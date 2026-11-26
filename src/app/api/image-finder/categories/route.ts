import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const categories = await prisma.kategori.findMany({
      select: {
        id: true,
        nama_kategori: true,
        produk: {
          select: { id: true, foto_url: true },
        },
      },
      orderBy: { nama_kategori: "asc" },
    });

    return NextResponse.json({
      categories: categories.map((category) => {
        const total = category.produk.length;
        const withPhoto = category.produk.filter((product) => product.foto_url).length;
        return {
          id: category.id,
          nama_kategori: category.nama_kategori,
          total,
          withPhoto,
          withoutPhoto: total - withPhoto,
        };
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Image finder categories error:", error);
    return NextResponse.json({ error: "Gagal mengambil statistik kategori." }, { status: 500 });
  }
}
