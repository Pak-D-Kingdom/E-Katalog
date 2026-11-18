"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, ChevronRight, Leaf, MapPin, MessageCircle, Minus, Plus, Search, ShoppingBag, ShoppingCart, Trash2, Utensils, X } from "lucide-react";
import { api, Product, Category, rupiah } from "@/lib/types";
import Link from "next/link";

type CartItem = { product: Product; quantity: number };
type Settings = { nama_instansi: string; nomor_whatsapp: string; alamat: string | null };
type HomeOffer = {
  category: string;
  badge: string;
  sku: string;
  title: string;
  details: string[];
  priceLabel: string;
  price: string;
  unit?: string;
  image?: string;
  emoji: string;
  background: string;
};
const cartKey = "mbg-cart-v1";

const homeCategories = ["Semua Kategori", "Peralatan", "Legalitas", "Maintenance", "Bahan Baku"];
const homeOffers: HomeOffer[] = [
  {
    category: "Peralatan Dapur",
    badge: "Garansi 2 Thn",
    sku: "DK-OVN-18M",
    title: "Commercial Combi Steam Oven 10-Tray GN 1/1",
    details: ["Kapasitas: 10 Tray GN 1/1 (Gas / 18kW)", "Material: SUS 304 Thick Chamber"],
    priceLabel: "Harga Satuan B2B",
    price: "Rp 68.500.000",
    image: "/commercial-combi-steam-oven.png",
    emoji: "♨️",
    background: "from-[#d8e0de] via-[#bccac7] to-[#e9e5d8]"
  },
  {
    category: "Perizinan & Legalitas",
    badge: "Audit Terverifikasi",
    sku: "DK-SFT-HACCP",
    title: "Paket Sertifikasi HACCP & Food Safety Audit",
    details: ["Termasuk GAP Analysis & Dokumen SOP", "Pelatihan Staff Dapur (10 Orang)"],
    priceLabel: "Paket Mulai Dari",
    price: "Rp 14.500.000",
    image: "/haccp-food-safety-audit.png",
    emoji: "🧑‍🍳",
    background: "from-[#d6e5e2] via-[#c6d6d3] to-[#eee9dc]"
  },
  {
    category: "Perawatan & Maintenance",
    badge: "SLA 24 Jam",
    sku: "DK-MNT-KITCHEN",
    title: "Kontrak Maintenance & Deep Cleaning Bulanan",
    details: ["2x Kunjungan Preventif Bulanan", "Pembersihan Grease Trap & Ducting Hood"],
    priceLabel: "Langganan Rutin",
    price: "Rp 4.750.000",
    image: "/maintenance-deep-cleaning.png",
    unit: "/ bln",
    emoji: "🧰",
    background: "from-[#d9e2df] via-[#c9d4d0] to-[#e9ecdf]"
  },
  {
    category: "Bahan Baku",
    badge: "Halal & Cold-Chain",
    sku: "DK-BEEF-STRIP29",
    title: "Daging Sapi Australian Striploin MB2+ (Karton 20kg)",
    details: ["Karton Master 20 kg Vacuum Sealed", "Suhu Pengiriman: -18°C Controlled"],
    priceLabel: "Harga Grosir B2B",
    price: "Rp 3.850.000",
    image: "/daging-sapi-australian-striploin.png",
    unit: "/ karton",
    emoji: "🥩",
    background: "from-[#d5d9d4] via-[#e6d9cd] to-[#c9cfcb]"
  }
];

const homePillars = [
  {
    icon: "◉",
    title: "Bahan Baku & Food Supplies",
    badge: "Fresh & Dry",
    description: "Komoditas pangan bermutu tinggi, pasokan tepat dan terverifikasi halal, serta sembako grosir dan sanitasi kimia.",
    items: ["Bahan Kering & Sembako", "Bahan Hewani & Unggas", "Sayuran & Buah Segar", "Bumbu Kering & Rempah", "Kemasan & Food Box", "Chemical & Sanitasi"],
    action: "Lihat Pasokan Pangan"
  },
  {
    icon: "✿",
    title: "Perizinan & Legalitas",
    badge: "Audit Standard",
    description: "Pendampingan sertifikasi kelayakan hygiene dan sertifikasi tata ruang dapur industri oleh auditor resmi.",
    items: ["HACCP & ISO 22000", "ISO 45001 Keselamatan", "Sertifikasi BNSP Chef", "Pengurusan Izin IPAL", "Ducting & Epoxy Lantai", "SLF & Izin Usaha"],
    action: "Lihat Paket Perizinan"
  },
  {
    icon: "▣",
    title: "Perawatan & Servis Dapur",
    badge: "Preventif 24/7",
    description: "Kontrak inspeksi pipa gas bertekanan, servis cold-storage berkala, deep cleaning exhaust, dan penanggulangan hama.",
    items: ["Pest Control Komersial", "Pipa Gas & Sensor Kebocoran", "Servis Walk-In Chiller", "Kalibrasi Kompor Burner", "Design & Build Layout"],
    action: "Lihat Paket Servis"
  },
  {
    icon: "♨",
    title: "Peralatan Heavy Duty",
    badge: "Garansi 2 Thn",
    description: "Peralatan memasak kapasitas tinggi berbahan stainless steel food grade 304 tahan banting untuk produksi nonstop.",
    items: ["Commercial Range 4-Burner", "Combi Steam Oven", "SS Preparation Table", "Walk-in Freezer & Chiller", "Dishwasher Conveyor", "Exhaust Hood Air Flow"],
    action: "Lihat Kitchen Hardware"
  }
];

const b2bCategorySlugs = new Set([
  "peralatan-dapur",
  "bahan-baku-food-supplies",
  "perizinan-legalitas",
  "perawatan-maintenance"
]);
const b2bCategoryOrder = [
  "peralatan-dapur",
  "bahan-baku-food-supplies",
  "perizinan-legalitas",
  "perawatan-maintenance"
];
const b2bProductOrder = [
  "DK-RNG-4BOV", "DK-DFY-E24L", "DK-REF-UP4D", "DK-MIX-PL20", "DK-EXH-BF24",
  "DK-FOD-BSM58", "DK-FOD-MYK18", "DK-FOD-AYN10", "DK-SUP-BX500", "DK-SUP-GLV100",
  "DK-SRV-SLHS1", "DK-SRV-HACCP", "DK-SRV-IPAL3", "DK-SRV-ERL18",
  "DK-MNT-PEST4", "DK-MNT-GAS01", "DK-MNT-GRS92", "DK-MNT-REF34"
];
const b2bProductStatuses: Record<string, string> = {
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

function HomeOfferCard({ item, whatsappHref }: { item: HomeOffer; whatsappHref: string }) {
  const message = encodeURIComponent(`Halo DapurKita, saya ingin informasi mengenai ${item.title} (${item.sku}).`);
  const href = whatsappHref.startsWith("https://") ? `${whatsappHref}?text=${message}` : "/#kontak";

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className={`relative flex aspect-[1.25/1] items-center justify-center overflow-hidden bg-gradient-to-br ${item.background}`}>
        {item.image
          ? <img src={item.image} alt={item.title} className="absolute inset-0 h-full w-full object-cover object-[center_45%]" />
          : <>
            <span className="absolute -left-7 -top-10 h-36 w-36 rounded-full bg-white/25"/>
            <span className="absolute -bottom-12 -right-7 h-40 w-40 rounded-full bg-white/30"/>
            <span className="relative text-7xl drop-shadow-sm">{item.emoji}</span>
            <span className="absolute left-2.5 top-2.5 max-w-[65%] truncate rounded bg-white/95 px-2.5 py-1 text-[9px] font-semibold text-slate-700 shadow-sm">{item.category}</span>
            <span className="absolute right-2.5 top-2.5 rounded bg-[#dce6ff] px-2 py-1 text-[9px] font-semibold text-slate-700">{item.badge}</span>
          </>}
      </div>
      <div className="flex min-h-[205px] flex-col p-3.5">
        <p className="text-[9px] font-bold uppercase tracking-[.13em] text-slate-400">SKU: {item.sku}</p>
        <h3 className="mt-1.5 min-h-10 text-sm font-extrabold leading-5 text-slate-900">{item.title}</h3>
        <div className="mt-2 space-y-1 text-[9px] leading-4 text-slate-500">{item.details.map((detail)=><p key={detail} className="flex gap-1.5"><BadgeCheck size={11} className="mt-0.5 shrink-0 text-[#ad3b00]"/>{detail}</p>)}</div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div><small className="block text-[9px] text-slate-500">{item.priceLabel}</small><b className="text-sm font-extrabold text-[#b63d00]">{item.price}</b>{item.unit&&<small className="ml-1 text-[9px] text-slate-500">{item.unit}</small>}</div>
          <div className="flex gap-1.5">
            <a href={href} target={href.startsWith("https://")?"_blank":undefined} rel={href.startsWith("https://")?"noreferrer":undefined} className="rounded-md bg-[#e7efff] px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-[#dbe7ff]">Detail</a>
            <a href={href} target={href.startsWith("https://")?"_blank":undefined} rel={href.startsWith("https://")?"noreferrer":undefined} aria-label={`Tanya ${item.title}`} className="flex h-8 w-8 items-center justify-center rounded-md bg-[#ad3b00] text-white hover:bg-[#8e3000]"><ShoppingCart size={15}/></a>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductCard({ product, onDetail, onAdd }: { product: Product; onDetail: () => void; onAdd: () => void }) {
  const status = b2bProductStatuses[product.kode_produk] || (product.tersedia ? "Ready Stock" : "Tidak Tersedia");
  return (
    <article className="group overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <button onClick={onDetail} className="relative block aspect-[1.25/1] w-full overflow-hidden bg-[#edf2ff] text-left">
        {product.foto_url
          ? <img src={product.foto_url} alt={product.nama_produk} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          : <span className="sr-only">Foto produk belum tersedia</span>}
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
        <div className="mt-auto pt-2">
          <small className="block text-[8px] text-slate-500">Harga Satuan B2B</small>
          <b className="block text-base font-extrabold leading-5 text-[#b63d00]">{rupiah(product.harga)}</b>
          <div className="mt-1.5 grid grid-cols-[1fr_1.2fr] gap-1">
            <button onClick={onDetail} className="inline-flex items-center justify-center gap-1 rounded bg-[#e7efff] px-2 py-1.5 text-[8px] font-bold text-slate-700 hover:bg-[#dbe7ff]"><Search size={10}/>Detail</button>
            <button onClick={onAdd} aria-label={`Tambah ${product.nama_produk} ke keranjang`} className="inline-flex items-center justify-center gap-1 rounded bg-[#ad3b00] px-2 py-1.5 text-[8px] font-bold text-white hover:bg-[#8e3000]"><ShoppingCart size={10}/>Keranjang</button>
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
  const [homeCategory, setHomeCategory] = useState("Semua Kategori");
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("recommended");
  const [loading, setLoading] = useState(page === "catalog");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nama_pemesan: "", nama_sekolah: "", telepon_pemesan: "", catatan: "" });

  useEffect(() => {
    setLoading(page === "catalog");
    const requests: Promise<void>[] = [];
    if (page === "catalog") {
      requests.push(
        api<{ pengaturan: Settings | null }>("/api/pengaturan")
        .then(({ pengaturan }) => setSettings(pengaturan))
          .catch((e: Error) => setError(e.message)),
        Promise.all([
          api<{ produk: Product[] }>("/api/produk"),
          api<{ kategori: Category[] }>("/api/kategori")
        ]).then(([p, c]) => {
          setProducts(p.produk);
          setCategories(c.kategori);
        }).catch((e: Error) => setError(e.message))
      );
    }
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

  const catalogCategories = categories
    .filter((item) => b2bCategorySlugs.has(item.slug))
    .sort((a, b) => b2bCategoryOrder.indexOf(a.slug) - b2bCategoryOrder.indexOf(b.slug));
  const b2bProducts = products.filter((product) => product.kategori?.slug && b2bCategorySlugs.has(product.kategori.slug));
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = b2bProducts.filter((p) => {
      const price = Number(p.harga);
      const status = b2bProductStatuses[p.kode_produk] || (p.tersedia ? "Ready Stock" : "Tidak Tersedia");
      const inPriceRange =
        priceRange === "all" ||
        (priceRange === "under-1m" && price < 1000000) ||
        (priceRange === "1m-5m" && price >= 1000000 && price < 5000000) ||
        (priceRange === "5m-15m" && price >= 5000000 && price < 15000000) ||
        (priceRange === "over-15m" && price >= 15000000);
      return (category === null || p.kategori_id === category) &&
      (!query || `${p.nama_produk} ${p.kode_produk} ${p.deskripsi}`.toLowerCase().includes(query)) &&
      inPriceRange &&
      (availabilityFilter === "all" || status === availabilityFilter)
    });
    if (sortOrder === "price-asc") filtered.sort((a, b) => Number(a.harga) - Number(b.harga));
    else if (sortOrder === "price-desc") filtered.sort((a, b) => Number(b.harga) - Number(a.harga));
    else if (sortOrder === "name") filtered.sort((a, b) => a.nama_produk.localeCompare(b.nama_produk));
    else filtered.sort((a, b) => b2bProductOrder.indexOf(a.kode_produk) - b2bProductOrder.indexOf(b.kode_produk));
    return filtered;
  }, [b2bProducts, category, search, priceRange, availabilityFilter, sortOrder]);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + Number(item.product.harga) * item.quantity, 0);
  const featuredHomeOffers = homeCategory === "Semua Kategori"
    ? homeOffers
    : homeOffers.filter((item) => item.category.toLowerCase().includes(homeCategory.toLowerCase()));
  const whatsappHref = page === "home"
    ? "https://wa.me/622155578900"
    : settings?.nomor_whatsapp
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
          <Link href="/" aria-label="Beranda DapurKita" className="order-1 flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-700 text-white"><Leaf size={21}/></span>
            <span><b className="block text-sm leading-tight text-slate-900">DapurKita</b><small className="block text-[9px] leading-3 text-slate-500">Kitchen Supply</small><small className="block text-[8px] leading-3 text-slate-500">& B2B Solutions</small></span>
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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dce6ff] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-600"><BadgeCheck size={12} className="text-[#b63d00]"/> KATALOG UNGGULAN B2B</span>
                <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-4xl">Produk & Layanan Paling Diminati</h1>
                <p className="mt-2 max-w-xl text-xs leading-5 text-slate-600 sm:text-sm">Peralatan bersertifikasi, paket legalitas instan, kontrak servis dapur, dan pasokan bahan pokok siap kirim.</p>
              </div>
              <div className="scrollbar-hide flex max-w-full gap-1 overflow-x-auto rounded-lg bg-[#e5edff] p-1">
                {homeCategories.map((item) => <button key={item} onClick={() => setHomeCategory(item)} className={`shrink-0 rounded-md px-3 py-2 text-[10px] font-semibold ${homeCategory === item ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:bg-white/60"}`}>{item}</button>)}
              </div>
            </div>
            {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map((n) => <div key={n} className="h-[330px] animate-pulse rounded-xl bg-white/80"/> )}</div> :
              featuredHomeOffers.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {featuredHomeOffers.map((item) => <HomeOfferCard key={item.sku} item={item} whatsappHref={whatsappHref}/>)}
              </div> : <div className="rounded-xl border border-white bg-white/80 px-5 py-12 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff4e8] text-[#ad3b00]"><Utensils size={22}/></span>
                <h2 className="mt-3 font-bold text-slate-800">Produk tidak ditemukan</h2>
                <p className="mt-1 text-sm text-slate-500">Pilih kategori lain untuk melihat produk dan layanan.</p>
              </div>
            }
            <div className="mt-7 flex justify-center">
              <Link href="/katalog" className="inline-flex items-center gap-2 rounded-md bg-[#ad3b00] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#8f3000]"><ShoppingBag size={13}/> Lihat Semua Produk & Layanan <ArrowRight size={15}/></Link>
            </div>
          </div>
        </section>

        <section className="bg-[#f8f9ff]">
          <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
            <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_.8fr] lg:gap-12">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dce6ff] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-600"><BadgeCheck size={12} className="text-[#b63d00]"/> PLATFORM PENGADAAN KOMERSIAL TERPADU</span>
                <h2 className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-4xl">Solusi Lengkap untuk Setiap Kebutuhan <span className="text-[#ad3b00]">Dapur Profesional</span></h2>
                <p className="mt-3 max-w-xl text-xs leading-5 text-slate-600 sm:text-sm">Mitra pengadaan B2B terpercaya untuk restoran, hotel, catering, dan cloud kitchen di seluruh Indonesia. Dari pasokan bahan baku segar, sertifikasi HACCP berlisensi, instalasi peralatan berat, hingga servis preventif terencana.</p>
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["500+","Dapur Terlayani"],
                    ["99.4%","On-Time Delivery"],
                    ["ISO & HACCP","Certified Partner"],
                    ["4.8 ⭐","Rating Kepuasan"]
                  ].map(([value,label])=><div key={label} className="rounded-lg bg-[#eef3ff] p-3"><b className="block text-sm font-black text-[#ad3b00]">{value}</b><small className="mt-1 block text-[9px] text-slate-600">{label}</small></div>)}
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="relative flex aspect-[1.35/1] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#dce9d5] via-[#f2e7ca] to-[#e9effb]">
                <img src="/horeca-standardisasi.png" alt="Standarisasi HORECA Pro" className="absolute inset-0 h-full w-full object-cover"/>
                  <span className="absolute left-3 top-2 text-[7px] text-slate-500">DapurKita - Horeca & Leading Pros</span>
                  <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-white/95 px-3 py-2 shadow"><span><b className="block text-[11px] text-slate-800">Standarisasi HORECA Pro</b><small className="text-[9px] text-slate-500">Grade SUS 304 & Halal Supply Chain</small></span><span className="rounded bg-[#dfe8ff] px-2 py-1 text-[9px] font-bold text-slate-700">Aktif</span></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f8f9ff] pb-12">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div><p className="text-[9px] font-bold uppercase tracking-widest text-[#ad3b00]">INFRASTRUKTUR PENGADAAN LENGKAP</p><h2 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">4 Pilar Utama Solusi Dapur Komersial</h2><p className="mt-1 max-w-xl text-xs leading-5 text-slate-600">Dukungan hulu ke hilir untuk menjamin kepatuhan sanitasi, kelancaran operasional harian, dan keandalan alat pemanas maupun pendingin berdaya tinggi.</p></div>
              <Link href="/katalog" className="hidden items-center gap-1 pb-1 text-[11px] font-bold text-[#ad3b00] sm:flex">Buka Seluruh Katalog B2B <ArrowRight size={14}/></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {homePillars.map((item)=><article key={item.title} className="flex min-h-[265px] flex-col rounded-xl bg-white p-4 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff4e8] text-lg font-bold text-[#ad3b00]">{item.icon}</span>
                <h3 className="mt-3 text-sm font-extrabold text-slate-900">{item.title}</h3>
                <span className="mt-1 w-fit rounded bg-[#e7efff] px-2 py-1 text-[9px] text-slate-600">{item.badge}</span>
                <p className="mt-2 min-h-12 text-[10px] leading-4 text-slate-500">{item.description}</p>
                <div className="mb-4 mt-2 flex flex-col gap-1">{item.items.map((tag)=><span key={tag} className="w-fit rounded bg-[#eef3ff] px-1.5 py-1 text-[8px] font-medium text-slate-600">{tag}</span>)}</div>
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="mt-auto flex items-center justify-between rounded-md bg-[#e7efff] px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-[#dbe7ff]">{item.action}<ChevronRight size={13}/></a>
              </article>)}
            </div>
          </div>
        </section>
      </> : <>
        <section className="border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-5 pb-7 pt-8 lg:px-8 lg:pb-9 lg:pt-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8eeff] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-600"><BadgeCheck size={12} className="text-[#b63d00]"/> B2B HORECA PROCUREMENT CATALOGUE 2025</span>
            <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div><h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Katalog Pengadaan Dapur Profesional</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Solusi pengadaan terintegrasi untuk kebutuhan dapur komersial, hotel, restoran, dan catering.</p></div>
              <div className="grid grid-cols-2 gap-2 text-[9px] sm:min-w-[310px]">
                <div className="rounded-lg border border-slate-100 bg-[#f7f8ff] p-3"><b className="block text-slate-800">Pengiriman Nasional</b><span className="mt-1 block text-slate-500">Armada terjadwal & terlacak</span></div>
                <div className="rounded-lg border border-slate-100 bg-[#f7f8ff] p-3"><b className="block text-slate-800">Faktur Pajak</b><span className="mt-1 block text-slate-500">Transaksi bisnis resmi</span></div>
              </div>
            </div>
          </div>
        </section>
        <section id="katalog" className="mx-auto w-full max-w-7xl flex-1 px-5 py-7 lg:px-8 lg:py-9">
          <div className="grid gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr_1fr] lg:p-4">
            <label className="relative block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e)=>setSearch(e.target.value)} className="field h-10 border-slate-200 pl-9 text-xs" placeholder="Cari nama produk, kode SKU..."/></label>
            <select value={priceRange} onChange={(e)=>setPriceRange(e.target.value)} className="field h-10 border-slate-200 text-xs"><option value="all">Semua Rentang Harga</option><option value="under-1m">Di bawah Rp 1 juta</option><option value="1m-5m">Rp 1–5 juta</option><option value="5m-15m">Rp 5–15 juta</option><option value="over-15m">Di atas Rp 15 juta</option></select>
            <select value={availabilityFilter} onChange={(e)=>setAvailabilityFilter(e.target.value)} className="field h-10 border-slate-200 text-xs"><option value="all">Semua Status</option><option value="Ready Stock">Ready Stock</option><option value="Indent 7 Hari">Indent 7 Hari</option><option value="Layanan Resmi">Layanan Resmi</option><option value="Layanan Rutin">Layanan Rutin</option></select>
            <select value={sortOrder} onChange={(e)=>setSortOrder(e.target.value)} className="field h-10 border-slate-200 text-xs"><option value="recommended">Urutkan: Rekomendasi</option><option value="price-asc">Harga: Terendah</option><option value="price-desc">Harga: Tertinggi</option><option value="name">Nama: A–Z</option></select>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <button onClick={()=>setCategory(null)} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left ${category===null?"border-[#b8c8f5] bg-[#eef3ff]":"border-slate-100 bg-white hover:bg-slate-50"}`}><span className="text-[10px] font-bold text-slate-800">Semua Kategori</span><span className="rounded bg-white px-2 py-1 text-[9px] text-slate-500">{b2bProducts.length}</span></button>
            {catalogCategories.map((item)=><button key={item.id} onClick={()=>setCategory(item.id)} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left ${category===item.id?"border-[#b8c8f5] bg-[#eef3ff]":"border-slate-100 bg-white hover:bg-slate-50"}`}><span className="truncate text-[10px] font-bold text-slate-800">{item.nama_kategori}</span><span className="ml-2 rounded bg-white px-2 py-1 text-[9px] text-slate-500">{b2bProducts.filter((product)=>product.kategori_id===item.id).length}</span></button>)}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">Populer:</span>
            {popularTags.map((tag)=><button key={tag} onClick={()=>{setSearch(popularTagQueries[tag]);setCategory(null);}} className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-medium text-slate-600 hover:border-[#b8c8f5] hover:text-[#ad3b00]">{tag}</button>)}
            <span className="ml-auto text-[10px] text-slate-500">{loading ? "Memuat katalog..." : `${visible.length} produk & layanan`}</span>
          </div>
          {error&&<div role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Katalog tidak dapat dimuat: {error}</div>}
          {loading?<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{[1,2,3,4,5,6,7,8,9,10].map((n)=><div key={n} className="aspect-[.8/1] animate-pulse rounded-lg bg-slate-100"/>)}</div>:
            visible.length?<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{visible.map((product)=><ProductCard key={product.id} product={product} onDetail={()=>setSelected(product)} onAdd={()=>add(product)}/>)}</div>:
            <div className="mt-4 rounded-xl bg-white py-16 text-center"><div className="text-4xl">⌕</div><h2 className="mt-3 font-bold text-slate-800">{error?"Katalog belum dapat ditampilkan":"Produk tidak ditemukan"}</h2><p className="mt-1 text-sm text-slate-500">{error?"Periksa koneksi database, lalu muat ulang halaman.":"Sesuaikan kata kunci atau filter untuk melihat produk lainnya."}</p></div>}
        </section>
      </>}

      <footer id="kontak" className="mt-auto border-t border-[#dfe7fb] bg-[#eef3ff] px-5 pb-4 pt-8 text-slate-600">
        <div className="mx-auto grid max-w-7xl gap-7 pb-7 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.2fr_1.1fr] lg:gap-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-700 text-white"><Leaf size={17}/></span>DapurKita</Link>
            <p className="mt-3 max-w-xs text-[10px] leading-4">Penyedia solusi terintegrasi pengadaan perlengkapan dapur komersial, bahan baku horeca, sertifikasi kelayakan, dan servis preventif untuk industri perhotelan dan kuliner nasional.</p>
            <div className="mt-3 flex gap-2 text-[9px]"><span className="rounded bg-white px-2 py-1">◉ ISO 9001:2015</span><span className="rounded bg-white px-2 py-1">◈ HACCP Compliant</span></div>
          </div>
          <div><h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900">NAVIGASI CEPAT</h3><div className="mt-3 flex flex-col gap-2 text-[10px]"><Link href="/" className="hover:text-[#ad3b00]">Home Utama</Link><Link href="/katalog" className="hover:text-[#ad3b00]">Katalog Peralatan</Link><a href={whatsappHref} target="_blank" rel="noreferrer" className="hover:text-[#ad3b00]">Hubungi Tim B2B</a><Link href="/admin/login" className="hover:text-[#ad3b00]">Portal Operasional Admin</Link></div></div>
          <div><h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900">KATEGORI PASOKAN</h3><div className="mt-3 flex flex-col gap-2 text-[10px]"><a href={whatsappHref} className="hover:text-[#ad3b00]">Bahan Baku & Pangan Komersial</a><a href={whatsappHref} className="hover:text-[#ad3b00]">Perizinan & Legalitas Usaha</a><a href={whatsappHref} className="hover:text-[#ad3b00]">Perawatan & Maintenance Dapur</a><a href={whatsappHref} className="hover:text-[#ad3b00]">Peralatan Dapur & Heavy Duty</a></div></div>
          <div><h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-900">HEAD OFFICE</h3><div className="mt-3 space-y-2 text-[10px]"><p className="flex gap-2"><MapPin size={13} className="shrink-0 text-[#ad3b00]"/>Kawasan SCBD Lot 8, Jl. Jendral Sudirman, Jakarta Selatan 12190</p><a href="tel:+622155578900" className="flex gap-2 hover:text-[#ad3b00]"><MessageCircle size={13} className="shrink-0 text-[#ad3b00]"/>+62 21 5557 8900</a><a href="mailto:procurement@dapurkita.co.id" className="flex gap-2 hover:text-[#ad3b00]">✉ procurement@dapurkita.co.id</a></div></div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 border-t border-[#dfe7fb] pt-4 text-[9px] sm:flex-row"><span>© 2025 PT DapurKita Solusi Kuliner Internasional. Hak Cipta Dilindungi Undang-Undang.</span><span className="flex gap-4"><a href="#kontak">Kebijakan Privasi B2B</a><a href="#kontak">Syarat & Ketentuan</a></span></div>
      </footer>

      <button onClick={()=>setCartOpen(true)} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-xl transition hover:bg-slate-800" aria-label={`Buka keranjang, ${itemCount} item`}>
        <ShoppingBag size={16}/>Keranjang RFQ {itemCount>0&&<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c24a06] px-1 text-[10px]">{itemCount}</span>}
      </button>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}>
        <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white">
          <button onClick={() => setSelected(null)} className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 shadow"><X size={18} /></button>
          <div className="flex h-56 items-center justify-center overflow-hidden bg-[#edf2ff]">{selected.foto_url && <img src={selected.foto_url} alt={selected.nama_produk} className="h-full w-full object-cover" />}</div>
          <div className="p-6 md:p-8"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#e8eeff] px-3 py-1 text-xs font-bold text-slate-700">{selected.kategori?.nama_kategori || "Produk & layanan"}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{b2bProductStatuses[selected.kode_produk] || "Ready Stock"}</span></div><p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">SKU: {selected.kode_produk}</p><h2 className="mt-2 text-2xl font-black">{selected.nama_produk}</h2><p className="mt-3 leading-7 text-slate-600">{selected.deskripsi}</p>
            <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-100 pt-5"><div><small className="block text-xs text-slate-500">Harga per {selected.satuan}</small><b className="mt-1 block text-2xl text-[#ad3b00]">{rupiah(selected.harga)}</b></div><button onClick={() => { add(selected); setSelected(null); setCartOpen(true); }} className="btn-primary"><Plus size={18}/> Tambah ke keranjang</button></div>
          </div>
        </div>
      </div>}

      {cartOpen && <div className="fixed inset-0 z-50 bg-slate-950/45" onMouseDown={(e) => e.target === e.currentTarget && setCartOpen(false)}>
        <aside className="ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b p-5"><div><h2 className="text-xl font-black">Permintaan Pengadaan</h2><p className="text-sm text-slate-500">{itemCount} item dipilih</p></div><button onClick={() => setCartOpen(false)} className="rounded-full bg-slate-100 p-2"><X size={19}/></button></div>
          <div className="scrollbar-hide flex-1 space-y-4 overflow-y-auto p-5">
            {!cart.length ? <div className="py-16 text-center"><ShoppingBag className="mx-auto text-slate-300" size={40}/><p className="mt-4 font-bold">Belum ada produk dipilih</p><button className="mt-4 text-sm font-bold text-forest-700" onClick={() => setCartOpen(false)}>Lihat katalog</button></div> : <>
              {cart.map(({ product, quantity }) => <div key={product.id} className="flex gap-3 rounded-2xl border border-slate-100 p-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#eff4eb] text-3xl">{product.foto_url ? <img src={product.foto_url} alt="" className="h-full w-full object-cover"/> : "🍱"}</div>
                <div className="min-w-0 flex-1"><b className="line-clamp-1 text-sm">{product.nama_produk}</b><p className="mt-1 text-sm font-bold text-forest-700">{rupiah(product.harga)}</p><div className="mt-2 flex items-center gap-2"><button onClick={() => adjust(product.id,-1)} className="rounded-lg border p-1"><Minus size={14}/></button><span className="w-5 text-center text-sm font-bold">{quantity}</span><button onClick={() => adjust(product.id,1)} className="rounded-lg border p-1"><Plus size={14}/></button></div></div>
                <button onClick={() => setCart((items) => items.filter((item) => item.product.id !== product.id))} className="self-start p-1 text-slate-400 hover:text-red-500" aria-label="Hapus item"><Trash2 size={17}/></button>
              </div>)}
              <div className="flex justify-between border-t pt-4 font-bold"><span>Total sementara</span><span className="text-forest-700">{rupiah(total)}</span></div>
              <form onSubmit={checkout} className="space-y-3 border-t pt-5">
                <h3 className="font-black">Data perusahaan / pemesan</h3>
                {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                <input required minLength={2} className="field" placeholder="Nama PIC pemesan" value={form.nama_pemesan} onChange={(e) => setForm({...form,nama_pemesan:e.target.value})}/>
                <input className="field" placeholder="Nama perusahaan / instansi (opsional)" value={form.nama_sekolah} onChange={(e) => setForm({...form,nama_sekolah:e.target.value})}/>
                <input type="tel" className="field" placeholder="Nomor WhatsApp (opsional)" value={form.telepon_pemesan} onChange={(e) => setForm({...form,telepon_pemesan:e.target.value})}/>
                <textarea className="field min-h-20" placeholder="Catatan permintaan (opsional)" value={form.catatan} onChange={(e) => setForm({...form,catatan:e.target.value})}/>
                <button disabled={submitting} className="btn-primary w-full disabled:opacity-60">{submitting ? "Menyimpan permintaan..." : "Kirim Permintaan via WhatsApp"} <ArrowRight size={17}/></button>
                <p className="text-center text-xs text-slate-400">Permintaan dicatat sebelum WhatsApp dibuka.</p>
              </form>
            </>}
          </div>
        </aside>
      </div>}
    </main>
  );
}
