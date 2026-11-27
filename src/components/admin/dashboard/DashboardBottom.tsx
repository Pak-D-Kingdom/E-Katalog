
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getProductDescription } from "@/lib/types";

interface Product {
    id: number;
    kodeProduk: string;
    namaProduk: string;
    slug: string;
    deskripsi: string;
    jenisHarga: "tetap" | "rentang";
    harga: number | null;
    hargaMin: number | null;
    hargaMax: number | null;
    satuan: string;
    fotoUrl: string | null;
    tersedia: boolean;
    kategori: string;
    subkategori: string;
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
    totalHargaMax: number | null;
    dibuatPada: string;
    detailPesanan: OrderDetail[];
}

interface DashboardActivityResponse {
    produk: Product[];
    pesanan: Order[];
    kategori: { id: string; nama: string }[];
    pagination: { total: number; page: number; totalPages: number };
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
    const [categories, setCategories] = useState<
        DashboardActivityResponse["kategori"]
    >([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [nomorWhatsapp, setNomorWhatsapp] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const pageSize = 5;

    const loadDashboardActivity = useCallback(
        async (requestedPage: number, query: string, categoryId: string, signal: AbortSignal) => {
            setLoading(true);
            setError("");

            const params = new URLSearchParams({
                page: String(requestedPage),
                q: query.trim(),
                kategori: categoryId,
            });

            try {
                const response = await fetch(
                    `/api/dashboard/activity?${params}`,
                    { cache: "no-store", signal }
                );
                const result =
                    (await response.json()) as DashboardActivityResponse;

                if (!response.ok) {
                    throw new Error(
                        result.error || "Gagal mengambil data dashboard."
                    );
                }

                setProducts(result.produk);
                setOrders(result.pesanan);
                setCategories(result.kategori);
                setTotalProducts(result.pagination.total);
                setNomorWhatsapp(result.nomorWhatsapp);

                if (result.pagination.page !== requestedPage) {
                    setPage(result.pagination.page);
                }
            } catch (err) {
                if (!signal.aborted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Terjadi kesalahan saat mengambil data."
                    );
                }
            } finally {
                if (!signal.aborted) setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => {
            void loadDashboardActivity(page, search, category, controller.signal);
        }, search.trim() ? 250 : 0);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [page, search, category, loadDashboardActivity]);

    const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
    const currentPage = Math.min(page, totalPages);

    const paginationItems = useMemo(() => {
        if (totalPages <= 5) {
            return Array.from(
                { length: totalPages },
                (_, index) => index + 1
            );
        }

        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);

        if (currentPage <= 2) {
            start = 2;
            end = Math.min(3, totalPages - 1);
        }

        if (currentPage >= totalPages - 1) {
            start = Math.max(2, totalPages - 2);
            end = totalPages - 1;
        }

        const items: (number | string)[] = [1];

        if (start > 2) {
            items.push("ellipsis-left");
        }

        for (let number = start; number <= end; number++) {
            items.push(number);
        }

        if (end < totalPages - 1) {
            items.push("ellipsis-right");
        }

        items.push(totalPages);

        return items;
    }, [totalPages, currentPage]);

    const visibleProducts = products;

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
        <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">

            {/* KATALOG PRODUK */}
            <div className="min-w-0 rounded-xl border border-[#E5EAF3] bg-white p-5 sm:p-6">

                {/* HEADER KATALOG PRODUK */}
                <div className="mb-5 flex min-w-0 flex-col gap-3">
                    {/* Judul */}
                    <div className="min-w-0">
                        <h2 className="text-[19px] font-semibold text-[#172B4D]">
                            Katalog Produk
                        </h2>

                        <p className="mt-1 text-[12px] leading-relaxed text-[#596780]">
                            Daftar produk yang tersimpan dalam database katalog
                        </p>
                    </div>

                    {/* Pencarian dan Filter Kategori */}
                    <div className="flex w-full min-w-0 flex-wrap items-center gap-2">

                        {/* Search */}
                        <div className="flex min-w-0 flex-1 basis-[190px] items-center gap-2 rounded-md bg-[#EAF0FC] px-3 py-2">
                            <Search
                                size={15}
                                className="shrink-0 text-[#64748B]"
                            />

                            <input
                                value={search}
                                onChange={(event) =>
                                    changeSearch(event.target.value)
                                }
                                placeholder="Cari nama / SKU..."
                                className="w-full min-w-0 bg-transparent text-[11px] text-[#172B4D] outline-none placeholder:text-[#94A3B8]"
                            />
                        </div>

                        {/* Filter Kategori */}
                        <div className="flex min-w-0 flex-1 basis-[140px] items-center gap-2 rounded-md bg-[#EAF0FC] px-2 sm:w-[170px] sm:flex-none">

                            <SlidersHorizontal
                                size={16}
                                className="shrink-0 text-[#172B4D]"
                            />

                            <select
                                value={category}
                                onChange={(event) =>
                                    changeCategory(event.target.value)
                                }
                                aria-label="Filter kategori produk"
                                className="w-full min-w-0 flex-1 cursor-pointer bg-transparent py-2 text-[10px] text-[#172B4D] outline-none"
                            >
                                <option value="all">Semua</option>

                                {categories.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.nama}
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
                <div className="w-full overflow-x-auto rounded-md">
                    <table className="w-full min-w-[1450px] border-collapse text-left">
                        <thead>
                            <tr className="bg-[#EEF3FF] text-[10px] font-bold uppercase tracking-wide text-[#596780]">
                                <th className="px-3 py-3">Foto, Produk & SKU</th>
                                <th className="px-3 py-3">Kategori</th>
                                <th className="px-3 py-3">Subkategori</th>
                                <th className="px-3 py-3">Jenis Harga</th>
                                <th className="px-3 py-3">Rincian Harga</th>
                                <th className="px-3 py-3">Satuan Produk</th>
                                <th className="px-3 py-3">Deskripsi</th>
                                <th className="px-3 py-3">Slug URL</th>
                                <th className="px-3 py-3 text-center">Ketersediaan</th>
                            </tr>
                        </thead>

                        <tbody>
                            {!loading &&
                                visibleProducts.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="border-b border-[#EAF0F8] last:border-0 align-top"
                                    >
                                        {/* Foto, Nama, SKU */}
                                        <td className="min-w-[230px] px-3 py-3">
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

                                        {/* Kategori */}
                                        <td className="min-w-[140px] px-3 py-3">
                                            <span className="inline-block rounded-md bg-[#DCE7FF] px-2 py-1 text-[9px] font-medium text-[#172B4D]">
                                                {product.kategori}
                                            </span>
                                        </td>

                                        {/* Subkategori */}
                                        <td className="min-w-[150px] px-3 py-3 text-[10px] text-[#172B4D]">
                                            {product.subkategori || "—"}
                                        </td>

                                        {/* Jenis Harga */}
                                        <td className="min-w-[120px] px-3 py-3">
                                            <span
                                                className={`inline-block rounded-md px-2 py-1 text-[9px] font-bold ${product.jenisHarga === "rentang"
                                                        ? "bg-orange-50 text-orange-700"
                                                        : "bg-blue-50 text-blue-700"
                                                    }`}
                                            >
                                                {product.jenisHarga === "rentang"
                                                    ? "Harga Rentang"
                                                    : "Harga Tetap"}
                                            </span>
                                        </td>

                                        {/* Rincian Harga */}
                                        <td className="min-w-[180px] px-3 py-3 text-[11px] font-bold text-[#172B4D]">
                                            {product.jenisHarga === "rentang" ? (
                                                product.hargaMin != null &&
                                                    product.hargaMax != null ? (
                                                    <div>
                                                        <p>
                                                            {formatRupiah(product.hargaMin)}
                                                        </p>
                                                        <p className="mt-1">
                                                            s.d. {formatRupiah(product.hargaMax)}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    "Hubungi Admin"
                                                )
                                            ) : product.harga != null ? (
                                                formatRupiah(product.harga)
                                            ) : (
                                                "Harga belum tersedia"
                                            )}
                                        </td>

                                        {/* Satuan */}
                                        <td className="min-w-[110px] px-3 py-3 text-[10px] text-[#172B4D]">
                                            {product.satuan || "—"}
                                        </td>

                                        {/* Deskripsi */}
                                        <td className="min-w-[260px] max-w-[300px] px-3 py-3">
                                            <p className="whitespace-normal break-words text-[10px] leading-5 text-[#596780]">
                                                {getProductDescription(product.deskripsi) || "Belum ada deskripsi"}
                                            </p>
                                        </td>

                                        {/* Slug */}
                                        <td className="min-w-[160px] max-w-[190px] px-3 py-3">
                                            <p className="break-all text-[10px] text-[#596780]">
                                                {product.slug || "—"}
                                            </p>
                                        </td>

                                        {/* Status */}
                                        <td className="min-w-[120px] px-3 py-3 text-center">
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
                                        colSpan={9}
                                        className="px-3 py-10 text-center text-[12px] text-[#64748B]"
                                    >
                                        Memuat katalog produk...
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && visibleProducts.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={9}
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
                <div className="mt-4 flex flex-col gap-3 border-t border-[#EAF0F8] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] text-[#596780]">
                        Menampilkan{" "}
                        <span className="font-semibold text-[#172B4D]">
                            {loading ? "..." : visibleProducts.length}
                        </span>{" "}
                        dari{" "}
                        <span className="font-semibold text-[#172B4D]">
                            {totalProducts}
                        </span>{" "}
                        produk terdaftar
                    </p>

                    <div className="flex flex-wrap items-center justify-end gap-1">
                        <button
                            type="button"
                            disabled={currentPage === 1 || loading}
                            onClick={() =>
                                setPage((value) => Math.max(1, value - 1))
                            }
                            className="rounded-md bg-[#E5EDFF] p-2 text-[#172B4D] hover:bg-[#D5E2FA] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Halaman sebelumnya"
                        >
                            <ChevronLeft size={14} />
                        </button>

                        {paginationItems.map((item, index) =>
                            typeof item === "number" ? (
                                <button
                                    type="button"
                                    key={item}
                                    onClick={() => setPage(item)}
                                    disabled={loading}
                                    className={`min-w-8 rounded-md px-2 py-2 text-[10px] font-bold ${currentPage === item
                                        ? "bg-[#A83D00] text-white"
                                        : "bg-[#E5EDFF] text-[#172B4D] hover:bg-[#D5E2FA]"
                                        }`}
                                >
                                    {item}
                                </button>
                            ) : (
                                <span
                                    key={`${item}-${index}`}
                                    className="px-1 text-xs text-[#94A3B8]"
                                >
                                    ...
                                </span>
                            )
                        )}

                        <button
                            type="button"
                            disabled={currentPage === totalPages || loading}
                            onClick={() =>
                                setPage((value) =>
                                    Math.min(totalPages, value + 1)
                                )
                            }
                            className="rounded-md bg-[#E5EDFF] p-2 text-[#172B4D] hover:bg-[#D5E2FA] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Halaman selanjutnya"
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
                                        {order.totalHargaMax == null
                                            ? formatRupiah(order.totalHarga)
                                            : `${formatRupiah(order.totalHarga)} – ${formatRupiah(order.totalHargaMax)} (estimasi)`}
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
