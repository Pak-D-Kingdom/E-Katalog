
"use client";

import { useEffect, useState } from "react";
import {
  CookingPot,
  Utensils,
  Wrench,
  BadgeCheck,
  ChartNoAxesCombined,
} from "lucide-react";

interface PortfolioItem {
  id: number;
  nama_kategori: string;
  jumlahProduk: number;
  percentage: number;
}

interface PortfolioResponse {
  totalProdukAktif: number;
  portfolio: PortfolioItem[];
  error?: string;
}

// Menyesuaikan ikon dengan nama kategori
function getCategoryIcon(category: string) {
  const name = category.toLowerCase();

  if (name.includes("peralatan")) {
    return CookingPot;
  }

  if (name.includes("bahan baku")) {
    return Utensils;
  }

  if (name.includes("perawatan")) {
    return Wrench;
  }

  if (
    name.includes("perizinan") ||
    name.includes("legalitas")
  ) {
    return BadgeCheck;
  }

  return ChartNoAxesCombined;
}

export default function InventoryPortfolio() {
  const [portfolioData, setPortfolioData] = useState<
    PortfolioItem[]
  >([]);

  const [totalProdukAktif, setTotalProdukAktif] =
    useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mengambil data portfolio dari API
  useEffect(() => {
    let isMounted = true;

    async function fetchPortfolio() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/dashboard/portfolio",
          { cache: "no-store" }
        );

        const result =
          (await response.json()) as PortfolioResponse;

        if (!response.ok) {
          throw new Error(
            result.error ||
            "Gagal mengambil data portfolio."
          );
        }

        if (isMounted) {
          setPortfolioData(result.portfolio);
          setTotalProdukAktif(result.totalProdukAktif);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat mengambil data."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPortfolio();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="space-y-4">
      {/* Heading */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[20px] font-bold text-[#172B4D]">
          <ChartNoAxesCombined
            size={21}
            className="text-[#596780]"
          />
          Ringkasan Portfolio & Distribusi Inventaris
        </h2>

        <p className="text-[13px] font-medium text-[#596780]">
          Total Produk Aktif:{" "}
          <span className="font-semibold text-[#172B4D]">
            {loading ? "Memuat..." : totalProdukAktif}
          </span>
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-[#E5EAF3] bg-white p-6 text-center text-sm text-[#596780]">
          Memuat data portfolio inventaris...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading &&
        !error &&
        portfolioData.length === 0 && (
          <div className="rounded-xl border border-[#E5EAF3] bg-white p-6 text-center text-sm text-[#596780]">
            Belum ada data kategori inventaris.
          </div>
        )}

      {/* Portfolio Cards */}
      {!loading && !error && portfolioData.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {portfolioData.map((item) => {
            const Icon = getCategoryIcon(
              item.nama_kategori
            );

            return (
              <div
                key={item.id}
                className="flex min-h-[260px] flex-col rounded-xl border border-[#E5EAF3] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                {/* Category and percentage */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold tracking-wide text-[#596780]">
                    DISTRIBUSI KATEGORI
                  </span>

                  <span
                    className={`text-[14px] font-bold ${item.percentage >= 30
                        ? "text-[#A83D00]"
                        : "text-[#596780]"
                      }`}
                  >
                    {item.percentage}%
                  </span>
                </div>

                {/* Title and icon */}
                <div className="mb-3 flex min-h-[48px] items-center justify-between gap-2">
                  <h3 className="text-[20px] font-semibold leading-tight text-[#172B4D]">
                    {item.nama_kategori}
                  </h3>

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.percentage >= 30
                        ? "bg-[#F9EDE6] text-[#A83D00]"
                        : "bg-[#E8F0FF] text-[#596780]"
                      }`}
                  >
                    <Icon size={19} />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-5 h-[9px] w-full overflow-hidden rounded-full bg-[#E5EEFF]">
                  <div
                    className="h-full rounded-full bg-[#A83D00] transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, item.percentage)
                      )}%`,
                    }}
                  />
                </div>

                {/* Information */}
                <div className="mt-auto grid grid-cols-2 gap-3 rounded-md bg-[#EEF3FF] px-3 py-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[#596780]">
                      Produk Aktif
                    </p>

                    <p className="text-[16px] font-bold leading-tight text-[#172B4D]">
                      {item.jumlahProduk}
                    </p>

                    <p className="text-[13px] font-medium text-[#172B4D]">
                      Produk
                    </p>
                  </div>

                  <div className="min-w-0 text-right">
                    <p className="text-[11px] font-medium text-[#596780]">
                      Dari Total Katalog
                    </p>

                    <p className="break-words text-[16px] font-bold leading-tight text-[#A83D00]">
                      {item.jumlahProduk} / {totalProdukAktif}
                    </p>

                    <p className="text-[11px] text-[#596780]">
                      Produk aktif
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
