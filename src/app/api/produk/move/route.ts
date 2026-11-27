import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { prefixForCategory, rewriteSkuPrefix } from "@/lib/sku";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(1000),
  kategori_id: z.number().int().positive(),
  subkategori_id: z.number().int().positive().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
    }

    const { ids, kategori_id, subkategori_id } = parsed.data;
    const uniqueIds = Array.from(new Set(ids));

    const kategori = await prisma.kategori.findUnique({
      where: { id: kategori_id },
      select: { id: true, nama_kategori: true },
    });
    if (!kategori) {
      return NextResponse.json({ error: "Kategori tujuan tidak ditemukan." }, { status: 404 });
    }

    let targetSubcategory: {
      id: number;
      nama_subkategori: string;
    } | null = null;
    if (subkategori_id != null) {
      targetSubcategory = await prisma.subkategori.findFirst({
        where: { id: subkategori_id, kategori_id },
        select: { id: true, nama_subkategori: true },
      });
      if (!targetSubcategory) {
        return NextResponse.json(
          { error: "Subkategori tidak sesuai dengan kategori tujuan." },
          { status: 400 }
        );
      }
    }

    const products = await prisma.produk.findMany({
      where: { id: { in: uniqueIds } },
      include: {
        kategori: { select: { nama_kategori: true } },
        subkategori: { select: { nama_subkategori: true } },
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }

    const newPrefix = prefixForCategory(kategori.nama_kategori);

    // Kumpulkan SKU yang sedang dipakai, kecuali SKU produk yang akan dipindah
    // (agar pertukaran prefix tidak dianggap bentrok).
    const movingSet = new Set(products.map((p) => p.id));
    const usedSkus = new Set<string>();
    const allProducts = await prisma.produk.findMany({
      select: { id: true, kode_produk: true },
    });
    for (const p of allProducts) {
      if (!movingSet.has(p.id)) {
        usedSkus.add(p.kode_produk.trim().toLowerCase());
      }
    }

    // Hitung SKU baru per produk.
    const updates: { id: number; kode_produk: string }[] = [];
    let skuUpdated = 0;
    for (const product of products) {
      let nextSku = product.kode_produk;
      const categoryChanged = product.kategori_id !== kategori_id;
      if (categoryChanged) {
        const candidate = rewriteSkuPrefix(product.kode_produk, newPrefix, usedSkus);
        if (candidate !== product.kode_produk) {
          skuUpdated += 1;
        }
        nextSku = candidate;
      }
      usedSkus.add(nextSku.trim().toLowerCase());
      updates.push({ id: product.id, kode_produk: nextSku });
    }

    let historyRecords = 0;
    await prisma.$transaction(async (tx) => {
      for (const u of updates) {
        const existing = products.find((product) => product.id === u.id);
        const updated = await tx.produk.update({
          where: { id: u.id },
          data: {
            kategori_id,
            subkategori_id: subkategori_id ?? null,
            kode_produk: u.kode_produk,
          },
          include: {
            kategori: { select: { nama_kategori: true } },
            subkategori: { select: { nama_subkategori: true } },
          },
        });

        if (!existing) continue;

        const kategoriBerubah = existing.kategori_id !== kategori_id;
        const subkategoriBerubah =
          existing.subkategori_id !== (subkategori_id ?? null);
        if (!kategoriBerubah && !subkategoriBerubah) continue;

        await tx.riwayat_perubahan_harga.create({
          data: {
            produk_id: updated.id,
            kode_produk: updated.kode_produk,
            nama_produk: updated.nama_produk,
            kategori_lama: existing.kategori?.nama_kategori ?? null,
            kategori_baru: updated.kategori?.nama_kategori ?? null,
            subkategori_lama:
              existing.subkategori?.nama_subkategori ?? null,
            subkategori_baru:
              updated.subkategori?.nama_subkategori ?? null,
            kategori_berubah: kategoriBerubah,
            subkategori_berubah: subkategoriBerubah,
            satuan_lama: updated.satuan,
            satuan_baru: updated.satuan,
            satuan_berubah: false,
            deskripsi_lama: updated.deskripsi,
            deskripsi_baru: updated.deskripsi,
            deskripsi_berubah: false,
            jenis_harga_berubah: false,
            harga_berubah: false,
            jenis_harga_lama: updated.jenis_harga,
            harga_lama: updated.harga,
            harga_min_lama: updated.harga_min,
            harga_max_lama: updated.harga_max,
            jenis_harga_baru: updated.jenis_harga,
            harga_baru: updated.harga,
            harga_min_baru: updated.harga_min,
            harga_max_baru: updated.harga_max,
          },
        });
        historyRecords += 1;
      }
    });

    return NextResponse.json({
      updated: products.length,
      skuUpdated,
      historyRecords,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      String((error as { code: unknown }).code) === "P2002"
    ) {
      return NextResponse.json(
        { error: "Kode SKU hasil penyesuaian sudah digunakan. Coba lagi." },
        { status: 409 }
      );
    }
    console.error("Move produk error:", error);
    return NextResponse.json({ error: "Gagal memindahkan produk." }, { status: 500 });
  }
}