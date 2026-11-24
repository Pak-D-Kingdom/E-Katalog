"use client";

import { useEffect, useState, type TransitionEvent } from "react";
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, MessageCircle, ReceiptText, ShieldCheck, ShoppingBag, ShoppingCart, UsersRound, X } from "lucide-react";
import Link from "next/link";
import { hargaSatuan, rupiah } from "@/lib/types";
import type { Product } from "@/lib/types";
import type { HomeSlide } from "@/lib/home-slides";

export type HomeOffer = {
  category: string;
  badge: string;
  sku: string;
  title: string;
  details: string[];
  priceLabel: string;
  price: string;
  priceValue: number;
  unit?: string;
  image: string | null;
  overlayBadges?: boolean;
};

const homeCategoryOrder = ["Bahan Baku", "Perizinan", "Perawatan", "Peralatan"];
const defaultProductDescription =
  "Detail produk belum tersedia. Silakan hubungi Admin untuk informasi lebih lanjut.";

export function getHomeOffers(products: Product[]): HomeOffer[] {
  const firstProductByCategory = new Map<number, Product>();

  for (const product of products) {
    const categoryId = product.kategori?.id;
    if (
      categoryId !== undefined &&
      !firstProductByCategory.has(categoryId) &&
      hargaSatuan(product) !== null
    ) {
      firstProductByCategory.set(categoryId, product);
    }
  }

  return [...firstProductByCategory.values()]
    .sort((a, b) => {
      const aOrder = homeCategoryOrder.indexOf(a.kategori?.nama_kategori || "");
      const bOrder = homeCategoryOrder.indexOf(b.kategori?.nama_kategori || "");
      return (aOrder < 0 ? Number.MAX_SAFE_INTEGER : aOrder) -
        (bOrder < 0 ? Number.MAX_SAFE_INTEGER : bOrder);
    })
    .map((product) => {
      const priceValue = hargaSatuan(product) ?? 0;
      const description = product.deskripsi.trim();
      const unit = product.satuan.trim();
      return {
        category: product.kategori?.nama_kategori || "Lainnya",
        badge: product.tersedia ? "Tersedia" : "Tidak tersedia",
        sku: product.kode_produk,
        title: product.nama_produk,
        details: [
          ...(description &&
          description.toLowerCase() !== defaultProductDescription.toLowerCase()
            ? [description]
            : []),
          ...(unit && unit.toLowerCase() !== "unit" ? [`Satuan: ${unit}`] : [])
        ],
        priceLabel: "Harga Satuan",
        price: rupiah(priceValue),
        priceValue,
        unit: product.satuan,
        image: product.foto_url,
        overlayBadges: true,
      };
    });
}

const homeCategories = ["Semua Kategori", "Bahan Baku", "Perizinan", "Perawatan", "Peralatan"];
const homePillars = [
  {
    icon: "◉",
    title: "Bahan Baku",
    categorySlug: "bahan-baku",
    badge: "Fresh & Dry",
    description: "Komoditas pangan bermutu tinggi, pasokan tepat dan terverifikasi halal, serta sembako grosir dan sanitasi kimia.",
    action: "Lihat Pasokan Pangan"
  },
  {
    icon: "✿",
    title: "Perizinan",
    categorySlug: "perizinan",
    badge: "Audit Standard",
    description: "Pendampingan sertifikasi kelayakan hygiene dan sertifikasi tata ruang dapur industri oleh auditor resmi.",
    action: "Lihat Paket Perizinan"
  },
  {
    icon: "▣",
    title: "Perawatan",
    categorySlug: "perawatan",
    badge: "Preventif 24/7",
    description: "Kontrak inspeksi pipa gas bertekanan, servis cold-storage berkala, deep cleaning exhaust, dan penanggulangan hama.",
    action: "Lihat Paket Servis"
  },
  {
    icon: "♨",
    title: "Peralatan",
    categorySlug: "peralatan",
    badge: "Garansi 2 Thn",
    description: "Peralatan memasak kapasitas tinggi berbahan stainless steel food grade 304 tahan banting untuk produksi nonstop.",
    action: "Lihat Kitchen Hardware"
  }
];

function HomeHeroSlider({
  instanceName,
  slides: configuredSlides,
}: {
  instanceName: string;
  slides: HomeSlide[];
}) {
  const homeSlides = configuredSlides.map((slide) => slide.foto_url);
  const [slidePosition, setSlidePosition] = useState(1);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const slides = [homeSlides[homeSlides.length - 1], ...homeSlides, homeSlides[0]];
  const activeSlide =
    slidePosition === 0
      ? homeSlides.length - 1
      : slidePosition === homeSlides.length + 1
        ? 0
        : slidePosition - 1;

  useEffect(() => {
    if (transitionEnabled) return;
    const frame = window.requestAnimationFrame(() => {
      setTransitionEnabled(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [transitionEnabled]);

  const showPrevious = () =>
    setSlidePosition((current) => Math.max(0, current - 1));
  const showNext = () =>
    setSlidePosition((current) =>
      Math.min(homeSlides.length + 1, current + 1)
    );
  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== "transform") {
      return;
    }
    if (slidePosition === homeSlides.length + 1) {
      setTransitionEnabled(false);
      setSlidePosition(1);
    } else if (slidePosition === 0) {
      setTransitionEnabled(false);
      setSlidePosition(homeSlides.length);
    }
  };

  return (
    <div
      role="region"
      aria-label={`Sorotan katalog ${instanceName}`}
      aria-roledescription="carousel"
      className="relative mx-auto w-full max-w-[1600px] overflow-hidden bg-slate-900 aspect-video"
    >
      <div
        onTransitionEnd={handleTransitionEnd}
        className={`flex h-full w-full ${
          transitionEnabled ? "transition-transform duration-700 ease-in-out" : "transition-none"
        }`}
        style={{ transform: `translateX(-${slidePosition * 100}%)` }}
      >
        {slides.map((slide, position) => {
          const index = (position - 1 + homeSlides.length) % homeSlides.length;
          return (
            <article
              key={`${position}-${slide}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} dari ${homeSlides.length}`}
              className="relative h-full w-full shrink-0"
            >
              <img
                src={slide}
                alt=""
                fetchPriority={position === 1 ? "high" : "auto"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </article>
          );
        })}
      </div>
      <button
        type="button"
        onClick={showPrevious}
        aria-label="Slide sebelumnya"
        className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/45 text-white transition hover:bg-slate-950/70 sm:left-5 sm:h-11 sm:w-11"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={showNext}
        aria-label="Slide berikutnya"
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/45 text-white transition hover:bg-slate-950/70 sm:right-5 sm:h-11 sm:w-11"
      >
        <ChevronRight size={22} />
      </button>
      <div className="absolute bottom-3 right-4 flex items-center gap-1.5 sm:bottom-5 sm:right-8">
        {homeSlides.map((slide, index) => (
          <button
            key={slide}
            type="button"
            onClick={() => {
              setTransitionEnabled(true);
              setSlidePosition(index + 1);
            }}
            aria-label={`Tampilkan slide ${index + 1}`}
            aria-current={activeSlide === index ? "true" : undefined}
            className={`h-1.5 rounded-full transition-all ${
              activeSlide === index ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function HomeOfferCard({ item, onDetail, onAdd }: { item: HomeOffer; onDetail: () => void; onAdd: (source: HTMLElement) => void }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative aspect-[1.4/1] overflow-hidden bg-[#e7edf4]">
        {item.image && <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>}
        {item.overlayBadges && <>
          <span className="absolute left-2.5 top-2.5 rounded bg-white/95 px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">{item.category}</span>
          <span className="absolute right-2.5 top-2.5 rounded bg-white/95 px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">{item.badge}</span>
        </>}
      </div>
      <div className="flex min-h-[185px] flex-col p-3">
        <p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-500">SKU: {item.sku}</p>
        <h3 className="mt-1.5 min-h-9 text-[14px] font-extrabold leading-4 text-slate-900">{item.title}</h3>
        <div className="mt-1.5 space-y-1 text-xs leading-4 text-slate-600">
          {item.details.map((detail) => <p key={detail} className="flex gap-1.5"><BadgeCheck size={12} className="mt-0.5 shrink-0 text-[#ad3b00]"/>{detail}</p>)}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0"><small className="block text-[10px] text-slate-500">{item.priceLabel}</small><b className="text-base font-extrabold text-[#b63d00]">{item.price}</b>{item.unit && item.unit.trim().toLowerCase() !== "unit" && <small className="ml-1 text-[10px] text-slate-500">{item.unit}</small>}</div>
          <div className="flex shrink-0 gap-1.5">
            <button type="button" onClick={onDetail} className="rounded bg-[#e7efff] px-4 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-[#dbe7ff]">Detail</button>
            <button type="button" onClick={(event) => onAdd(event.currentTarget)} aria-label={`Tambah ${item.title} ke keranjang`} className="flex h-7 w-8 items-center justify-center rounded bg-[#ad3b00] text-white hover:bg-[#8e3000]"><ShoppingCart size={13}/></button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function HomePage({
  offers,
  loading,
  slides,
  onAddOffer,
  onOpenCart,
  whatsappHref,
  instanceName
}: {
  offers: HomeOffer[];
  loading: boolean;
  slides: HomeSlide[];
  onAddOffer: (offer: HomeOffer, source?: HTMLElement) => void;
  onOpenCart: () => void;
  whatsappHref: string;
  instanceName: string;
}) {
  const [homeCategory, setHomeCategory] = useState("Semua Kategori");
  const [selectedHomeOffer, setSelectedHomeOffer] = useState<HomeOffer | null>(null);
  const featuredHomeOffers = homeCategory === "Semua Kategori"
    ? offers
    : offers.filter((item) => item.category.toLowerCase().includes(homeCategory.toLowerCase()));

  return <>
    <section id="home" className="bg-[#eef3ff]">
      <HomeHeroSlider instanceName={instanceName} slides={slides} />
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-7 lg:px-8 lg:pb-10 lg:pt-9">
        <div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dce6ff] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600"><BadgeCheck size={12} className="text-[#b63d00]"/> KATALOG UNGGULAN B2B</span>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-4xl">Produk &amp; Layanan Paling Diminati</h1>
            <p className="mt-2 max-w-xl text-sm leading-5 text-slate-600 sm:text-base">Peralatan bersertifikasi, paket legalitas instan, kontrak servis dapur, dan pasokan bahan pokok siap kirim.</p>
          </div>
          <div className="scrollbar-hide flex max-w-full gap-1 overflow-x-auto rounded-lg bg-[#e5edff] p-1">
            {homeCategories.map((item) => <button key={item} onClick={() => setHomeCategory(item)} className={`shrink-0 rounded-md px-3 py-2 text-[12px] font-semibold ${homeCategory === item ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:bg-white/60"}`}>{item}</button>)}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <p className="col-span-full py-8 text-center text-sm text-slate-500">Memuat produk unggulan...</p>
          ) : featuredHomeOffers.length ? (
            featuredHomeOffers.map((item) => <HomeOfferCard key={item.sku}
             item={item} onDetail={() => setSelectedHomeOffer(item)} onAdd={(source) => onAddOffer(item, source)}/>)
          ) : (
            <p className="col-span-full py-8 text-center text-sm text-slate-500">Belum ada produk pada kategori ini.</p>
          )}
        </div>
        <div className="mt-7 flex justify-center">
          <Link href="/katalog" className="inline-flex items-center gap-2 rounded-md bg-[#ad3b00] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#8f3000]"><ShoppingBag size={13}/> Lihat Semua 250+ Produk di Katalog Lengkap <ArrowRight size={15}/></Link>
        </div>
      </div>
    </section>

    <section className="bg-[#f8f9ff]">
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_.8fr] lg:gap-12">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dce6ff] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600"><BadgeCheck size={12} className="text-[#b63d00]"/> PLATFORM PENGADAAN KOMERSIAL TERPADU</span>
            <h2 className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-4xl">Solusi Lengkap untuk Setiap Kebutuhan <span className="text-[#ad3b00]">Dapur Profesional</span></h2>
            <p className="mt-3 max-w-xl text-sm leading-5 text-slate-600 sm:text-base">Mitra pengadaan B2B terpercaya untuk restoran, hotel, catering, dan cloud kitchen di seluruh Indonesia. Dari pasokan bahan baku segar, sertifikasi HACCP berlisensi, instalasi peralatan berat, hingga servis preventif terencana.</p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { icon: ShieldCheck, value: "1–2 Thn", label: "Garansi Mesin Resmi" },
                { icon: BadgeCheck, value: "SUS 304", label: "100% Food-Grade" },
                { icon: ReceiptText, value: "Faktur Pajak", label: "PPN & Legalitas Valid" },
                { icon: UsersRound, value: "Gratis RAB", label: "Konsultasi & Desain" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex min-h-[62px] items-start gap-2 rounded-lg bg-[#eef3ff] px-3 py-2.5">
                  <Icon size={14} className="mt-0.5 shrink-0 text-[#ad3b00]" />
                  <span>
                    <b className="block text-sm font-black leading-4 text-slate-800">{value}</b>
                    <small className="mt-1 block text-[9px] leading-3 text-slate-600">{label}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            <div className="relative flex aspect-[1.35/1] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#dce9d5] via-[#f2e7ca] to-[#e9effb]">
              <img src="/horeca-standardisasi.png" alt="Standarisasi HORECA Pro" className="absolute inset-0 h-full w-full object-cover"/>
              <span className="absolute left-3 top-2 text-[9px] text-slate-500">{instanceName} - Horeca &amp; Leading Pros</span>
              <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-white/95 px-3 py-2 shadow"><span><b className="block text-[13px] text-slate-800">Standarisasi HORECA Pro</b><small className="text-[11px] text-slate-500">Grade SUS 304 & Halal Supply Chain</small></span><span className="rounded bg-[#dfe8ff] px-2 py-1 text-[11px] font-bold text-slate-700">Aktif</span></span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-[#f8f9ff] pb-12">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div><p className="text-[11px] font-bold uppercase tracking-widest text-[#ad3b00]">INFRASTRUKTUR PENGADAAN LENGKAP</p><h2 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">4 Pilar Utama Solusi Dapur Komersial</h2><p className="mt-1 max-w-xl text-sm leading-5 text-slate-600">Dukungan hulu ke hilir untuk menjamin kepatuhan sanitasi, kelancaran operasional harian, dan keandalan alat pemanas maupun pendingin berdaya tinggi.</p></div>
          <Link href="/katalog" className="hidden items-center gap-1 pb-1 text-[13px] font-bold text-[#ad3b00] sm:flex">Buka Seluruh Katalog B2B <ArrowRight size={14}/></Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {homePillars.map((item)=><article key={item.title} className="flex min-h-[265px] flex-col rounded-xl bg-white p-4 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff4e8] text-lg font-bold text-[#ad3b00]">{item.icon}</span>
            <h3 className="mt-3 text-base font-extrabold text-slate-900">{item.title}</h3>
            <span className="mt-1 w-fit rounded bg-[#e7efff] px-2 py-1 text-[11px] text-slate-600">{item.badge}</span>
            <p className="mt-2 min-h-12 text-[12px] leading-4 text-slate-500">{item.description}</p>
            <Link href={`/katalog?kategori=${item.categorySlug}`} className="mt-auto flex items-center justify-between rounded-md bg-[#e7efff] px-3 py-2 text-[12px] font-bold text-slate-700 hover:bg-[#dbe7ff]">{item.action}<ChevronRight size={13}/></Link>
          </article>)}
        </div>
      </div>
    </section>

    {selectedHomeOffer && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && setSelectedHomeOffer(null)}>
      <div role="dialog" aria-modal="true" aria-labelledby="home-offer-title" className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">{selectedHomeOffer.category}<span className="mx-2 text-slate-300">|</span><span className="normal-case tracking-normal">SKU: {selectedHomeOffer.sku}</span></p>
          <button onClick={() => setSelectedHomeOffer(null)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Tutup detail produk"><X size={16}/></button>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_1fr]">
          <div className="relative min-h-[205px] overflow-hidden rounded-md bg-[#edf2ff]">
            {selectedHomeOffer.image && <img src={selectedHomeOffer.image} alt={selectedHomeOffer.title} className="absolute inset-0 h-full w-full object-cover"/>}
            {selectedHomeOffer.overlayBadges && <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-1 text-[11px] font-semibold text-slate-700">{selectedHomeOffer.badge}</span>}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#ad3b00]">{selectedHomeOffer.category}</p>
            <h2 id="home-offer-title" className="mt-1.5 text-xl font-black leading-tight text-slate-900">{selectedHomeOffer.title}</h2>
            <div className="mt-2 flex items-end gap-1.5"><b className="text-2xl font-black text-[#ad3b00]">{selectedHomeOffer.price}</b>{selectedHomeOffer.unit && selectedHomeOffer.unit.trim().toLowerCase() !== "unit" && <span className="pb-1 text-[11px] text-slate-500">{selectedHomeOffer.unit}</span>}</div>
            <div className="mt-3 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-md bg-[#edf7ef] px-2 py-1.5 text-[11px] font-bold text-forest-700"><BadgeCheck size={12}/>{selectedHomeOffer.badge}</span><span className="inline-flex items-center rounded-md bg-[#edf2ff] px-2 py-1.5 text-[11px] font-bold text-slate-700">Pengadaan B2B</span></div>
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="rounded-lg border border-slate-100 p-3.5">
            <h3 className="flex items-center gap-2 text-[13px] font-black text-slate-900"><span className="flex h-5 w-5 items-center justify-center rounded bg-[#fff1e8] text-[#ad3b00]"><BadgeCheck size={12}/></span>Informasi Produk</h3>
            <div className="mt-3 grid gap-2 text-[12px] sm:grid-cols-2">
              <div><span className="block text-slate-400">Kategori</span><b className="mt-0.5 block text-slate-700">{selectedHomeOffer.category}</b></div>
              <div><span className="block text-slate-400">SKU</span><b className="mt-0.5 block text-slate-700">{selectedHomeOffer.sku}</b></div>
              {selectedHomeOffer.details.map((detail) => <p key={detail} className="flex gap-1.5 text-slate-600"><BadgeCheck size={12} className="shrink-0 text-[#ad3b00]"/>{detail}</p>)}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button onClick={(event) => { onAddOffer(selectedHomeOffer, event.currentTarget); setSelectedHomeOffer(null); onOpenCart(); }} className="flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-4 text-[12px] font-bold text-slate-700 hover:bg-slate-50"><ShoppingCart size={14}/>Tambah ke keranjang</button>
            <a href={whatsappHref.startsWith("https://") ? `${whatsappHref}?text=${encodeURIComponent(`Halo ${instanceName}, saya ingin informasi mengenai ${selectedHomeOffer.title} (${selectedHomeOffer.sku}).`)}` : "/#kontak"} target={whatsappHref.startsWith("https://") ? "_blank" : undefined} rel={whatsappHref.startsWith("https://") ? "noreferrer" : undefined} className="flex h-9 items-center justify-center gap-2 rounded-md bg-[#ad3b00] px-4 text-[12px] font-bold text-white hover:bg-[#8f3000]"><MessageCircle size={14}/>Tanya via WhatsApp</a>
          </div>
        </div>
      </div>
    </div>}
  </>;
}