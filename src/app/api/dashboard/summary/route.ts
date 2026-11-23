
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProdukUnggulanPerKategori } from "@/lib/produk-unggulan";

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
      totalInquiry,
      produkUnggulan,
    ] = await Promise.all([
      prisma.produk.count({
        where: {
          tersedia: true,
        },
      }),
      prisma.kategori.count(),
      prisma.subkategori.count(),
      prisma.riwayat_pesanan.count(),
      getProdukUnggulanPerKategori(),
    ]);

    return NextResponse.json({
      produkAktif,
      totalKategori,
      totalSubkategori,
      totalInquiry,
      totalProdukUnggulan: produkUnggulan.totalProdukUnggulan,
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
      {
        error: "Gagal mengambil statistik dashboard.",
        ...(process.env.NODE_ENV === "development" && {
          detail: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
  }
}
