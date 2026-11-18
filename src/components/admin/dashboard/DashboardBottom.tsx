
"use client";

import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ExternalLink,
  Headset,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

const products = [
  {
    name: "Combi Steam Oven 10-Tray",
    sku: "EQ-OVN-2024-01",
    category: "Peralatan Dapur",
    price: "Rp 115.000.000",
    image: "oven",
  },
  {
    name: "Kontrak Preventif Maintenance",
    sku: "SRV-MNT-KTR-04",
    category: "Perawatan",
    price: "Rp 4.500.000/bln",
    image: "maintenance",
  },
  {
    name: "Daging Sapi Striploin Aus MB3+",
    sku: "RAW-BEEF-STR-20",
    category: "Bahan Baku",
    price: "Rp 285.000/kg",
    image: "beef",
  },
  {
    name: "Paket Pendampingan HACCP",
    sku: "LEG-HACCP-PRO-01",
    category: "Perizinan",
    price: "Rp 18.500.000",
    image: "haccp",
  },
  {
    name: "SLHS Hygiene Certification",
    sku: "LEG-SLHS-KLN-09",
    category: "Perizinan",
    price: "Rp 12.000.000",
    image: "hygiene",
  },
  {
    name: "Mesin Pendingin Industrial",
    sku: "EQ-REF-2024-06",
    category: "Peralatan Dapur",
    price: "Rp 32.500.000",
    image: "refrigerator",
  },
  {
    name: "Paket Bahan Baku Mingguan",
    sku: "RAW-PACK-001",
    category: "Bahan Baku",
    price: "Rp 7.500.000",
    image: "ingredients",
  },
];

const whatsappLogs = [
  {
    company: "PT Boga Mandiri Sejahtera",
    time: "3 menit lalu",
    product: "Combi Steam Oven 10-Tray",
    quantity: "2 Unit",
    price: "Rp 230.000.000",
    buyer: "Hotel Horison Group",
  },
  {
    company: "CV Rasa Nusantara Express",
    time: "24 menit lalu",
    product: "Daging Sapi Striploin Aus MB3+",
    quantity: "150 Kg Bulanan",
    price: "Rp 42.750.000",
    buyer: "Restoran Padang Modern",
  },
  {
    company: "Koperasi Dapur Prima",
    time: "1 jam lalu",
    product: "Paket Sertifikasi HACCP & SLHS",
    quantity: "1 Paket Bundling",
    price: "Rp 30.500.000",
    buyer: "Central Cloud Kitchen",
  },
  {
    company: "KitchenCraft Bistro PIK",
    time: "2 jam lalu",
    product: "Kontrak Maintenance Bulanan",
    quantity: "Tenor: 12 Bulan",
    price: "Rp 54.000.000",
    buyer: "Branch: PIK 2 Jakarta Utara",
  },
];

const imageStyles: Record<string, string> = {
  oven: "bg-gradient-to-br from-slate-700 to-slate-950",
  maintenance: "bg-gradient-to-br from-stone-500 to-slate-800",
  beef: "bg-gradient-to-br from-rose-300 to-red-800",
  haccp: "bg-gradient-to-br from-amber-100 to-stone-500",
  hygiene: "bg-gradient-to-br from-cyan-300 to-slate-700",
  refrigerator: "bg-gradient-to-br from-slate-300 to-slate-700",
  ingredients: "bg-gradient-to-br from-lime-200 to-emerald-700",
};

function ProductThumbnail({ image }: { image: string }) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${imageStyles[image] ?? "bg-slate-200"}`}
    >
      <span className="text-[9px] font-bold tracking-wider text-white">
        {image.slice(0, 3).toUpperCase()}
      </span>
    </div>
  );
}

export default function DashboardBottom() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [page, setPage] = useState(1);

  const pageSize = 5;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword);

      const matchesCategory =
        category === "Semua" || product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeCategory(value: string) {
    setCategory(value);
    setPage(1);
  }

  return (
    <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.6fr_1fr]">
      {/* KATALOG PRODUK */}
      <div className="min-w-0 rounded-xl border border-[#E5EAF3] bg-white p-5 sm:p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-[19px] font-semibold text-[#172B4D]">
              Katalog Produk & Aktivasi Beranda
            </h2>

            <p className="mt-1 text-[12px] leading-relaxed text-[#596780]">
              Kontrol visibilitas rekomendasi komersial pada tampilan utama B2B
            </p>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-[#EAF0FC] px-3 py-2 lg:w-[190px] lg:flex-none">
              <Search size={15} className="shrink-0 text-[#64748B]" />

              <input
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
                placeholder="Cari nama / SKU..."
                className="w-full min-w-0 bg-transparent text-[11px] text-[#172B4D] outline-none placeholder:text-[#94A3B8]"
              />
            </div>

            <div className="flex items-center rounded-md bg-[#EAF0FC] px-2">
              <SlidersHorizontal size={16} className="text-[#172B4D]" />

              <select
                value={category}
                onChange={(event) => changeCategory(event.target.value)}
                aria-label="Filter kategori produk"
                className="max-w-[105px] cursor-pointer bg-transparent py-2 text-[10px] text-[#172B4D] outline-none"
              >
                <option value="Semua">Semua</option>
                <option value="Peralatan Dapur">Peralatan Dapur</option>
                <option value="Perawatan">Perawatan</option>
                <option value="Bahan Baku">Bahan Baku</option>
                <option value="Perizinan">Perizinan</option>
              </select>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[590px] border-collapse text-left">
            <thead>
              <tr className="bg-[#EEF3FF] text-[10px] font-bold uppercase tracking-wide text-[#596780]">
                <th className="px-3 py-3">Produk & SKU</th>
                <th className="px-3 py-3">Kategori</th>
                <th className="px-3 py-3">Harga Satuan</th>
                <th className="px-3 py-3 text-center">Beranda</th>
              </tr>
            </thead>

            <tbody>
              {visibleProducts.map((product) => (
                <tr
                  key={product.sku}
                  className="border-b border-[#EAF0F8] last:border-0"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <ProductThumbnail image={product.image} />

                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-[#172B4D]">
                          {product.name}
                        </p>

                        <p className="mt-1 text-[9px] text-[#64748B]">
                          SKU: {product.sku}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <span className="inline-block rounded-md bg-[#DCE7FF] px-2 py-1 text-[9px] font-medium text-[#172B4D]">
                      {product.category}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-[11px] font-bold text-[#172B4D]">
                    {product.price}
                  </td>

                  <td className="px-3 py-3 text-center">
                    <CheckCircle2
                      size={17}
                      className="mx-auto text-[#A83D00]"
                    />
                  </td>
                </tr>
              ))}

              {visibleProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
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
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#EAF0F8] pt-4">
          <p className="text-[11px] text-[#596780]">
            Menampilkan{" "}
            <span className="font-semibold text-[#172B4D]">
              {visibleProducts.length}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-[#172B4D]">
              {filteredProducts.length}
            </span>{" "}
            produk terdaftar
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-md bg-[#E5EDFF] px-2 py-2 text-[10px] font-medium text-[#172B4D] hover:bg-[#D5E2FA] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (number) => (
                <button
                  type="button"
                  key={number}
                  onClick={() => setPage(number)}
                  className={`min-w-8 rounded-md px-2 py-2 text-[10px] font-bold ${
                    currentPage === number
                      ? "bg-[#A83D00] text-white"
                      : "bg-[#E5EDFF] text-[#172B4D] hover:bg-[#D5E2FA]"
                  }`}
                >
                  {number}
                </button>
              )
            )}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              className="rounded-md bg-[#E5EDFF] px-2 py-2 text-[10px] font-medium text-[#172B4D] hover:bg-[#D5E2FA] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* LOG WHATSAPP */}
      <div className="min-w-0 rounded-xl border border-[#E5EAF3] bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[18px] font-semibold text-[#172B4D]">
            <span className="h-3 w-3 rounded-full bg-[#22C55E]" />
            Log WhatsApp B2B
          </h2>

          <span className="text-[9px] font-medium text-[#596780]">
            Real-time Stream
          </span>
        </div>

        <p className="mb-5 mt-3 text-[11px] leading-relaxed text-[#64748B]">
          Notifikasi otomatis saat client mengeklik CTA pemesanan via WhatsApp
          dari katalog komersial.
        </p>

        <div className="space-y-2">
          {whatsappLogs.map((log) => (
            <div
              key={log.company}
              className="rounded-lg bg-[#EEF3FF] p-3"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                <p className="text-[10px] font-bold text-[#A83D00]">
                  {log.company}
                </p>

                <span className="text-[9px] text-[#64748B]">
                  {log.time}
                </span>
              </div>

              <h3 className="text-[12px] font-bold leading-snug text-[#172B4D]">
                {log.product}
              </h3>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#596780]">
                <span>{log.quantity}</span>
                <span className="font-bold text-[#172B4D]">
                  {log.price}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 rounded-sm bg-[#E2EBFC] px-2 py-1 text-[9px] text-[#596780]">
                  Buyer: {log.buyer}
                </span>

                <a
                  href="https://web.whatsapp.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-[#A83D00] hover:underline"
                >
                  Buka Chat
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* NOMOR CS */}
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
                +62 812-9988-7711
              </p>

              <p className="text-[10px] text-[#64748B]">
                (Sales Procurement)
              </p>
            </div>
          </div>

          <a
            href="/admin/dashboard/pengaturan"
            className="shrink-0 rounded-md bg-white px-3 py-2 text-[10px] font-bold text-[#172B4D] transition hover:bg-[#F8FAFC]"
          >
            Ganti
          </a>
        </div>
      </div>
    </section>
  );
}
