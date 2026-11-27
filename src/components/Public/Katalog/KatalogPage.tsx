"use client";

import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Download, Layers3, Minus, PackageOpen, Plus, Search, ShoppingCart, SlidersHorizontal, Utensils, X } from "lucide-react";
import {
  formatProductPrice,
  getProductDescription,
  hargaRentang,
  hargaSatuan,
  slugify,
} from "@/lib/types";
import type { Category, Product } from "@/lib/types";
import type { CartItem, CatalogSettings } from "../types";

const categoryOrder = [
  "bahan-baku",
  "perizinan",
  "perawatan",
  "peralatan"
];
const productOrder = [
  "DK-RNG-4BOV", "DK-DFY-E24L", "DK-REF-UP4D", "DK-MIX-PL20", "DK-EXH-BF24",
  "DK-FOD-BSM58", "DK-FOD-MYK18", "DK-FOD-AYN10", "DK-SUP-BX500", "DK-SUP-GLV100",
  "DK-SRV-SLHS1", "DK-SRV-HACCP", "DK-SRV-IPAL3", "DK-SRV-ERL18",
  "DK-MNT-PEST4", "DK-MNT-GAS01", "DK-MNT-GRS92", "DK-MNT-REF34"
];
const PAGE_SIZE = 5;

function getPaginationItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 3) return [1, 2, 3, "ellipsis", totalPages];
  if (currentPage >= totalPages - 2) return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

const ProductCard = memo(function ProductCard({ product, onDetail, onAdd }: {
  product: Product;
  onDetail: () => void;
  onAdd: (source: HTMLElement) => void;
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[#e2eaf8] bg-white shadow-[0_6px_20px_rgba(15,43,92,.06)] transition duration-300 hover:-translate-y-1 hover:border-[#c8d9f5] hover:shadow-[0_14px_32px_rgba(15,43,92,.12)]">
      <button onClick={onDetail} aria-label={`Lihat detail ${product.nama_produk}`} className="relative block aspect-[1.55/1] w-full overflow-hidden bg-[#edf2ff] text-left sm:aspect-[1.2/1]">
        {product.foto_url
        ? <img src={product.foto_url} alt={product.nama_produk} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(e) => { const img = e.currentTarget as HTMLImageElement; img.src = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='160'%3E%3Crect width='100%25' height='100%25' fill='%23edf2ff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%232563EB' font-size='12'%3EGambar tidak tersedia%3C/text%3E%3C/svg%3E"; img.onerror = null; }} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          : <span className="flex h-full w-full items-center justify-center text-[#2563EB]/35" aria-hidden="true"><PackageOpen size={30}/></span>}
        <span className="absolute right-2 top-2 max-w-[55%] truncate rounded bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700">{product.subkategori?.nama_subkategori || product.kategori?.nama_kategori || "Layanan"}</span>
      </button>
      <div className="flex min-h-[155px] flex-col p-2 sm:min-h-[170px] sm:p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-bold uppercase tracking-[.12em] text-slate-500">{product.kode_produk}</p>
        </div>
        <button onClick={onDetail} className="mt-1 min-h-10 text-left text-sm font-extrabold leading-5 text-slate-900 hover:text-[#2563EB]">{product.nama_produk}</button>
        <div className="mt-auto pt-2">
          <small className="block text-xs text-slate-600">Harga Satuan</small>
          <b className="block text-base font-extrabold leading-6 text-[#2563EB]">
            {formatProductPrice(product)}
          </b>
          <div className="mt-1.5 grid min-w-0 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-1">
            <button onClick={onDetail} aria-label={`Lihat detail ${product.nama_produk}`} className="inline-flex min-w-0 items-center justify-center gap-1 rounded bg-[#e7efff] px-1 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-[#dbe7ff] sm:px-2 sm:text-xs"><Search size={12} className="shrink-0" /><span className="hidden min-[375px]:inline">Detail</span></button>
            <button
              onClick={(event) => onAdd(event.currentTarget)}
              disabled={
                !product.tersedia ||
                product.stok === 0 ||
                (hargaSatuan(product) == null && hargaRentang(product) == null)
              }
              title={
                product.jenis_harga === "rentang"
                  ? "Harga final produk ini akan dikonfirmasi Admin"
                  : "Tambah ke keranjang"
              }
              aria-label={`Tambah ${product.nama_produk} ke keranjang`}
              className="inline-flex min-w-0 items-center justify-center gap-1 rounded bg-[#0F2B5C] px-1 py-1.5 text-[11px] font-bold text-white hover:bg-[#0b2148] disabled:cursor-not-allowed disabled:opacity-40 sm:px-2 sm:text-xs"
            >
              <ShoppingCart size={12} className="shrink-0" />

              <span className="hidden min-[375px]:inline sm:hidden">
                Tambah
              </span>

              <span className="hidden sm:inline">
                Keranjang
              </span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
});

function KatalogPage({
  products,
  categories,
  settings,
  loading,
  error,
  cart,
  search,
  onSearchChange,
  onAdd,
  onAdjust,
  onOpenCart
}: {
  products: Product[];
  categories: Category[];
  settings: CatalogSettings | null;
  loading: boolean;
  error: string;
  cart: CartItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: (product: Product, source?: HTMLElement, quantity?: number) => void;
  onAdjust: (id: number, delta: number) => void;
  onOpenCart: () => void;
}) {
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Product | null>(null);
  const [category, setCategory] = useState<number | null>(null);
  const [requestedCategory, setRequestedCategory] = useState<string | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfCategory, setPdfCategory] = useState("all");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    setRequestedCategory(searchParams.get("kategori"));
    setSubcategoryFilter("all");
    onSearchChange(searchParams.get("q") || "");
  }, [onSearchChange, searchParams]);

  useEffect(() => {
    if (!requestedCategory) return;
    const match = categories.find((item) =>
      item.slug === requestedCategory || slugify(item.nama_kategori) === requestedCategory
    );
    setCategory(match?.id ?? null);
  }, [categories, requestedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, requestedCategory, subcategoryFilter, priceRange, deferredSearch]);

  const catalogCategories = [...categories].sort((a, b) => {
    const aOrder = categoryOrder.indexOf(a.slug);
    const bOrder = categoryOrder.indexOf(b.slug);
    return (aOrder < 0 ? Number.MAX_SAFE_INTEGER : aOrder) -
      (bOrder < 0 ? Number.MAX_SAFE_INTEGER : bOrder);
  });
  const b2bProducts = useMemo(
    () => products.filter((product) => product.kategori),
    [products]
  );
  const subcategories = useMemo(
    () => [...new Set(
      b2bProducts
        .filter((product) => category === null || product.kategori_id === category)
        .map((product) => product.subkategori?.nama_subkategori?.trim() || "")
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b)),
    [b2bProducts, category]
  );
  const requestedCategoryMissing = Boolean(requestedCategory) && !loading && category === null &&
    !categories.some((item) =>
      item.slug === requestedCategory || slugify(item.nama_kategori) === requestedCategory
    );
  const visible = useMemo(() => {
    if (requestedCategoryMissing) return [];
    const query = deferredSearch.trim().toLowerCase();
    const filtered = b2bProducts.filter((product) => {
      const price = hargaSatuan(product);
      const range = hargaRentang(product);
      const inPriceRange =
        priceRange === "all" ||
        (price !== null && (
          (priceRange === "under-1m" && price < 1000000) ||
          (priceRange === "1m-5m" && price >= 1000000 && price < 5000000) ||
          (priceRange === "5m-15m" && price >= 5000000 && price < 15000000) ||
          (priceRange === "over-15m" && price >= 15000000)
        )) ||
        (range !== null && (
          (priceRange === "under-1m" && range.min < 1000000) ||
          (priceRange === "1m-5m" && range.max >= 1000000 && range.min < 5000000) ||
          (priceRange === "5m-15m" && range.max >= 5000000 && range.min < 15000000) ||
          (priceRange === "over-15m" && range.max >= 15000000)
        ));
      return (category === null || product.kategori_id === category) &&
        (subcategoryFilter === "all" || product.subkategori?.nama_subkategori === subcategoryFilter) &&
        (!query || `${product.nama_produk} ${product.kode_produk} ${product.subkategori?.nama_subkategori || ""} ${product.deskripsi}`.toLowerCase().includes(query)) &&
        inPriceRange;
    });
    filtered.sort((a, b) => {
      const aHasImage = Boolean(a.foto_url?.trim());
      const bHasImage = Boolean(b.foto_url?.trim());
      if (aHasImage !== bHasImage) return aHasImage ? -1 : 1;

      const aOrder = productOrder.indexOf(a.kode_produk);
      const bOrder = productOrder.indexOf(b.kode_produk);
      if (aOrder === -1 && bOrder === -1) return a.nama_produk.localeCompare(b.nama_produk);
      if (aOrder === -1) return 1;
      if (bOrder === -1) return -1;
      return aOrder - bOrder;
    });
    return filtered;
  }, [b2bProducts, category, subcategoryFilter, deferredSearch, priceRange, requestedCategoryMissing]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pageProducts = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const paginationItems = getPaginationItems(page, totalPages);
  const selectedPdfCategoryId =
    pdfCategory === "all" ? null : Number(pdfCategory);
  const selectedPdfCategory = selectedPdfCategoryId === null
    ? null
    : catalogCategories.find((item) => item.id === selectedPdfCategoryId) ?? null;
  const downloadableProducts = b2bProducts.filter(
    (product) =>
      product.tersedia &&
      (selectedPdfCategoryId === null ||
        product.kategori_id === selectedPdfCategoryId)
  );
  const canDownloadPricelist = b2bProducts.some((product) => product.tersedia);

  async function downloadPricelist() {
    setPdfError("");
    setGeneratingPdf(true);

    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 36;
      const today = new Date();
      const dateLabel = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(today);
      const companyName = settings?.nama_instansi.trim() || "DapurKita";
      const categoryName = selectedPdfCategory?.nama_kategori || "Semua kategori";
      const filterLines = pdf.splitTextToSize(
        `Kategori: ${categoryName} | Tanggal: ${dateLabel} | Total: ${downloadableProducts.length} produk`,
        pageWidth - margin * 2
      );
      const contactDetails = [
        settings?.alamat?.trim(),
        settings?.nomor_whatsapp.trim()
          ? `WhatsApp: ${settings.nomor_whatsapp.trim()}`
          : null,
        settings?.email?.trim(),
      ].filter((value): value is string => Boolean(value));
      const contactLines = contactDetails.length
        ? pdf.splitTextToSize(contactDetails.join(" | "), pageWidth - margin * 2)
        : [];
      const titleY = 38 + contactLines.length * 12 + 15;
      const filterY = titleY + 18;
      const tableStartY = filterY + filterLines.length * 10 + 8;
      const productsForPdf = [...downloadableProducts].sort((a, b) =>
        a.kode_produk.localeCompare(b.kode_produk, "id-ID", {
          numeric: true,
          sensitivity: "base",
        })
      );

      pdf.setProperties({
        title: `Pricelist ${companyName}`,
        subject: `Daftar harga ${productsForPdf.length} produk`,
      });

      autoTable(pdf, {
        startY: tableStartY,
        margin: { top: tableStartY, left: margin, right: margin, bottom: 42 },
        head: [["Kode SKU", "Nama produk", "Kategori", "Harga", "Satuan"]],
        body: productsForPdf.map((product) => [
          product.kode_produk,
          product.nama_produk,
          [
            product.kategori?.nama_kategori,
            product.subkategori?.nama_subkategori,
          ].filter(Boolean).join(" / ") || "-",
          formatProductPrice(product).replace(/\u2013/g, "-"),
          `Per ${product.satuan}`,
        ]),
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 5,
          overflow: "linebreak",
          valign: "top",
          textColor: [39, 51, 42],
          lineColor: [225, 231, 228],
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: [168, 61, 0],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [248, 249, 246] },
        columnStyles: {
          0: { cellWidth: 75 },
          1: { cellWidth: 280 },
          2: { cellWidth: 145 },
          3: { cellWidth: 145 },
          4: { cellWidth: 70 },
        },
        didDrawPage: () => {
          pdf.setTextColor(35, 51, 42);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(15);
          pdf.text(companyName, margin, 31);

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          if (contactLines.length) {
            pdf.text(contactLines, margin, 47);
          }

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.text("PRICELIST PRODUK", margin, titleY);

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.text(filterLines, margin, filterY);
        },
      });

      const pageCount = pdf.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        pdf.setPage(pageNumber);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(92, 102, 94);
        pdf.text(
          "Harga belum termasuk PPN.",
          margin,
          pageHeight - 20
        );
        pdf.text(
          `Halaman ${pageNumber} dari ${pageCount}`,
          pageWidth - margin,
          pageHeight - 20,
          { align: "right" }
        );
      }

      pdf.save(`${slugify(companyName)}-pricelist.pdf`);
      setPdfModalOpen(false);
    } catch (error) {
      console.error("Pricelist PDF error:", error);
      setPdfError(
        error instanceof Error
          ? `PDF gagal dibuat: ${error.message}`
          : "PDF gagal dibuat. Silakan coba kembali."
      );
    } finally {
      setGeneratingPdf(false);
    }
  }

  const selectedCartQuantity = selected
    ? cart.find((item) => item.product.id === selected.id)?.quantity ?? 0
    : 0;
  const remainingStock = selected
    ? selected.stok == null
      ? Number.MAX_SAFE_INTEGER
      : Math.max(0, selected.stok - selectedCartQuantity)
    : 0;

  return <>
    <section className="relative isolate overflow-hidden border-b border-slate-100 bg-gradient-to-br from-[#F1F5F9] via-[#f4f7fc] to-[#eaf4fb]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-[26rem] w-[26rem] rounded-full border-[28px] border-[#dbeafe]/60" />
      <div aria-hidden="true" className="pointer-events-none absolute right-8 top-10 h-48 w-48 rounded-full border border-[#60B7CD]/25" />
      <div aria-hidden="true" className="pointer-events-none absolute left-[42%] top-12 h-32 w-32 rounded-full bg-[#dbeafe]/35 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-28 pt-8 lg:px-8 lg:pb-32 lg:pt-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8eeff] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600"><BadgeCheck size={12} className="text-[#2563EB]" /> B2B PROCUREMENT CATALOGUE 2026</span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Katalog Pengadaan Dapur Profesional</h1>
            <p className="mt-2 max-w-2xl text-base leading-6 text-slate-600">Solusi pengadaan terintegrasi untuk kebutuhan dapur komersial, hotel, restoran, dan catering.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[310px]">
            <div className="rounded-xl border border-white/80 bg-white/75 p-3.5 shadow-sm backdrop-blur"><span className="flex items-center justify-between"><b className="text-base text-slate-800">Produk B2B</b><PackageOpen size={16} className="text-[#2563EB]" /></span><span className="mt-1 block text-slate-600">{b2bProducts.length} item</span></div>
            <div className="rounded-xl border border-white/80 bg-white/75 p-3.5 shadow-sm backdrop-blur"><span className="flex items-center justify-between"><b className="text-base text-slate-800">Kategori</b><Layers3 size={16} className="text-[#2563EB]" /></span><span className="mt-1 block text-slate-600">{catalogCategories.length} pilihan</span></div>
            <div className="rounded-xl border border-white/80 bg-white/75 p-3.5 shadow-sm backdrop-blur"><b className="block text-base text-slate-800">Pengiriman Nasional</b><span className="mt-1 block text-slate-600">Armada terjadwal & terlacak</span></div>
            <div className="rounded-xl border border-white/80 bg-white/75 p-3.5 shadow-sm backdrop-blur"><b className="block text-base text-slate-800">Faktur Pajak</b><span className="mt-1 block text-slate-600">Transaksi bisnis resmi</span></div>
          </div>
        </div>
      </div>
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-28 w-full"
      >
        <path
          fill="#60B7CD"
          d="M0 39c172-32 303-6 467 13 185 21 289-7 459-27 188-22 343 37 514 12v83H0Z"
        />
        <path
          fill="#2563EB"
          d="M0 52c177-27 299-4 456 12 190 20 307-5 478-22 182-18 342 28 506 12v71H0Z"
        />
        <path
          fill="#f8fafc"
          d="M0 66c176-20 305-1 459 12 193 16 302-5 475-17 183-13 341 19 506 11v53H0Z"
        />
      </svg>
    </section>

    <section id="katalog" className="relative flex-1 overflow-hidden bg-[#f8fafc]">
      <div aria-hidden="true" className="pointer-events-none absolute right-[-7rem] top-24 hidden h-[30rem] w-[30rem] rounded-full border-2 border-[#c5daf8]/70 xl:block" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[-3rem] top-40 hidden h-[22rem] w-[22rem] rounded-full border-[26px] border-[#dce9ff]/65 xl:block" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[4.5rem] top-[17rem] hidden h-64 w-64 rounded-full bg-gradient-to-br from-[#dbeafe]/65 via-[#eaf4fb]/50 to-[#d9f2ef]/65 xl:block" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[10.5rem] top-[21rem] hidden h-36 w-36 rounded-full border-2 border-dashed border-[#60B7CD]/45 xl:block" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[14.5rem] top-[24rem] hidden h-16 w-16 rounded-2xl border border-[#2563EB]/20 bg-white/50 shadow-[0_12px_28px_rgba(37,99,235,.08)] rotate-12 xl:block" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[18rem] top-[20rem] hidden h-3 w-3 rounded-full bg-[#60B7CD]/75 shadow-[24px_18px_0_2px_rgba(96,183,205,.42),-18px_36px_0_2px_rgba(37,99,235,.28),20px_58px_0_2px_rgba(37,99,235,.24),-4px_82px_0_3px_rgba(96,183,205,.38),34px_100px_0_2px_rgba(96,183,205,.3)] xl:block" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-5 sm:pt-5 lg:px-8 lg:pt-6">
        <form
          role="search"
          aria-label="Cari produk katalog"
          onSubmit={(event) => {
            event.preventDefault();
            document.getElementById("daftar-produk")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
          className="mb-4 flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center"
        >
          <label htmlFor="catalog-search" className="relative min-w-0 flex-1">
            <Search size={17} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="catalog-search"
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari produk pengadaan, peralatan stainless, bahan baku, sertifikasi, atau SKU..."
              className="h-11 w-full rounded-md border border-slate-100 bg-slate-50 pl-10 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-500 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-[#0F2B5C] px-5 text-sm font-bold text-white transition hover:bg-[#0b2148] sm:w-auto"
          >
            Cari Produk
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>
        <div className="mb-5 rounded-2xl border border-[#e3eaf7] bg-white/85 p-4 shadow-[0_8px_24px_rgba(15,43,92,.05)] backdrop-blur sm:p-5">
        <div className="mb-4">
        <span className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold text-slate-700"><SlidersHorizontal size={15} />Kategori:</span>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <button onClick={() => { setRequestedCategory(null); setCategory(null); setSubcategoryFilter("all"); }} className={`shrink-0 rounded px-4 py-2 text-sm font-bold transition ${category === null ? "bg-[#0F2B5C] text-white" : "bg-[#edf2ff] text-slate-700 hover:bg-[#dfe8ff]"}`}>Semua Kategori ({b2bProducts.length})</button>
          {catalogCategories.map((item) => <button key={item.id} onClick={() => { setRequestedCategory(null); setCategory(item.id); setSubcategoryFilter("all"); }} className={`shrink-0 rounded px-4 py-2 text-sm font-semibold transition ${category === item.id ? "bg-[#0F2B5C] text-white" : "bg-[#edf2ff] text-slate-700 hover:bg-[#dfe8ff]"}`}>{item.nama_kategori} ({b2bProducts.filter((product) => product.kategori_id === item.id).length})</button>)}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-start gap-2">
        <select value={subcategoryFilter} onChange={(event) => setSubcategoryFilter(event.target.value)} className="h-9 w-[210px] max-w-full min-w-0 rounded-md border-0 bg-[#edf2ff] px-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#2563EB]/20"><option value="all">Subkategori: Semua</option>{subcategories.map((subcategory) => <option key={subcategory} value={subcategory}>{subcategory}</option>)}</select>
        <select value={priceRange} onChange={(event) => setPriceRange(event.target.value)} className="h-9 w-[160px] max-w-full min-w-0 rounded-md border-0 bg-[#edf2ff] px-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#2563EB]/20"><option value="all">Harga</option><option value="under-1m">Di bawah Rp 1 juta</option><option value="1m-5m">Rp 1–5 juta</option><option value="5m-15m">Rp 5–15 juta</option><option value="over-15m">Di atas Rp 15 juta</option></select>
      </div>
        </div>
      <div id="daftar-produk" className="mb-3 mt-4 scroll-mt-24 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"><h2 className="text-base font-black text-slate-900">Daftar Produk &amp; Jasa</h2><span className="rounded bg-[#e8eeff] px-2 py-1 text-[10px] font-semibold text-slate-600">{loading ? "Memuat..." : `${visible.length} Item Ditemukan`}</span></div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="inline-flex items-start gap-1 text-[11px] leading-4 text-slate-600"><BadgeCheck size={12} className="mt-0.5 shrink-0 text-[#2563EB]" />Harga resmi tertera belum termasuk PPN faktur B2B</span>
          <button
            type="button"
            onClick={() => {
              setPdfCategory(category === null ? "all" : String(category));
              setPdfError("");
              setPdfModalOpen(true);
            }}
            disabled={loading || generatingPdf || !canDownloadPricelist}
            className="inline-flex items-center gap-2 rounded-md bg-[#0F2B5C] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#0b2148] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} />
            {generatingPdf ? "Membuat PDF..." : "Download Pricelist PDF"}
          </button>
        </div>
      </div>
      {requestedCategoryMissing && <div role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Kategori “{requestedCategory?.replace(/-/g, " ")}” belum ditemukan. Tambahkan kategori ini melalui dashboard admin atau pilih kategori lain.</div>}
      {error && <div role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-base text-red-700">Katalog tidak dapat dimuat: {error}</div>}
      {loading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <div key={n} className="aspect-[.8/1] animate-pulse rounded-lg bg-[#edf2ff]" />)}</div> :
        visible.length ? <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{pageProducts.map((product) => <ProductCard key={product.id} product={product} onDetail={() => setSelected(product)} onAdd={(source) => onAdd(product, source)} />)}</div>
          {visible.length > PAGE_SIZE && <nav aria-label="Navigasi halaman katalog" className="mt-5 flex flex-col items-center justify-between gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:gap-3">
            <p className="text-center text-xs text-slate-500 sm:text-left">Menampilkan <b className="font-bold text-[#0F2B5C]">{pageProducts.length}</b> dari <b className="font-bold text-[#0F2B5C]">{visible.length}</b> produk terdaftar</p>
            <div className="flex w-full max-w-full items-center justify-center gap-1 overflow-x-auto px-1 sm:w-auto sm:justify-end" aria-label={`Halaman ${page} dari ${totalPages}`}>
              <button type="button" onClick={() => setCurrentPage(page - 1)} disabled={page === 1} aria-label="Halaman sebelumnya" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#edf2ff] text-[#0F2B5C] transition hover:bg-[#dfe8ff] disabled:cursor-not-allowed disabled:text-slate-400"><ChevronLeft size={15} /></button>
              {paginationItems.map((item, index) => item === "ellipsis" ? (
                <span key={`ellipsis-${index}`} aria-hidden="true" className="flex h-9 min-w-5 shrink-0 items-center justify-center text-xs text-slate-500">…</span>
              ) : (
                <button key={item} type="button" onClick={() => setCurrentPage(item)} aria-label={`Halaman ${item}`} aria-current={page === item ? "page" : undefined} className={`h-9 min-w-9 shrink-0 rounded-md px-2 text-xs font-bold transition ${page === item ? "bg-[#2563EB] text-white shadow-sm" : "bg-[#e7efff] text-[#1e3155] hover:bg-[#d8e5ff]"}`}>{item}</button>
              ))}
              <button type="button" onClick={() => setCurrentPage(page + 1)} disabled={page === totalPages} aria-label="Halaman berikutnya" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#edf2ff] text-[#0F2B5C] transition hover:bg-[#dfe8ff] disabled:cursor-not-allowed disabled:text-slate-400"><ChevronRight size={15} /></button>
            </div>
          </nav>}
        </> :
          <div className="mt-4 rounded-xl bg-white py-16 text-center"><div className="text-4xl">⌕</div><h2 className="mt-3 font-bold text-slate-800">{error ? "Katalog belum dapat ditampilkan" : b2bProducts.length === 0 ? "Belum ada produk di katalog" : "Produk tidak ditemukan"}</h2><p className="mt-1 text-base text-slate-500">{error ? "Periksa koneksi database, lalu muat ulang halaman." : b2bProducts.length === 0 ? "Tambahkan produk melalui dashboard admin atau jalankan npm run db:seed untuk data contoh." : "Sesuaikan kata kunci atau filter untuk melihat produk lainnya."}</p></div>}
      </div>
    </section>

    {pdfModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && !generatingPdf && setPdfModalOpen(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="pricelist-dialog-title" className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="pricelist-dialog-title" className="text-lg font-black text-slate-900">Download Pricelist PDF</h2>
            <p className="mt-1 text-sm text-slate-600">Pilih kategori produk yang ingin dimasukkan.</p>
          </div>
          <button type="button" onClick={() => setPdfModalOpen(false)} disabled={generatingPdf} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50" aria-label="Tutup pilihan kategori"><X size={18}/></button>
        </div>
        <label htmlFor="pricelist-category" className="mt-5 block text-sm font-bold text-slate-700">Kategori</label>
        <select
          id="pricelist-category"
          value={pdfCategory}
          onChange={(event) => {
            setPdfCategory(event.target.value);
            setPdfError("");
          }}
          disabled={generatingPdf}
          className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
        >
          <option value="all">Semua kategori</option>
          {catalogCategories.map((item) => {
            const count = b2bProducts.filter(
              (product) => product.tersedia && product.kategori_id === item.id
            ).length;
            return (
              <option key={item.id} value={String(item.id)} disabled={count === 0}>
                {item.nama_kategori} ({count})
              </option>
            );
          })}
        </select>
        <p className="mt-2 text-xs text-slate-500">
          PDF akan berisi {downloadableProducts.length} produk tersedia dan mengabaikan filter katalog lainnya.
        </p>
        {downloadableProducts.length === 0 && <p role="status" className="mt-2 text-sm text-amber-700">Tidak ada produk tersedia pada kategori ini.</p>}
        {pdfError && <p role="alert" className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{pdfError}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setPdfModalOpen(false)} disabled={generatingPdf} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Batal</button>
          <button type="button" onClick={downloadPricelist} disabled={generatingPdf || downloadableProducts.length === 0} className="inline-flex items-center gap-2 rounded-md bg-[#0F2B5C] px-4 py-2 text-sm font-bold text-white hover:bg-[#0b2148] disabled:cursor-not-allowed disabled:opacity-50">
            <Download size={15}/>
            {generatingPdf ? "Membuat PDF..." : "Download"}
          </button>
        </div>
      </div>
    </div>}

    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <p className="min-w-0 flex-1 break-words text-[10px] font-bold uppercase tracking-[.1em] text-slate-500 sm:text-[11px] sm:tracking-[.12em]">{selected.kategori?.nama_kategori || "Produk"} <span className="mx-1 text-slate-300 sm:mx-2">|</span> <span className="normal-case tracking-normal">SKU: {selected.kode_produk}</span></p>
          <button onClick={() => setSelected(null)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Tutup detail produk"><X size={16} /></button>
        </div>
        <div className="grid gap-4 p-4 sm:gap-5 sm:p-5 md:grid-cols-[1fr_1fr]">
          <div className="flex min-h-[205px] items-center justify-center overflow-hidden rounded-md bg-[#edf2ff]">
            {selected.foto_url ? <img src={selected.foto_url} alt={selected.nama_produk} referrerPolicy="no-referrer" onError={(e) => { const img = e.currentTarget as HTMLImageElement; img.src = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='160'%3E%3Crect width='100%25' height='100%25' fill='%23edf2ff'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%232563EB' font-size='12'%3EGambar tidak tersedia%3C/text%3E%3C/svg%3E"; img.onerror = null; }} className="h-full max-h-[220px] w-full object-cover" /> : <Utensils size={58} className="text-[#2563EB]" />}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#2563EB]">{selected.kategori?.nama_kategori || "Menu MBG"}</p>
            <h2 className="mt-1.5 text-xl font-black leading-tight text-slate-900">{selected.nama_produk}</h2>
            <div className="mt-2">
              <b className="text-xl font-black text-[#2563EB]">
                {formatProductPrice(selected)}
              </b>
              <span className="mt-1 block text-[11px] text-slate-500">
                Per {selected.satuan}
              </span>
            </div>
            <p className="mt-3 text-[13px] leading-5 text-slate-600">{getProductDescription(selected.deskripsi)}</p>
          </div>
        </div>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="rounded-lg border border-slate-100 p-3.5">
            <h3 className="flex items-center gap-2 text-[13px] font-black text-slate-900"><span className="flex h-5 w-5 items-center justify-center rounded bg-[#dbeafe] text-[#2563EB]"><BadgeCheck size={12} /></span>Informasi Produk</h3>
            <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 text-[11px] min-[360px]:grid-cols-2">
              <div><span className="block text-slate-400">Kategori</span><b className="mt-0.5 block text-slate-700">{selected.kategori?.nama_kategori || "Belum dikategorikan"}</b></div>
              <div><span className="block text-slate-400">Subkategori</span><b className="mt-0.5 block text-slate-700">{selected.subkategori?.nama_subkategori || "—"}</b></div>
              <div><span className="block text-slate-400">Satuan</span><b className="mt-0.5 block text-slate-700">{selected.satuan}</b></div>
            </div>
          </div>
          <div className="mt-3">
            {selected.jenis_harga === "rentang" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-bold text-amber-800">
                  Harga berupa rentang
                </p>
                <p className="mt-1 text-[11px] leading-5 text-amber-700">
                  Estimasi akan ditampilkan sebagai rentang. Admin akan
                  mengonfirmasi harga final setelah permintaan dikirim.
                </p>
              </div>
            )}
            <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-slate-600">
                    Kuantitas:
                  </span>

                  <div className="flex items-center rounded-md border border-slate-200 p-0.5">
                    <button
                      onClick={() => onAdjust(selected.id, -1)}
                      className="flex h-7 w-7 items-center justify-center text-slate-500 disabled:opacity-30"
                      disabled={!cart.find((item) => item.product.id === selected.id)}
                    >
                      <Minus size={13} />
                    </button>

                    <span className="w-8 text-center text-[13px] font-black">
                      {cart.find((item) => item.product.id === selected.id)?.quantity || 1}
                    </span>

                    <button
                      onClick={(event) => onAdd(selected, event.currentTarget)}
                      disabled={
                        !selected.tersedia ||
                        remainingStock === 0 ||
                        (hargaSatuan(selected) == null && hargaRentang(selected) == null)
                      }
                      className="flex h-7 w-7 items-center justify-center text-slate-500 disabled:opacity-30"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={(event) => {
                    onAdd(selected, event.currentTarget);
                    setSelected(null);
                    onOpenCart();
                  }}
                  disabled={
                    !selected.tersedia ||
                    remainingStock === 0 ||
                    (hargaSatuan(selected) == null && hargaRentang(selected) == null)
                  }
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#0F2B5C] px-4 text-[12px] font-bold text-white hover:bg-[#0b2148] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  <ShoppingCart size={14} />
                  Tambah ke keranjang
                </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    }
  </>;
}

export default memo(KatalogPage);
