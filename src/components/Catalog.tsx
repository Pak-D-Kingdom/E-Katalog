"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BadgeCheck, ChevronRight, Layers3, Leaf, MapPin, MessageCircle, Minus, PackageOpen, Plus, Search, ShoppingBag, ShoppingCart, SlidersHorizontal, Trash2, Utensils, X } from "lucide-react";
import { api, Product, Category, rupiah } from "@/lib/types";
import Link from "next/link";

type CartItem = { product: Product; quantity: number };
type Settings = { nama_instansi: string; nomor_whatsapp: string; alamat: string | null };
type FlyingItem = { key: number; left: number; top: number; x: number; y: number; foto_url: string | null };
const cartKey = "mbg-cart-v1";

function ProductCard({ product, onDetail, onAdd }: { product: Product; onDetail: () => void; onAdd: (source: HTMLElement) => void }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <button onClick={onDetail} className="relative block aspect-[1.4/1] w-full overflow-hidden bg-[#edf2ff] text-left">
        {product.foto_url
          ? <img src={product.foto_url} alt={product.nama_produk} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          : <div className="flex h-full items-center justify-center bg-[#edf2ff] text-5xl">🍱</div>}
        <span className="absolute left-2.5 top-2.5 max-w-[68%] truncate rounded bg-white/95 px-2 py-1 text-[9px] font-semibold text-slate-700 shadow-sm">{product.tersedia ? "Ready Stock" : "Tidak tersedia"}</span>
        <span className="absolute right-2.5 top-2.5 max-w-[45%] truncate rounded bg-white/95 px-2 py-1 text-[9px] font-semibold text-slate-700 shadow-sm">{product.kategori?.nama_kategori || "Menu MBG"}</span>
      </button>
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[8px] font-bold uppercase tracking-[.12em] text-slate-400">Kode: {product.kode_produk}</p>
        </div>
        <button onClick={onDetail} className="mt-1 min-h-9 text-left text-sm font-extrabold leading-4 text-slate-800 hover:text-[#ad3b00]">{product.nama_produk}</button>
        <p className="mt-1 line-clamp-2 min-h-8 text-[10px] leading-3.5 text-slate-500">{product.deskripsi}</p>
        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[9px] text-slate-500">
          <span className="inline-flex items-center gap-1"><Leaf size={10} className="text-[#ad3b00]"/>{product.informasi_gizi.kalori} kkal</span>
          <span className="inline-flex items-center gap-1"><BadgeCheck size={10} className="text-[#ad3b00]"/>Protein {product.informasi_gizi.protein} g</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-2.5">
          <div><small className="block text-[8px] text-slate-500">Harga per {product.satuan}</small><b className="text-sm font-extrabold text-[#ad3b00]">{rupiah(product.harga)}</b></div>
          <div className="flex gap-1.5">
            <button onClick={onDetail} className="rounded bg-[#e8efff] px-2.5 py-1.5 text-[9px] font-bold text-slate-700 hover:bg-[#dce7ff]">Detail</button>
            <button onClick={(event) => onAdd(event.currentTarget)} disabled={!product.tersedia} aria-label={`Tambah ${product.nama_produk} ke keranjang`} className="flex h-7 w-8 items-center justify-center rounded bg-[#ad3b00] text-white hover:bg-[#8f3000] disabled:cursor-not-allowed disabled:opacity-40"><ShoppingCart size={13}/></button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Catalog({ page = "home" }: { page?: "home" | "catalog" }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [category, setCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState<"all" | "available">("all");
  const [priceRange, setPriceRange] = useState<"all" | "under-1m" | "1m-5m" | "over-5m">("all");
  const [sort, setSort] = useState<"recommended" | "price-low" | "price-high" | "name">("recommended");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nama_pemesan: "", nama_sekolah: "", telepon_pemesan: "", catatan: "" });
  const [flyingItem, setFlyingItem] = useState<FlyingItem | null>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const flyingKeyRef = useRef(0);

  useEffect(() => {
    setLoading(true);
    const requests = [
      api<{ pengaturan: Settings | null }>("/api/pengaturan")
        .then(({ pengaturan }) => setSettings(pengaturan))
        .catch((e: Error) => {
          if (page === "catalog") setError(e.message);
        }),
      Promise.all([
        api<{ produk: Product[] }>("/api/produk"),
        api<{ kategori: Category[] }>("/api/kategori")
      ]).then(([p, c]) => {
        setProducts(p.produk);
        setCategories(c.kategori);
      }).catch((e: Error) => {
        if (page === "catalog") setError(e.message);
      })
    ];
    Promise.all(requests).finally(() => setLoading(false));
    try {
      const saved = JSON.parse(localStorage.getItem(cartKey) || "[]") as CartItem[];
      if (Array.isArray(saved)) setCart(saved.filter((item) => item?.product?.id && Number.isInteger(item.quantity) && item.quantity > 0));
    } catch {
      localStorage.removeItem(cartKey);
    }
  }, [page]);

  useEffect(() => {
    if (!loading) localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, loading]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = products.filter((p) =>
      (category === null || p.kategori_id === category) &&
      (!query || `${p.nama_produk} ${p.kode_produk} ${p.deskripsi}`.toLowerCase().includes(query)) &&
      (availability === "all" || p.tersedia) &&
      (priceRange === "all" ||
        (priceRange === "under-1m" && Number(p.harga) < 1000000) ||
        (priceRange === "1m-5m" && Number(p.harga) >= 1000000 && Number(p.harga) <= 5000000) ||
        (priceRange === "over-5m" && Number(p.harga) > 5000000))
    );
    return [...filtered].sort((a, b) => {
      if (sort === "price-low") return Number(a.harga) - Number(b.harga);
      if (sort === "price-high") return Number(b.harga) - Number(a.harga);
      if (sort === "name") return a.nama_produk.localeCompare(b.nama_produk);
      return 0;
    });
  }, [products, category, search, availability, priceRange, sort]);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + Number(item.product.harga) * item.quantity, 0);
  const featuredProducts = visible.slice(0, 4);
  const whatsappHref = settings?.nomor_whatsapp
    ? `https://wa.me/${settings.nomor_whatsapp.replace(/\D/g, "")}`
    : "/#kontak";

  function add(product: Product, source?: HTMLElement) {
    if (source && cartButtonRef.current) {
      const sourceRect = source.getBoundingClientRect();
      const targetRect = cartButtonRef.current.getBoundingClientRect();
      setFlyingItem({
        key: ++flyingKeyRef.current,
        left: sourceRect.left + sourceRect.width / 2 - 14,
        top: sourceRect.top + sourceRect.height / 2 - 14,
        x: targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2),
        y: targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2),
        foto_url: product.foto_url
      });
    }
    setCart((items) => {
      const current = items.find((item) => item.product.id === product.id);
      return current
        ? items.map((item) => item.product.id === product.id ? { ...item, product, quantity: item.quantity + 1 } : item)
        : [...items, { product, quantity: 1 }];
    });
  }
  function adjust(id: number, delta: number) {
    setCart((items) => items.map((item) => item.product.id === id ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0));
  }

  async function checkout(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!cart.length) return;
    setSubmitting(true);
    try {
      const result = await api<{ whatsapp_url: string }>("/api/pesanan", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          items: cart.map((item) => ({ produk_id: item.product.id, jumlah: item.quantity }))
        })
      });
      setCart([]);
      localStorage.removeItem(cartKey);
      window.location.assign(result.whatsapp_url);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-3 px-5 py-3 lg:px-8">
          <Link href="/" aria-label="Beranda E-Katalog MBG" className="order-1 flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-700 text-white"><Leaf size={21}/></span>
            <span><b className="block text-sm leading-tight text-slate-900">{settings?.nama_instansi || "E-Katalog MBG"}</b><small className="text-[10px] text-slate-500">Makan Bergizi Gratis</small></span>
          </Link>
          <nav aria-label="Navigasi utama" className="order-3 flex w-full items-center justify-center gap-1 rounded-lg bg-[#edf2ff] p-1 text-xs font-semibold text-slate-600 md:absolute md:left-1/2 md:top-1/2 md:order-2 md:w-auto md:-translate-x-1/2 md:-translate-y-1/2">
            <Link href="/" className={`rounded-md px-4 py-2 ${page === "home" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"}`}>Home</Link>
            <Link href="/katalog" className={`rounded-md px-4 py-2 ${page === "catalog" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"}`}>Katalog</Link>
          </nav>
          <a href={whatsappHref} target={settings?.nomor_whatsapp ? "_blank" : undefined} rel={settings?.nomor_whatsapp ? "noreferrer" : undefined} className="order-2 inline-flex items-center gap-1.5 rounded-md bg-[#ad3b00] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#8f3000] md:order-3">
            <MessageCircle size={14}/> WhatsApp
          </a>
        </div>
      </header>

      {page === "home" ? <>
        <section id="home" className="bg-[#eef3ff]">
          <div className="mx-auto max-w-7xl px-5 pb-10 pt-8 lg:px-8 lg:pb-12 lg:pt-10">
            <div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dce6ff] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-600"><BadgeCheck size={12} className="text-[#b63d00]"/> Katalog menu bergizi</span>
                <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-4xl">Menu Bergizi Pilihan<br className="hidden sm:block"/> untuk Tumbuh Optimal</h1>
                <p className="mt-2 max-w-xl text-xs leading-5 text-slate-600 sm:text-sm">Paket makan seimbang, praktis, dan lezat untuk mendukung aktivitas belajar setiap hari.</p>
              </div>
              <div className="scrollbar-hide flex max-w-full gap-1 overflow-x-auto rounded-lg bg-[#e5edff] p-1">
                <button onClick={() => setCategory(null)} className={`shrink-0 rounded-md px-3 py-2 text-[10px] font-bold ${category === null ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:bg-white/60"}`}>Semua Kategori</button>
                {categories.map((item) => <button key={item.id} onClick={() => setCategory(item.id)} className={`shrink-0 rounded-md px-3 py-2 text-[10px] font-semibold ${category === item.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:bg-white/60"}`}>{item.nama_kategori}</button>)}
              </div>
            </div>
            {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map((n) => <div key={n} className="h-[330px] animate-pulse rounded-xl bg-white/80"/> )}</div> :
              featuredProducts.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {featuredProducts.map((product) => <ProductCard key={product.id} product={product} onDetail={() => setSelected(product)} onAdd={(source) => add(product, source)}/>)}
              </div> : <div className="rounded-xl border border-white bg-white/80 px-5 py-12 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff4e8] text-[#ad3b00]"><Utensils size={22}/></span>
                <h2 className="mt-3 font-bold text-slate-800">Menu sedang disiapkan</h2>
                <p className="mt-1 text-sm text-slate-500">Silakan kunjungi katalog untuk melihat pilihan yang tersedia.</p>
                <Link href="/katalog" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#ad3b00]">Buka katalog <ChevronRight size={16}/></Link>
              </div>
            }
            <div className="mt-7 flex justify-center">
              <Link href="/katalog" className="inline-flex items-center gap-2 rounded-md bg-[#ad3b00] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#8f3000]">Lihat Semua Menu di Katalog Lengkap <ArrowRight size={15}/></Link>
            </div>
          </div>
        </section>

        <section className="bg-[#f8f9ff]">
          <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
            <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_.8fr] lg:gap-12">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dce6ff] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-600"><BadgeCheck size={12} className="text-[#b63d00]"/> Program Makan Bergizi Gratis</span>
                <h2 className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-4xl">Pilihan Seimbang untuk Setiap Kebutuhan <span className="text-[#ad3b00]">Sekolah</span></h2>
                <p className="mt-3 max-w-xl text-xs leading-5 text-slate-600 sm:text-sm">Temukan pilihan makanan yang membantu memenuhi kebutuhan nutrisi harian. Lihat informasi gizi, pilih paket, dan pesan dengan mudah melalui WhatsApp.</p>
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[[`${products.length}+`,"Menu pilihan"],[`${categories.length}`,"Kategori"],["4","Informasi gizi"],["Mudah","Pesan online"]].map(([value,label])=><div key={label} className="rounded-lg bg-[#eef3ff] p-3"><b className="block text-base font-black text-[#ad3b00]">{value}</b><small className="mt-1 block text-[9px] text-slate-600">{label}</small></div>)}
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="relative flex aspect-[1.35/1] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#dce9d5] via-[#f2e7ca] to-[#e9effb]">
                  {products.find((product) => product.foto_url)?.foto_url
                    ? <img src={products.find((product) => product.foto_url)?.foto_url ?? ""} alt="Pilihan menu MBG" className="absolute inset-0 h-full w-full object-cover"/>
                    : <div className="text-center"><div className="text-7xl sm:text-8xl">🍱🥗</div><p className="mt-3 text-xs font-bold text-forest-900">Makan sehat, semangat belajar</p></div>}
                  <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-white/95 px-3 py-2 shadow"><span><b className="block text-[11px] text-slate-800">Menu bergizi setiap hari</b><small className="text-[9px] text-slate-500">Pilihan untuk keluarga sekolah</small></span><span className="rounded bg-[#dfe8ff] px-2 py-1 text-[9px] font-bold text-slate-700">MBG</span></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f8f9ff] pb-12">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div><p className="text-[9px] font-bold uppercase tracking-widest text-[#ad3b00]">Pilihan untuk semua</p><h2 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">Penuhi Kebutuhan Gizi Harian</h2><p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">Pilihan menu dan layanan yang dirancang agar pemesanan lebih praktis.</p></div>
              <Link href="/katalog" className="hidden items-center gap-1 pb-1 text-[11px] font-bold text-[#ad3b00] sm:flex">Lihat seluruh katalog <ArrowRight size={14}/></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {icon:"🥦",title:"Menu Seimbang",tag:"Gizi beragam",text:"Pilihan menu dengan informasi gizi yang jelas.",items:["Kalori","Protein","Karbohidrat","Lemak"],href:"/katalog",button:"Jelajahi menu"},
                {icon:"🍚",title:"Bahan Berkualitas",tag:"Pilihan segar",text:"Menu harian yang praktis untuk kebutuhan sekolah.",items:["Menu utama","Lauk pilihan","Sayuran","Buah"],href:"/katalog",button:"Lihat pilihan"},
                {icon:"💚",title:"Paket Fleksibel",tag:"Sesuai kebutuhan",text:"Pilih paket dan jumlah porsi dengan mudah.",items:["Porsi satuan","Paket menu","Atur jumlah","Keranjang"],href:"/katalog",button:"Pilih paket"},
                {icon:"🛒",title:"Pemesanan Mudah",tag:"Pesan via WhatsApp",text:"Kirim detail pesanan langsung dari katalog.",items:["Isi data","Cek subtotal","Simpan pesanan","Konfirmasi"],href:"/katalog",button:"Mulai pesan"}
              ].map((item)=><article key={item.title} className="flex min-h-[245px] flex-col rounded-xl bg-white p-4 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff4e8] text-lg">{item.icon}</span>
                <h3 className="mt-3 text-sm font-extrabold text-slate-900">{item.title}</h3>
                <span className="mt-1 w-fit rounded bg-[#e7efff] px-2 py-1 text-[9px] text-slate-600">{item.tag}</span>
                <p className="mt-2 min-h-8 text-[10px] leading-4 text-slate-500">{item.text}</p>
                <div className="mb-4 mt-2 flex flex-wrap gap-1">{item.items.map((tag)=><span key={tag} className="rounded bg-[#eef3ff] px-1.5 py-1 text-[8px] font-medium text-slate-600">{tag}</span>)}</div>
                <Link href={item.href} className="mt-auto flex items-center justify-between rounded-md bg-[#e7efff] px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-[#dbe7ff]">{item.button}<ChevronRight size={13}/></Link>
              </article>)}
            </div>
          </div>
        </section>
      </> : <>
        <section className="border-b border-[#e1e6f4] bg-[#f7f8ff]">
          <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8 lg:py-8">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8efff] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-600"><BadgeCheck size={11} className="text-[#ad3b00]"/> Katalog Pengadaan Dapur</span>
                <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl md:text-4xl">Katalog Pengadaan Dapur Profesional</h1>
                <p className="mt-2 max-w-xl text-xs leading-5 text-slate-600 sm:text-sm">Temukan bahan baku, perlengkapan, dan layanan dapur dari mitra terverifikasi untuk mendukung operasional MBG Anda.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] sm:min-w-[280px]">
                <div className="rounded-md bg-[#e8efff] p-2.5 text-slate-700"><div className="flex items-center justify-between"><b className="text-[9px] uppercase tracking-wide text-slate-500">Produk aktif</b><PackageOpen size={14} className="text-[#ad3b00]"/></div><strong className="mt-1 block text-sm text-slate-900">{products.length} item</strong></div>
                <div className="rounded-md bg-[#e8efff] p-2.5 text-slate-700"><div className="flex items-center justify-between"><b className="text-[9px] uppercase tracking-wide text-slate-500">Kategori</b><Layers3 size={14} className="text-[#ad3b00]"/></div><strong className="mt-1 block text-sm text-slate-900">{categories.length} pilihan</strong></div>
              </div>
            </div>
          </div>
        </section>
        <section id="katalog" className="mx-auto w-full max-w-7xl flex-1 bg-[#f7f8ff] px-5 py-6 lg:px-8 lg:py-8">
          <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(280px,1fr)_165px_185px_180px]">
              <label className="relative block"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e)=>setSearch(e.target.value)} className="field field-with-icon h-10 border-0 bg-[#edf2ff] text-xs" placeholder="Cari produk, merk, spesifikasi, atau layanan..."/></label>
              <select value={priceRange} onChange={(e)=>setPriceRange(e.target.value as typeof priceRange)} className="field h-10 border-0 bg-[#edf2ff] py-2 text-[10px] text-slate-600"><option value="all">Semua rentang harga</option><option value="under-1m">Di bawah Rp1 juta</option><option value="1m-5m">Rp1–5 juta</option><option value="over-5m">Di atas Rp5 juta</option></select>
              <select value={availability} onChange={(e)=>setAvailability(e.target.value as typeof availability)} className="field h-10 border-0 bg-[#edf2ff] py-2 text-[10px] text-slate-600"><option value="all">Ketersediaan: Semua</option><option value="available">Tersedia saja</option></select>
              <select value={sort} onChange={(e)=>setSort(e.target.value as typeof sort)} className="field h-10 border-0 bg-[#edf2ff] py-2 text-[10px] text-slate-600"><option value="recommended">Urutkan: Rekomendasi</option><option value="price-low">Harga terendah</option><option value="price-high">Harga tertinggi</option><option value="name">Nama A–Z</option></select>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={12} className="shrink-0 text-slate-600"/>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Kategori</span>
                <div className="scrollbar-hide flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
                  <button onClick={()=>setCategory(null)} className={`shrink-0 rounded px-3 py-1.5 text-[9px] font-bold transition ${category===null?"bg-[#ad3b00] text-white shadow-sm":"bg-[#edf2ff] text-slate-700 hover:bg-[#dfe8ff]"}`}>Semua kategori ({products.length})</button>
                  {categories.map((item)=><button key={item.id} onClick={()=>setCategory(item.id)} className={`shrink-0 rounded px-3 py-1.5 text-[9px] font-semibold transition ${category===item.id?"bg-[#ad3b00] text-white shadow-sm":"bg-[#edf2ff] text-slate-700 hover:bg-[#dfe8ff]"}`}>{item.nama_kategori} <span className="ml-1 opacity-70">({products.filter((product) => product.kategori_id === item.id).length})</span></button>)}
                </div>
              </div>
            </div>
          </div>
          <div className="mb-4 mt-6 flex items-end justify-between gap-3"><div><h2 className="text-lg font-black text-slate-900 md:text-xl">Daftar Produk & Jasa</h2></div><span className="rounded bg-[#e8efff] px-2 py-1 text-[9px] font-semibold text-slate-600">{visible.length} item ditampilkan</span></div>
          {error&&<div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Katalog tidak dapat dimuat: {error}</div>}
          {loading?<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{[1,2,3,4].map((n)=><div key={n} className="h-[330px] animate-pulse rounded-lg bg-[#edf2ff]"/>)}</div>:
            visible.length?<div className="grid grid-cols-2 items-stretch gap-4 md:grid-cols-3 lg:grid-cols-4">{visible.map((product)=><ProductCard key={product.id} product={product} onDetail={()=>setSelected(product)} onAdd={(source)=>add(product, source)}/>)}</div>:
            <div className="rounded-lg border border-dashed border-[#dfe6f5] bg-white py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#edf2ff] text-[#ad3b00]"><Search size={22}/></div><h2 className="mt-3 font-bold text-slate-800">{error?"Katalog belum dapat ditampilkan":"Produk belum ditemukan"}</h2><p className="mt-1 text-sm text-slate-500">{error?"Periksa koneksi database, lalu muat ulang halaman.":"Coba kata kunci, kategori, atau filter lainnya."}</p></div>}
        </section>
      </>}

      <footer id="kontak" className="mt-auto border-t border-[#dfe6f5] bg-[#edf2ff] px-5 pb-4 pt-8 text-slate-600">
        <div className="mx-auto grid max-w-7xl gap-7 pb-7 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.2fr_1.1fr] lg:gap-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-700 text-white"><Leaf size={17}/></span>{settings?.nama_instansi||"E-Katalog MBG"}</Link>
            <p className="mt-3 max-w-xs text-[10px] leading-4">Katalog pilihan makanan bergizi untuk membantu sekolah dan keluarga memilih menu dengan lebih mudah.</p>
            <div className="mt-3 flex gap-2 text-[9px]"><span className="rounded bg-white px-2 py-1">✓ Informasi Gizi</span><span className="rounded bg-white px-2 py-1">✓ Pemesanan Mudah</span></div>
          </div>
          <div><h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900">Navigasi Cepat</h3><div className="mt-3 flex flex-col gap-2 text-[10px]"><Link href="/" className="hover:text-forest-600">Home</Link><Link href="/katalog" className="hover:text-forest-600">Katalog Menu</Link><a href={whatsappHref} className="hover:text-forest-600">Hubungi via WhatsApp</a><Link href="/admin/login" className="hover:text-forest-600">Portal Admin</Link></div></div>
          <div><h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900">Kategori Menu</h3><div className="mt-3 flex flex-col gap-2 text-[10px]">{categories.slice(0,4).map((item)=><Link key={item.id} href="/katalog" className="hover:text-forest-600">{item.nama_kategori}</Link>)}{!categories.length&&<><Link href="/katalog">Paket Makan Siang</Link><Link href="/katalog">Kudapan Sehat</Link></>}</div></div>
          <div><h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900">Kontak</h3><div className="mt-3 space-y-2 text-[10px]">{settings?.alamat&&<p className="flex gap-2"><MapPin size={13} className="shrink-0 text-forest-600"/>{settings.alamat}</p>}{settings?.nomor_whatsapp&&<a href={whatsappHref} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-forest-600"><MessageCircle size={13} className="shrink-0 text-forest-600"/>+{settings.nomor_whatsapp.replace(/\D/g,"")}</a>}<p className="text-slate-500">Melayani dengan sepenuh hati.</p></div></div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 border-t border-[#dfe7fb] pt-4 text-[9px] sm:flex-row"><span>© {new Date().getFullYear()} {settings?.nama_instansi||"E-Katalog MBG"}. Hak cipta dilindungi.</span><span>Informasi menu dapat berubah sewaktu-waktu.</span></div>
      </footer>

      {flyingItem && <div
        key={flyingItem.key}
        onAnimationEnd={() => setFlyingItem(null)}
        className="pointer-events-none fixed z-[60] flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-white text-lg shadow-lg animate-fly-to-cart"
        style={{ left: flyingItem.left, top: flyingItem.top, "--fly-x": `${flyingItem.x}px`, "--fly-y": `${flyingItem.y}px` } as React.CSSProperties}
      >
        {flyingItem.foto_url ? <img src={flyingItem.foto_url} alt="" className="h-full w-full object-cover" /> : "🍱"}
      </div>}
      <button ref={cartButtonRef} onClick={()=>setCartOpen(true)} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-xl transition hover:bg-slate-800" aria-label={`Buka keranjang, ${itemCount} item`}>
        <ShoppingBag size={16}/>Keranjang {itemCount>0&&<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c24a06] px-1 text-[10px]">{itemCount}</span>}
      </button>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}>
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
              <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-slate-600">Kuantitas:</span><div className="flex items-center rounded-md border border-slate-200 p-0.5"><button onClick={() => adjust(selected.id,-1)} className="flex h-7 w-7 items-center justify-center text-slate-500 disabled:opacity-30" disabled={!cart.find((item) => item.product.id === selected.id)}><Minus size={13}/></button><span className="w-8 text-center text-[11px] font-black">{cart.find((item) => item.product.id === selected.id)?.quantity || 1}</span><button onClick={() => cart.find((item) => item.product.id === selected.id) ? adjust(selected.id,1) : add(selected)} className="flex h-7 w-7 items-center justify-center text-slate-500"><Plus size={13}/></button></div></div>
              <button onClick={() => { add(selected); setSelected(null); setCartOpen(true); }} disabled={!selected.tersedia} className="flex h-9 items-center justify-center gap-2 rounded-md bg-[#ad3b00] px-4 text-[10px] font-bold text-white hover:bg-[#8f3000] disabled:cursor-not-allowed disabled:opacity-40"><ShoppingCart size={14}/>Tambah ke keranjang</button>
            </div>
          </div>
        </div>
      </div>}

      {cartOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 sm:p-5" onMouseDown={(e) => e.target === e.currentTarget && setCartOpen(false)}>
        <aside className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff1e8] text-[#ad3b00]"><ShoppingCart size={18}/></span>
              <div><h2 className="text-sm font-black text-slate-900">Keranjang</h2><p className="mt-0.5 text-[9px] text-slate-500">{itemCount} item <span className="mx-1">•</span> E-Katalog MBG <span className="mx-1">•</span> Respon cepat</p></div>
            </div>
            {cart.length === 0 && <button onClick={() => setCartOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Tutup keranjang"><X size={17}/></button>}
          </div>
          <div className="scrollbar-hide flex-1 overflow-y-auto px-5 py-4">
            {!cart.length ? <div className="py-14 text-center"><ShoppingBag className="mx-auto text-slate-300" size={42}/><p className="mt-4 text-sm font-bold text-slate-800">Keranjang masih kosong</p><p className="mt-1 text-xs text-slate-500">Tambahkan produk atau layanan dari katalog.</p><button className="mt-4 text-xs font-bold text-[#ad3b00]" onClick={() => setCartOpen(false)}>Lanjut belanja</button></div> : <>
              <div className="space-y-2.5">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="rounded-lg border border-slate-100 bg-white p-3">
                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#fff1e8] text-[#ad3b00]">{product.foto_url ? <img src={product.foto_url} alt="" className="h-full w-full object-cover"/> : <Utensils size={21}/>}</div>
                      <div className="min-w-0 flex-1">
                        <b className="block truncate text-[11px] text-slate-900">{product.nama_produk}</b>
                        <p className="mt-0.5 text-[9px] text-slate-500">SKU: {product.kode_produk}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[9px] text-slate-500">Harga satuan: <b className="text-slate-700">{rupiah(product.harga)}</b></span>
                          <div className="flex items-center gap-1.5 rounded-md border border-slate-100 p-0.5">
                            <button onClick={() => adjust(product.id,-1)} className="flex h-6 w-6 items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Kurangi jumlah"><Minus size={12}/></button>
                            <span className="w-5 text-center text-[10px] font-bold text-slate-800">{quantity}</span>
                            <button onClick={() => adjust(product.id,1)} className="flex h-6 w-6 items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Tambah jumlah"><Plus size={12}/></button>
                          </div>
                        </div>
                      </div>
                      <div className="flex w-[88px] flex-col items-end justify-between">
                        <b className="text-[12px] text-[#ad3b00]">{rupiah(Number(product.harga) * quantity)}</b>
                        <button onClick={() => setCart((items) => items.filter((item) => item.product.id !== product.id))} className="text-slate-400 hover:text-red-500" aria-label="Hapus item"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-slate-100 p-3">
                <div className="flex justify-between text-[10px] text-slate-600"><span>Subtotal pesanan ({itemCount} item)</span><b className="text-slate-800">{rupiah(total)}</b></div>
                <div className="mt-2.5 flex justify-between border-t border-slate-100 pt-2.5"><span className="text-sm font-black text-slate-900">Total keseluruhan pesanan</span><b className="text-lg font-black text-[#ad3b00]">{rupiah(total)}</b></div>
              </div>
              <div className="mt-3 flex gap-2 rounded-md bg-[#fff7f2] px-3 py-2.5 text-[9px] leading-4 text-slate-600"><BadgeCheck size={14} className="shrink-0 text-[#ad3b00]"/><p>Pesan otomatis berisi data produk, jumlah, dan total estimasi untuk diteruskan ke tim E-Katalog MBG.</p></div>
              <form onSubmit={checkout} className="mt-3 overflow-hidden rounded-lg border border-slate-100 bg-white">
                <h3 className="flex items-center gap-2 bg-[#fff9f5] px-3.5 py-2.5 text-[11px] font-black text-[#ad3b00]"><ShoppingBag size={14}/> Informasi pemesan / lembaga</h3>
                {error && <div className="mt-3 rounded-md bg-red-50 p-2 text-[10px] text-red-700">{error}</div>}
                <div className="grid gap-x-3 gap-y-2.5 p-3.5 sm:grid-cols-2">
                  <label className="block text-[9px] font-bold leading-4 text-slate-600">Nama pemesan *
                    <input required minLength={2} className="field mt-1 h-9 rounded-md border-slate-200 px-3 py-2 text-[10px] font-normal" placeholder="Contoh: Budi Setiawan" value={form.nama_pemesan} onChange={(e) => setForm({...form,nama_pemesan:e.target.value})}/>
                  </label>
                  <label className="block text-[9px] font-bold leading-4 text-slate-600">Nama sekolah / instansi
                    <input className="field mt-1 h-9 rounded-md border-slate-200 px-3 py-2 text-[10px] font-normal" placeholder="Contoh: SMK Negeri 1" value={form.nama_sekolah} onChange={(e) => setForm({...form,nama_sekolah:e.target.value})}/>
                  </label>
                  <label className="block text-[9px] font-bold leading-4 text-slate-600 sm:col-span-2">Nomor telepon / WhatsApp
                    <input type="tel" className="field mt-1 h-9 rounded-md border-slate-200 px-3 py-2 text-[10px] font-normal" placeholder="Contoh: 0812-3456-7890" value={form.telepon_pemesan} onChange={(e) => setForm({...form,telepon_pemesan:e.target.value})}/>
                  </label>
                  <label className="block text-[9px] font-bold leading-4 text-slate-600 sm:col-span-2">Catatan pesanan (opsional)
                    <textarea className="field mt-1 min-h-16 resize-y overflow-hidden rounded-md border-slate-200 px-3 py-2 text-[10px] font-normal" placeholder="Contoh: kebutuhan harian..." value={form.catatan} onChange={(e) => setForm({...form,catatan:e.target.value})}/>
                  </label>
                </div>
              </form>
            </>}
          </div>
          {cart.length > 0 && <div className="grid grid-cols-[120px_1fr] gap-2 border-t border-slate-100 px-5 py-3">
            <button onClick={() => setCartOpen(false)} className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-50"><ArrowRight size={14} className="rotate-180"/>Lanjut belanja</button>
            <button disabled={submitting} onClick={() => { const formElement = document.querySelector<HTMLFormElement>("aside form"); formElement?.requestSubmit(); }} className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#ad3b00] text-[10px] font-bold text-white hover:bg-[#8f3000] disabled:opacity-60"><MessageCircle size={14}/>{submitting ? "Menyimpan pesanan..." : "Order via WhatsApp"}</button>
          </div>}
        </aside>
      </div>}
    </main>
  );
}
