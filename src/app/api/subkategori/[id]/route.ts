
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

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

// PUT: Mengedit subkategori
export async function PUT(
  request: Request,
  { params }: Context
) {
  try {
    await requireAdmin();

    const id = Number((await params).id);

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "ID subkategori tidak valid." },
        { status: 400 }
      );
    }

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

    const existingSubkategori =
      await prisma.subkategori.findUnique({
        where: { id },
      });

    if (!existingSubkategori) {
      return NextResponse.json(
        { error: "Subkategori tidak ditemukan." },
        { status: 404 }
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

    const duplicate = await prisma.subkategori.findFirst({
      where: {
        kategori_id,
        slug,
        NOT: { id },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "Slug subkategori sudah digunakan dalam kategori ini.",
        },
        { status: 409 }
      );
    }

    const subkategori = await prisma.subkategori.update({
      where: { id },
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

    return NextResponse.json({ subkategori });
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
        { error: "Subkategori sudah terdaftar." },
        { status: 409 }
      );
    }

    if (code === "P2025") {
      return NextResponse.json(
        { error: "Subkategori tidak ditemukan." },
        { status: 404 }
      );
    }

    console.error("Update subkategori error:", error);

    return NextResponse.json(
      { error: "Gagal memperbarui subkategori." },
      { status: 500 }
    );
  }
}

// DELETE: Menghapus subkategori
export async function DELETE(
  _request: Request,
  { params }: Context
) {
  try {
    await requireAdmin();

    const id = Number((await params).id);

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "ID subkategori tidak valid." },
        { status: 400 }
      );
    }

    const subkategori = await prisma.subkategori.findUnique({
      where: { id },
      include: {
        _count: {
          select: { produk: true },
        },
      },
    });

    if (!subkategori) {
      return NextResponse.json(
        { error: "Subkategori tidak ditemukan." },
        { status: 404 }
      );
    }

    if (subkategori._count.produk > 0) {
      return NextResponse.json(
        {
          error: `Subkategori masih memiliki ${subkategori._count.produk} produk. Pindahkan produk terlebih dahulu sebelum menghapus subkategori.`,
        },
        { status: 409 }
      );
    }

    await prisma.subkategori.delete({
      where: { id },
    });

    return NextResponse.json({
      ok: true,
      message: "Subkategori berhasil dihapus.",
    });
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

    if (code === "P2025") {
      return NextResponse.json(
        { error: "Subkategori tidak ditemukan." },
        { status: 404 }
      );
    }

    if (code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Subkategori masih digunakan oleh produk dan tidak dapat dihapus.",
        },
        { status: 409 }
      );
    }

    console.error("Delete subkategori error:", error);

    return NextResponse.json(
      { error: "Gagal menghapus subkategori." },
      { status: 500 }
    );
  }
}
