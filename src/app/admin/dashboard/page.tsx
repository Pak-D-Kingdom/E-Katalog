
"use client";

import { useEffect, useState } from "react";

import {
  Activity,
  Boxes,
  ChartNoAxesCombined,
  ClipboardCheck,
  MessageSquare,
  Star,
  ArrowUpRight,
  FileSpreadsheet,
} from "lucide-react";

import QuickActions from "@/components/admin/dashboard/QuickActions";
import InventoryPortfolio from "@/components/admin/dashboard/InventoryPortfolio";
import DashboardBottom from "@/components/admin/dashboard/DashboardBottom";

// Data sementara untuk tampilan UI
const statistics = [
  {
    title: "TOTAL PRODUK AKTIF",
    value: "248",
    suffix: "SKU Aktif",
    description: "+12 produk baru bulan ini",
    icon: ClipboardCheck,
    color: "text-[#A83D00]",
    background: "bg-[#FFF4ED]",
    footer: "bg-[#FBF4F0]",
  },
  {
    title: "STRUKTUR KATALOG",
    value: "4",
    suffix: "Kategori Utama",
    description: "Mencakup 18 Sub-kategori terdaftar",
    icon: Boxes,
    color: "text-[#172B4D]",
    background: "bg-[#E8F0FF]",
    footer: "bg-[#F0F4FC]",
  },
  {
    title: "INQUIRY WHATSAPP B2B",
    value: "142",
    suffix: "Pemesanan",
    description: "Aktivitas minggu ini (+18.4%)",
    icon: MessageSquare,
    color: "text-[#A83D00]",
    background: "bg-[#FFF0E9]",
    footer: "bg-[#FAEEE8]",
  },
  {
    title: "PRODUK UNGGULAN",
    value: "8 / 12",
    suffix: "Slot",
    description: "Aktif di beranda storefront utama",
    icon: Star,
    color: "text-[#A83D00]",
    background: "bg-[#E8F0FF]",
    footer: "bg-[#F0F4FC]",
  },
];

function WelcomePanel() {
  return (
    <section className="flex flex-col justify-between gap-5 rounded-xl border border-[#E8ECF4] bg-white p-5 sm:flex-row sm:items-center sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F8EDE7] text-[#A83D00]">
          <ChartNoAxesCombined size={21} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#172B4D]">
              Pusat Kendali Pengadaan
            </h1>

            <span className="rounded-full bg-[#E5EDFF] px-2 py-1 text-[9px] font-bold text-[#42577E]">
              LIVE SYSTEM
            </span>
          </div>

          <p className="mt-1 max-w-xl text-xs leading-5 text-[#64748B]">
            Monitoring ketersediaan SKU komersial, pipeline konversi
            WhatsApp, dan aktivasi beranda publik.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 rounded-lg bg-[#E8F0FF] px-4 py-3">
        <Activity size={16} className="text-[#A83D00]" />
        <div>
          <p className="text-[10px] font-bold text-[#172B4D]">
            Sinkronisasi Marunda Hub: 2
          </p>
          <p className="text-[10px] font-semibold text-[#172B4D]">
            menit lalu
          </p>
        </div>
      </div>
    </section>
  );
}

function Statistics() {
  const [data, setData] = useState({
    produkAktif: 0,
    totalKategori: 0,
    totalSubkategori: 0,
  });

  useEffect(() => {
    async function loadStatistics() {
      try {
        const response = await fetch("/api/dashboard/summary");
        if (!response.ok) throw new Error("Gagal mengambil statistik");

        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Gagal memuat statistik dashboard:", error);
      }
    }

    loadStatistics();
  }, []);

  const statistics = [
    {
      title: "TOTAL PRODUK AKTIF",
      value: data.produkAktif,
      suffix: "SKU Aktif",
      description: "Data produk dari database",
      icon: ClipboardCheck,
      color: "text-[#A83D00]",
      background: "bg-[#FFF4ED]",
      footer: "bg-[#FBF4F0]",
    },
    {
      title: "STRUKTUR KATALOG",
      value: data.totalKategori,
      suffix: "Kategori Utama",
      description: `Mencakup ${data.totalSubkategori} subkategori terdaftar`,
      icon: Boxes,
      color: "text-[#172B4D]",
      background: "bg-[#E8F0FF]",
      footer: "bg-[#F0F4FC]",
    },
    {
      title: "INQUIRY WHATSAPP B2B",
      value: "142",
      suffix: "Pemesanan",
      description: "Aktivitas minggu ini (+18.4%)",
      icon: MessageSquare,
      color: "text-[#A83D00]",
      background: "bg-[#FFF0E9]",
      footer: "bg-[#FAEEE8]",
    },
    {
      title: "PRODUK UNGGULAN",
      value: "8 / 12",
      suffix: "Slot",
      description: "Aktif di beranda storefront utama",
      icon: Star,
      color: "text-[#A83D00]",
      background: "bg-[#E8F0FF]",
      footer: "bg-[#F0F4FC]",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statistics.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="relative overflow-hidden rounded-xl border border-[#E8ECF4] bg-white p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-bold tracking-wide text-[#64748B]">
                {item.title}
              </p>

              <span className={`rounded-md p-2 ${item.background} ${item.color}`}>
                <Icon size={17} />
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-1">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#172B4D]">
                {item.value}
              </h2>

              <span className="text-[10px] text-[#64748B]">
                {item.suffix}
              </span>
            </div>

            <div
              className={`absolute bottom-0 left-0 right-0 min-h-12 px-4 py-2 ${item.footer}`}
            >
              <p className="flex items-center gap-1 text-[10px] font-semibold text-[#A83D00]">
                <ArrowUpRight size={12} />
                {item.description}
              </p>
            </div>

            <div className="h-10" />
          </div>
        );
      })}
    </section>
  );
}

//import data exel

function ImportExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    berhasil: number;
    gagal: number;
    detailGagal: { baris: number; pesan: string }[];
  } | null>(null);
  const [error, setError] = useState("");

  async function handleImport() {
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/produk/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import gagal.");
      }

      setResult(data);
      setFile(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat import."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-[#E8ECF4] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FF] text-[#172B4D]">
          <FileSpreadsheet size={21} />
        </div>

        <div>
          <h2 className="text-base font-bold text-[#172B4D]">
            Import Data Produk
          </h2>
          <p className="mt-1 text-xs text-[#64748B]">
            Tambahkan banyak produk sekaligus melalui file Excel.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#A83D00] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#873100]">
          <FileSpreadsheet size={17} />
          Pilih File Excel

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={loading}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
              setError("");
            }}
          />
        </label>

        {file && (
          <>
            <p className="text-xs font-medium text-[#172B4D]">
              File dipilih: {file.name}
            </p>

            <button
              type="button"
              onClick={handleImport}
              disabled={loading}
              className="flex h-10 items-center justify-center rounded-lg bg-[#172B4D] px-5 text-xs font-bold text-white transition hover:bg-[#263F66] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sedang Mengimport..." : "Import Produk"}
            </button>
          </>
        )}

        {!file && !result && (
          <p className="text-[10px] text-[#94A3B8]">
            Format .xlsx, .xls, atau .csv
          </p>
        )}

        {error && (
          <p className="max-w-xs text-xs font-medium text-red-600">
            {error}
          </p>
        )}

        {result && (
          <div className="w-full rounded-lg border border-[#E8ECF4] bg-[#F8FAFD] p-3 text-xs sm:min-w-64">
            <p className="font-bold text-green-700">
              Import selesai!
            </p>
            <p className="mt-1 text-[#172B4D]">
              Berhasil: {result.berhasil} produk
            </p>
            <p className="text-red-600">
              Gagal: {result.gagal} produk
            </p>

            {result.detailGagal.length > 0 && (
              <div className="mt-2 max-h-32 space-y-1 overflow-y-auto border-t border-[#E8ECF4] pt-2">
                {result.detailGagal.map((item, index) => (
                  <p key={index} className="text-red-600">
                    Baris {item.baris}: {item.pesan}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}


export default function AdminDashboard() {
  return (
    <div className="min-h-screen space-y-5 p-4 sm:p-6 lg:p-7">
      <WelcomePanel />

      <Statistics />

      <QuickActions />

      {/* Import Data Excel */}
      <ImportExcel />

      <InventoryPortfolio />

      <DashboardBottom />
    </div>
  );
}
