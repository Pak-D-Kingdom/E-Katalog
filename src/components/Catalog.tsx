"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BadgeCheck, ChevronRight, Layers3, Leaf, MapPin, MessageCircle, Minus, PackageOpen, Plus, Search, ShoppingBag, ShoppingCart, SlidersHorizontal, Trash2, Utensils, X } from "lucide-react";
import { api, Product, Category, rupiah, slugify } from "@/lib/types";
import Link from "next/link";

type CartItem = { product: Product; quantity: number };
type HomeCartItem = { offer: HomeOffer; quantity: number };
type Settings = { nama_instansi: string; nomor_whatsapp: string; alamat: string | null };
type FlyingItem = { key: number; left: number; top: number; x: number; y: number; foto_url: string | null };
type HomeOffer = {
  category: string;
  badge: string;
  sku: string;
  title: string;
  details: string[];
  priceLabel: string;
  price: string;
  priceValue: number;
  unit?: string;
  image: string;
  overlayBadges?: boolean;
  emoji?: string;
  background?: string;
};
const cartKey = "mbg-cart-v1";
const homeCartKey = "dapurkita-rfq-v1";

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
    priceValue: 68500000,
    image: "/commercial-combi-steam-oven.png"
  },
  {
    category: "Perizinan & Legalitas",
    badge: "Audit Terverifikasi",
    sku: "DK-SFT-HACCP",
    title: "Paket Sertifikasi HACCP & Food Safety Audit",
    details: ["Termasuk GAP Analysis & Dokumen SOP", "Pelatihan Staff Dapur (10 Orang)"],
    priceLabel: "Paket Mulai Dari",
    price: "Rp 14.500.000",
    priceValue: 14500000,
    image: "/haccp-food-safety-audit.png"
  },
  {
    category: "Perawatan & Maintenance",
    badge: "SLA 24 Jam",
    sku: "DK-MNT-KITCHEN",
    title: "Kontrak Maintenance & Deep Cleaning Bulanan",
    details: ["2x Kunjungan Preventif Bulanan", "Pembersihan Grease Trap & Ducting Hood"],
    priceLabel: "Langganan Rutin",
    price: "Rp 4.750.000",
    priceValue: 4750000,
    unit: "/ bln",
    image: "/maintenance-deep-cleaning.png",
    overlayBadges: true
  },
  {
    category: "Bahan Baku",
    badge: "Halal & Cold-Chain",
    sku: "DK-BEEF-STRIP29",
    title: "Daging Sapi Australian Striploin MB2+ (Karton 20kg)",
    details: ["Karton Master 20 kg Vacuum Sealed", "Suhu Pengiriman: -18°C Controlled"],
    priceLabel: "Harga Grosir B2B",
    price: "Rp 3.850.000",
    priceValue: 3850000,
    unit: "/ karton",
    image: "/daging-sapi-australian-striploin.png"
  }
];

const homePillars = [
  {
    icon: "◉",
    title: "Bahan Baku & Food Supplies",
    categorySlug: "bahan-baku-food-supplies",
    badge: "Fresh & Dry",
    description: "Komoditas pangan bermutu tinggi, pasokan tepat dan terverifikasi halal, serta sembako grosir dan sanitasi kimia.",
    items: ["Bahan Kering & Sembako", "Bahan Hewani & Unggas", "Sayuran & Buah Segar", "Bumbu Kering & Rempah", "Kemasan & Food Box", "Chemical & Sanitasi"],
    action: "Lihat Pasokan Pangan"
  },
  {
    icon: "✿",
    title: "Perizinan & Legalitas",
    categorySlug: "perizinan-legalitas",
    badge: "Audit Standard",
    description: "Pendampingan sertifikasi kelayakan hygiene dan sertifikasi tata ruang dapur industri oleh auditor resmi.",
    items: ["HACCP & ISO 22000", "ISO 45001 Keselamatan", "Sertifikasi BNSP Chef", "Pengurusan Izin IPAL", "Ducting & Epoxy Lantai", "SLF & Izin Usaha"],
    action: "Lihat Paket Perizinan"
  },
  {
    icon: "▣",
    title: "Perawatan & Servis Dapur",
    categorySlug: "perawatan-maintenance",
    badge: "Preventif 24/7",
    description: "Kontrak inspeksi pipa gas bertekanan, servis cold-storage berkala, deep cleaning exhaust, dan penanggulangan hama.",
    items: ["Pest Control Komersial", "Pipa Gas & Sensor Kebocoran", "Servis Walk-In Chiller", "Kalibrasi Kompor Burner", "Design & Build Layout"],
    action: "Lihat Paket Servis"
  },
  {
    icon: "♨",
    title: "Peralatan Heavy Duty",
    categorySlug: "peralatan-dapur",
    badge: "Garansi 2 Thn",
    description: "Peralatan memasak kapasitas tinggi berbahan stainless steel food grade 304 tahan banting untuk produksi nonstop.",
    items: ["Commercial Range 4-Burner", "Combi Steam Oven", "SS Preparation Table", "Walk-in Freezer & Chiller", "Dishwasher Conveyor", "Exhaust Hood Air Flow"],
    action: "Lihat Kitchen Hardware"
  }
];

function HomeOfferCard({ item, onDetail, onAdd }: { item: HomeOffer; onDetail: () => void; onAdd: () => void }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-[1.4/1] overflow-hidden bg-[#e7edf4]">
        <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
        {item.overlayBadges && <>
          <span className="absolute left-2.5 top-2.5 rounded bg-white/95 px-2 py-1 text-[9px] font-semibold text-slate-700 shadow-sm">{item.category}</span>
          <span className="absolute right-2.5 top-2.5 rounded bg-white/95 px-2 py-1 text-[9px] font-semibold text-slate-700 shadow-sm">{item.badge}</span>
        </>}
      </div>
      <div className="flex min-h-[185px] flex-col p-3">
        <p className="text-[8px] font-bold uppercase tracking-[.13em] text-slate-500">SKU: {item.sku}</p>
        <h3 className="mt-1.5 min-h-9 text-[12px] font-extrabold leading-4 text-slate-900">{item.title}</h3>
        <div className="mt-1.5 space-y-1 text-[8px] leading-3.5 text-slate-600">
          {item.details.map((detail) => <p key={detail} className="flex gap-1.5"><BadgeCheck size={10} className="mt-0.5 shrink-0 text-[#ad3b00]"/>{detail}</p>)}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0"><small className="block text-[8px] text-slate-500">{item.priceLabel}</small><b className="text-sm font-extrabold text-[#b63d00]">{item.price}</b>{item.unit && <small className="ml-1 text-[8px] text-slate-500">{item.unit}</small>}</div>
          <div className="flex shrink-0 gap-1.5">
            <button type="button" onClick={onDetail} className="rounded bg-[#e7efff] px-4 py-1.5 text-[9px] font-bold text-slate-700 hover:bg-[#dbe7ff]">Detail</button>
            <button type="button" onClick={onAdd} aria-label={`Tambah ${item.title} ke keranjang`} className="flex h-7 w-8 items-center justify-center rounded bg-[#ad3b00] text-white hover:bg-[#8e3000]"><ShoppingCart size={13}/></button>
          </div>
        </div>
      </div>
    </article>
  );
}

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

function ProductCard({ product, onDetail, onAdd }: { product: Product; onDetail: () => void; onAdd: (source: HTMLElement) => void }) {
  const status = b2bProductStatuses[product.kode_produk] || (product.tersedia ? "Ready Stock" : "Tidak Tersedia");
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

export default function Catalog({ page = "home" }: { page?: "home" | "catalog" }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [homeCart, setHomeCart] = useState<HomeCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedHomeOffer, setSelectedHomeOffer] = useState<HomeOffer | null>(null);
  const [category, setCategory] = useState<number | null>(null);
  const [requestedCategory, setRequestedCategory] = useState<string | null>(null);
  const [homeCategory, setHomeCategory] = useState("Semua Kategori");
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("recommended");
  const [loading, setLoading] = useState(page === "catalog");
  const [cartInitialized, setCartInitialized] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nama_pemesan: "", nama_sekolah: "", telepon_pemesan: "", catatan: "" });
  const [flyingItem, setFlyingItem] = useState<FlyingItem | null>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const flyingKeyRef = useRef(0);

  useEffect(() => {
    setLoading(page === "catalog");
    const requests: Promise<void>[] = [];
    if (page === "catalog") {
      setRequestedCategory(new URLSearchParams(window.location.search).get("kategori"));
    }
    requests.push(
      api<{ pengaturan: Settings | null }>("/api/pengaturan")
        .then(({ pengaturan }) => setSettings(pengaturan))
        .catch((e: Error) => setError(e.message))
    );
    if (page === "catalog") {
      requests.push(
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
    if (page === "home") {
      try {
        const saved = JSON.parse(localStorage.getItem(homeCartKey) || "[]") as Array<{ offer?: { sku?: string }; quantity?: number }>;
        if (Array.isArray(saved)) {
          const restored: HomeCartItem[] = [];
          for (const item of saved) {
            const offer = homeOffers.find((candidate) => candidate.sku === item?.offer?.sku);
            if (offer && typeof item.quantity === "number" && Number.isInteger(item.quantity) && item.quantity > 0) {
              restored.push({ offer, quantity: item.quantity });
            }
          }
          setHomeCart(restored);
        }
      } catch {
        localStorage.removeItem(homeCartKey);
      }
    }
    setCartInitialized(true);
  }, [page]);

  useEffect(() => {
    if (!requestedCategory) return;
    const match = categories.find((item) =>
      item.slug === requestedCategory || slugify(item.nama_kategori) === requestedCategory
    );
    setCategory(match?.id ?? null);
  }, [categories, requestedCategory]);

  const catalogCategories = categories
    .filter((item) => b2bCategorySlugs.has(item.slug))
    .sort((a, b) => b2bCategoryOrder.indexOf(a.slug) - b2bCategoryOrder.indexOf(b.slug));
  const b2bProducts = products.filter((product) => product.kategori?.slug && b2bCategorySlugs.has(product.kategori.slug));
  useEffect(() => {
    if (cartInitialized) {
      localStorage.setItem(cartKey, JSON.stringify(cart));
      if (page === "home") localStorage.setItem(homeCartKey, JSON.stringify(homeCart));
    }
  }, [cart, homeCart, cartInitialized, page]);

  const requestedCategoryMissing = Boolean(requestedCategory) && !loading && category === null &&
    !categories.some((item) =>
      item.slug === requestedCategory || slugify(item.nama_kategori) === requestedCategory
    );
  const visible = useMemo(() => {
    if (requestedCategoryMissing) return [];
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
      (availabilityFilter === "all" ||
        (availabilityFilter === "available" && p.tersedia) ||
        (availabilityFilter === "unavailable" && !p.tersedia) ||
        status === availabilityFilter)
    });
    if (sortOrder === "price-asc") filtered.sort((a, b) => Number(a.harga) - Number(b.harga));
    else if (sortOrder === "price-desc") filtered.sort((a, b) => Number(b.harga) - Number(a.harga));
    else if (sortOrder === "name") filtered.sort((a, b) => a.nama_produk.localeCompare(b.nama_produk));
    else filtered.sort((a, b) => b2bProductOrder.indexOf(a.kode_produk) - b2bProductOrder.indexOf(b.kode_produk));
    return filtered;
  }, [b2bProducts, category, search, priceRange, availabilityFilter, sortOrder, requestedCategoryMissing]);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + Number(item.product.harga) * item.quantity, 0);
  const homeItemCount = homeCart.reduce((sum, item) => sum + item.quantity, 0);
  const homeTotal = homeCart.reduce((sum, item) => sum + item.offer.priceValue * item.quantity, 0);
  const featuredHomeOffers = homeCategory === "Semua Kategori"
    ? homeOffers
    : homeOffers.filter((item) => item.category.toLowerCase().includes(homeCategory.toLowerCase()));
  const whatsappNumber = settings?.nomor_whatsapp.replace(/\D/g, "");
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : page === "home" ? "https://wa.me/622155578900" : "/#kontak";

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

  function addHomeOffer(offer: HomeOffer) {
    setHomeCart((items) => {
      const current = items.find((item) => item.offer.sku === offer.sku);
      return current
        ? items.map((item) => item.offer.sku === offer.sku ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { offer, quantity: 1 }];
    });
  }

  function adjustHomeOffer(sku: string, delta: number) {
    setHomeCart((items) => items.map((item) => item.offer.sku === sku ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0));
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

  function checkoutHome(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!homeCart.length) return;
    setSubmitting(true);
    const itemLines = homeCart.map(({ offer, quantity }) => {
      const subtotal = offer.priceValue * quantity;
      return `- ${offer.title} [${offer.sku}] x${quantity} @ ${rupiah(offer.priceValue)} = ${rupiah(subtotal)}`;
    }).join("\n");
    const text = [
      `Halo DapurKita, saya ${form.nama_pemesan} dari ${form.nama_sekolah || "-"} ingin meminta penawaran:`,
      `Nomor telepon: ${form.telepon_pemesan || "-"}`,
      "",
      "Rangkuman pilihan:",
      itemLines,
      `Total estimasi: ${rupiah(homeTotal)}`,
      `Catatan: ${form.catatan || "-"}`,
      `Kode permintaan: DK-${Date.now()}`
    ].join("\n");
    localStorage.removeItem(homeCartKey);
    setHomeCart([]);
    window.location.assign(`${whatsappHref}?text=${encodeURIComponent(text)}`);
  }

  return (
    <main className={`flex min-h-screen flex-col ${page === "catalog" ? "bg-[#f7f8ff]" : ""}`}>
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-3 px-5 py-3 lg:px-8">
          <Link href="/" aria-label="Beranda DapurKita" className="order-1 flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-700 text-white"><Leaf size={21}/></span>
            <span><b className="block text-sm leading-tight text-slate-900">DapurKita</b><small className="block text-[9px] leading-3 text-slate-500">Kitchen Supply</small><small className="block text-[8px] leading-3 text-slate-500">& B2B Solutions</small></span>
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
          <div className="mx-auto max-w-7xl px-5 pb-8 pt-7 lg:px-8 lg:pb-10 lg:pt-9">
            <div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dce6ff] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-600"><BadgeCheck size={12} className="text-[#b63d00]"/> KATALOG UNGGULAN B2B</span>
                <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-4xl">Produk &amp; Layanan Paling Diminati</h1>
                <p className="mt-2 max-w-xl text-xs leading-5 text-slate-600 sm:text-sm">Peralatan bersertifikasi, paket legalitas instan, kontrak servis dapur, dan pasokan bahan pokok siap kirim.</p>
              </div>
              <div className="scrollbar-hide flex max-w-full gap-1 overflow-x-auto rounded-lg bg-[#e5edff] p-1">
                {homeCategories.map((item) => <button key={item} onClick={() => setHomeCategory(item)} className={`shrink-0 rounded-md px-3 py-2 text-[10px] font-semibold ${homeCategory === item ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:bg-white/60"}`}>{item}</button>)}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredHomeOffers.map((item) => <HomeOfferCard key={item.sku} item={item} onDetail={() => setSelectedHomeOffer(item)} onAdd={() => addHomeOffer(item)}/>)}
            </div>
            <div className="mt-7 flex justify-center">
              <Link href="/katalog" className="inline-flex items-center gap-2 rounded-md bg-[#ad3b00] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#8f3000]"><ShoppingBag size={13}/> Lihat Semua 250+ Produk di Katalog Lengkap <ArrowRight size={15}/></Link>
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
                <Link href={`/katalog?kategori=${item.categorySlug}`} className="mt-auto flex items-center justify-between rounded-md bg-[#e7efff] px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-[#dbe7ff]">{item.action}<ChevronRight size={13}/></Link>
              </article>)}
            </div>
          </div>
        </section>
      </> : <>
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
            <label className="relative block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input value={search} onChange={(e)=>setSearch(e.target.value)} className="h-10 w-full rounded-md border-0 bg-[#edf2ff] pl-9 pr-3 text-[10px] text-slate-700 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#ad3b00]/20" placeholder="Cari produk, merk, spesifikasi, atau layanan..."/></label>
            <select value={priceRange} onChange={(e)=>setPriceRange(e.target.value)} className="h-10 min-w-0 rounded-md border-0 bg-[#edf2ff] px-3 text-[10px] text-slate-700 outline-none focus:ring-2 focus:ring-[#ad3b00]/20"><option value="all">Semua Rentang Harga</option><option value="under-1m">Di bawah Rp 1 juta</option><option value="1m-5m">Rp 1–5 juta</option><option value="5m-15m">Rp 5–15 juta</option><option value="over-15m">Di atas Rp 15 juta</option></select>
            <select value={availabilityFilter} onChange={(e)=>setAvailabilityFilter(e.target.value)} className="h-10 min-w-0 rounded-md border-0 bg-[#edf2ff] px-3 text-[10px] text-slate-700 outline-none focus:ring-2 focus:ring-[#ad3b00]/20"><option value="all">Ketersediaan: Semua</option><option value="available">Tersedia saja</option><option value="unavailable">Tidak tersedia</option><option value="Ready Stock">Ready Stock</option><option value="Indent 7 Hari">Indent 7 Hari</option><option value="Layanan Resmi">Layanan Resmi</option><option value="Layanan Rutin">Layanan Rutin</option></select>
            <select value={sortOrder} onChange={(e)=>setSortOrder(e.target.value)} className="h-10 min-w-0 rounded-md border-0 bg-[#edf2ff] px-3 text-[10px] text-slate-700 outline-none focus:ring-2 focus:ring-[#ad3b00]/20"><option value="recommended">Urutkan: Rekomendasi</option><option value="price-asc">Harga: Terendah</option><option value="price-desc">Harga: Tertinggi</option><option value="name">Nama: A–Z</option></select>
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
            visible.length?<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{visible.map((product)=><ProductCard key={product.id} product={product} onDetail={()=>setSelected(product)} onAdd={(source)=>add(product, source)}/>)}</div>:
            <div className="mt-4 rounded-xl bg-white py-16 text-center"><div className="text-4xl">⌕</div><h2 className="mt-3 font-bold text-slate-800">{error?"Katalog belum dapat ditampilkan":b2bProducts.length===0?"Belum ada produk di katalog":"Produk tidak ditemukan"}</h2><p className="mt-1 text-sm text-slate-500">{error?"Periksa koneksi database, lalu muat ulang halaman.":b2bProducts.length===0?"Tambahkan produk melalui dashboard admin atau jalankan npm run db:seed untuk data contoh.":"Sesuaikan kata kunci atau filter untuk melihat produk lainnya."}</p></div>}
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

      {flyingItem && <div
        key={flyingItem.key}
        onAnimationEnd={() => setFlyingItem(null)}
        className="pointer-events-none fixed z-[60] flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-white text-lg shadow-lg animate-fly-to-cart"
        style={{ left: flyingItem.left, top: flyingItem.top, "--fly-x": `${flyingItem.x}px`, "--fly-y": `${flyingItem.y}px` } as React.CSSProperties}
      >
        {flyingItem.foto_url ? <img src={flyingItem.foto_url} alt="" className="h-full w-full object-cover" /> : "🍱"}
      </div>}
      <button ref={cartButtonRef} onClick={()=>setCartOpen(true)} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-xl transition hover:bg-slate-800" aria-label={`Buka keranjang, ${page === "home" ? homeItemCount : itemCount} item`}>
        <ShoppingBag size={16}/>Keranjang RFQ {(page === "home" ? homeItemCount : itemCount)>0&&<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c24a06] px-1 text-[10px]">{page === "home" ? homeItemCount : itemCount}</span>}
      </button>

      {selectedHomeOffer && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && setSelectedHomeOffer(null)}>
        <div role="dialog" aria-modal="true" aria-labelledby="home-offer-title" className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <p className="text-[9px] font-bold uppercase tracking-[.12em] text-slate-500">{selectedHomeOffer.category}<span className="mx-2 text-slate-300">|</span><span className="normal-case tracking-normal">SKU: {selectedHomeOffer.sku}</span></p>
            <button onClick={() => setSelectedHomeOffer(null)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Tutup detail produk"><X size={16}/></button>
          </div>
          <div className="grid gap-5 p-5 md:grid-cols-[1fr_1fr]">
            <div className="relative min-h-[205px] overflow-hidden rounded-md bg-[#edf2ff]">
              <img src={selectedHomeOffer.image} alt={selectedHomeOffer.title} className="absolute inset-0 h-full w-full object-cover"/>
              {selectedHomeOffer.overlayBadges && <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-1 text-[9px] font-semibold text-slate-700">{selectedHomeOffer.badge}</span>}
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#ad3b00]">{selectedHomeOffer.category}</p>
              <h2 id="home-offer-title" className="mt-1.5 text-xl font-black leading-tight text-slate-900">{selectedHomeOffer.title}</h2>
              <div className="mt-2 flex items-end gap-1.5"><b className="text-2xl font-black text-[#ad3b00]">{selectedHomeOffer.price}</b>{selectedHomeOffer.unit && <span className="pb-1 text-[9px] text-slate-500">{selectedHomeOffer.unit}</span>}</div>
              <div className="mt-3 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-md bg-[#edf7ef] px-2 py-1.5 text-[9px] font-bold text-forest-700"><BadgeCheck size={12}/>{selectedHomeOffer.badge}</span><span className="inline-flex items-center rounded-md bg-[#edf2ff] px-2 py-1.5 text-[9px] font-bold text-slate-700">Pengadaan B2B</span></div>
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="rounded-lg border border-slate-100 p-3.5">
              <h3 className="flex items-center gap-2 text-[11px] font-black text-slate-900"><span className="flex h-5 w-5 items-center justify-center rounded bg-[#fff1e8] text-[#ad3b00]"><BadgeCheck size={12}/></span>Informasi Produk</h3>
              <div className="mt-3 grid gap-2 text-[10px] sm:grid-cols-2">
                <div><span className="block text-slate-400">Kategori</span><b className="mt-0.5 block text-slate-700">{selectedHomeOffer.category}</b></div>
                <div><span className="block text-slate-400">SKU</span><b className="mt-0.5 block text-slate-700">{selectedHomeOffer.sku}</b></div>
                {selectedHomeOffer.details.map((detail) => <p key={detail} className="flex gap-1.5 text-slate-600"><BadgeCheck size={12} className="shrink-0 text-[#ad3b00]"/>{detail}</p>)}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button onClick={() => { addHomeOffer(selectedHomeOffer); setSelectedHomeOffer(null); setCartOpen(true); }} className="flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-4 text-[10px] font-bold text-slate-700 hover:bg-slate-50"><ShoppingCart size={14}/>Tambah ke keranjang</button>
              <a href={whatsappHref.startsWith("https://") ? `${whatsappHref}?text=${encodeURIComponent(`Halo DapurKita, saya ingin informasi mengenai ${selectedHomeOffer.title} (${selectedHomeOffer.sku}).`)}` : "/#kontak"} target={whatsappHref.startsWith("https://") ? "_blank" : undefined} rel={whatsappHref.startsWith("https://") ? "noreferrer" : undefined} className="flex h-9 items-center justify-center gap-2 rounded-md bg-[#ad3b00] px-4 text-[10px] font-bold text-white hover:bg-[#8f3000]"><MessageCircle size={14}/>Tanya via WhatsApp</a>
            </div>
          </div>
        </div>
      </div>}

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

      {cartOpen && page === "home" && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && setCartOpen(false)}>
        <aside className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff1e8] text-[#ad3b00]"><ShoppingCart size={18}/></span>
              <div><h2 className="text-sm font-black text-slate-900">Keranjang Permintaan Penawaran</h2><p className="mt-0.5 text-[9px] text-slate-500">{homeItemCount} item <span className="mx-1">•</span> DapurKita B2B</p></div>
            </div>
            <button onClick={() => setCartOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Tutup keranjang"><X size={17}/></button>
          </div>
          {!homeCart.length ? <div className="py-14 text-center"><ShoppingBag className="mx-auto text-slate-300" size={42}/><p className="mt-4 text-sm font-bold text-slate-800">Keranjang masih kosong</p><p className="mt-1 text-xs text-slate-500">Pilih produk atau layanan B2B yang ingin ditanyakan.</p><button className="mt-4 text-xs font-bold text-[#ad3b00]" onClick={() => setCartOpen(false)}>Lanjut belanja</button></div> : <form onSubmit={checkoutHome} className="flex min-h-0 flex-1 flex-col">
            <div className="scrollbar-hide flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-2.5">
                {homeCart.map(({ offer, quantity }) => <div key={offer.sku} className="rounded-lg border border-slate-100 bg-white p-3">
                  <div className="flex gap-3">
                    <img src={offer.image} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover"/>
                    <div className="min-w-0 flex-1">
                      <b className="block text-[11px] text-slate-900">{offer.title}</b>
                      <p className="mt-0.5 text-[9px] text-slate-500">SKU: {offer.sku}</p>
                      <p className="mt-1 text-[9px] text-slate-500">Harga satuan: <b className="text-slate-700">{rupiah(offer.priceValue)}</b></p>
                      <div className="mt-1.5 flex items-center gap-1.5 rounded-md border border-slate-100 p-0.5 w-fit">
                        <button type="button" onClick={() => adjustHomeOffer(offer.sku, -1)} className="flex h-6 w-6 items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Kurangi jumlah"><Minus size={12}/></button>
                        <span className="w-5 text-center text-[10px] font-bold text-slate-800">{quantity}</span>
                        <button type="button" onClick={() => adjustHomeOffer(offer.sku, 1)} className="flex h-6 w-6 items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Tambah jumlah"><Plus size={12}/></button>
                      </div>
                    </div>
                    <div className="flex w-[88px] flex-col items-end justify-between">
                      <b className="text-[12px] text-[#ad3b00]">{rupiah(offer.priceValue * quantity)}</b>
                      <button type="button" onClick={() => setHomeCart((items) => items.filter((item) => item.offer.sku !== offer.sku))} className="text-slate-400 hover:text-red-500" aria-label="Hapus item"><Trash2 size={14}/></button>
                    </div>
                  </div>
                </div>)}
              </div>
              <div className="mt-3 rounded-lg border border-slate-100 p-3">
                <div className="flex justify-between text-[10px] text-slate-600"><span>Subtotal permintaan ({homeItemCount} item)</span><b className="text-slate-800">{rupiah(homeTotal)}</b></div>
                <div className="mt-2.5 flex justify-between border-t border-slate-100 pt-2.5"><span className="text-sm font-black text-slate-900">Total estimasi</span><b className="text-lg font-black text-[#ad3b00]">{rupiah(homeTotal)}</b></div>
              </div>
              {error && <div role="alert" className="mt-3 rounded-md bg-red-50 p-2 text-[10px] text-red-700">{error}</div>}
              <div className="mt-3 grid gap-x-3 gap-y-2.5 sm:grid-cols-2">
                <label className="block text-[9px] font-bold leading-4 text-slate-600">Nama pemesan *
                  <input required minLength={2} className="field mt-1 h-9 rounded-md border-slate-200 px-3 py-2 text-[10px] font-normal" placeholder="Nama Anda" value={form.nama_pemesan} onChange={(event) => setForm({...form, nama_pemesan: event.target.value})}/>
                </label>
                <label className="block text-[9px] font-bold leading-4 text-slate-600">Nama perusahaan / instansi
                  <input className="field mt-1 h-9 rounded-md border-slate-200 px-3 py-2 text-[10px] font-normal" placeholder="Nama perusahaan" value={form.nama_sekolah} onChange={(event) => setForm({...form, nama_sekolah: event.target.value})}/>
                </label>
                <label className="block text-[9px] font-bold leading-4 text-slate-600 sm:col-span-2">Nomor telepon / WhatsApp
                  <input type="tel" className="field mt-1 h-9 rounded-md border-slate-200 px-3 py-2 text-[10px] font-normal" placeholder="Contoh: 0812-3456-7890" value={form.telepon_pemesan} onChange={(event) => setForm({...form, telepon_pemesan: event.target.value})}/>
                </label>
                <label className="block text-[9px] font-bold leading-4 text-slate-600 sm:col-span-2">Catatan (opsional)
                  <textarea className="field mt-1 min-h-16 resize-y overflow-hidden rounded-md border-slate-200 px-3 py-2 text-[10px] font-normal" placeholder="Kebutuhan atau pertanyaan tambahan..." value={form.catatan} onChange={(event) => setForm({...form, catatan: event.target.value})}/>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 border-t border-slate-100 px-5 py-3">
              <button type="button" onClick={() => setCartOpen(false)} className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-slate-200 text-[10px] font-bold text-slate-700 hover:bg-slate-50"><ArrowRight size={14} className="rotate-180"/>Lanjut belanja</button>
              <button type="submit" disabled={submitting} className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#ad3b00] text-[10px] font-bold text-white hover:bg-[#8f3000] disabled:opacity-60"><MessageCircle size={14}/>{submitting ? "Membuka WhatsApp..." : "Kirim Permintaan via WhatsApp"}</button>
            </div>
          </form>}
        </aside>
      </div>}

      {cartOpen && page === "catalog" && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 sm:p-5" onMouseDown={(e) => e.target === e.currentTarget && setCartOpen(false)}>
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
