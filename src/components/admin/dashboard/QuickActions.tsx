
"use client";

import Link from "next/link";
import {
  PlusCircle,
  FolderPlus,
  Download,
  PhoneCall,
  Zap,
} from "lucide-react";

interface QuickActionsProps {
  onExport?: () => void;
}

export default function QuickActions({
  onExport,
}: QuickActionsProps) {
  const buttonBase =
    "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md px-4 py-2 text-[14px] font-semibold transition-all duration-200";

  return (
    <section className="rounded-xl border border-[#E5EAF3] bg-white px-6 py-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-[20px] font-bold text-[#172B4D]">
        <Zap size={21} className="text-[#A83D00]" />
        Aksi Cepat Pengelolaan
      </h2>

      <div className="flex flex-wrap items-center gap-3">
        {/* Tambah Produk */}
        <Link
          href="/admin/dashboard/produk"
          className={`${buttonBase} bg-[#A83D00] text-white hover:bg-[#8F3400]`}
        >
          <PlusCircle size={19} />
          Tambah Produk Baru
        </Link>

        {/* Tambah Kategori */}
        <Link
          href="/admin/dashboard/kategori"
          className={`${buttonBase} bg-[#E5EEFF] text-[#172B4D] hover:bg-[#D6E4FF]`}
        >
          <FolderPlus size={19} />
          Tambah Kategori
        </Link>

        {/* Export Data */}
        <button
          type="button"
          onClick={onExport}
          className={`${buttonBase} bg-[#E5EEFF] text-[#172B4D] hover:bg-[#D6E4FF]`}
        >
          <Download size={19} />
          Export Data Katalog (CSV/PDF)
        </button>

        {/* Konfigurasi WhatsApp */}
        <Link
          href="/admin/dashboard/pengaturan"
          className={`${buttonBase} bg-[#E5EEFF] text-[#172B4D] hover:bg-[#D6E4FF]`}
        >
          <PhoneCall size={18} className="text-[#A83D00]" />
          Ubah Konfigurasi WhatsApp
        </Link>
      </div>
    </section>
  );
}
