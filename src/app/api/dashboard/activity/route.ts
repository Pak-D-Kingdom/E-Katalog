
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await requireAdmin();

        const [produk, pesanan, pengaturan] = await Promise.all([
            // Mengambil seluruh produk untuk tabel katalog
            prisma.produk.findMany({
                orderBy: {
                    diperbarui_pada: "desc",
                },
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
