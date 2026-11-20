
import { NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { produkSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

function getPrismaCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    return String(error.code);
  }

  return undefined;
}

// GET: Mengambil produk beserta kategori dan subkategori
export async function GET() {
  try {
    const session = await getSession();

    const produk = await prisma.produk.findMany({
      where: session ? {} : { tersedia: true },
      include: {
        kategori: true,
        subkategori: true,
      },
      orderBy: {
        dibuat_pada: "desc",
      },
    });

    return NextResponse.json({ produk });
  } catch (error) {
    console.error("Get produk error:", error);

    return NextResponse.json(
      { error: "Gagal mengambil data produk." },
      { status: 500 }
    );
  }
}

// POST: Menambahkan produk baru
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const parsed = produkSchema.safeParse(
      await request.json()
    );

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      kategori_id,
      subkategori_id,
      ...data
    } = parsed.data;

    // Memastikan kategori utama tersedia
    const kategori = await prisma.kategori.findUnique({
      where: {
        id: kategori_id,
      },
      select: {
        id: true,
      },
    });

    if (!kategori) {
      return NextResponse.json(
        { error: "Kategori utama tidak ditemukan." },
        { status: 404 }
      );
    }

    // Memastikan subkategori sesuai dengan kategori utama
    if (subkategori_id != null) {
      const subkategori = await prisma.subkategori.findFirst({
        where: {
          id: subkategori_id,
          kategori_id,
        },
        select: {
          id: true,
        },
      });

      if (!subkategori) {
        return NextResponse.json(
          {
            error:
              "Subkategori tidak sesuai dengan kategori utama yang dipilih.",
          },
          { status: 400 }
        );
      }
    }

    const produk = await prisma.produk.create({
      data: {
        ...data,
        kategori_id,
        subkategori_id: subkategori_id ?? null,
        foto_url: data.foto_url ?? null,
      },
      include: {
        kategori: true,
        subkategori: true,
      },
    });

    return NextResponse.json(
      { produk },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "Tidak berizin." },
        { status: 401 }
      );
    }

    const code = getPrismaCode(error);

    if (code === "P2002") {
      return NextResponse.json(
        { error: "Kode produk atau slug sudah digunakan." },
        { status: 409 }
      );
    }

    if (code === "P2003") {
      return NextResponse.json(
        { error: "Kategori atau subkategori tidak valid." },
        { status: 400 }
      );
    }

    console.error("Create produk error:", error);

    return NextResponse.json(
      { error: "Gagal menambahkan produk." },
      { status: 500 }
    );
  }
}
