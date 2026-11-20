
"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Search,
    SlidersHorizontal,
    ExternalLink,
    Headset,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Package,
} from "lucide-react";

interface Product {
    id: number;
    kodeProduk: string;
    namaProduk: string;
    harga: number;
    satuan: string;
    fotoUrl: string | null;
    tersedia: boolean;
    kategori: string;
    diperbaruiPada: string;
}

interface OrderDetail {
    namaProduk: string;
    jumlah: number;
}

interface Order {
    id: number;
    kodePesanan: string;
    namaPemesan: string;
    namaSekolah: string | null;
    teleponPemesan: string | null;
    totalHarga: number;
    dibuatPada: string;
    detailPesanan: OrderDetail[];
}

interface DashboardActivityResponse {
    produk: Product[];
    pesanan: Order[];
    nomorWhatsapp: string | null;
    error?: string;
}

function formatRupiah(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function ProductThumbnail({
    image,
    name,
}: {
    image: string | null;
    name: string;
}) {
    return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#EAF0FC]">
            {image ? (
                <img
                    src={image}
                    alt={name}
                    className="h-full w-full object-cover"
                />
            ) : (
                <Package size={21} className="text-[#64748B]" />
            )}
        </div>
    );
}

export default function DashboardBottom() {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [nomorWhatsapp, setNomorWhatsapp] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("Semua");
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const pageSize = 5;

    // Mengambil katalog produk dan aktivitas pesanan dari API
    useEffect(() => {
        let isMounted = true;

        async function fetchDashboardActivity() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    "/api/dashboard/activity",
                    { cache: "no-store" }
                );

                const result =
                    (await response.json()) as DashboardActivityResponse;

                if (!response.ok) {
                    throw new Error(
                        result.error || "Gagal mengambil data dashboard."
                    );
                }

                if (isMounted) {
                    setProducts(result.produk);
                    setOrders(result.pesanan);
                    setNomorWhatsapp(result.nomorWhatsapp);
                }
            } catch (err) {
                if (isMounted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Terjadi kesalahan saat mengambil data."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchDashboardActivity();

        return () => {
            isMounted = false;
        };
    }, []);

    // Pilihan kategori mengikuti data database
    const categories = useMemo(() => {
        return [
            ...new Set(products.map((product) => product.kategori)),
        ].sort((a, b) => a.localeCompare(b, "id"));
    }, [products]);

    // Pencarian dan filter produk
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const keyword = search.toLowerCase();

            const matchesSearch =
                product.namaProduk.toLowerCase().includes(keyword) ||
                product.kodeProduk.toLowerCase().includes(keyword);

            const matchesCategory =
                category === "Semua" || product.kategori === category;

            return matchesSearch && matchesCategory;
        });
    }, [products, search, category]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredProducts.length / pageSize)
    );

    const currentPage = Math.min(page, totalPages);

    const visibleProducts = filteredProducts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    function changeSearch(value: string) {
        setSearch(value);
        setPage(1);
    }

    function changeCategory(value: string) {
        setCategory(value);
        setPage(1);
    }

    const safeWhatsapp = nomorWhatsapp?.replace(/\D/g, "") ?? "";

    return (
        <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.6fr_1fr]">

            {/* KATALOG PRODUK */}
            <div className="min-w-0 rounded-xl border border-[#E5EAF3] bg-white p-5 sm:p-6">

                <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                    <div>
                        <h2 className="text-[19px] font-semibold text-[#172B4D]">
                            Katalog Produk
                        </h2>

                        <p className="mt-1 text-[12px] leading-relaxed text-[#596780]">
                            Daftar produk yang tersimpan dalam database katalog
                        </p>
                    </div>

                    <div className="flex min-w-0 items-center gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-[#EAF0FC] px-3 py-2 lg:w-[190px] lg:flex-none">
                            <Search size={15} className="shrink-0 text-[#64748B]" />

                            <input
                                value={search}
                                onChange={(event) => changeSearch(event.target.value)}
                                placeholder="Cari nama / SKU..."
                                className="w-full min-w-0 bg-transparent text-[11px] text-[#172B4D] outline-none placeholder:text-[#94A3B8]"
                            />
                        </div>

                        <div className="flex items-center rounded-md bg-[#EAF0FC] px-2">
                            <SlidersHorizontal
                                size={16}
                                className="text-[#172B4D]"
                            />

                            <select
                                value={category}
                                onChange={(event) => changeCategory(event.target.value)}
                                aria-label="Filter kategori produk"
                                className="max-w-[150px] cursor-pointer bg-transparent py-2 text-[10px] text-[#172B4D] outline-none"
                            >
                                <option value="Semua">Semua</option>

                                {categories.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ERROR */}
                {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-[12px] text-red-600">
                        {error}
                    </div>
                )}

                {/* TABEL PRODUK */}
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[590px] border-collapse text-left">
                        <thead>
                            <tr className="bg-[#EEF3FF] text-[10px] font-bold uppercase tracking-wide text-[#596780]">
                                <th className="px-3 py-3">Produk & SKU</th>
                                <th className="px-3 py-3">Kategori</th>
                                <th className="px-3 py-3">Harga Satuan</th>
                                <th className="px-3 py-3 text-center">
                                    Ketersediaan
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {!loading &&
                                visibleProducts.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="border-b border-[#EAF0F8] last:border-0"
                                    >
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-3">
                                                <ProductThumbnail
                                                    image={product.fotoUrl}
                                                    name={product.namaProduk}
                                                />

                                                <div className="min-w-0">
                                                    <p className="text-[12px] font-bold text-[#172B4D]">
                                                        {product.namaProduk}
                                                    </p>

                                                    <p className="mt-1 text-[9px] text-[#64748B]">
                                                        SKU: {product.kodeProduk}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-3 py-3">
                                            <span className="inline-block rounded-md bg-[#DCE7FF] px-2 py-1 text-[9px] font-medium text-[#172B4D]">
                                                {product.kategori}
                                            </span>
                                        </td>

                                        <td className="px-3 py-3 text-[11px] font-bold text-[#172B4D]">
                                            {formatRupiah(product.harga)}
                                            <span className="block text-[9px] font-normal text-[#64748B]">
                                                / {product.satuan}
                                            </span>
                                        </td>

                                        <td className="px-3 py-3 text-center">
                                            {product.tersedia ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600">
                                                    <CheckCircle2 size={15} />
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-500">
                                                    <XCircle size={15} />
                                                    Tidak aktif
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                            {loading && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-3 py-10 text-center text-[12px] text-[#64748B]"
                                    >
                                        Memuat katalog produk...
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && visibleProducts.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-3 py-10 text-center text-[12px] text-[#64748B]"
                                    >
                                        Produk tidak ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#EAF0F8] pt-4">
                    <p className="text-[11px] text-[#596780]">
                        Menampilkan{" "}
                        <span className="font-semibold text-[#172B4D]">
                            {loading ? "..." : visibleProducts.length}
                        </span>{" "}
                        dari{" "}
                        <span className="font-semibold text-[#172B4D]">
                            {filteredProducts.length}
                        </span>{" "}
                        produk terdaftar
                    </p>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() =>
                                setPage((value) => Math.max(1, value - 1))
                            }
                            className="rounded-md bg-[#E5EDFF] px-2 py-2 text-[10px] font-medium text-[#172B4D] hover:bg-[#D5E2FA] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft size={14} />
                        </button>

                        {Array.from(
                            { length: totalPages },
                            (_, index) => index + 1
                        ).map((number) => (
                            <button
                                type="button"
                                key={number}
                                onClick={() => setPage(number)}
                                disabled={loading}
                                className={`min-w-8 rounded-md px-2 py-2 text-[10px] font-bold ${currentPage === number
                                        ? "bg-[#A83D00] text-white"
                                        : "bg-[#E5EDFF] text-[#172B4D] hover:bg-[#D5E2FA]"
                                    }`}
                            >
                                {number}
                            </button>
                        ))}

                        <button
                            type="button"
                            disabled={currentPage === totalPages || loading}
                            onClick={() =>
                                setPage((value) =>
                                    Math.min(totalPages, value + 1)
                                )
                            }
                            className="rounded-md bg-[#E5EDFF] px-2 py-2 text-[10px] font-medium text-[#172B4D] hover:bg-[#D5E2FA] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* AKTIVITAS PESANAN TERBARU */}
            <div className="min-w-0 rounded-xl border border-[#E5EAF3] bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#172B4D]">
                        <span className="h-3 w-3 rounded-full bg-[#22C55E]" />
                        Aktivitas Pesanan Terbaru
                    </h2>

                    <span className="text-[9px] font-medium text-[#596780]">
                        Database
                    </span>
                </div>

                <p className="mb-5 mt-3 text-[11px] leading-relaxed text-[#64748B]">
                    Informasi pesanan terbaru yang tercatat dalam sistem katalog.
                </p>

                <div className="space-y-2">
                    {!loading && orders.length === 0 && !error && (
                        <div className="rounded-lg border border-dashed border-[#D8E0EE] bg-[#F8FAFD] px-4 py-10 text-center">
                            <Package
                                size={30}
                                className="mx-auto mb-3 text-[#94A3B8]"
                            />

                            <p className="text-[12px] font-semibold text-[#172B4D]">
                                Belum Ada Pesanan
                            </p>

                            <p className="mt-1 text-[10px] leading-relaxed text-[#64748B]">
                                Pesanan yang masuk akan ditampilkan di bagian ini.
                            </p>
                        </div>
                    )}

                    {loading && (
                        <div className="rounded-lg bg-[#EEF3FF] px-4 py-10 text-center text-[11px] text-[#64748B]">
                            Memuat aktivitas pesanan...
                        </div>
                    )}

                    {!loading &&
                        !error &&
                        orders.map((order) => (
                            <div
                                key={order.id}
                                className="rounded-lg bg-[#EEF3FF] p-3"
                            >
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                                    <p className="text-[10px] font-bold text-[#A83D00]">
                                        {order.kodePesanan}
                                    </p>

                                    <span className="text-[9px] text-[#64748B]">
                                        {formatDate(order.dibuatPada)}
                                    </span>
                                </div>

                                <h3 className="text-[12px] font-bold leading-snug text-[#172B4D]">
                                    {order.namaPemesan}
                                </h3>

                                {order.namaSekolah && (
                                    <p className="mt-1 text-[10px] text-[#64748B]">
                                        {order.namaSekolah}
                                    </p>
                                )}

                                <p className="mt-2 text-[10px] leading-relaxed text-[#596780]">
                                    {order.detailPesanan
                                        .map(
                                            (detail) =>
                                                `${detail.namaProduk} (${detail.jumlah})`
                                        )
                                        .join(", ") || "Detail produk tidak tersedia"}
                                </p>

                                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-[10px] text-[#596780]">
                                        Total Pesanan
                                    </span>

                                    <span className="text-[11px] font-bold text-[#172B4D]">
                                        {formatRupiah(order.totalHarga)}
                                    </span>
                                </div>
                            </div>
                        ))}
                </div>

                {/* NOMOR CS WHATSAPP */}
                <div className="mt-5 flex items-center justify-between gap-3 rounded-lg bg-[#E5EEFF] p-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#A83D00]">
                            <Headset size={20} />
                        </div>

                        <div className="min-w-0">
                            <p className="text-[12px] font-bold text-[#172B4D]">
                                Nomor CS WhatsApp Aktif
                            </p>

                            <p className="mt-1 text-[12px] text-[#596780]">
                                {safeWhatsapp ? `+${safeWhatsapp}` : "Belum diatur"}
                            </p>

                            <p className="text-[10px] text-[#64748B]">
                                Sales Procurement
                            </p>
                        </div>
                    </div>

                    <a
                        href={
                            safeWhatsapp
                                ? `https://wa.me/${safeWhatsapp}`
                                : "/admin/dashboard/pengaturan"
                        }
                        target={safeWhatsapp ? "_blank" : undefined}
                        rel={safeWhatsapp ? "noreferrer" : undefined}
                        className="flex shrink-0 items-center gap-1 rounded-md bg-white px-3 py-2 text-[10px] font-bold text-[#172B4D] transition hover:bg-[#F8FAFC]"
                    >
                        {safeWhatsapp ? "Hubungi" : "Atur"}
                        <ExternalLink size={12} />
                    </a>
                </div>
            </div>
        </section>
    );
}
