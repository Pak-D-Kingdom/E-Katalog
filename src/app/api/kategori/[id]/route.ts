
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { kategoriSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

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

// EDIT KATEGORI
export async function PUT(
  request: Request,
  { params }: Context
) {
  try {
    await requireAdmin();

    const id = Number((await params).id);

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "ID kategori tidak valid." },
        { status: 400 }
      );
    }

    const parsed = kategoriSchema.safeParse(
      await request.json()
    );

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const kategori = await prisma.kategori.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ kategori });
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
        { error: "Slug kategori sudah digunakan." },
        { status: 409 }
      );
    }

    if (code === "P2025") {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    console.error("Update kategori error:", error);

    return NextResponse.json(
      { error: "Gagal memperbarui kategori." },
      { status: 500 }
    );
  }
}

// HAPUS KATEGORI
export async function DELETE(
  _request: Request,
  { params }: Context
) {
  try {
    await requireAdmin();

    const id = Number((await params).id);

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "ID kategori tidak valid." },
        { status: 400 }
      );
    }

    // Pastikan kategori tersedia
    const kategori = await prisma.kategori.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            subkategori: true,
          },
        },
      },
    });

    if (!kategori) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    // Cegah penghapusan apabila masih memiliki subkategori
    if (kategori._count.subkategori > 0) {
      return NextResponse.json(
        {
          error: `Kategori tidak dapat dihapus karena masih memiliki ${kategori._count.subkategori} subkategori. Hapus atau pindahkan subkategori terlebih dahulu.`,
        },
        { status: 409 }
      );
    }

    await prisma.kategori.delete({
      where: { id },
    });

    return NextResponse.json({
      ok: true,
      message:
        "Kategori berhasil dihapus. Produk tetap tersimpan dan tidak lagi memiliki kategori.",
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
        { error: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    if (code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Kategori masih digunakan oleh data lain dan tidak dapat dihapus.",
        },
        { status: 409 }
      );
    }

    console.error("Delete kategori error:", error);

    return NextResponse.json(
      { error: "Gagal menghapus kategori." },
      { status: 500 }
    );
  }
}
