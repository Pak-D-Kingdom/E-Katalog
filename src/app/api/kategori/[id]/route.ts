import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { kategoriSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "ID kategori tidak valid." }, { status: 400 });
    const parsed = kategoriSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    return NextResponse.json({ kategori: await prisma.kategori.update({ where: { id }, data: parsed.data }) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "Slug kategori sudah digunakan." }, { status: 409 });
    if (error instanceof Error && "code" in error && error.code === "P2025") return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "ID kategori tidak valid." }, { status: 400 });
    await prisma.kategori.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    if (error instanceof Error && "code" in error && error.code === "P2025") return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
    throw error;
  }
}
