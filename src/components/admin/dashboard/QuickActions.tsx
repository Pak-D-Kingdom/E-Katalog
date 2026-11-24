"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  PlusCircle,
  FolderPlus,
  Download,
  PhoneCall,
  Zap,
  X,
} from "lucide-react";

interface Category {
  id: number;
  nama_kategori: string;
}

interface QuickActionsProps {
  onExport?: (
    kategoriId: number | null,
    format: "csv" | "xlsx" | "pdf"
  ) => void;
}

export default function QuickActions({
  onExport,
}: QuickActionsProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("all");
  const [format, setFormat] = useState<"csv" | "xlsx" | "pdf">("csv");
  const [showExport, setShowExport] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const buttonBase =
    "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md px-4 py-2 text-[14px] font-semibold transition-all duration-200";

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/kategori", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil kategori.");
        }

        const data = await response.json();

        setCategories(
          Array.isArray(data.kategori) ? data.kategori : []
        );
      } catch {
        setCategoryError("Kategori gagal dimuat.");
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    if (!showExport) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShowExport(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showExport]);

  return (
    <section className="rounded-xl border border-[#E5EAF3] bg-white px-6 py-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-[20px] font-bold text-[#172B4D]">
        <Zap size={21} className="text-[#A83D00]" />
        Aksi Cepat Pengelolaan
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/dashboard/produk?action=tambah"
          className={`${buttonBase} bg-[#A83D00] text-white hover:bg-[#8F3400]`}
        >
          <PlusCircle size={19} />
          Tambah Produk Baru
        </Link>

        <Link
          href="/admin/dashboard/kategori?action=tambah"
          className={`${buttonBase} bg-[#A83D00] text-white hover:bg-[#8F3400]`}
        >
          <FolderPlus size={19} />
          Tambah Kategori
        </Link>

        <button
          type="button"
          onClick={() => setShowExport(true)}
          className={`${buttonBase} bg-[#A83D00] text-white hover:bg-[#8F3400]`}
        >
          <Download size={19} />
          Export Data Katalog
        </button>

        <Link
          href="/admin/dashboard/pengaturan"
          className={`${buttonBase} bg-[#A83D00] text-white hover:bg-[#8F3400]`}
        >
          <PhoneCall size={18} />
          Ubah Konfigurasi WhatsApp
        </Link>
      </div>

      {showExport && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[1px] sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Export data katalog"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowExport(false);
          }}
        >
          <div className="w-full max-w-lg rounded-xl border border-[#E5EAF3] bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#172B4D]">
                  Pengaturan Export Katalog
                </h3>
                <p className="mt-1 text-xs text-[#64748B]">
                  Pilih kategori dan format data yang ingin diunduh.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExport(false)}
                className="rounded-md p-2 text-[#64748B] hover:bg-[#EEF3FF]"
                aria-label="Tutup popup export"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold text-[#172B4D]">
                  Kategori Produk
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-md border border-[#DCE4F0] bg-[#F8FAFD] px-3 py-3 text-xs text-[#172B4D] outline-none focus:border-[#A83D00]"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.nama_kategori}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#172B4D]">
                  Format File
                </label>
                <select
                  value={format}
                  onChange={(e) =>
                    setFormat(e.target.value as "csv" | "xlsx" | "pdf")
                  }
                  className="w-full rounded-md border border-[#DCE4F0] bg-[#F8FAFD] px-3 py-3 text-xs text-[#172B4D] outline-none focus:border-[#A83D00]"
                >
                  <option value="csv">CSV (.csv)</option>
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="pdf">PDF (.pdf)</option>
                </select>
              </div>
            </div>

            {categoryError && (
              <p className="mt-3 text-xs text-red-600">{categoryError}</p>
            )}

            <div className="mt-6 flex justify-end gap-2 border-t border-[#EAF0F8] pt-4">
              <button
                type="button"
                onClick={() => setShowExport(false)}
                className="rounded-md bg-[#E5EDFF] px-4 py-3 text-xs font-bold text-[#172B4D] hover:bg-[#D5E2FA]"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!!categoryError}
                onClick={() => {
                  onExport?.(
                    categoryId === "all" ? null : Number(categoryId),
                    format
                  );
                  setShowExport(false);
                }}
                className="flex items-center gap-2 rounded-md bg-[#A83D00] px-5 py-3 text-xs font-bold text-white hover:bg-[#873100] disabled:opacity-50"
              >
                <Download size={15} />
                Unduh Data
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}