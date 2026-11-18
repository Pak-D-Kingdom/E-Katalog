import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pengaturanSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const pengaturan = await prisma.pengaturan_katalog.findFirst({ orderBy: { id: "asc" } });
  return NextResponse.json({ pengaturan });
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const parsed = pengaturanSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const existing = await prisma.pengaturan_katalog.findFirst({ orderBy: { id: "asc" } });
    const pengaturan = existing
      ? await prisma.pengaturan_katalog.update({ where: { id: existing.id }, data: parsed.data })
      : await prisma.pengaturan_katalog.create({ data: parsed.data });
    return NextResponse.json({ pengaturan });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    throw error;
  }
}
