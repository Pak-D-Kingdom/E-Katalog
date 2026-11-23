"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, BadgeCheck, ChevronDown, Leaf, MapPin, Menu, MessageCircle, Minus, Plus, Search, ShoppingBag, ShoppingCart, Trash2, Utensils, X } from "lucide-react";
import { api, formatProductPrice, hargaSatuan, rupiah, } from "@/lib/types";
import type { Category, Product } from "@/lib/types";
import Link from "next/link";
import HomePage, { homeOffers } from "./Home/HomePage";
import type { HomeOffer } from "./Home/HomePage";
import KatalogPage from "./Katalog/KatalogPage";
import type { CartItem } from "./types";

type HomeCartItem = { offer: HomeOffer; quantity: number };
type PublicCatalogProps = {
  page?: "home" | "catalog";
};
type Settings = { nama_instansi: string; nomor_whatsapp: string; alamat: string | null };
type FlyingItem = { key: number; left: number; top: number; x: number; y: number; image: string | null };
const cartKey = "mbg-cart-v1";
const homeCartKey = "dapurkita-rfq-v1";
const hiddenNavCategoryNames = new Set(["kudapan sehat", "paket makan siang"]);

export default function PublicCatalog({
  page = "home",
}: PublicCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [homeCart, setHomeCart] = useState<HomeCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(page === "catalog");
  const [cartInitialized, setCartInitialized] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nama_pemesan: "", nama_sekolah: "", telepon_pemesan: "", catatan: "" });
  const [flyingItem, setFlyingItem] = useState<FlyingItem | null>(null);
  const [cartPulseKey, setCartPulseKey] = useState(0);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const flyingKeyRef = useRef(0);

  useEffect(() => {
    setLoading(page === "catalog");
    setProductsLoading(true);
    setProductsError("");
    setCategoriesLoading(true);
    setCategoryError("");
    const requests: Promise<void>[] = [];
    requests.push(
      api<{ pengaturan: Settings | null }>("/api/pengaturan")
        .then(({ pengaturan }) => setSettings(pengaturan))
        .catch((e: Error) => setError(e.message))
    );
    requests.push(
      api<{ kategori: Category[] }>("/api/kategori")
        .then(({ kategori }) => setCategories(kategori))
        .catch((e: Error) => {
          setCategoryError(e.message);
          setError(e.message);
        })
        .finally(() => setCategoriesLoading(false))
    );
    requests.push(
      api<{ produk: Product[] }>("/api/produk")
        .then(({ produk }) => setProducts(produk))
        .catch((e: Error) => {
          setProductsError(e.message);
          if (page === "catalog") setError(e.message);
        })
        .finally(() => setProductsLoading(false))
    );
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
    if (cartInitialized) {
      localStorage.setItem(cartKey, JSON.stringify(cart));
      if (page === "home") localStorage.setItem(homeCartKey, JSON.stringify(homeCart));
    }
  }, [cart, homeCart, cartInitialized, page]);

  useEffect(() => {
    if (!products.length) return;

    const productById = new Map(
      products.map((product) => [product.id, product])
    );

    setCart((items) =>
      items.flatMap((item) => {
        // Jaga-jaga kalau ada data lama di localStorage yang strukturnya rusak.
        const fresh = item?.product?.id
          ? productById.get(item.product.id)
          : undefined;

        if (!fresh || !fresh.tersedia || hargaSatuan(fresh) == null) {
          return [];
        }

        return [{ ...item, product: fresh }];
      })
    );
  }, [products]);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + (hargaSatuan(item.product) ?? 0) * item.quantity, 0);
  const homeItemCount = homeCart.reduce((sum, item) => sum + item.quantity, 0);
  const homeTotal = homeCart.reduce((sum, item) => sum + item.offer.priceValue * item.quantity, 0);
  const navCategories = categories.filter(
    (category) => !hiddenNavCategoryNames.has(category.nama_kategori.trim().toLowerCase())
  );
  const whatsappNumber = settings?.nomor_whatsapp.replace(/\D/g, "");
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : page === "home" ? "https://wa.me/622155578900" : "/#kontak";

  function animateIntoCart(source: HTMLElement | undefined | null, image: string | null) {
    setCartPulseKey((key) => key + 1);
    if (!source || !cartButtonRef.current) return;

    const sourceRect = source.getBoundingClientRect();
    const targetRect = cartButtonRef.current.getBoundingClientRect();
    setFlyingItem({
      key: ++flyingKeyRef.current,
      left: sourceRect.left + sourceRect.width / 2 - 24,
      top: sourceRect.top + sourceRect.height / 2 - 24,
      x: targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2),
      y: targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2),
      image,
    });
  }

  function add(product: Product, source?: HTMLElement) {
    if (hargaSatuan(product) == null) return;
    animateIntoCart(source, product.foto_url);
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

  function addHomeOffer(offer: HomeOffer, source?: HTMLElement) {
    animateIntoCart(source, offer.image);
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

    const rangeItem = cart.find((item) => hargaSatuan(item.product) == null);
    if (rangeItem) {
      setError(`Produk ${rangeItem.product.nama_produk} memerlukan penawaran harga dari Admin.`);
      return;
    }

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
      "Kode permintaan: Permintaan dari katalog"
    ].join("\n");
    localStorage.removeItem(homeCartKey);
    setHomeCart([]);
    window.location.assign(`${whatsappHref}?text=${encodeURIComponent(text)}`);
  }

  return (
    <main className={`flex min-h-screen flex-col ${page === "catalog" ? "bg-[#f7f8ff]" : ""}`}>
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:gap-y-3 sm:px-5 sm:py-3 lg:px-8">
          <Link href="/" aria-label="Beranda DapurKita" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-700 text-white"><Leaf size={21} /></span>
            <span><b className="block text-base leading-tight text-slate-900">DapurKita</b><small className="block text-[11px] leading-3 text-slate-500">Kitchen Supply</small><small className="block text-[10px] leading-3 text-slate-500">& B2B Solutions</small></span>
          </Link>
          <div className="ml-auto flex items-center gap-1 sm:hidden">
            {page === "catalog" && (
              <button
                type="button"
                aria-label={mobileSearchOpen ? "Tutup pencarian" : "Cari produk"}
                aria-expanded={mobileSearchOpen}
                aria-controls="mobile-catalog-search"
                onClick={() => {
                  setMobileSearchOpen((open) => !open);
                  setMobileMenuOpen(false);
                }}
                className="rounded-md p-2 text-slate-700 transition hover:bg-slate-100"
              >
                <Search size={20} />
              </button>
            )}
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-main-navigation"
              onClick={() => {
                setMobileMenuOpen((open) => !open);
                setMobileSearchOpen(false);
              }}
              className="rounded-md p-2 text-slate-700 transition hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
          <nav aria-label="Navigasi utama" className="ml-auto hidden items-center gap-3 text-sm font-semibold text-slate-700 sm:flex sm:max-w-full sm:flex-wrap sm:justify-end">
            {page === "catalog" && (
              <label className="relative block w-full sm:w-44">
                <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  aria-label="Cari produk katalog"
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  placeholder="Cari produk..."
                  className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm font-normal text-slate-700 outline-none placeholder:text-slate-500 focus:border-[#ad3b00] focus:ring-2 focus:ring-[#ad3b00]/20"
                />
              </label>
            )}
            <Link href="/" className={`px-2 py-2 transition-colors hover:text-slate-950 ${page === "home" ? "font-extrabold text-slate-950" : ""}`}>Home</Link>
            <Link href="/katalog" className="px-2 py-2 text-slate-700 transition-colors hover:text-slate-950">Katalog</Link>
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-1 whitespace-nowrap px-2 py-2 text-slate-700 transition-colors hover:text-slate-950">
                Our Catalog
                <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-xl sm:w-80">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">Kategori</p>
                {categoriesLoading ? (
                  <p className="px-3 py-2 text-sm text-slate-500">Memuat kategori...</p>
                ) : categoryError ? (
                  <p role="alert" className="px-3 py-2 text-sm text-red-600">Kategori tidak dapat dimuat: {categoryError}</p>
                ) : navCategories.length ? (
                  navCategories.map((category) => {
                    const categoryProducts = products.filter((product) => product.kategori_id === category.id);
                    return (
                      <details key={category.id} className="group">
                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-[#fff1e8] hover:text-[#ad3b00]">
                          {category.nama_kategori}
                          <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="ml-3 border-l border-slate-100 py-1 pl-2">
                          <a
                            href={`/katalog?kategori=${encodeURIComponent(category.slug)}`}
                            className="block rounded-md px-3 py-2 text-sm font-semibold text-[#ad3b00] hover:bg-[#fff1e8]"
                          >
                            Lihat semua produk kategori
                          </a>
                          {productsLoading ? (
                            <p className="px-3 py-2 text-sm text-slate-500">Memuat produk...</p>
                          ) : productsError ? (
                            <p role="alert" className="px-3 py-2 text-sm text-red-600">Produk tidak dapat dimuat: {productsError}</p>
                          ) : categoryProducts.length ? (
                            categoryProducts.map((product) => (
                              <a
                                key={product.id}
                                href={`/katalog?kategori=${encodeURIComponent(category.slug)}&q=${encodeURIComponent(product.nama_produk)}`}
                                className="block rounded-md px-3 py-2 text-sm hover:bg-[#fff1e8] hover:text-[#ad3b00]"
                              >
                                {product.nama_produk}
                              </a>
                            ))
                          ) : (
                            <p className="px-3 py-2 text-sm text-slate-500">Belum ada produk.</p>
                          )}
                        </div>
                      </details>
                    );
                  })
                ) : (
                  <p className="px-3 py-2 text-sm text-slate-500">Belum ada kategori.</p>
                )}
              </div>
            </details>
          </nav>
          {page === "catalog" && mobileSearchOpen && (
            <label id="mobile-catalog-search" className="relative block w-full pb-1 sm:hidden">
              <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                aria-label="Cari produk katalog"
                autoFocus
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Cari produk..."
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-500 focus:border-[#ad3b00] focus:ring-2 focus:ring-[#ad3b00]/20"
              />
            </label>
          )}
          {mobileMenuOpen && (
            <nav id="mobile-main-navigation" aria-label="Navigasi mobile" className="max-h-[70vh] w-full overflow-y-auto border-t border-slate-100 pb-2 pt-2 text-sm font-semibold text-slate-700 sm:hidden">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-md px-3 py-2.5 hover:bg-slate-50 ${page === "home" ? "font-extrabold text-slate-950" : ""}`}
              >
                Home
              </Link>
              <Link
                href="/katalog"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-md px-3 py-2.5 hover:bg-slate-50"
              >
                Katalog
              </Link>
              <div className="mt-1 border-t border-slate-100 pt-2">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">Our Catalog</p>
                {categoriesLoading ? (
                  <p className="px-3 py-2 text-sm font-normal text-slate-500">Memuat kategori...</p>
                ) : categoryError ? (
                  <p role="alert" className="px-3 py-2 text-sm font-normal text-red-600">Kategori tidak dapat dimuat: {categoryError}</p>
                ) : navCategories.length ? (
                  navCategories.map((category) => {
                    const categoryProducts = products.filter((product) => product.kategori_id === category.id);
                    return (
                      <details key={category.id} className="group">
                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2.5 hover:bg-[#fff1e8] hover:text-[#ad3b00]">
                          {category.nama_kategori}
                          <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="ml-3 border-l border-slate-100 pb-2 pl-2">
                          <Link
                            href={`/katalog?kategori=${encodeURIComponent(category.slug)}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block rounded-md px-3 py-2 text-sm font-semibold text-[#ad3b00] hover:bg-[#fff1e8]"
                          >
                            Lihat semua produk kategori
                          </Link>
                          {productsLoading ? (
                            <p className="px-3 py-2 text-sm font-normal text-slate-500">Memuat produk...</p>
                          ) : productsError ? (
                            <p role="alert" className="px-3 py-2 text-sm font-normal text-red-600">Produk tidak dapat dimuat: {productsError}</p>
                          ) : categoryProducts.length ? (
                            categoryProducts.map((product) => (
                              <Link
                                key={product.id}
                                href={`/katalog?kategori=${encodeURIComponent(category.slug)}&q=${encodeURIComponent(product.nama_produk)}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block rounded-md px-3 py-2 text-sm font-normal hover:bg-[#fff1e8] hover:text-[#ad3b00]"
                              >
                                {product.nama_produk}
                              </Link>
                            ))
                          ) : (
                            <p className="px-3 py-2 text-sm font-normal text-slate-500">Belum ada produk.</p>
                          )}
                        </div>
                      </details>
                    );
                  })
                ) : (
                  <p className="px-3 py-2 text-sm font-normal text-slate-500">Belum ada kategori.</p>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      {page === "home" ? <HomePage
        onAddOffer={addHomeOffer}
        onOpenCart={() => setCartOpen(true)}
        whatsappHref={whatsappHref}
      /> : <KatalogPage
        products={products}
        categories={categories}
        loading={loading}
        error={error}
        cart={cart}
        search={catalogSearch}
        onSearchChange={setCatalogSearch}
        onAdd={add}
        onAdjust={adjust}
        onOpenCart={() => setCartOpen(true)}
      />}
      <footer id="kontak" className="mt-auto border-t border-[#dfe7fb] bg-[#eef3ff] px-5 pb-4 pt-8 text-slate-600">
        <div className="mx-auto grid max-w-7xl gap-7 pb-7 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.2fr_1.1fr] lg:gap-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-base font-bold text-slate-900"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-700 text-white"><Leaf size={17} /></span>DapurKita</Link>
            <p className="mt-3 max-w-xs text-[12px] leading-4">Penyedia solusi terintegrasi pengadaan perlengkapan dapur komersial, bahan baku horeca, sertifikasi kelayakan, dan servis preventif untuk industri perhotelan dan kuliner nasional.</p>
            <div className="mt-3 flex gap-2 text-[11px]"><span className="rounded bg-white px-2 py-1">◉ ISO 9001:2015</span><span className="rounded bg-white px-2 py-1">◈ HACCP Compliant</span></div>
          </div>
          <div><h3 className="text-[12px] font-extrabold uppercase tracking-wider text-slate-900">NAVIGASI CEPAT</h3><div className="mt-3 flex flex-col gap-2 text-[12px]"><Link href="/" className="hover:text-[#ad3b00]">Home Utama</Link><Link href="/katalog" className="hover:text-[#ad3b00]">Katalog Peralatan</Link><a href={whatsappHref} target="_blank" rel="noreferrer" className="hover:text-[#ad3b00]">Hubungi Tim B2B</a><Link href="/admin/login" className="hover:text-[#ad3b00]">Portal Operasional Admin</Link></div></div>
          <div><h3 className="text-[12px] font-extrabold uppercase tracking-wider text-slate-900">KATEGORI PASOKAN</h3><div className="mt-3 flex flex-col gap-2 text-[12px]"><a href={whatsappHref} className="hover:text-[#ad3b00]">Bahan Baku</a><a href={whatsappHref} className="hover:text-[#ad3b00]">Perizinan</a><a href={whatsappHref} className="hover:text-[#ad3b00]">Perawatan</a><a href={whatsappHref} className="hover:text-[#ad3b00]">Peralatan</a></div></div>
          <div><h3 className="text-[12px] font-extrabold uppercase tracking-wider text-slate-900">HEAD OFFICE</h3><div className="mt-3 space-y-2 text-[12px]"><p className="flex gap-2"><MapPin size={13} className="shrink-0 text-[#ad3b00]" />Kawasan SCBD Lot 8, Jl. Jendral Sudirman, Jakarta Selatan 12190</p><a href="tel:+622155578900" className="flex gap-2 hover:text-[#ad3b00]"><MessageCircle size={13} className="shrink-0 text-[#ad3b00]" />+62 21 5557 8900</a><a href="mailto:procurement@dapurkita.co.id" className="flex gap-2 hover:text-[#ad3b00]">✉ procurement@dapurkita.co.id</a></div></div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 border-t border-[#dfe7fb] pt-4 text-[11px] sm:flex-row"><span>© 2026 PT DapurKita Solusi Kuliner Internasional. Hak Cipta Dilindungi Undang-Undang.</span><span className="flex gap-4"><a href="#kontak">Kebijakan Privasi B2B</a><a href="#kontak">Syarat & Ketentuan</a></span></div>
      </footer>

      {flyingItem && <div
        key={flyingItem.key}
        onAnimationEnd={() => setFlyingItem(null)}
        aria-hidden="true"
        className="pointer-events-none fixed z-[60] flex h-12 w-12 items-center justify-center rounded-xl border border-white/80 bg-white/95 p-1.5 shadow-[0_8px_24px_rgba(15,23,42,.25)] ring-2 ring-[#ad3b00]/20 animate-fly-to-cart"
        style={{ left: flyingItem.left, top: flyingItem.top, "--fly-x": `${flyingItem.x}px`, "--fly-y": `${flyingItem.y}px` } as React.CSSProperties}
      >
        {flyingItem.image
          ? <img src={flyingItem.image} alt="" className="h-full w-full rounded-lg object-cover" />
          : <ShoppingBag size={21} className="text-[#ad3b00]" />}
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ad3b00] text-white shadow-sm">
          <Plus size={12} />
        </span>
      </div>}
      <a
        href={whatsappHref}
        target={settings?.nomor_whatsapp ? "_blank" : undefined}
        rel={settings?.nomor_whatsapp ? "noreferrer" : undefined}
        aria-label="Hubungi kami melalui WhatsApp"
        title="WhatsApp"
        className="fixed bottom-[88px] right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:bg-[#1fa855]"
      >
        <MessageCircle size={24} aria-hidden="true" />
      </a>
      <button ref={cartButtonRef} onClick={() => setCartOpen(true)} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-xl transition hover:bg-slate-800" aria-label={`Buka keranjang, ${page === "home" ? homeItemCount : itemCount} item`}>
        <span key={`cart-icon-${cartPulseKey}`} className={cartPulseKey ? "animate-cart-arrival" : ""}><ShoppingBag size={16} /></span>Keranjang {(page === "home" ? homeItemCount : itemCount) > 0 && <span key={`cart-count-${cartPulseKey}`} className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c24a06] px-1 text-[12px] ${cartPulseKey ? "animate-cart-count" : ""}`}>{page === "home" ? homeItemCount : itemCount}</span>}
      </button>

      {cartOpen && page === "home" && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && setCartOpen(false)}>
        <aside className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff1e8] text-[#ad3b00]"><ShoppingCart size={18} /></span>
              <div><h2 className="text-base font-black text-slate-900">Keranjang Permintaan Penawaran</h2><p className="mt-0.5 text-[11px] text-slate-500">{homeItemCount} item <span className="mx-1">•</span> DapurKita B2B</p></div>
            </div>
            <button onClick={() => setCartOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Tutup keranjang"><X size={17} /></button>
          </div>
          {!homeCart.length ? <div className="py-14 text-center"><ShoppingBag className="mx-auto text-slate-300" size={42} /><p className="mt-4 text-base font-bold text-slate-800">Keranjang masih kosong</p><p className="mt-1 text-sm text-slate-500">Pilih produk atau layanan B2B yang ingin ditanyakan.</p><button className="mt-4 text-sm font-bold text-[#ad3b00]" onClick={() => setCartOpen(false)}>Lanjut belanja</button></div> : <form onSubmit={checkoutHome} className="flex min-h-0 flex-1 flex-col">
            <div className="scrollbar-hide flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-2.5">
                {homeCart.map(({ offer, quantity }) => <div key={offer.sku} className="rounded-lg border border-slate-100 bg-white p-3">
                  <div className="flex gap-3">
                    <img src={offer.image} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
                    <div className="min-w-0 flex-1">
                      <b className="block text-[13px] text-slate-900">{offer.title}</b>
                      <p className="mt-0.5 text-[11px] text-slate-500">SKU: {offer.sku}</p>
                      <p className="mt-1 text-[11px] text-slate-500">Harga satuan: <b className="text-slate-700">{rupiah(offer.priceValue)}</b></p>
                      <div className="mt-1.5 flex items-center gap-1.5 rounded-md border border-slate-100 p-0.5 w-fit">
                        <button type="button" onClick={() => adjustHomeOffer(offer.sku, -1)} className="flex h-6 w-6 items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Kurangi jumlah"><Minus size={12} /></button>
                        <span className="w-5 text-center text-[12px] font-bold text-slate-800">{quantity}</span>
                        <button type="button" onClick={() => adjustHomeOffer(offer.sku, 1)} className="flex h-6 w-6 items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Tambah jumlah"><Plus size={12} /></button>
                      </div>
                    </div>
                    <div className="flex w-[88px] flex-col items-end justify-between">
                      <b className="text-[14px] text-[#ad3b00]">{rupiah(offer.priceValue * quantity)}</b>
                      <button type="button" onClick={() => setHomeCart((items) => items.filter((item) => item.offer.sku !== offer.sku))} className="text-slate-400 hover:text-red-500" aria-label="Hapus item"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>)}
              </div>
              <div className="mt-3 rounded-lg border border-slate-100 p-3">
                <div className="flex justify-between text-[12px] text-slate-600"><span>Subtotal permintaan ({homeItemCount} item)</span><b className="text-slate-800">{rupiah(homeTotal)}</b></div>
                <div className="mt-2.5 flex justify-between border-t border-slate-100 pt-2.5"><span className="text-base font-black text-slate-900">Total estimasi</span><b className="text-lg font-black text-[#ad3b00]">{rupiah(homeTotal)}</b></div>
              </div>
              {error && <div role="alert" className="mt-3 rounded-md bg-red-50 p-2 text-[12px] text-red-700">{error}</div>}
              <div className="mt-3 grid gap-x-3 gap-y-2.5 sm:grid-cols-2">
                <label className="block text-[11px] font-bold leading-4 text-slate-600">Nama pemesan *
                  <input required minLength={2} className="field mt-1 h-9 rounded-md border-slate-200 px-3 py-2 text-[12px] font-normal" placeholder="Nama Anda" value={form.nama_pemesan} onChange={(event) => setForm({ ...form, nama_pemesan: event.target.value })} />
                </label>
                <label className="block text-[11px] font-bold leading-4 text-slate-600">SPPG
                  <input className="field mt-1 h-9 rounded-md border-slate-200 px-3 py-2 text-[12px] font-normal" placeholder="Nama SPPG" value={form.nama_sekolah} onChange={(event) => setForm({ ...form, nama_sekolah: event.target.value })} />
                </label>
                <label className="block text-[11px] font-bold leading-4 text-slate-600 sm:col-span-2">Nomor telepon / WhatsApp
                  <input type="tel" className="field mt-1 h-9 rounded-md border-slate-200 px-3 py-2 text-[12px] font-normal" placeholder="Contoh: 0812-3456-7890" value={form.telepon_pemesan} onChange={(event) => setForm({ ...form, telepon_pemesan: event.target.value })} />
                </label>
                <label className="block text-[11px] font-bold leading-4 text-slate-600 sm:col-span-2">Catatan (opsional)
                  <textarea className="field mt-1 min-h-16 resize-y overflow-hidden rounded-md border-slate-200 px-3 py-2 text-[12px] font-normal" placeholder="Kebutuhan atau pertanyaan tambahan..." value={form.catatan} onChange={(event) => setForm({ ...form, catatan: event.target.value })} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2 border-t border-slate-100 px-5 py-3">
              <button type="button" onClick={() => setCartOpen(false)} className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-slate-200 text-[12px] font-bold text-slate-700 hover:bg-slate-50"><ArrowRight size={14} className="rotate-180" />Lanjut belanja</button>
              <button type="submit" disabled={submitting} className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#ad3b00] text-[12px] font-bold text-white hover:bg-[#8f3000] disabled:opacity-60"><MessageCircle size={14} />{submitting ? "Membuka WhatsApp..." : "Kirim Permintaan via WhatsApp"}</button>
            </div>
          </form>}
        </aside>
      </div>}

      {cartOpen && page === "catalog" && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 sm:p-5" onMouseDown={(e) => e.target === e.currentTarget && setCartOpen(false)}>
        <aside className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff1e8] text-[#ad3b00]"><ShoppingCart size={18} /></span>
              <div><h2 className="text-base font-black text-slate-900">Keranjang</h2><p className="mt-0.5 text-[11px] text-slate-500">{itemCount} item <span className="mx-1">•</span> E-Katalog MBG <span className="mx-1">•</span> Respon cepat</p></div>
            </div>
            {cart.length === 0 && <button onClick={() => setCartOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Tutup keranjang"><X size={17} /></button>}
          </div>
          <div className="scrollbar-hide flex-1 overflow-y-auto px-5 py-4">
            {!cart.length ? <div className="py-14 text-center"><ShoppingBag className="mx-auto text-slate-300" size={42} /><p className="mt-4 text-base font-bold text-slate-800">Keranjang masih kosong</p><p className="mt-1 text-sm text-slate-500">Tambahkan produk atau layanan dari katalog.</p><button className="mt-4 text-sm font-bold text-[#ad3b00]" onClick={() => setCartOpen(false)}>Lanjut belanja</button></div> : <>
              <div className="space-y-2.5">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="rounded-lg border border-slate-100 bg-white p-3">
                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#fff1e8] text-[#ad3b00]">{product.foto_url ? <img src={product.foto_url} alt="" className="h-full w-full object-cover" /> : <Utensils size={21} />}</div>
                      <div className="min-w-0 flex-1">
                        <b className="block truncate text-[13px] text-slate-900">{product.nama_produk}</b>
                        <p className="mt-0.5 text-[11px] text-slate-500">SKU: {product.kode_produk}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">Harga satuan: <b className="text-slate-700">{formatProductPrice(product)}</b></span>
                          <div className="flex items-center gap-1.5 rounded-md border border-slate-100 p-0.5">
                            <button onClick={() => adjust(product.id, -1)} className="flex h-6 w-6 items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Kurangi jumlah"><Minus size={12} /></button>
                            <span className="w-5 text-center text-[12px] font-bold text-slate-800">{quantity}</span>
                            <button onClick={() => adjust(product.id, 1)} className="flex h-6 w-6 items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="Tambah jumlah"><Plus size={12} /></button>
                          </div>
                        </div>
                      </div>
                      <div className="flex w-[88px] flex-col items-end justify-between">
                        <b className="text-[14px] text-[#ad3b00]">{hargaSatuan(product) == null ? "Penawaran" : rupiah(hargaSatuan(product)! * quantity)}</b>
                        <button onClick={() => setCart((items) => items.filter((item) => item.product.id !== product.id))} className="text-slate-400 hover:text-red-500" aria-label="Hapus item"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-slate-100 p-3">
                <div className="flex justify-between text-[12px] text-slate-600"><span>Subtotal pesanan ({itemCount} item)</span><b className="text-slate-800">{rupiah(total)}</b></div>
                <div className="mt-2.5 flex justify-between border-t border-slate-100 pt-2.5"><span className="text-base font-black text-slate-900">Total keseluruhan pesanan</span><b className="text-lg font-black text-[#ad3b00]">{rupiah(total)}</b></div>
              </div>
              <div className="mt-3 flex gap-2 rounded-md bg-[#fff7f2] px-3 py-2.5 text-[11px] leading-4 text-slate-600"><BadgeCheck size={14} className="shrink-0 text-[#ad3b00]" /><p>Pesan otomatis berisi data produk, jumlah, dan total estimasi untuk diteruskan ke tim E-Katalog MBG.</p></div>
              <form onSubmit={checkout} className="mt-3 overflow-hidden rounded-lg border border-slate-100 bg-white">
                <h3 className="flex items-center gap-2 bg-[#fff9f5] px-3.5 py-2.5 text-[13px] font-black text-[#ad3b00]"><ShoppingBag size={14} /> Informasi pemesan / lembaga</h3>
                {error && <div className="mt-3 rounded-md bg-red-50 p-2 text-[12px] text-red-700">{error}</div>}
                <div className="grid gap-x-3 gap-y-2.5 p-3.5 sm:grid-cols-2">
                  <label className="block text-[11px] font-bold leading-4 text-slate-600">Nama pemesan *
                    <input required minLength={2} className="field mt-1 h-9 rounded-md border-slate-200 px-3 py-2 text-[12px] font-normal" placeholder="Contoh: Budi Setiawan" value={form.nama_pemesan} onChange={(e) => setForm({ ...form, nama_pemesan: e.target.value })} />
                  </label>
                  <label className="block text-[11px] font-bold leading-4 text-slate-600">SPPG
                    <input className="field mt-1 h-9 rounded-md border-slate-200 px-3 py-2 text-[12px] font-normal" placeholder="Contoh: SPPG Karah" value={form.nama_sekolah} onChange={(e) => setForm({ ...form, nama_sekolah: e.target.value })} />
                  </label>
                  <label className="block text-[11px] font-bold leading-4 text-slate-600 sm:col-span-2">Nomor telepon / WhatsApp
                    <input type="tel" className="field mt-1 h-9 rounded-md border-slate-200 px-3 py-2 text-[12px] font-normal" placeholder="Contoh: 0812-3456-7890" value={form.telepon_pemesan} onChange={(e) => setForm({ ...form, telepon_pemesan: e.target.value })} />
                  </label>
                  <label className="block text-[11px] font-bold leading-4 text-slate-600 sm:col-span-2">Catatan pesanan (opsional)
                    <textarea className="field mt-1 min-h-16 resize-y overflow-hidden rounded-md border-slate-200 px-3 py-2 text-[12px] font-normal" placeholder="Contoh: kebutuhan harian..." value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} />
                  </label>
                </div>
              </form>
            </>}
          </div>
          {cart.length > 0 && <div className="grid grid-cols-[120px_1fr] gap-2 border-t border-slate-100 px-5 py-3">
            <button onClick={() => setCartOpen(false)} className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-slate-200 text-[12px] font-bold text-slate-700 hover:bg-slate-50"><ArrowRight size={14} className="rotate-180" />Lanjut belanja</button>
            <button disabled={submitting} onClick={() => { const formElement = document.querySelector<HTMLFormElement>("aside form"); formElement?.requestSubmit(); }} className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#ad3b00] text-[12px] font-bold text-white hover:bg-[#8f3000] disabled:opacity-60"><MessageCircle size={14} />{submitting ? "Menyimpan pesanan..." : "Order via WhatsApp"}</button>
          </div>}
        </aside>
      </div>}
    </main>
  );
}
