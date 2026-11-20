"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Layers3, Leaf, Minus, PackageOpen, Plus, Search, ShoppingCart, SlidersHorizontal, Utensils, X } from "lucide-react";
import { rupiah, slugify } from "@/lib/types";
import type { Category, Product } from "@/lib/types";
import type { CartItem } from "../types";

const categorySlugs = new Set([
  "peralatan",
  "bahan-baku",
  "perizinan",
  "perawatan"
]);
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
const productStatuses: Record<string, string> = {
  "DK-EXH-BF24": "Indent 7 Hari",
  "DK-SRV-SLHS1": "Layanan Resmi",
  "DK-SRV-HACCP": "Layanan Resmi",
  "DK-SRV-IPAL3": "Layanan Resmi",
  "DK-SRV-ERL18": "Layanan Resmi",
  "DK-MNT-PEST4": "Layanan Rutin",
  "DK-MNT-GAS01": "Layanan Rutin",
  "DK-MNT-GRS92": "Layanan Rutin",
  "DK-MNT-REF34": "Layanan Rutin"
};
function ProductCard({ product, onDetail, onAdd }: { product: Product; onDetail: () => void; onAdd: (source: HTMLElement) => void }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <button onClick={onDetail} aria-label={`Lihat detail ${product.nama_produk}`} className="relative block aspect-[1.2/1] w-full overflow-hidden bg-[#edf2ff] text-left">
        {product.foto_url
          ? <img src={product.foto_url} alt={product.nama_produk} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          : <span className="block h-full w-full" aria-hidden="true" />}
        <span className="absolute right-2 top-2 max-w-[55%] truncate rounded bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700">{product.subkategori || product.kategori?.nama_kategori || "Layanan"}</span>
      </button>
      <div className="flex min-h-[170px] flex-col p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-bold uppercase tracking-[.12em] text-slate-500">{product.kode_produk}</p>
          <span className="shrink-0 text-xs font-bold text-[#ad3b00]">★ 4.9</span>
        </div>
        <button onClick={onDetail} className="mt-1 min-h-10 text-left text-sm font-extrabold leading-5 text-slate-900 hover:text-[#ad3b00]">{product.nama_produk}</button>
        <div className="mt-2 min-h-9 sm:min-h-5">
          {product.kategori?.slug === "bahan-baku" &&
            (product.informasi_gizi.kalori > 0 || product.informasi_gizi.protein > 0) && (
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1"><Leaf size={12} className="text-[#ad3b00]"/>{product.informasi_gizi.kalori} kkal</span>
              <span className="inline-flex items-center gap-1"><BadgeCheck size={12} className="text-[#ad3b00]"/>Protein {product.informasi_gizi.protein} g</span>
            </div>
          )}
        </div>
        <div className="mt-auto pt-2">
          <small className="block text-xs text-slate-600">Harga Satuan</small>
          <b className="block text-lg font-extrabold leading-6 text-[#b63d00]">{rupiah(product.harga)}</b>
          <div className="mt-1.5 grid min-w-0 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-1">
            <button onClick={onDetail} aria-label={`Lihat detail ${product.nama_produk}`} className="inline-flex min-w-0 items-center justify-center gap-1 rounded bg-[#e7efff] px-1 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-[#dbe7ff] sm:px-2 sm:text-xs"><Search size={12} className="shrink-0"/><span className="hidden min-[375px]:inline">Detail</span></button>
            <button onClick={(event) => onAdd(event.currentTarget)} disabled={!product.tersedia} aria-label={`Tambah ${product.nama_produk} ke keranjang`} className="inline-flex min-w-0 items-center justify-center gap-1 rounded bg-[#ad3b00] px-1 py-1.5 text-[11px] font-bold text-white hover:bg-[#8e3000] disabled:cursor-not-allowed disabled:opacity-40 sm:px-2 sm:text-xs"><ShoppingCart size={12} className="shrink-0"/><span className="hidden min-[375px]:inline sm:hidden">Tambah</span><span className="hidden sm:inline">Keranjang</span></button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function KatalogPage({
  products,
  categories,
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
  loading: boolean;
  error: string;
  cart: CartItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: (product: Product, source?: HTMLElement) => void;
  onAdjust: (id: number, delta: number) => void;
  onOpenCart: () => void;
}) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [category, setCategory] = useState<number | null>(null);
  const [requestedCategory, setRequestedCategory] = useState<string | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("recommended");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRequestedCategory(params.get("kategori"));
    setSubcategoryFilter("all");
    onSearchChange(params.get("q") || "");
  }, [onSearchChange]);

  useEffect(() => {
    if (!requestedCategory) return;
    const match = categories.find((item) =>
      item.slug === requestedCategory || slugify(item.nama_kategori) === requestedCategory
    );
    setCategory(match?.id ?? null);
  }, [categories, requestedCategory]);

  const catalogCategories = categories
    .filter((item) => categorySlugs.has(item.slug))
    .sort((a, b) => categoryOrder.indexOf(a.slug) - categoryOrder.indexOf(b.slug));
  const b2bProducts = products.filter((product) => product.kategori?.slug && categorySlugs.has(product.kategori.slug));
  const subcategories = [...new Set(
    b2bProducts
      .filter((product) => category === null || product.kategori_id === category)
      .map((product) => product.subkategori?.trim() || "")
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));
  const requestedCategoryMissing = Boolean(requestedCategory) && !loading && category === null &&
    !categories.some((item) =>
      item.slug === requestedCategory || slugify(item.nama_kategori) === requestedCategory
    );
  const visible = useMemo(() => {
    if (requestedCategoryMissing) return [];
    const query = search.trim().toLowerCase();
    const filtered = b2bProducts.filter((product) => {
      const price = Number(product.harga);
      const status = productStatuses[product.kode_produk] || (product.tersedia ? "Ready Stock" : "Tidak Tersedia");
      const inPriceRange =
        priceRange === "all" ||
        (priceRange === "under-1m" && price < 1000000) ||
        (priceRange === "1m-5m" && price >= 1000000 && price < 5000000) ||
        (priceRange === "5m-15m" && price >= 5000000 && price < 15000000) ||
        (priceRange === "over-15m" && price >= 15000000);
      return (category === null || product.kategori_id === category) &&
        (subcategoryFilter === "all" || product.subkategori === subcategoryFilter) &&
        (!query || `${product.nama_produk} ${product.kode_produk} ${product.subkategori || ""} ${product.deskripsi}`.toLowerCase().includes(query)) &&
        inPriceRange &&
        (availabilityFilter === "all" ||
          (availabilityFilter === "available" && product.tersedia) ||
          (availabilityFilter === "unavailable" && !product.tersedia) ||
          status === availabilityFilter);
    });
    if (sortOrder === "price-asc") filtered.sort((a, b) => Number(a.harga) - Number(b.harga));
    else if (sortOrder === "price-desc") filtered.sort((a, b) => Number(b.harga) - Number(a.harga));
    else if (sortOrder === "name") filtered.sort((a, b) => a.nama_produk.localeCompare(b.nama_produk));
    else filtered.sort((a, b) => {
      const aOrder = productOrder.indexOf(a.kode_produk);
      const bOrder = productOrder.indexOf(b.kode_produk);
      if (aOrder === -1 && bOrder === -1) return a.nama_produk.localeCompare(b.nama_produk);
      if (aOrder === -1) return 1;
      if (bOrder === -1) return -1;
      return aOrder - bOrder;
    });
    return filtered;
  }, [b2bProducts, category, subcategoryFilter, search, priceRange, availabilityFilter, sortOrder, requestedCategoryMissing]);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return <>
    <section className="border-b border-slate-100 bg-[#f7f8ff]">
      <div className="mx-auto max-w-7xl px-5 pb-7 pt-8 lg:px-8 lg:pb-9 lg:pt-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8eeff] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600"><BadgeCheck size={12} className="text-[#b63d00]"/> B2B HORECA PROCUREMENT CATALOGUE 2026</span>
        <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div><h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Katalog Pengadaan Dapur Profesional</h1><p className="mt-2 max-w-2xl text-base leading-6 text-slate-600">Solusi pengadaan terintegrasi untuk kebutuhan dapur komersial, hotel, restoran, dan catering.</p></div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[310px]">
            <div className="rounded-lg border border-slate-100 bg-[#f7f8ff] p-3"><span className="flex items-center justify-between"><b className="text-base text-slate-800">Produk B2B</b><PackageOpen size={16} className="text-[#ad3b00]"/></span><span className="mt-1 block text-slate-600">{b2bProducts.length} item</span></div>
            <div className="rounded-lg border border-slate-100 bg-[#f7f8ff] p-3"><span className="flex items-center justify-between"><b className="text-base text-slate-800">Kategori</b><Layers3 size={16} className="text-[#ad3b00]"/></span><span className="mt-1 block text-slate-600">{catalogCategories.length} pilihan</span></div>
            <div className="rounded-lg border border-slate-100 bg-[#f7f8ff] p-3"><b className="block text-base text-slate-800">Pengiriman Nasional</b><span className="mt-1 block text-slate-600">Armada terjadwal & terlacak</span></div>
            <div className="rounded-lg border border-slate-100 bg-[#f7f8ff] p-3"><b className="block text-base text-slate-800">Faktur Pajak</b><span className="mt-1 block text-slate-600">Transaksi bisnis resmi</span></div>
          </div>
        </div>
      </div>
    </section>

    <section id="katalog" className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-5 sm:px-5 sm:py-5 lg:px-8 lg:py-6">
      <div className="mb-4">
        <span className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold text-slate-700"><SlidersHorizontal size={15}/>Kategori:</span>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <button onClick={()=>{setRequestedCategory(null);setCategory(null);setSubcategoryFilter("all");}} className={`shrink-0 rounded px-4 py-2 text-sm font-bold transition ${category===null?"bg-[#ad3b00] text-white":"bg-[#edf2ff] text-slate-700 hover:bg-[#dfe8ff]"}`}>Semua Kategori ({b2bProducts.length})</button>
          {catalogCategories.map((item)=><button key={item.id} onClick={()=>{setRequestedCategory(null);setCategory(item.id);setSubcategoryFilter("all");}} className={`shrink-0 rounded px-4 py-2 text-sm font-semibold transition ${category===item.id?"bg-[#ad3b00] text-white":"bg-[#edf2ff] text-slate-700 hover:bg-[#dfe8ff]"}`}>{item.nama_kategori} ({b2bProducts.filter((product)=>product.kategori_id===item.id).length})</button>)}
        </div>
      </div>
      <div className="grid gap-2 rounded-lg border border-slate-100 bg-white p-2.5 shadow-sm sm:grid-cols-2 lg:grid-cols-4 lg:p-3">
        <select value={subcategoryFilter} onChange={(event)=>setSubcategoryFilter(event.target.value)} className="h-11 min-w-0 rounded-md border-0 bg-[#edf2ff] px-3 text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-[#ad3b00]/20"><option value="all">Subkategori: Semua</option>{subcategories.map((subcategory)=><option key={subcategory} value={subcategory}>{subcategory}</option>)}</select>
        <select value={priceRange} onChange={(event)=>setPriceRange(event.target.value)} className="h-11 min-w-0 rounded-md border-0 bg-[#edf2ff] px-3 text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-[#ad3b00]/20"><option value="all">Semua Rentang Harga</option><option value="under-1m">Di bawah Rp 1 juta</option><option value="1m-5m">Rp 1–5 juta</option><option value="5m-15m">Rp 5–15 juta</option><option value="over-15m">Di atas Rp 15 juta</option></select>
        <select value={availabilityFilter} onChange={(event)=>setAvailabilityFilter(event.target.value)} className="h-11 min-w-0 rounded-md border-0 bg-[#edf2ff] px-3 text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-[#ad3b00]/20"><option value="all">Ketersediaan: Semua</option><option value="available">Tersedia saja</option><option value="unavailable">Tidak tersedia</option><option value="Ready Stock">Ready Stock</option><option value="Indent 7 Hari">Indent 7 Hari</option><option value="Layanan Resmi">Layanan Resmi</option><option value="Layanan Rutin">Layanan Rutin</option></select>
        <select value={sortOrder} onChange={(event)=>setSortOrder(event.target.value)} className="h-11 min-w-0 rounded-md border-0 bg-[#edf2ff] px-3 text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-[#ad3b00]/20"><option value="recommended">Urutkan: Rekomendasi</option><option value="price-asc">Harga: Terendah</option><option value="price-desc">Harga: Tertinggi</option><option value="name">Nama: A–Z</option></select>
      </div>
      <div className="mb-3 mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"><h2 className="text-base font-black text-slate-900">Daftar Produk &amp; Jasa</h2><span className="rounded bg-[#e8eeff] px-2 py-1 text-[10px] font-semibold text-slate-600">{loading ? "Memuat..." : `${visible.length} Item Ditampilkan`}</span></div>
        <span className="inline-flex items-start gap-1 text-[11px] leading-4 text-slate-600"><BadgeCheck size={12} className="mt-0.5 shrink-0 text-[#ad3b00]"/>Harga resmi tertera belum termasuk PPN faktur B2B</span>
      </div>
      {requestedCategoryMissing && <div role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Kategori “{requestedCategory?.replace(/-/g, " ")}” belum tersedia. Tambahkan kategori ini melalui dashboard admin atau pilih kategori lain.</div>}
      {error&&<div role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-base text-red-700">Katalog tidak dapat dimuat: {error}</div>}
      {loading?<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{[1,2,3,4,5,6,7,8].map((n)=><div key={n} className="aspect-[.8/1] animate-pulse rounded-lg bg-[#edf2ff]"/>)}</div>:
        visible.length?<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{visible.map((product)=><ProductCard key={product.id} product={product} onDetail={()=>setSelected(product)} onAdd={(source)=>onAdd(product, source)}/>)}</div>:
        <div className="mt-4 rounded-xl bg-white py-16 text-center"><div className="text-4xl">⌕</div><h2 className="mt-3 font-bold text-slate-800">{error?"Katalog belum dapat ditampilkan":b2bProducts.length===0?"Belum ada produk di katalog":"Produk tidak ditemukan"}</h2><p className="mt-1 text-base text-slate-500">{error?"Periksa koneksi database, lalu muat ulang halaman.":b2bProducts.length===0?"Tambahkan produk melalui dashboard admin atau jalankan npm run db:seed untuk data contoh.":"Sesuaikan kata kunci atau filter untuk melihat produk lainnya."}</p></div>}
    </section>

    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <p className="min-w-0 flex-1 break-words text-[10px] font-bold uppercase tracking-[.1em] text-slate-500 sm:text-[11px] sm:tracking-[.12em]">{selected.kategori?.nama_kategori || "Produk"} <span className="mx-1 text-slate-300 sm:mx-2">|</span> <span className="normal-case tracking-normal">SKU: {selected.kode_produk}</span></p>
          <button onClick={() => setSelected(null)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Tutup detail produk"><X size={16}/></button>
        </div>
        <div className="grid gap-4 p-4 sm:gap-5 sm:p-5 md:grid-cols-[1fr_1fr]">
          <div className="flex min-h-[205px] items-center justify-center overflow-hidden rounded-md bg-[#edf2ff]">
            {selected.foto_url ? <img src={selected.foto_url} alt={selected.nama_produk} className="h-full max-h-[220px] w-full object-cover"/> : <Utensils size={58} className="text-[#ad3b00]"/>}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#ad3b00]">{selected.kategori?.nama_kategori || "Menu MBG"}</p>
            <h2 className="mt-1.5 text-xl font-black leading-tight text-slate-900">{selected.nama_produk}</h2>
            <div className="mt-2 flex items-end gap-1.5"><b className="text-2xl font-black text-[#ad3b00]">{rupiah(selected.harga)}</b><span className="pb-1 text-[11px] text-slate-500">/ Unit ({selected.satuan})</span></div>
            <p className="mt-3 text-[13px] leading-5 text-slate-600">{selected.deskripsi}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-bold ${selected.tersedia ? "bg-[#edf7ef] text-forest-700" : "bg-slate-100 text-slate-600"}`}><BadgeCheck size={12}/>{selected.tersedia ? "Tersedia" : "Tidak tersedia"}</span>
              {selected.informasi_gizi.kalori > 0 && <span className="inline-flex items-center gap-1.5 rounded-md bg-[#edf2ff] px-2 py-1.5 text-[11px] font-bold text-slate-700"><Leaf size={12}/>{selected.informasi_gizi.kalori} kkal</span>}
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="rounded-lg border border-slate-100 p-3.5">
            <h3 className="flex items-center gap-2 text-[13px] font-black text-slate-900"><span className="flex h-5 w-5 items-center justify-center rounded bg-[#fff1e8] text-[#ad3b00]"><BadgeCheck size={12}/></span>Informasi Produk</h3>
            <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 text-[11px] min-[360px]:grid-cols-2">
              <div><span className="block text-slate-400">Kategori</span><b className="mt-0.5 block text-slate-700">{selected.kategori?.nama_kategori || "Belum dikategorikan"}</b></div>
              <div><span className="block text-slate-400">Subkategori</span><b className="mt-0.5 block text-slate-700">{selected.subkategori || "—"}</b></div>
              <div><span className="block text-slate-400">Satuan</span><b className="mt-0.5 block text-slate-700">{selected.satuan}</b></div>
              <div><span className="block text-slate-400">Status ketersediaan</span><b className="mt-0.5 block text-slate-700">{selected.tersedia ? "Tersedia" : "Tidak tersedia"}</b></div>
              <div><span className="block text-slate-400">Informasi gizi</span><b className="mt-0.5 block text-slate-700">{selected.informasi_gizi.kalori > 0 || selected.informasi_gizi.protein > 0 ? `${selected.informasi_gizi.protein} g protein` : "Belum tersedia"}</b></div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto]">
            <div className="flex items-center justify-between gap-2 sm:justify-start"><span className="text-[12px] font-bold text-slate-600">Kuantitas:</span><div className="flex items-center rounded-md border border-slate-200 p-0.5"><button onClick={() => onAdjust(selected.id,-1)} className="flex h-7 w-7 items-center justify-center text-slate-500 disabled:opacity-30" disabled={!cart.find((item) => item.product.id === selected.id)}><Minus size={13}/></button><span className="w-8 text-center text-[13px] font-black">{cart.find((item) => item.product.id === selected.id)?.quantity || 1}</span><button onClick={(event) => onAdd(selected, event.currentTarget)} className="flex h-7 w-7 items-center justify-center text-slate-500"><Plus size={13}/></button></div></div>
            <button onClick={(event) => { onAdd(selected, event.currentTarget); setSelected(null); onOpenCart(); }} disabled={!selected.tersedia} className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#ad3b00] px-4 text-[12px] font-bold text-white hover:bg-[#8f3000] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"><ShoppingCart size={14}/>Tambah ke keranjang</button>
          </div>
        </div>
      </div>
    </div>}
  </>;
}
