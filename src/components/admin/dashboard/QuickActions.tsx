"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  PlusCircle,
  FolderPlus,
  Download,
  PhoneCall,
  Zap,
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

  return (
    <section className="rounded-xl border border-[#E5EAF3] bg-white px-6 py-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-[20px] font-bold text-[#172B4D]">
        <Zap size={21} className="text-[#A83D00]" />
        Aksi Cepat Pengelolaan
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/dashboard/produk"
          className={`${buttonBase} bg-[#A83D00] text-white hover:bg-[#8F3400]`}
        >
          <PlusCircle size={19} />
          Tambah Produk Baru
        </Link>

        <Link
          href="/admin/dashboard/kategori"
          className={`${buttonBase} bg-[#E5EEFF] text-[#172B4D] hover:bg-[#D6E4FF]`}
        >
          <FolderPlus size={19} />
          Tambah Kategori
        </Link>

        <button
          type="button"
          onClick={() => setShowExport((current) => !current)}
          className={`${buttonBase} bg-[#E5EEFF] text-[#172B4D] hover:bg-[#D6E4FF]`}
        >
          <Download size={19} />
          Export Data Katalog
        </button>

        <Link
          href="/admin/dashboard/pengaturan"
          className={`${buttonBase} bg-[#E5EEFF] text-[#172B4D] hover:bg-[#D6E4FF]`}
        >
          <PhoneCall size={18} className="text-[#A83D00]" />
          Ubah Konfigurasi WhatsApp
        </Link>
      </div>

      {showExport && (
        <div className="mt-5 rounded-lg border border-[#E5EAF3] bg-[#F8FAFD] p-4">
          <h3 className="text-sm font-bold text-[#172B4D]">
            Pengaturan Export Katalog
          </h3>

          <p className="mt-1 text-xs text-[#64748B]">
            Tentukan kategori dan format data yang ingin diunduh.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold text-[#172B4D]">
                Kategori Produk
              </label>

              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-[#DCE4F0] bg-white px-3 py-2.5 text-xs text-[#172B4D] outline-none"
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
              <label className="mb-2 block text-xs font-semibold text-[#172B4D]">
                Format File
              </label>

              <select
                value={format}
                onChange={(e) =>
                  setFormat(e.target.value as "csv" | "xlsx" | "pdf")
                }
                className="w-full rounded-md border border-[#DCE4F0] bg-white px-3 py-2.5 text-xs text-[#172B4D] outline-none"
              >
                <option value="csv">CSV (.csv)</option>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="pdf">PDF (.pdf)</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                disabled={!!categoryError}
                onClick={() => {
                  onExport?.(
                    categoryId === "all" ? null : Number(categoryId),
                    format
                  );
                }}
                className="flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-md bg-[#A83D00] px-4 py-2 text-xs font-bold text-white hover:bg-[#8F3400] disabled:opacity-50"
              >
                <Download size={16} />
                Unduh Data
              </button>

              <button
                type="button"
                onClick={() => setShowExport(false)}
                className="min-h-[40px] rounded-md border border-[#DCE4F0] bg-white px-3 text-xs font-semibold text-[#64748B]"
              >
                Batal
              </button>
            </div>
          </div>

          {categoryError && (
            <p className="mt-2 text-xs text-red-600">
              {categoryError}
            </p>
          )}
        </div>
      )}
    </section>
  );
}