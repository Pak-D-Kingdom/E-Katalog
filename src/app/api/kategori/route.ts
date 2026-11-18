import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { kategoriSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const kategori = await prisma.kategori.findMany({ orderBy: { nama_kategori: "asc" } });
  return NextResponse.json({ kategori });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = kategoriSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const kategori = await prisma.kategori.create({ data: parsed.data });
    return NextResponse.json({ kategori }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    if (error instanceof Error && "code" in error && error.code === "P2002") return NextResponse.json({ error: "Slug kategori sudah digunakan." }, { status: 409 });
    throw error;
  }
}
