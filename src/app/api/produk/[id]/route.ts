import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { produkSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "ID produk tidak valid." }, { status: 400 });
    const parsed = produkSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const produk = await prisma.produk.update({
      where: { id },
      data: { ...parsed.data, kategori_id: parsed.data.kategori_id ?? null, foto_url: parsed.data.foto_url ?? null }
    });
    return NextResponse.json({ produk });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "Kode produk atau slug sudah digunakan." }, { status: 409 });
    if (error instanceof Error && "code" in error && error.code === "P2025") return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "ID produk tidak valid." }, { status: 400 });
    await prisma.produk.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    if (error instanceof Error && "code" in error && error.code === "P2025") return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    throw error;
  }
}
