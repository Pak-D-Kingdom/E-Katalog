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

    if (query.length > 191) {
      return NextResponse.json(
        { error: "Pencarian maksimal 191 karakter." },
        { status: 400 }
      );
    }

    const where = query
      ? {
          OR: [
            { nama_produk: { contains: query } },
            { kode_produk: { contains: query } },
          ],
        }
      : {};

    const [riwayatHarga, total] = await prisma.$transaction([
      prisma.riwayat_perubahan_harga.findMany({
        where,
        orderBy: [{ diubah_pada: "desc" }, { id: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.riwayat_perubahan_harga.count({ where }),
    ]);

    return NextResponse.json({
      riwayatHarga,
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
