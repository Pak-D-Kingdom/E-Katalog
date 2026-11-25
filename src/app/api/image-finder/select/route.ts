import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isSafeImageUrl } from "@/lib/image-search/url";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  productId: z.number().int().positive(),
  candidateId: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
    }

    const { productId, candidateId } = parsed.data;

    const candidate = await prisma.kandidat_gambar_produk.findFirst({
      where: { id: candidateId, produk_id: productId },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Kandidat tidak ditemukan." }, { status: 404 });
    }

    if (!isSafeImageUrl(candidate.image_url)) {
      return NextResponse.json({ error: "URL gambar tidak valid." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.kandidat_gambar_produk.updateMany({
        where: { produk_id: productId },
        data: { dipilih: false },
      }),
      prisma.kandidat_gambar_produk.update({
        where: { id: candidateId },
        data: { dipilih: true },
      }),
      prisma.produk.update({
        where: { id: productId },
        data: { foto_url: candidate.image_url },
      }),
      prisma.pencarian_gambar_produk.upsert({
        where: { produk_id: productId },
        create: {
          produk_id: productId,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Image finder select error:", error);
    return NextResponse.json({ error: "Gagal menyimpan pilihan." }, { status: 500 });
  }
}
