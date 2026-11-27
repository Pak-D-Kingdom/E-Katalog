"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, History, Search } from "lucide-react";
import { api, rupiah } from "@/lib/types";

type PriceValue = string | number | null;
type PriceSnapshot = {
  jenis_harga: string;
  harga: PriceValue;
  harga_min: PriceValue;
  harga_max: PriceValue;
};
type PriceHistoryEntry = {
  id: number;
  kode_produk: string;
  nama_produk: string;
  jenis_harga_lama: string;
  harga_lama: PriceValue;
  harga_min_lama: PriceValue;
  harga_max_lama: PriceValue;
  jenis_harga_baru: string;
  harga_baru: PriceValue;
  harga_min_baru: PriceValue;
  harga_max_baru: PriceValue;
  diubah_pada: string;
};
type Pagination = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function formatPrice(snapshot: PriceSnapshot) {
  if (snapshot.jenis_harga === "rentang") {
    if (snapshot.harga_min == null || snapshot.harga_max == null) return "—";
    return `${rupiah(snapshot.harga_min)} – ${rupiah(snapshot.harga_max)}`;
  }
  return snapshot.harga == null ? "—" : rupiah(snapshot.harga);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PriceHistoryPage() {
  const [entries, setEntries] = useState<PriceHistoryEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      page: String(page),
      q: submittedQuery,
    });

    setLoading(true);
    setError("");

    api<{ riwayatHarga: PriceHistoryEntry[]; pagination: Pagination }>(
      `/api/produk/riwayat-harga?${params}`
    )
      .then((result) => {
        if (!active) return;
        setEntries(result.riwayatHarga);
        setPagination(result.pagination);
      })
      .catch((cause: Error) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, submittedQuery]);

  function search(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSubmittedQuery(query.trim());
  }

  return (
    <div className="min-h-screen space-y-5 bg-[#F2F5FC] p-4 sm:p-6 lg:p-7">
      <section className="rounded-xl border border-[#E5EAF3] bg-white p-5 sm:p-6">
        <Link
          href="/admin/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] transition hover:text-[#A83D00]"
        >
          <ArrowLeft size={15} />
          Kembali ke Dashboard
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-[#A83D00]">
              <History size={18} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Data Produk
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#172B4D]">
              Riwayat Perubahan Harga
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              Catatan perubahan harga produk dari pengelolaan katalog.
            </p>
          </div>

          <form onSubmit={search} className="flex w-full gap-2 sm:max-w-sm">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#DCE4F0] bg-[#F8FAFD] px-3">
              <Search size={16} className="shrink-0 text-[#64748B]" />
              <input
                type="search"
                maxLength={191}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama produk atau SKU"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-xs text-[#172B4D] outline-none placeholder:text-[#94A3B8]"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-[#A83D00] px-4 text-xs font-bold text-white transition hover:bg-[#873100]"
            >
              Cari
            </button>
          </form>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#E5EAF3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAF0F8] px-5 py-4">
          <h2 className="text-sm font-bold text-[#172B4D]">
            Perubahan Terbaru
          </h2>
          <p className="text-xs text-[#64748B]">
            {pagination.total} perubahan tercatat
          </p>
        </div>

        {error ? (
          <p role="alert" className="p-6 text-sm text-red-600">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#F8FAFD] text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
                <tr>
                  <th className="px-5 py-3">Waktu</th>
                  <th className="px-5 py-3">Produk</th>
                  <th className="px-5 py-3">Harga Sebelumnya</th>
                  <th className="px-5 py-3">Harga Baru</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF1F7]">
                {entries.map((entry) => (
                  <tr key={entry.id} className="text-xs text-[#172B4D]">
                    <td className="whitespace-nowrap px-5 py-4 text-[#64748B]">
                      {formatDate(entry.diubah_pada)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{entry.nama_produk}</p>
                      <p className="mt-1 text-[10px] text-[#64748B]">
                        SKU: {entry.kode_produk}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#64748B]">
                      {formatPrice({
                        jenis_harga: entry.jenis_harga_lama,
                        harga: entry.harga_lama,
                        harga_min: entry.harga_min_lama,
                        harga_max: entry.harga_max_lama,
                      })}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-[#A83D00]">
                      {formatPrice({
                        jenis_harga: entry.jenis_harga_baru,
                        harga: entry.harga_baru,
                        harga_min: entry.harga_min_baru,
                        harga_max: entry.harga_max_baru,
                      })}
                    </td>
                  </tr>
                ))}
                {!loading && entries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <p className="text-sm font-semibold text-[#172B4D]">
                        {submittedQuery
                          ? "Tidak ada perubahan harga yang cocok."
                          : "Belum ada riwayat perubahan harga."}
                      </p>
                      {!submittedQuery && (
                        <p className="mt-1 text-xs text-[#64748B]">
                          Perubahan harga mulai dicatat setelah fitur ini aktif.
                        </p>
                      )}
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-[#64748B]">
                      Memuat riwayat harga...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EAF0F8] px-5 py-4">
          <p className="text-xs text-[#64748B]">
            Halaman {pagination.page} dari {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="flex h-9 items-center gap-1 rounded-lg border border-[#DCE4F0] px-3 text-xs font-semibold text-[#172B4D] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={loading || page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="flex h-9 items-center gap-1 rounded-lg border border-[#DCE4F0] px-3 text-xs font-semibold text-[#172B4D] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Berikutnya
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
