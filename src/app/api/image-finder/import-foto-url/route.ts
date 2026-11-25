import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  kode_produk: z.string().trim().min(1).max(120),
  foto_url: z.string().trim().url().max(2048),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(5000),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
    }

    const items = parsed.data.items;
    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    const errors: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await tx.produk.findUnique({
          where: { kode_produk: item.kode_produk },
          select: { id: true, foto_url: true },
        });

        if (!product) {
          notFound += 1;
          continue;
        }

        if (product.foto_url === item.foto_url) {
          skipped += 1;
          continue;
        }

        await tx.produk.update({
          where: { id: product.id },
          data: { foto_url: item.foto_url },
        });
        updated += 1;
      }
    });

    return NextResponse.json({
      total: items.length,
      updated,
      skipped,
      notFound,
      errors,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Import foto URL error:", error);
    return NextResponse.json({ error: "Gagal mengimpor foto URL." }, { status: 500 });
  }
}