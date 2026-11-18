"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, ChevronRight, Leaf, MapPin, MessageCircle, Minus, Plus, Search, ShoppingBag, ShoppingCart, Trash2, Utensils, X } from "lucide-react";
import { api, Product, Category, rupiah } from "@/lib/types";
import Link from "next/link";

type CartItem = { product: Product; quantity: number };
type Settings = { nama_instansi: string; nomor_whatsapp: string; alamat: string | null };
const cartKey = "mbg-cart-v1";

function ProductCard({ product, onDetail, onAdd }: { product: Product; onDetail: () => void; onAdd: () => void }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <button onClick={onDetail} className="relative block aspect-[1.25/1] w-full overflow-hidden bg-[#e6edf2] text-left">
        {product.foto_url
          ? <img src={product.foto_url} alt={product.nama_produk} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          : <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#dbe9d2] via-[#f2ead4] to-[#e6edf2] text-7xl">🍱</div>}
        <span className="absolute left-2.5 top-2.5 max-w-[70%] truncate rounded bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">{product.kategori?.nama_kategori || "Menu MBG"}</span>
        <span className="absolute right-2.5 top-2.5 rounded bg-forest-700 px-2 py-1 text-[10px] font-semibold text-white">Tersedia</span>
      </button>
      <div className="p-3.5">
        <p className="text-[9px] font-bold uppercase tracking-[.15em] text-slate-400">Kode: {product.kode_produk}</p>
        <button onClick={onDetail} className="mt-1.5 min-h-10 text-left text-sm font-extrabold leading-5 text-slate-800 hover:text-forest-700">{product.nama_produk}</button>
        <p className="mt-1.5 line-clamp-2 min-h-8 text-[11px] leading-4 text-slate-500">{product.deskripsi}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1"><Leaf size={11} className="text-orange-700"/>{product.informasi_gizi.kalori} kkal</span>
          <span className="inline-flex items-center gap-1"><BadgeCheck size={11} className="text-orange-700"/>Protein {product.informasi_gizi.protein} g</span>
        </div>
        <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-2.5">
          <div><small className="block text-[9px] text-slate-500">Harga per {product.satuan}</small><b className="text-sm font-extrabold text-[#b63d00]">{rupiah(product.harga)}</b></div>
          <div className="flex gap-1.5">
            <button onClick={onDetail} className="rounded-md bg-[#e7efff] px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-[#dbe7ff]">Detail</button>
            <button onClick={onAdd} aria-label={`Tambah ${product.nama_produk} ke keranjang`} className="flex h-8 w-8 items-center justify-center rounded-md bg-[#ad3b00] text-white hover:bg-[#8e3000]"><ShoppingCart size={15}/></button>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nama_pemesan: "", nama_sekolah: "", telepon_pemesan: "", catatan: "" });

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
    return products.filter((p) =>
      (category === null || p.kategori_id === category) &&
      (!query || `${p.nama_produk} ${p.kode_produk}`.toLowerCase().includes(query))
    );
  }, [products, category, search]);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + Number(item.product.harga) * item.quantity, 0);
  const featuredProducts = visible.slice(0, 4);
  const whatsappHref = settings?.nomor_whatsapp
    ? `https://wa.me/${settings.nomor_whatsapp.replace(/\D/g, "")}`
    : "/#kontak";

  function add(product: Product) {
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
          <nav aria-label="Navigasi utama" className="order-3 flex w-full items-center justify-center gap-1 rounded-lg bg-[#eef3ff] p-1 text-xs font-semibold text-slate-600 md:absolute md:left-1/2 md:top-1/2 md:order-2 md:w-auto md:-translate-x-1/2 md:-translate-y-1/2">
            <Link href="/" className={`rounded-md px-4 py-2 ${page === "home" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"}`}>Home</Link>
            <Link href="/katalog" className={`rounded-md px-4 py-2 ${page === "catalog" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"}`}>Katalog</Link>
          </nav>
          <a href={whatsappHref} target={settings?.nomor_whatsapp ? "_blank" : undefined} rel={settings?.nomor_whatsapp ? "noreferrer" : undefined} className="order-2 inline-flex items-center gap-1.5 rounded-md bg-[#a83b00] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#8c3100] md:order-3">
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
                {featuredProducts.map((product) => <ProductCard key={product.id} product={product} onDetail={() => setSelected(product)} onAdd={() => add(product)}/>)}
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
        <section className="bg-[#eef3ff]">
          <div className="mx-auto max-w-7xl px-5 py-9 lg:px-8 lg:py-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dce6ff] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-600"><BadgeCheck size={12} className="text-[#b63d00]"/> Katalog MBG</span>
            <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div><h1 className="text-3xl font-black text-slate-900 md:text-4xl">Temukan Menu Favorit Anda</h1><p className="mt-2 text-sm text-slate-600">Lihat pilihan menu, informasi gizi, dan harga dalam satu tempat.</p></div>
              <label className="relative block w-full md:max-w-sm"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e)=>setSearch(e.target.value)} className="field border-0 pl-10 shadow-sm" placeholder="Cari menu atau kode produk..."/></label>
            </div>
          </div>
        </section>
        <section id="katalog" className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 lg:px-8 lg:py-10">
          <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg bg-[#eef3ff] p-1">
            <button onClick={()=>setCategory(null)} className={`shrink-0 rounded-md px-3 py-2 text-[10px] font-bold ${category===null?"bg-white text-slate-900 shadow-sm":"text-slate-600"}`}>Semua Kategori</button>
            {categories.map((item)=><button key={item.id} onClick={()=>setCategory(item.id)} className={`shrink-0 rounded-md px-3 py-2 text-[10px] font-semibold ${category===item.id?"bg-white text-slate-900 shadow-sm":"text-slate-600"}`}>{item.nama_kategori}</button>)}
          </div>
          {error&&<div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Katalog tidak dapat dimuat: {error}</div>}
          {loading?<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map((n)=><div key={n} className="h-[330px] animate-pulse rounded-xl bg-slate-100"/>)}</div>:
            visible.length?<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{visible.map((product)=><ProductCard key={product.id} product={product} onDetail={()=>setSelected(product)} onAdd={()=>add(product)}/>)}</div>:
            <div className="rounded-xl bg-white py-16 text-center"><div className="text-4xl">🥣</div><h2 className="mt-3 font-bold text-slate-800">{error?"Katalog belum dapat ditampilkan":"Menu belum ditemukan"}</h2><p className="mt-1 text-sm text-slate-500">{error?"Periksa koneksi database, lalu muat ulang halaman.":"Coba kata kunci atau kategori lainnya."}</p></div>}
        </section>
      </>}

      <footer id="kontak" className="mt-auto border-t border-[#dfe7fb] bg-[#eef3ff] px-5 pb-4 pt-8 text-slate-600">
        <div className="mx-auto grid max-w-7xl gap-7 pb-7 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.2fr_1.1fr] lg:gap-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-700 text-white"><Leaf size={17}/></span>{settings?.nama_instansi||"E-Katalog MBG"}</Link>
            <p className="mt-3 max-w-xs text-[10px] leading-4">Katalog pilihan makanan bergizi untuk membantu sekolah dan keluarga memilih menu dengan lebih mudah.</p>
            <div className="mt-3 flex gap-2 text-[9px]"><span className="rounded bg-white px-2 py-1">✓ Informasi Gizi</span><span className="rounded bg-white px-2 py-1">✓ Pemesanan Mudah</span></div>
          </div>
          <div><h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900">Navigasi Cepat</h3><div className="mt-3 flex flex-col gap-2 text-[10px]"><Link href="/" className="hover:text-[#ad3b00]">Home</Link><Link href="/katalog" className="hover:text-[#ad3b00]">Katalog Menu</Link><a href={whatsappHref} className="hover:text-[#ad3b00]">Hubungi via WhatsApp</a><Link href="/admin/login" className="hover:text-[#ad3b00]">Portal Admin</Link></div></div>
          <div><h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900">Kategori Menu</h3><div className="mt-3 flex flex-col gap-2 text-[10px]">{categories.slice(0,4).map((item)=><Link key={item.id} href="/katalog" className="hover:text-[#ad3b00]">{item.nama_kategori}</Link>)}{!categories.length&&<><Link href="/katalog">Paket Makan Siang</Link><Link href="/katalog">Kudapan Sehat</Link></>}</div></div>
          <div><h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900">Kontak</h3><div className="mt-3 space-y-2 text-[10px]">{settings?.alamat&&<p className="flex gap-2"><MapPin size={13} className="shrink-0 text-[#ad3b00]"/>{settings.alamat}</p>}{settings?.nomor_whatsapp&&<a href={whatsappHref} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-[#ad3b00]"><MessageCircle size={13} className="shrink-0 text-[#ad3b00]"/>+{settings.nomor_whatsapp.replace(/\D/g,"")}</a>}<p className="text-slate-500">Melayani dengan sepenuh hati.</p></div></div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 border-t border-[#dfe7fb] pt-4 text-[9px] sm:flex-row"><span>© {new Date().getFullYear()} {settings?.nama_instansi||"E-Katalog MBG"}. Hak cipta dilindungi.</span><span>Informasi menu dapat berubah sewaktu-waktu.</span></div>
      </footer>

      <button onClick={()=>setCartOpen(true)} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-xl transition hover:bg-slate-800" aria-label={`Buka keranjang, ${itemCount} item`}>
        <ShoppingBag size={16}/>Keranjang {itemCount>0&&<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c24a06] px-1 text-[10px]">{itemCount}</span>}
      </button>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}>
        <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white">
          <button onClick={() => setSelected(null)} className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 shadow"><X size={18} /></button>
          <div className="flex h-56 items-center justify-center bg-[#eff4eb] text-7xl">{selected.foto_url ? <img src={selected.foto_url} alt={selected.nama_produk} className="h-full w-full object-cover" /> : "🍱"}</div>
          <div className="p-6 md:p-8"><span className="rounded-full bg-forest-50 px-3 py-1 text-xs font-bold text-forest-700">{selected.kategori?.nama_kategori || "Menu MBG"}</span><h2 className="mt-3 text-2xl font-black">{selected.nama_produk}</h2><p className="mt-3 leading-7 text-slate-600">{selected.deskripsi}</p>
            <div className="mt-6"><h3 className="font-bold">Informasi gizi per {selected.satuan}</h3><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Kalori",selected.informasi_gizi.kalori,"kkal"],["Protein",selected.informasi_gizi.protein,"g"],["Karbohidrat",selected.informasi_gizi.karbohidrat,"g"],["Lemak",selected.informasi_gizi.lemak,"g"]].map(([label,value,unit]) => <div key={String(label)} className="rounded-xl bg-cream p-3"><small className="text-slate-500">{label}</small><b className="mt-1 block">{value} {unit}</b></div>)}</div></div>
            <div className="mt-6 flex items-center justify-between"><b className="text-xl text-forest-700">{rupiah(selected.harga)} <small className="text-sm font-normal text-slate-500">/ {selected.satuan}</small></b><button onClick={() => { add(selected); setSelected(null); setCartOpen(true); }} className="btn-primary"><Plus size={18}/> Tambah ke keranjang</button></div>
          </div>
        </div>
      </div>}

      {cartOpen && <div className="fixed inset-0 z-50 bg-slate-950/45" onMouseDown={(e) => e.target === e.currentTarget && setCartOpen(false)}>
        <aside className="ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b p-5"><div><h2 className="text-xl font-black">Keranjang belanja</h2><p className="text-sm text-slate-500">{itemCount} item pilihan</p></div><button onClick={() => setCartOpen(false)} className="rounded-full bg-slate-100 p-2"><X size={19}/></button></div>
          <div className="scrollbar-hide flex-1 space-y-4 overflow-y-auto p-5">
            {!cart.length ? <div className="py-16 text-center"><ShoppingBag className="mx-auto text-slate-300" size={40}/><p className="mt-4 font-bold">Keranjang masih kosong</p><button className="mt-4 text-sm font-bold text-forest-700" onClick={() => setCartOpen(false)}>Lihat katalog menu</button></div> : <>
              {cart.map(({ product, quantity }) => <div key={product.id} className="flex gap-3 rounded-2xl border border-slate-100 p-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#eff4eb] text-3xl">{product.foto_url ? <img src={product.foto_url} alt="" className="h-full w-full object-cover"/> : "🍱"}</div>
                <div className="min-w-0 flex-1"><b className="line-clamp-1 text-sm">{product.nama_produk}</b><p className="mt-1 text-sm font-bold text-forest-700">{rupiah(product.harga)}</p><div className="mt-2 flex items-center gap-2"><button onClick={() => adjust(product.id,-1)} className="rounded-lg border p-1"><Minus size={14}/></button><span className="w-5 text-center text-sm font-bold">{quantity}</span><button onClick={() => adjust(product.id,1)} className="rounded-lg border p-1"><Plus size={14}/></button></div></div>
                <button onClick={() => setCart((items) => items.filter((item) => item.product.id !== product.id))} className="self-start p-1 text-slate-400 hover:text-red-500" aria-label="Hapus item"><Trash2 size={17}/></button>
              </div>)}
              <div className="flex justify-between border-t pt-4 font-bold"><span>Total sementara</span><span className="text-forest-700">{rupiah(total)}</span></div>
              <form onSubmit={checkout} className="space-y-3 border-t pt-5">
                <h3 className="font-black">Data pemesan</h3>
                {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                <input required minLength={2} className="field" placeholder="Nama pemesan" value={form.nama_pemesan} onChange={(e) => setForm({...form,nama_pemesan:e.target.value})}/>
                <input className="field" placeholder="Nama sekolah (opsional)" value={form.nama_sekolah} onChange={(e) => setForm({...form,nama_sekolah:e.target.value})}/>
                <input type="tel" className="field" placeholder="Nomor telepon (opsional)" value={form.telepon_pemesan} onChange={(e) => setForm({...form,telepon_pemesan:e.target.value})}/>
                <textarea className="field min-h-20" placeholder="Catatan pesanan (opsional)" value={form.catatan} onChange={(e) => setForm({...form,catatan:e.target.value})}/>
                <button disabled={submitting} className="btn-primary w-full disabled:opacity-60">{submitting ? "Menyimpan pesanan..." : "Pesan via WhatsApp"} <ArrowRight size={17}/></button>
                <p className="text-center text-xs text-slate-400">Pesanan dicatat sebelum WhatsApp dibuka.</p>
              </form>
            </>}
          </div>
        </aside>
      </div>}
    </main>
  );
}
