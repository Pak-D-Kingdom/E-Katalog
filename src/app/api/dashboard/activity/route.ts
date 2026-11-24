
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(request.url);
        const requestedPage = Number(searchParams.get("page") ?? "1");
        const pageSize = 5;
        const query = searchParams.get("q")?.trim() ?? "";
        const categoryId = searchParams.get("kategori") ?? "all";

        if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) {
            return NextResponse.json(
                { error: "Parameter halaman tidak valid." },
                { status: 400 }
            );
        }

        const parsedCategoryId =
            categoryId === "all" || categoryId === "none"
                ? categoryId
                : Number(categoryId);

        if (
            typeof parsedCategoryId === "number" &&
            (!Number.isSafeInteger(parsedCategoryId) || parsedCategoryId < 1)
        ) {
            return NextResponse.json(
                { error: "Filter kategori tidak valid." },
                { status: 400 }
            );
        }

        const where = {
            ...(parsedCategoryId === "none"
                ? { kategori_id: null }
                : typeof parsedCategoryId === "number"
                    ? { kategori_id: parsedCategoryId }
                    : {}),
            ...(query
                ? {
                    OR: [
                        { nama_produk: { contains: query } },
                        { kode_produk: { contains: query } },
                    ],
                }
                : {}),
        };

        const totalProduk = await prisma.produk.count({ where });
        const totalPages = Math.max(1, Math.ceil(totalProduk / pageSize));
        const page = Math.min(requestedPage, totalPages);

        const [produk, pesanan, pengaturan, kategori, produkTanpaKategori] =
            await Promise.all([
                prisma.produk.findMany({
                    where,
                    orderBy: {
                        diperbarui_pada: "desc",
                    },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    select: {
                        id: true,
                        kode_produk: true,
                        nama_produk: true,
                        slug: true,
                        deskripsi: true,
                        jenis_harga: true,
                        harga: true,
                        harga_min: true,
                        harga_max: true,
                        satuan: true,
                        foto_url: true,
                        tersedia: true,
                        diperbarui_pada: true,
                        kategori: {
                            select: {
                                nama_kategori: true,
                            },
                        },
                        subkategori: {
                            select: {
                                nama_subkategori: true,
                            },
                        },
                    },
                }),

            // Mengambil 4 pesanan terbaru beserta detailnya
            prisma.riwayat_pesanan.findMany({
                orderBy: {
                    dibuat_pada: "desc",
                },
                take: 4,
                include: {
                    detail_pesanan: {
                        select: {
                            nama_produk: true,
                            jumlah: true,
                        },
                    },
                },
            }),

            // Mengambil nomor WhatsApp dari pengaturan katalog
            prisma.pengaturan_katalog.findFirst({
                orderBy: {
                    diperbarui_pada: "desc",
                },
                select: {
                    nomor_whatsapp: true,
                },
            }),
            prisma.kategori.findMany({
                where: { produk: { some: {} } },
                select: { id: true, nama_kategori: true },
                orderBy: { nama_kategori: "asc" },
            }),
            prisma.produk.count({ where: { kategori_id: null } }),
        ]);

        return NextResponse.json({
            produk: produk.map((item) => ({
                id: item.id,
                kodeProduk: item.kode_produk,
                namaProduk: item.nama_produk,
                slug: item.slug,
                deskripsi: item.deskripsi,
                jenisHarga: item.jenis_harga,
                harga: item.harga != null ? Number(item.harga) : null,
                hargaMin: item.harga_min != null ? Number(item.harga_min) : null,
                hargaMax: item.harga_max != null ? Number(item.harga_max) : null,
                satuan: item.satuan,
                fotoUrl: item.foto_url,
                tersedia: item.tersedia,
                kategori: item.kategori?.nama_kategori ?? "Belum Dikategorikan",
                subkategori: item.subkategori?.nama_subkategori ?? "Belum Ada Subkategori",
                diperbaruiPada: item.diperbarui_pada,
            })),

            pesanan: pesanan.map((item) => ({
                id: item.id,
                kodePesanan: item.kode_pesanan,
                namaPemesan: item.nama_pemesan,
                namaSekolah: item.nama_sekolah,
                teleponPemesan: item.telepon_pemesan,
                totalHarga: Number(item.total_harga),
                totalHargaMax: item.total_harga_max != null
                    ? Number(item.total_harga_max)
                    : null,
                dibuatPada: item.dibuat_pada,
                detailPesanan: item.detail_pesanan.map(
                    (detail) => ({
                        namaProduk: detail.nama_produk,
                        jumlah: detail.jumlah,
                    })
                ),
            })),

            kategori: [
                ...kategori.map((item) => ({
                    id: String(item.id),
                    nama: item.nama_kategori,
                })),
                ...(produkTanpaKategori > 0
                    ? [{ id: "none", nama: "Belum Dikategorikan" }]
                    : []),
            ],
            pagination: { total: totalProduk, page, totalPages },
            nomorWhatsapp: pengaturan?.nomor_whatsapp ?? null,
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

        console.error("Dashboard activity error:", error);

        return NextResponse.json(
            { error: "Gagal mengambil aktivitas dashboard." },
            { status: 500 }
        );
    }
}
