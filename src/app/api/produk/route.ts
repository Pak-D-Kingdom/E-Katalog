
import { NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { produkSchema, zodErrorMessage } from "@/lib/validation";

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

    const [produk, rekapBarang] = await Promise.all([
      prisma.produk.findMany({
      where: session ? {} : { tersedia: true },
      include: {
        kategori: true,
        subkategori: true,
      },
      orderBy: {
        dibuat_pada: "desc",
      },
      }),
      prisma.rekap_barang.findMany({
        select: {
          kategori: true,
          subkategori: true,
          jumlah_barang: true,
        },
      }),
    ]);

    const rekapBySubcategory = new Map(
      rekapBarang.map((item) => [
        `${item.kategori.trim().toLocaleLowerCase()}|${item.subkategori.trim().toLocaleLowerCase()}`,
        item.jumlah_barang,
      ])
    );
    const produkDenganRekap = produk.map((item) => ({
      ...item,
      jumlah_barang_subkategori:
        item.kategori && item.subkategori
          ? rekapBySubcategory.get(
              `${item.kategori.nama_kategori.trim().toLocaleLowerCase()}|${item.subkategori.nama_subkategori.trim().toLocaleLowerCase()}`
            ) ?? null
          : null,
    }));

    return NextResponse.json({ produk: produkDenganRekap });
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
