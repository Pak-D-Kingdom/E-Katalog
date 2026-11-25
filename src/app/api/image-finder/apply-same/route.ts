import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isSafeImageUrl } from "@/lib/image-search/url";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sourceProductId: z.number().int().positive(),
  candidateId: z.number().int().positive(),
  overwrite: z.boolean().optional(),
});

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
    }

    const { sourceProductId, candidateId, overwrite = false } = parsed.data;

    const candidate = await prisma.kandidat_gambar_produk.findFirst({
      where: { id: candidateId, produk_id: sourceProductId },
    });

    if (!candidate || !isSafeImageUrl(candidate.image_url)) {
      return NextResponse.json({ error: "Kandidat tidak ditemukan." }, { status: 404 });
    }

    const sourceProduct = await prisma.produk.findUnique({
      where: { id: sourceProductId },
      select: { id: true, nama_produk: true },
    });

    if (!sourceProduct) {
      return NextResponse.json({ error: "Produk sumber tidak ditemukan." }, { status: 404 });
    }

    const sourceName = normalizeName(sourceProduct.nama_produk);

    const allProducts = await prisma.produk.findMany({
      select: { id: true, nama_produk: true, foto_url: true },
    });

    const targets = allProducts.filter((product) => {
      if (product.id === sourceProductId) return false;
      if (normalizeName(product.nama_produk) !== sourceName) return false;
      if (!overwrite && product.foto_url) return false;
      return true;
    });

    let applied = 0;

    for (const target of targets) {
      await prisma.$transaction([
        prisma.kandidat_gambar_produk.deleteMany({ where: { produk_id: target.id } }),
        prisma.kandidat_gambar_produk.create({
          data: {
            produk_id: target.id,
            posisi: 1,
            judul: candidate.judul,
            image_url: candidate.image_url,
            thumbnail_url: candidate.thumbnail_url,
            source_url: candidate.source_url,
            domain: candidate.domain,
            provider: candidate.provider,
            relevansi: candidate.relevansi,
            dipilih: true,
          },
        }),
        prisma.produk.update({
          where: { id: target.id },
          data: { foto_url: candidate.image_url },
        }),
        prisma.pencarian_gambar_produk.upsert({
          where: { produk_id: target.id },
          create: {
            produk_id: target.id,
            status: "dipilih",
            query: candidate.judul,
            dipilih_pada: new Date(),
          },
          update: {
            status: "dipilih",
            dipilih_pada: new Date(),
            error_terakhir: null,
          },
        }),
      ]);

      applied++;
    }

    return NextResponse.json({
      applied,
      totalTargets: targets.length,
      targetIds: targets.map((item) => item.id),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Image finder apply-same error:", error);
    return NextResponse.json({ error: "Gagal menerapkan gambar." }, { status: 500 });
  }
}
