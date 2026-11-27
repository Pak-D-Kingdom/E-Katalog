
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
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get("admin") === "1") {
      await requireAdmin();

      if (searchParams.get("codesOnly") === "1") {
        const produk = await prisma.produk.findMany({
          select: { kode_produk: true },
        });

        return NextResponse.json({
          kodeProduk: produk.map((item) => item.kode_produk),
        });
      }

      const requestedPage = Number(searchParams.get("page") ?? "1");
      const pageSize = Number(searchParams.get("pageSize") ?? "4");
      const categoryId = searchParams.get("kategori");
      const subcategoryId = searchParams.get("subkategori");
      const query = searchParams.get("q")?.trim() ?? "";

      if (
        !Number.isSafeInteger(requestedPage) ||
        requestedPage < 1 ||
        !Number.isSafeInteger(pageSize) ||
        pageSize < 1 ||
        pageSize > 50
      ) {
        return NextResponse.json(
          { error: "Parameter halaman tidak valid." },
          { status: 400 }
        );
      }

      const parsedCategoryId =
        categoryId && categoryId !== "all" ? Number(categoryId) : null;
      const parsedSubcategoryId =
        subcategoryId && subcategoryId !== "all"
          ? Number(subcategoryId)
          : null;

      if (
        (parsedCategoryId !== null &&
          (!Number.isSafeInteger(parsedCategoryId) || parsedCategoryId < 1)) ||
        (parsedSubcategoryId !== null &&
          (!Number.isSafeInteger(parsedSubcategoryId) ||
            parsedSubcategoryId < 1))
      ) {
        return NextResponse.json(
          { error: "Filter kategori tidak valid." },
          { status: 400 }
        );
      }

      const idsParam = searchParams.get("ids");
      if (idsParam) {
        const ids = idsParam
          .split(",")
          .map((v) => Number(v.trim()))
          .filter((v) => Number.isInteger(v) && v > 0);

        if (ids.length === 0) {
          return NextResponse.json({ produk: [] });
        }

        const produk = await prisma.produk.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            kategori_id: true,
            subkategori_id: true,
            kode_produk: true,
            nama_produk: true,
            slug: true,
            deskripsi: true,
            informasi_gizi: true,
            jenis_harga: true,
            harga: true,
            harga_min: true,
            harga_max: true,
            stok: true,
            satuan: true,
            foto_url: true,
            tersedia: true,
            kategori: {
              select: {
                id: true,
                nama_kategori: true,
                slug: true,
                ikon_url: true,
              },
            },
            subkategori: {
              select: {
                id: true,
                kategori_id: true,
                nama_subkategori: true,
                slug: true,
              },
            },
          },
          orderBy: { dibuat_pada: "desc" },
        });

        return NextResponse.json({ produk });
      }

      const where = {
        ...(parsedCategoryId !== null
          ? { kategori_id: parsedCategoryId }
          : {}),
        ...(parsedSubcategoryId !== null
          ? { subkategori_id: parsedSubcategoryId }
          : {}),
        ...(query
          ? {
              OR: [
                { nama_produk: { contains: query } },
                { kode_produk: { contains: query } },
                {
                  subkategori: {
                    is: { nama_subkategori: { contains: query } },
                  },
                },
              ],
            }
          : {}),
      };

      const total = await prisma.produk.count({ where });
      const stats =
        searchParams.get("stats") === "1"
          ? await Promise.all([
              prisma.produk.count(),
              prisma.produk.count({ where: { tersedia: true } }),
              prisma.produk.count({ where: { foto_url: { not: null } } }),
            ])
          : null;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const page = Math.min(requestedPage, totalPages);

      const produk = await prisma.produk.findMany({
        where,
        select: {
          id: true,
          kategori_id: true,
          subkategori_id: true,
          kode_produk: true,
          nama_produk: true,
          slug: true,
          deskripsi: true,
          informasi_gizi: true,
          jenis_harga: true,
          harga: true,
          harga_min: true,
          harga_max: true,
          stok: true,
          satuan: true,
          foto_url: true,
          tersedia: true,
          kategori: {
            select: {
              id: true,
              nama_kategori: true,
              slug: true,
              ikon_url: true,
            },
          },
          subkategori: {
            select: {
              id: true,
              kategori_id: true,
              nama_subkategori: true,
              slug: true,
            },
          },
        },
        orderBy: { dibuat_pada: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return NextResponse.json({
        produk,
        pagination: { total, page, pageSize, totalPages },
        ...(stats
          ? {
              stats: {
                totalProduk: stats[0],
                produkAktif: stats[1],
                totalFoto: stats[2],
              },
            }
          : {}),
      });
    }

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
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Tidak berizin." },
        { status: 401 }
      );
    }

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
