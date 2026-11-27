import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const url = new URL(request.url);
    const requestedPage = Number(url.searchParams.get("page") || 1);
    const page = Number.isInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
    const query = url.searchParams.get("q")?.trim() || "";
    const filter = url.searchParams.get("filter") || "all";
    const validFilters = [
      "all",
      "kategori",
      "subkategori",
      "satuan",
      "deskripsi",
      "harga",
    ] as const;

    if (query.length > 191) {
      return NextResponse.json(
        { error: "Pencarian maksimal 191 karakter." },
        { status: 400 }
      );
    }

    if (!validFilters.includes(filter as (typeof validFilters)[number])) {
      return NextResponse.json(
        { error: "Filter riwayat tidak valid." },
        { status: 400 }
      );
    }

    const filterWhere = {
      all: {},
      kategori: { kategori_berubah: true },
      subkategori: { subkategori_berubah: true },
      satuan: { satuan_berubah: true },
      deskripsi: { deskripsi_berubah: true },
      harga: { harga_berubah: true },
    }[filter as (typeof validFilters)[number]];

    const where = {
      AND: [
        query
          ? {
              OR: [
                { nama_produk: { contains: query } },
                { kode_produk: { contains: query } },
              ],
            }
          : {},
        filterWhere,
      ],
    };

    const [riwayatProduk, total] = await prisma.$transaction([
      prisma.riwayat_perubahan_harga.findMany({
        where,
        orderBy: [{ diubah_pada: "desc" }, { id: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.riwayat_perubahan_harga.count({ where }),
    ]);

    return NextResponse.json({
      riwayatProduk,
      pagination: {
        total,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    throw error;
  }
}
