import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(1000),
  kategori_id: z.number().int().positive(),
  subkategori_id: z.number().int().positive().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
    }

    const { ids, kategori_id, subkategori_id } = parsed.data;
    const uniqueIds = Array.from(new Set(ids));

    const kategori = await prisma.kategori.findUnique({
      where: { id: kategori_id },
      select: { id: true },
    });
    if (!kategori) {
      return NextResponse.json({ error: "Kategori tujuan tidak ditemukan." }, { status: 404 });
    }

    if (subkategori_id != null) {
      const sub = await prisma.subkategori.findFirst({
        where: { id: subkategori_id, kategori_id },
        select: { id: true },
      });
      if (!sub) {
        return NextResponse.json(
          { error: "Subkategori tidak sesuai dengan kategori tujuan." },
          { status: 400 }
        );
      }
    }

    const result = await prisma.produk.updateMany({
      where: { id: { in: uniqueIds } },
      data: { kategori_id, subkategori_id: subkategori_id ?? null },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Move produk error:", error);
    return NextResponse.json({ error: "Gagal memindahkan produk." }, { status: 500 });
  }
}