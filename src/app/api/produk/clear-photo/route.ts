import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(1000),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
    }
    const ids = Array.from(new Set(parsed.data.ids));
    const result = await prisma.produk.updateMany({
      where: { id: { in: ids } },
      data: { foto_url: null },
    });
    return NextResponse.json({ updated: result.count });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Clear photo error:", error);
    return NextResponse.json({ error: "Gagal menghapus foto." }, { status: 500 });
  }
}