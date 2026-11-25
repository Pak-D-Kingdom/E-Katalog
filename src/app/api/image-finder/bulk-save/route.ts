import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isSafeImageUrl } from "@/lib/image-search/url";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  selections: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        candidateId: z.number().int().positive(),
      })
    )
    .min(1)
    .max(50),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
    }

    let saved = 0;
    let skipped = 0;

    for (const selection of parsed.data.selections) {
      const candidate = await prisma.kandidat_gambar_produk.findFirst({
        where: { id: selection.candidateId, produk_id: selection.productId },
      });

      if (!candidate || !isSafeImageUrl(candidate.image_url)) {
        skipped++;
        continue;
      }

      await prisma.$transaction([
        prisma.kandidat_gambar_produk.updateMany({
          where: { produk_id: selection.productId },
          data: { dipilih: false },
        }),
        prisma.kandidat_gambar_produk.update({
          where: { id: selection.candidateId },
          data: { dipilih: true },
        }),
        prisma.produk.update({
          where: { id: selection.productId },
          data: { foto_url: candidate.image_url },
        }),
        prisma.pencarian_gambar_produk.upsert({
          where: { produk_id: selection.productId },
          create: {
            produk_id: selection.productId,
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

      saved++;
    }

    return NextResponse.json({ saved, skipped });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Image finder bulk-save error:", error);
    return NextResponse.json({ error: "Gagal menyimpan pilihan massal." }, { status: 500 });
  }
}
