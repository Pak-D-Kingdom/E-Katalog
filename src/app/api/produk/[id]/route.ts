
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { produkSchema, zodErrorMessage } from "@/lib/validation";

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

// PUT: Mengedit produk
export async function PUT(
  request: Request,
  { params }: Context
) {
  try {
    await requireAdmin();

    const id = Number((await params).id);

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "ID produk tidak valid." },
        { status: 400 }
      );
    }

    const parsed = produkSchema.safeParse(
      await request.json()
    );

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: zodErrorMessage(parsed.error),
          details: parsed.error.flatten(),
        },
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
      where: { id: kategori_id },
      select: { id: true },
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
        select: { id: true },
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

    const produk = await prisma.produk.update({
      where: { id },
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

    return NextResponse.json({ produk });
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

    if (code === "P2025") {
      return NextResponse.json(
        { error: "Produk atau data terkait tidak ditemukan." },
        { status: 404 }
      );
    }

    if (code === "P2003") {
      return NextResponse.json(
        { error: "Kategori atau subkategori tidak valid." },
        { status: 400 }
      );
    }

    console.error("Update produk error:", error);

    return NextResponse.json(
      { error: "Gagal memperbarui produk." },
      { status: 500 }
    );
  }
}

// DELETE: Menghapus produk
export async function DELETE(
  _request: Request,
  { params }: Context
) {
  try {
    await requireAdmin();

    const id = Number((await params).id);

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "ID produk tidak valid." },
        { status: 400 }
      );
    }

    await prisma.produk.delete({
      where: { id },
    });

    return NextResponse.json({
      ok: true,
      message:
        "Produk berhasil dihapus. Snapshot produk pada riwayat pesanan tetap tersimpan.",
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
        { error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    if (code === "P2003") {
      return NextResponse.json(
        { error: "Produk masih digunakan oleh data lain." },
        { status: 409 }
      );
    }

    console.error("Delete produk error:", error);

    return NextResponse.json(
      { error: "Gagal menghapus produk." },
      { status: 500 }
    );
  }
}
