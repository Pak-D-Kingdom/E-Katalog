import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getImageSearchProvider } from "@/lib/image-search/provider";
import { ImageSearchError } from "@/lib/image-search/serpapi";
import { buildSearchQuery, relevanceScore } from "@/lib/image-search/query";
import { getSerpApiQuota } from "@/lib/image-search/quota";
import { TERMINAL_STATUSES } from "@/lib/image-search/status";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  productIds: z.array(z.number().int().positive()).max(50).optional(),
  limit: z.number().int().min(1).max(20).optional(),
  candidates: z.number().int().min(1).max(5).optional(),
  force: z.boolean().optional(),
  keyword: z.string().trim().max(80).optional(),
  autoSelect: z.boolean().optional(),
  kategoriId: z.number().int().positive().optional(),
  nameContains: z.string().trim().max(120).optional(),
});

let batchLockUntil = 0;

function isBatchLocked() {
  return Date.now() < batchLockUntil;
}

function acquireBatchLock() {
  if (isBatchLocked()) return false;
  batchLockUntil = Date.now() + 10 * 60 * 1000;
  return true;
}

function releaseBatchLock() {
  batchLockUntil = 0;
}

const STALE_MS = 2 * 60 * 1000;

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
    }

    const {
      productIds,
      limit = 10,
      candidates = 5,
      force = false,
      keyword,
      autoSelect = false,
      kategoriId,
      nameContains,
    } = parsed.data;

    if (!acquireBatchLock()) {
      return NextResponse.json(
        { error: "Proses batch lain sedang berjalan. Tunggu hingga selesai." },
        { status: 409 }
      );
    }

    try {
      const quota = await getSerpApiQuota();
      const available =
        quota.totalSearchesLeft ?? quota.planSearchesLeft ?? null;

      if (available === null) {
        return NextResponse.json(
          { error: "Kuota SerpApi tidak dapat dibaca. Proses diblokir untuk mencegah overspend." },
          { status: 409 }
        );
      }

      type ProductWithRelations = Prisma.produkGetPayload<{
        include: {
          kategori: { select: { nama_kategori: true } };
          subkategori: { select: { nama_subkategori: true } };
          pencarian_gambar: true;
        };
      }>;

      let products: ProductWithRelations[];
      if (productIds && productIds.length > 0) {
        const found = await prisma.produk.findMany({
          where: { id: { in: productIds } },
          include: {
            kategori: { select: { nama_kategori: true } },
            subkategori: { select: { nama_subkategori: true } },
            pencarian_gambar: true,
          },
        });

        products = found.filter((product) => {
          if (!force && product.foto_url) return false;
          if (kategoriId && product.kategori_id !== kategoriId) return false;
          if (nameContains && !product.nama_produk.toLowerCase().includes(nameContains.toLowerCase())) {
            return false;
          }
          return true;
        });
      } else {
        const candidatesProducts = await prisma.produk.findMany({
          where: {
            ...(force ? {} : { foto_url: null }),
            ...(kategoriId ? { kategori_id: kategoriId } : {}),
            ...(nameContains ? { nama_produk: { contains: nameContains } } : {}),
          },
          include: {
            kategori: { select: { nama_kategori: true } },
            subkategori: { select: { nama_subkategori: true } },
            pencarian_gambar: true,
          },
          orderBy: { id: "asc" },
        });

        products = candidatesProducts.filter((product) => {
          const status = product.pencarian_gambar?.status ?? "belum_dicari";
          if (TERMINAL_STATUSES.includes(status as (typeof TERMINAL_STATUSES)[number])) return false;
          if (!force && status === "menunggu_review") return false;
          if (!force && status === "dipilih") return false;
          if (status === "mencari") {
            const searchedAt = product.pencarian_gambar?.dicari_pada;
            if (searchedAt && Date.now() - searchedAt.getTime() < STALE_MS) return false;
          }
          if (!force && product.foto_url) return false;
          return true;
        }).slice(0, limit);
      }

      if (products.length === 0) {
        return NextResponse.json({ processed: 0, results: [], message: "Tidak ada produk yang perlu dicari." });
      }

      const estimated = products.length + 5;
      if (estimated > available) {
        return NextResponse.json(
          {
            error: `Kuota SerpApi tersisa ${available}, tetapi estimasi request ${estimated}. Kurangi jumlah produk atau tunggu periode berikutnya.`,
            available,
            estimated,
          },
          { status: 409 }
        );
      }

      const provider = await getImageSearchProvider();
      const outcomes: Array<{
        productId: number;
        status: string;
        query?: string;
        candidateCount?: number;
        error?: string;
      }> = new Array(products.length);

      let stopReason: string | null = null;
      let cursor = 0;

      async function worker() {
        while (true) {
          if (stopReason) return;
          const index = cursor++;
          if (index >= products.length) return;
          const product = products[index];

          const statusRecord = product.pencarian_gambar;
          if (!force && statusRecord && (statusRecord.status === "menunggu_review" || statusRecord.status === "dipilih")) {
            outcomes[index] = { productId: product.id, status: statusRecord.status };
            continue;
          }

          const query = buildSearchQuery(
            {
              nama_produk: product.nama_produk,
              satuan: product.satuan,
              kategori: product.kategori,
              subkategori: product.subkategori,
            },
            keyword
          );

          try {
            await prisma.pencarian_gambar_produk.upsert({
              where: { produk_id: product.id },
              create: {
                produk_id: product.id,
                status: "mencari",
                query,
                percobaan: 1,
                dicari_pada: new Date(),
              },
              update: {
                status: "mencari",
                query,
                percobaan: { increment: 1 },
                dicari_pada: new Date(),
                error_terakhir: null,
              },
            });

            const outcome = await provider.search(query, candidates);
            const mapped = outcome.candidates
              .map((item) => ({
                ...item,
                relevance: relevanceScore(
                  {
                    nama_produk: product.nama_produk,
                    satuan: product.satuan,
                    kategori: product.kategori,
                    subkategori: product.subkategori,
                  },
                  item
                ),
              }))
              .sort((a, b) => b.relevance - a.relevance)
              .slice(0, candidates);

            await prisma.kandidat_gambar_produk.deleteMany({ where: { produk_id: product.id } });

            if (mapped.length > 0) {
              await prisma.kandidat_gambar_produk.createMany({
                data: mapped.map((item, pos) => ({
                  produk_id: product.id,
                  posisi: pos + 1,
                  judul: item.title,
                  image_url: item.imageUrl,
                  thumbnail_url: item.thumbnailUrl,
                  source_url: item.sourceUrl,
                  domain: item.domain,
                  provider: item.provider,
                  relevansi: item.relevance,
                  dipilih: false,
                })),
              });

              const best = mapped[0];
              const canAutoSelect = autoSelect && best.relevance >= 60;

              if (canAutoSelect) {
                const bestCandidate = await prisma.kandidat_gambar_produk.findFirst({
                  where: { produk_id: product.id, posisi: 1 },
                });

                if (bestCandidate) {
                  await prisma.$transaction([
                    prisma.kandidat_gambar_produk.updateMany({
                      where: { produk_id: product.id },
                      data: { dipilih: false },
                    }),
                    prisma.kandidat_gambar_produk.update({
                      where: { id: bestCandidate.id },
                      data: { dipilih: true },
                    }),
                    prisma.produk.update({
                      where: { id: product.id },
                      data: { foto_url: bestCandidate.image_url },
                    }),
                    prisma.pencarian_gambar_produk.update({
                      where: { produk_id: product.id },
                      data: {
                        status: "dipilih",
                        jumlah_request: { increment: outcome.requestCount },
                        dipilih_pada: new Date(),
                      },
                    }),
                  ]);

                  // Terapkan gambar yang sama ke produk lain dengan nama identik.
                  const sourceName = normalizeName(product.nama_produk);
                  const sameNameProducts = await prisma.produk.findMany({
                    where: { id: { not: product.id }, foto_url: null },
                    select: { id: true, nama_produk: true },
                  });
                  const targets = sameNameProducts.filter(
                    (target) => normalizeName(target.nama_produk) === sourceName
                  );

                  for (const target of targets) {
                    await prisma.$transaction([
                      prisma.kandidat_gambar_produk.deleteMany({ where: { produk_id: target.id } }),
                      prisma.kandidat_gambar_produk.create({
                        data: {
                          produk_id: target.id,
                          posisi: 1,
                          judul: bestCandidate.judul,
                          image_url: bestCandidate.image_url,
                          thumbnail_url: bestCandidate.thumbnail_url,
                          source_url: bestCandidate.source_url,
                          domain: bestCandidate.domain,
                          provider: bestCandidate.provider,
                          relevansi: bestCandidate.relevansi,
                          dipilih: true,
                        },
                      }),
                      prisma.produk.update({
                        where: { id: target.id },
                        data: { foto_url: bestCandidate.image_url },
                      }),
                      prisma.pencarian_gambar_produk.upsert({
                        where: { produk_id: target.id },
                        create: {
                          produk_id: target.id,
                          status: "dipilih",
                          dipilih_pada: new Date(),
                        },
                        update: {
                          status: "dipilih",
                          dipilih_pada: new Date(),
                          error_terakhir: null,
                        },
                      }),
                    ]);
                  }
                }
              } else {
                await prisma.pencarian_gambar_produk.update({
                  where: { produk_id: product.id },
                  data: {
                    status: "menunggu_review",
                    jumlah_request: { increment: outcome.requestCount },
                  },
                });
              }

              outcomes[index] = {
                productId: product.id,
                status: canAutoSelect ? "dipilih" : "menunggu_review",
                query,
                candidateCount: mapped.length,
              };
            } else {
              await prisma.pencarian_gambar_produk.update({
                where: { produk_id: product.id },
                data: {
                  status: "tidak_ditemukan",
                  jumlah_request: { increment: outcome.requestCount },
                },
              });
              outcomes[index] = {
                productId: product.id,
                status: "tidak_ditemukan",
                query,
                candidateCount: 0,
              };
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : "Pencarian gagal.";
            const kind = error instanceof ImageSearchError ? error.kind : "server";

            await prisma.pencarian_gambar_produk.upsert({
              where: { produk_id: product.id },
              create: {
                produk_id: product.id,
                status: "gagal",
                query,
                percobaan: 1,
                error_terakhir: message,
                dicari_pada: new Date(),
              },
              update: {
                status: "gagal",
                query,
                error_terakhir: message,
                dicari_pada: new Date(),
              },
            });

            outcomes[index] = {
              productId: product.id,
              status: "gagal",
              query,
              error: message,
            };

            if (kind === "rate_limited" || kind === "quota" || kind === "invalid_key") {
              stopReason = kind;
            }
          }
        }
      }

      const workerCount = Math.min(5, products.length);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));

      return NextResponse.json({
        processed: products.length,
        stopped: Boolean(stopReason),
        stopReason,
        results: outcomes.filter(Boolean),
      });
    } finally {
      releaseBatchLock();
    }
  } catch (error) {
    releaseBatchLock();
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Image finder search-batch error:", error);
    return NextResponse.json({ error: "Gagal menjalankan batch." }, { status: 500 });
  }
}
