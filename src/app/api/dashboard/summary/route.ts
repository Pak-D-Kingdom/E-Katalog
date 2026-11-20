
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Memastikan hanya admin yang dapat mengakses data
    await requireAdmin();

    // Mengambil statistik langsung dari database
    const [
      produkAktif,
      totalKategori,
      totalSubkategori,
    ] = await Promise.all([
      prisma.produk.count({
        where: {
          tersedia: true,
        },
      }),
      prisma.kategori.count(),
      prisma.subkategori.count(),
    ]);

    return NextResponse.json({
      produkAktif,
      totalKategori,
      totalSubkategori,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "Tidak berizin." },
        { status: 401 }
      );
    }

    console.error("Dashboard summary error:", error);

    return NextResponse.json(
      { error: "Gagal mengambil statistik dashboard." },
      { status: 500 }
    );
  }
}
