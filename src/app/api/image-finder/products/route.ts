import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = new Set([
  "all",
  "belum_dicari",
  "mencari",
  "menunggu_review",
  "dipilih",
  "gagal",
  "tidak_ditemukan",
  "dilewati",
]);

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") ?? "all";
    const q = (searchParams.get("q") ?? "").trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "24") || 24));
    const kategoriId = Number(searchParams.get("kategoriId") ?? "");
    const idsParam = searchParams.get("ids");

    if (!ALLOWED_STATUSES.has(statusFilter)) {
      return NextResponse.json({ error: "Filter status tidak valid." }, { status: 400 });
    }

    const where: Record<string, unknown> = {};
    if (Number.isInteger(kategoriId) && kategoriId > 0) {
      where.kategori_id = kategoriId;
    }
    if (q) {
      where.OR = [
        { nama_produk: { contains: q } },
        { kode_produk: { contains: q } },
      ];
    }

    if (idsParam) {
      const ids = idsParam
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isInteger(v) && v > 0);
      if (ids.length > 0) where.id = { in: ids };
    }

    const products = await prisma.produk.findMany({
      where,
      include: {
        kategori: { select: { id: true, nama_kategori: true } },
        subkategori: { select: { id: true, nama_subkategori: true } },
        pencarian_gambar: true,
        kandidat_gambar: { orderBy: { posisi: "asc" } },
      },
      orderBy: { id: "asc" },
    });

    const filtered = products.filter((product) => {
      const status = product.pencarian_gambar?.status ?? "belum_dicari";
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (product.foto_url && statusFilter === "belum_dicari") return false;
      return true;
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    return NextResponse.json({
      total,
      page,
      pageSize,
      products: pageItems.map((product) => ({
        id: product.id,
        kode_produk: product.kode_produk,
        nama_produk: product.nama_produk,
        satuan: product.satuan,
        foto_url: product.foto_url,
        kategori: product.kategori,
        subkategori: product.subkategori,
        pencarian: product.pencarian_gambar,
        kandidat: product.kandidat_gambar,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Image finder products error:", error);
    return NextResponse.json({ error: "Gagal mengambil produk." }, { status: 500 });
  }
}
