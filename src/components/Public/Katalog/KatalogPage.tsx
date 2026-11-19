"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Layers3, Leaf, Minus, PackageOpen, Plus, Search, ShoppingCart, SlidersHorizontal, Utensils, X } from "lucide-react";
import { rupiah, slugify } from "@/lib/types";
import type { Category, Product } from "@/lib/types";
import type { CartItem } from "../types";

const categorySlugs = new Set([
  "peralatan-dapur",
  "bahan-baku-food-supplies",
  "perizinan-legalitas",
  "perawatan-maintenance"
]);
const categoryOrder = [
  "peralatan-dapur",
  "bahan-baku-food-supplies",
  "perizinan-legalitas",
  "perawatan-maintenance"
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
const popularTags = ["Heavy-Duty", "#Stainless-SUS304", "#HACCP-Standard", "#Grill-B2B", "#SLA-Terjamin"];
const popularTagQueries: Record<string, string> = {
  "Heavy-Duty": "heavy duty",
  "#Stainless-SUS304": "stainless",
  "#HACCP-Standard": "HACCP",
  "#Grill-B2B": "Range",
  "#SLA-Terjamin": "layanan"
};

function ProductCard({ product, onDetail, onAdd }: { product: Product; onDetail: () => void; onAdd: (source: HTMLElement) => void }) {
  const status = productStatuses[product.kode_produk] || (product.tersedia ? "Ready Stock" : "Tidak Tersedia");
  return (
    <article className="group overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <button onClick={onDetail} aria-label={`Lihat detail ${product.nama_produk}`} className="relative block aspect-[1.2/1] w-full overflow-hidden bg-[#edf2ff] text-left">
        {product.foto_url
          ? <img src={product.foto_url} alt={product.nama_produk} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          : <span className="block h-full w-full" aria-hidden="true" />}
        <span className="absolute left-2 top-2 rounded bg-[#dce6ff] px-2 py-1 text-[8px] font-bold text-slate-700">{status}</span>
        <span className="absolute right-2 top-2 max-w-[55%] truncate rounded bg-white/90 px-2 py-1 text-[8px] font-semibold text-slate-700">{product.kategori?.nama_kategori || "Layanan"}</span>
      </button>
      <div className="flex min-h-[145px] flex-col p-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[8px] font-bold uppercase tracking-[.12em] text-slate-500">{product.kode_produk}</p>
          <span className="shrink-0 text-[8px] font-bold text-[#ad3b00]">★ 4.9</span>
        </div>
        <button onClick={onDetail} className="mt-1 min-h-9 text-left text-[11px] font-extrabold leading-4 text-slate-900 hover:text-[#ad3b00]">{product.nama_produk}</button>
        <p className="mt-1 line-clamp-2 min-h-7 text-[8px] leading-3 text-slate-500">{product.deskripsi}</p>
        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[8px] text-slate-500">
          <span className="inline-flex items-center gap-1"><Leaf size={10} className="text-[#ad3b00]"/>{product.informasi_gizi.kalori} kkal</span>
          <span className="inline-flex items-center gap-1"><BadgeCheck size={10} className="text-[#ad3b00]"/>Protein {product.informasi_gizi.protein} g</span>
        </div>
        <div className="mt-auto pt-2">
          <small className="block text-[8px] text-slate-500">Harga Satuan B2B</small>
          <b className="block text-base font-extrabold leading-5 text-[#b63d00]">{rupiah(product.harga)}</b>
          <div className="mt-1.5 grid grid-cols-[1fr_1.2fr] gap-1">
            <button onClick={onDetail} className="inline-flex items-center justify-center gap-1 rounded bg-[#e7efff] px-2 py-1.5 text-[8px] font-bold text-slate-700 hover:bg-[#dbe7ff]"><Search size={10}/>Detail</button>
            <button onClick={(event) => onAdd(event.currentTarget)} disabled={!product.tersedia} aria-label={`Tambah ${product.nama_produk} ke keranjang`} className="inline-flex items-center justify-center gap-1 rounded bg-[#ad3b00] px-2 py-1.5 text-[8px] font-bold text-white hover:bg-[#8e3000] disabled:cursor-not-allowed disabled:opacity-40"><ShoppingCart size={10}/>Keranjang</button>
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
  onAdd,
  onAdjust,
  onOpenCart
}: {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string;
  cart: CartItem[];
  onAdd: (product: Product, source?: HTMLElement) => void;
  onAdjust: (id: number, delta: number) => void;
  onOpenCart: () => void;
}) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [category, setCategory] = useState<number | null>(null);
  const [requestedCategory, setRequestedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("recommended");

  useEffect(() => {
    setRequestedCategory(new URLSearchParams(window.location.search).get("kategori"));
  }, []);

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
        (!query || `${product.nama_produk} ${product.kode_produk} ${product.deskripsi}`.toLowerCase().includes(query)) &&
        inPriceRange &&
        (availabilityFilter === "all" ||
          (availabilityFilter === "available" && product.tersedia) ||
          (availabilityFilter === "unavailable" && !product.tersedia) ||
          status === availabilityFilter);
    });
    if (sortOrder === "price-asc") filtered.sort((a, b) => Number(a.harga) - Number(b.harga));
    else if (sortOrder === "price-desc") filtered.sort((a, b) => Number(b.harga) - Number(a.harga));
    else if (sortOrder === "name") filtered.sort((a, b) => a.nama_produk.localeCompare(b.nama_produk));
    else filtered.sort((a, b) => productOrder.indexOf(a.kode_produk) - productOrder.indexOf(b.kode_produk));
    return filtered;
  }, [b2bProducts, category, search, priceRange, availabilityFilter, sortOrder, requestedCategoryMissing]);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return <>
    <section className="border-b border-slate-100 bg-[#f7f8ff]">
      <div className="mx-auto max-w-7xl px-5 pb-7 pt-8 lg:px-8 lg:pb-9 lg:pt-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8eeff] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-600"><BadgeCheck size={12} className="text-[#b63d00]"/> B2B HORECA PROCUREMENT CATALOGUE 2025</span>
        <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div><h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Katalog Pengadaan Dapur Profesional</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Solusi pengadaan terintegrasi untuk kebutuhan dapur komersial, hotel, restoran, dan catering.</p></div>
          <div className="grid grid-cols-2 gap-2 text-[9px] sm:min-w-[310px]">
            <div className="rounded-lg border border-slate-100 bg-[#f7f8ff] p-2.5"><span className="flex items-center justify-between"><b className="text-slate-800">Produk B2B</b><PackageOpen size={13} className="text-[#ad3b00]"/></span><span className="mt-1 block text-slate-500">{b2bProducts.length} item</span></div>
            <div className="rounded-lg border border-slate-100 bg-[#f7f8ff] p-2.5"><span className="flex items-center justify-between"><b className="text-slate-800">Kategori</b><Layers3 size={13} className="text-[#ad3b00]"/></span><span className="mt-1 block text-slate-500">{catalogCategories.length} pilihan</span></div>
            <div className="rounded-lg border border-slate-100 bg-[#f7f8ff] p-2.5"><b className="block text-slate-800">Pengiriman Nasional</b><span className="mt-1 block text-slate-500">Armada terjadwal & terlacak</span></div>
            <div className="rounded-lg border border-slate-100 bg-[#f7f8ff] p-2.5"><b className="block text-slate-800">Faktur Pajak</b><span className="mt-1 block text-slate-500">Transaksi bisnis resmi</span></div>
          </div>
        </div>
      </div>
    </section>

    <section id="katalog" className="mx-auto w-full max-w-7xl flex-1 px-5 py-5 lg:px-8 lg:py-6">
      <div className="grid gap-2 rounded-lg border border-slate-100 bg-white p-2.5 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr_1fr] lg:p-3">
        <label className="relative block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input value={search} onChange={(event)=>setSearch(event.target.value)} className="h-10 w-full rounded-md border-0 bg-[#edf2ff] pl-9 pr-3 text-[10px] text-slate-700 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#ad3b00]/20" placeholder="Cari produk, merk, spesifikasi, atau layanan..."/></label>
        <select value={priceRange} onChange={(event)=>setPriceRange(event.target.value)} className="h-10 min-w-0 rounded-md border-0 bg-[#edf2ff] px-3 text-[10px] text-slate-700 outline-none focus:ring-2 focus:ring-[#ad3b00]/20"><option value="all">Semua Rentang Harga</option><option value="under-1m">Di bawah Rp 1 juta</option><option value="1m-5m">Rp 1–5 juta</option><option value="5m-15m">Rp 5–15 juta</option><option value="over-15m">Di atas Rp 15 juta</option></select>
        <select value={availabilityFilter} onChange={(event)=>setAvailabilityFilter(event.target.value)} className="h-10 min-w-0 rounded-md border-0 bg-[#edf2ff] px-3 text-[10px] text-slate-700 outline-none focus:ring-2 focus:ring-[#ad3b00]/20"><option value="all">Ketersediaan: Semua</option><option value="available">Tersedia saja</option><option value="unavailable">Tidak tersedia</option><option value="Ready Stock">Ready Stock</option><option value="Indent 7 Hari">Indent 7 Hari</option><option value="Layanan Resmi">Layanan Resmi</option><option value="Layanan Rutin">Layanan Rutin</option></select>
        <select value={sortOrder} onChange={(event)=>setSortOrder(event.target.value)} className="h-10 min-w-0 rounded-md border-0 bg-[#edf2ff] px-3 text-[10px] text-slate-700 outline-none focus:ring-2 focus:ring-[#ad3b00]/20"><option value="recommended">Urutkan: Rekomendasi</option><option value="price-asc">Harga: Terendah</option><option value="price-desc">Harga: Tertinggi</option><option value="name">Nama: A–Z</option></select>
      </div>
      <div className="scrollbar-hide mt-2.5 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
        <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-bold text-slate-600"><SlidersHorizontal size={11}/>Kategori:</span>
        <button onClick={()=>{setRequestedCategory(null);setCategory(null);}} className={`shrink-0 rounded px-3 py-1.5 text-[9px] font-bold transition ${category===null?"bg-[#ad3b00] text-white":"bg-[#edf2ff] text-slate-700 hover:bg-[#dfe8ff]"}`}>Semua Kategori ({b2bProducts.length})</button>
        {catalogCategories.map((item)=><button key={item.id} onClick={()=>{setRequestedCategory(null);setCategory(item.id);}} className={`shrink-0 rounded px-3 py-1.5 text-[9px] font-semibold transition ${category===item.id?"bg-[#ad3b00] text-white":"bg-[#edf2ff] text-slate-700 hover:bg-[#dfe8ff]"}`}>{item.nama_kategori} ({b2bProducts.filter((product)=>product.kategori_id===item.id).length})</button>)}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 inline-flex items-center gap-1 text-[9px] font-bold text-slate-600"><SlidersHorizontal size={11}/>Tag Populer:</span>
        {popularTags.map((tag)=><button key={tag} onClick={()=>{setSearch(popularTagQueries[tag]);setRequestedCategory(null);setCategory(null);}} className="rounded bg-[#edf2ff] px-2 py-1 text-[8px] font-medium text-slate-700 hover:bg-[#dfe8ff]">{tag}</button>)}
      </div>
      <div className="mb-3 mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2"><h2 className="text-base font-black text-slate-900">Daftar Produk &amp; Jasa</h2><span className="rounded bg-[#e8eeff] px-2 py-1 text-[8px] font-semibold text-slate-600">{loading ? "Memuat..." : `${visible.length} Item Ditampilkan`}</span></div>
        <span className="inline-flex items-center gap-1 text-[8px] text-slate-600"><BadgeCheck size={11} className="text-[#ad3b00]"/>Harga resmi tertera belum termasuk PPN faktur B2B</span>
      </div>
      {requestedCategoryMissing && <div role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Kategori “{requestedCategory?.replace(/-/g, " ")}” belum tersedia. Tambahkan kategori ini melalui dashboard admin atau pilih kategori lain.</div>}
      {error&&<div role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Katalog tidak dapat dimuat: {error}</div>}
      {loading?<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{[1,2,3,4,5,6,7,8].map((n)=><div key={n} className="aspect-[.8/1] animate-pulse rounded-lg bg-[#edf2ff]"/>)}</div>:
        visible.length?<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{visible.map((product)=><ProductCard key={product.id} product={product} onDetail={()=>setSelected(product)} onAdd={(source)=>onAdd(product, source)}/>)}</div>:
        <div className="mt-4 rounded-xl bg-white py-16 text-center"><div className="text-4xl">⌕</div><h2 className="mt-3 font-bold text-slate-800">{error?"Katalog belum dapat ditampilkan":b2bProducts.length===0?"Belum ada produk di katalog":"Produk tidak ditemukan"}</h2><p className="mt-1 text-sm text-slate-500">{error?"Periksa koneksi database, lalu muat ulang halaman.":b2bProducts.length===0?"Tambahkan produk melalui dashboard admin atau jalankan npm run db:seed untuk data contoh.":"Sesuaikan kata kunci atau filter untuk melihat produk lainnya."}</p></div>}
    </section>

    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="text-[9px] font-bold uppercase tracking-[.12em] text-slate-500">{selected.kategori?.nama_kategori || "Produk"} <span className="mx-2 text-slate-300">|</span> <span className="normal-case tracking-normal">SKU: {selected.kode_produk}</span></p>
          <button onClick={() => setSelected(null)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Tutup detail produk"><X size={16}/></button>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_1fr]">
          <div className="flex min-h-[205px] items-center justify-center overflow-hidden rounded-md bg-[#edf2ff]">
            {selected.foto_url ? <img src={selected.foto_url} alt={selected.nama_produk} className="h-full max-h-[220px] w-full object-cover"/> : <Utensils size={58} className="text-[#ad3b00]"/>}
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#ad3b00]">{selected.kategori?.nama_kategori || "Menu MBG"}</p>
            <h2 className="mt-1.5 text-xl font-black leading-tight text-slate-900">{selected.nama_produk}</h2>
            <div className="mt-2 flex items-end gap-1.5"><b className="text-2xl font-black text-[#ad3b00]">{rupiah(selected.harga)}</b><span className="pb-1 text-[9px] text-slate-500">/ Unit ({selected.satuan})</span></div>
            <p className="mt-3 text-[11px] leading-5 text-slate-600">{selected.deskripsi}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[9px] font-bold ${selected.tersedia ? "bg-[#edf7ef] text-forest-700" : "bg-slate-100 text-slate-600"}`}><BadgeCheck size={12}/>{selected.tersedia ? "Tersedia" : "Tidak tersedia"}</span>
              {selected.informasi_gizi.kalori > 0 && <span className="inline-flex items-center gap-1.5 rounded-md bg-[#edf2ff] px-2 py-1.5 text-[9px] font-bold text-slate-700"><Leaf size={12}/>{selected.informasi_gizi.kalori} kkal</span>}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="rounded-lg border border-slate-100 p-3.5">
            <h3 className="flex items-center gap-2 text-[11px] font-black text-slate-900"><span className="flex h-5 w-5 items-center justify-center rounded bg-[#fff1e8] text-[#ad3b00]"><BadgeCheck size={12}/></span>Informasi Produk</h3>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-[9px]">
              <div><span className="block text-slate-400">Kategori</span><b className="mt-0.5 block text-slate-700">{selected.kategori?.nama_kategori || "Belum dikategorikan"}</b></div>
              <div><span className="block text-slate-400">Satuan</span><b className="mt-0.5 block text-slate-700">{selected.satuan}</b></div>
              <div><span className="block text-slate-400">Status ketersediaan</span><b className="mt-0.5 block text-slate-700">{selected.tersedia ? "Tersedia" : "Tidak tersedia"}</b></div>
              <div><span className="block text-slate-400">Informasi gizi</span><b className="mt-0.5 block text-slate-700">{selected.informasi_gizi.protein} g protein</b></div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
            <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-slate-600">Kuantitas:</span><div className="flex items-center rounded-md border border-slate-200 p-0.5"><button onClick={() => onAdjust(selected.id,-1)} className="flex h-7 w-7 items-center justify-center text-slate-500 disabled:opacity-30" disabled={!cart.find((item) => item.product.id === selected.id)}><Minus size={13}/></button><span className="w-8 text-center text-[11px] font-black">{cart.find((item) => item.product.id === selected.id)?.quantity || 1}</span><button onClick={() => cart.find((item) => item.product.id === selected.id) ? onAdjust(selected.id,1) : onAdd(selected)} className="flex h-7 w-7 items-center justify-center text-slate-500"><Plus size={13}/></button></div></div>
            <button onClick={() => { onAdd(selected); setSelected(null); onOpenCart(); }} disabled={!selected.tersedia} className="flex h-9 items-center justify-center gap-2 rounded-md bg-[#ad3b00] px-4 text-[10px] font-bold text-white hover:bg-[#8f3000] disabled:cursor-not-allowed disabled:opacity-40"><ShoppingCart size={14}/>Tambah ke keranjang</button>
          </div>
        </div>
      </div>
    </div>}
  </>;
}
