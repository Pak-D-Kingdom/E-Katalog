import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const total = await prisma.produk.count();
    const withPhoto = await prisma.produk.count({ where: { foto_url: { not: null } } });
    const withoutPhoto = total - withPhoto;

    const rows = await prisma.pencarian_gambar_produk.findMany({
      select: { status: true },
    });

    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }

    const searched = rows.length;
    const notSearched = total - searched;

    return NextResponse.json({
      total,
      withPhoto,
      withoutPhoto,
      searched,
      notSearched,
      menungguReview: counts.menunggu_review ?? 0,
      dipilih: counts.dipilih ?? 0,
      gagal: counts.gagal ?? 0,
      tidakDitemukan: counts.tidak_ditemukan ?? 0,
      dilewati: counts.dilewati ?? 0,
      mencari: counts.mencari ?? 0,
      belumDicari: counts.belum_dicari ?? notSearched,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Image finder summary error:", error);
    return NextResponse.json({ error: "Gagal mengambil ringkasan." }, { status: 500 });
  }
}
