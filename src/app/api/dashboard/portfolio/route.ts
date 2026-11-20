
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await requireAdmin();

        const [totalProdukAktif, produkTanpaKategori, kategori] =
            await Promise.all([
                prisma.produk.count({
                    where: { tersedia: true },
                }),
                prisma.produk.count({
                    where: {
                        tersedia: true,
                        kategori_id: null,
                    },
                }),
                prisma.kategori.findMany({
                    orderBy: {
                        nama_kategori: "asc",
                    },
                    include: {
                        produk: {
                            where: {
                                tersedia: true,
                            },
                            select: {
                                id: true,
                            },
                        },
                    },
                }),
            ]);

        const portfolio = kategori.map((item) => {
            const jumlahProduk = item.produk.length;

            return {
                id: item.id,
                nama_kategori: item.nama_kategori,
                jumlahProduk,
                percentage:
                    totalProdukAktif > 0
                        ? Math.round(
                            (jumlahProduk / totalProdukAktif) * 100
                        )
                        : 0,
            };
        });

        // Menampilkan produk yang belum memiliki kategori
        if (produkTanpaKategori > 0) {
            portfolio.push({
                id: 0,
                nama_kategori: "Belum Dikategorikan",
                jumlahProduk: produkTanpaKategori,
                percentage: Math.round(
                    (produkTanpaKategori / totalProdukAktif) * 100
                ),
            });
        }

        return NextResponse.json({
            totalProdukAktif,
            portfolio,
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

        console.error("Dashboard portfolio error:", error);

        return NextResponse.json(
            { error: "Gagal mengambil portfolio inventaris." },
            { status: 500 }
        );
    }
}
