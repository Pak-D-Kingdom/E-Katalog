import { NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { produkSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  const produk = await prisma.produk.findMany({
    where: session ? {} : { tersedia: true },
    include: { kategori: true },
    orderBy: { dibuat_pada: "desc" }
  });
  return NextResponse.json({ produk });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = produkSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const produk = await prisma.produk.create({
      data: { ...parsed.data, kategori_id: parsed.data.kategori_id ?? null, foto_url: parsed.data.foto_url ?? null }
    });
    return NextResponse.json({ produk }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "Kode produk atau slug sudah digunakan." }, { status: 409 });
    throw error;
  }
}
