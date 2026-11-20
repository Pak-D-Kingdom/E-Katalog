
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

// GET: Mengambil seluruh subkategori
export async function GET() {
  try {
    const subkategori = await prisma.subkategori.findMany({
      include: {
        kategori: true,
        _count: {
          select: { produk: true },
        },
      },
      orderBy: {
        nama_subkategori: "asc",
      },
    });

    return NextResponse.json({ subkategori });
  } catch (error) {
    console.error("Get subkategori error:", error);

    return NextResponse.json(
      { error: "Gagal mengambil data subkategori." },
      { status: 500 }
    );
  }
}

// POST: Menambahkan subkategori
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const kategori_id = Number(body.kategori_id);
    const nama_subkategori = String(
      body.nama_subkategori ?? ""
    ).trim();

    const slug = normalizeSlug(
      String(body.slug || nama_subkategori).trim()
    );

    if (!Number.isInteger(kategori_id) || kategori_id < 1) {
      return NextResponse.json(
        { error: "Kategori utama tidak valid." },
        { status: 400 }
      );
    }

    if (
      !nama_subkategori ||
      nama_subkategori.length > 120
    ) {
      return NextResponse.json(
        {
          error:
            "Nama subkategori wajib diisi dan maksimal 120 karakter.",
        },
        { status: 400 }
      );
    }

    if (
      !slug ||
      slug.length > 191 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
      return NextResponse.json(
        { error: "Format slug subkategori tidak valid." },
        { status: 400 }
      );
    }

    const kategori = await prisma.kategori.findUnique({
      where: { id: kategori_id },
    });

    if (!kategori) {
      return NextResponse.json(
        { error: "Kategori utama tidak ditemukan." },
        { status: 404 }
      );
    }

    const existing = await prisma.subkategori.findFirst({
      where: {
        kategori_id,
        slug,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "Subkategori dengan slug tersebut sudah ada di kategori ini.",
        },
        { status: 409 }
      );
    }

    const subkategori = await prisma.subkategori.create({
      data: {
        kategori_id,
        nama_subkategori,
        slug,
      },
      include: {
        kategori: true,
        _count: {
          select: { produk: true },
        },
      },
    });

    return NextResponse.json(
      { subkategori },
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

    if (getPrismaCode(error) === "P2002") {
      return NextResponse.json(
        { error: "Subkategori sudah terdaftar." },
        { status: 409 }
      );
    }

    console.error("Create subkategori error:", error);

    return NextResponse.json(
      { error: "Gagal menambahkan subkategori." },
      { status: 500 }
    );
  }
}
