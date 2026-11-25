import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  productId: z.number().int().positive(),
  status: z.enum(["dilewati", "tidak_ditemukan", "belum_dicari"]),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
    }

    const { productId, status } = parsed.data;

    await prisma.pencarian_gambar_produk.upsert({
      where: { produk_id: productId },
      create: {
        produk_id: productId,
        status,
        dicari_pada: status === "belum_dicari" ? null : new Date(),
      },
      update: {
        status,
        error_terakhir: null,
      },
    });

    if (status === "belum_dicari") {
      await prisma.kandidat_gambar_produk.deleteMany({ where: { produk_id: productId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Image finder status error:", error);
    return NextResponse.json({ error: "Gagal mengubah status." }, { status: 500 });
  }
}
