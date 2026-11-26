"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  RefreshCw,
  Image as ImageIcon,
  Play,
  Pause,
  Square,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Upload,
} from "lucide-react";
import Swal from "sweetalert2";
import { api } from "@/lib/types";

type Summary = {
  total: number;
  withPhoto: number;
  withoutPhoto: number;
  searched: number;
  notSearched: number;
  menungguReview: number;
  dipilih: number;
  gagal: number;
  tidakDitemukan: number;
  dilewati: number;
  mencari: number;
  belumDicari: number;
};

type Quota = {
  planName: string | null;
  searchesPerMonth: number | null;
  planSearchesLeft: number | null;
  totalSearchesLeft: number | null;
  thisMonthUsage: number | null;
  hourlyLimit: number | null;
  fetchedAt: string;
};

type Candidate = {
  id: number;
  produk_id: number;
  posisi: number;
  judul: string | null;
  image_url: string;
  thumbnail_url: string | null;
  source_url: string | null;
  domain: string | null;
  provider: string;
  relevansi: number;
  dipilih: boolean;
};

type ProductItem = {
  id: number;
  kode_produk: string;
  nama_produk: string;
  satuan: string;
  foto_url: string | null;
  kategori: { id: number; nama_kategori: string } | null;
  subkategori: { id: number; nama_subkategori: string } | null;
  pencarian: {
    status: string;
    query: string | null;
    jumlah_request: number;
    percobaan: number;
    error_terakhir: string | null;
  } | null;
  kandidat: Candidate[];
};

const STATUS_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "belum_dicari", label: "Belum dicari" },
  { value: "menunggu_review", label: "Menunggu review" },
  { value: "dipilih", label: "Sudah dipilih" },
  { value: "gagal", label: "Gagal" },
  { value: "tidak_ditemukan", label: "Tidak ditemukan" },
  { value: "dilewati", label: "Dilewati" },
];

const STATUS_LABEL: Record<string, string> = {
  belum_dicari: "Belum dicari",
  mencari: "Sedang dicari",
  menunggu_review: "Menunggu review",
  dipilih: "Sudah dipilih",
  gagal: "Gagal",
  tidak_ditemukan: "Tidak ditemukan",
  dilewati: "Dilewati",
};

function relevanceLabel(score: number) {
  if (score >= 60) return "Tinggi";
  if (score >= 35) return "Sedang";
  return "Rendah";
}

function SafeImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-[#edf2ff] text-[#ad3b00] ${className ?? ""}`}>
        <ImageIcon size={18} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export default function ImageFinderPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(24);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [autoSelect, setAutoSelect] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<
    { id: number; nama_kategori: string; total: number; withPhoto: number; withoutPhoto: number }[]
  >([]);
  const [duplicates, setDuplicates] = useState<{
    duplicateGroups: number;
    duplicateProducts: number;
    groups: { name: string; total: number; searched: number; withPhoto: number }[];
    alreadySearchedWithPhoto: number;
    totalProducts: number;
    commonKeywords: { keyword: string; count: number; withoutPhoto: number }[];
  } | null>(null);

  const [limit, setLimit] = useState(10);
  const [candidates, setCandidates] = useState(5);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, success: 0, failed: 0, notFound: 0 });
  const [lastMessage, setLastMessage] = useState("");

  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total: number; updated: number; skipped: number; notFound: number;
  } | null>(null);

  const cancelRef = useRef(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const loadSummary = useCallback(async () => {
    const data = await api<Summary>("/api/image-finder/summary");
    setSummary(data);
  }, []);

  const loadDuplicates = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategoryId) params.set("kategoriId", String(selectedCategoryId));
      const data = await api<{
        duplicateGroups: number;
        duplicateProducts: number;
        groups: { name: string; total: number; searched: number; withPhoto: number }[];
        alreadySearchedWithPhoto: number;
        totalProducts: number;
        commonKeywords: { keyword: string; count: number; withoutPhoto: number }[];
      }>(`/api/image-finder/duplicates${params.toString() ? `?${params.toString()}` : ""}`);
      setDuplicates(data);
    } catch {
      setDuplicates(null);
    }
  }, [selectedCategoryId]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await api<{
        categories: { id: number; nama_kategori: string; total: number; withPhoto: number; withoutPhoto: number }[];
      }>("/api/image-finder/categories");
      setCategories(data.categories);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadQuota = useCallback(async (force = false) => {
    try {
      const data = await api<Quota>(`/api/image-finder/quota${force ? "?force=1" : ""}`);
      setQuota(data);
    } catch {
      setQuota(null);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (selectedCategoryId) params.set("kategoriId", String(selectedCategoryId));
      const data = await api<{ total: number; products: ProductItem[] }>(
        `/api/image-finder/products?${params.toString()}`
      );
      setProducts(data.products);
      setTotal(data.total);
    } finally {
      setLoadingProducts(false);
    }
  }, [statusFilter, page, pageSize, searchQuery, selectedCategoryId]);

  useEffect(() => {
    loadSummary();
    loadQuota();
    loadProducts();
    loadDuplicates();
    loadCategories();
  }, [loadSummary, loadQuota, loadProducts, loadDuplicates, loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [statusFilter, page, searchQuery, loadProducts]);

  const availableQuota = quota?.totalSearchesLeft ?? quota?.planSearchesLeft ?? null;

  async function applySame(product: ProductItem) {
    const candidateId = product.kandidat.find((c) => c.dipilih)?.id;
    if (!candidateId) {
      Swal.fire("Info", "Belum ada gambar yang dipilih otomatis untuk produk ini.", "info");
      return;
    }

    const confirm = await Swal.fire({
      title: "Terapkan ke produk dengan nama sama?",
      text: "Gambar akan diterapkan ke produk lain dengan nama yang identik (hanya yang belum punya foto).",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Terapkan",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;

    const res = await api<{ applied: number; totalTargets: number }>(
      "/api/image-finder/apply-same",
      {
        method: "POST",
        body: JSON.stringify({
          sourceProductId: product.id,
          candidateId,
          overwrite: false,
        }),
      }
    );

    await loadProducts();
    await loadSummary();
    await loadDuplicates();
    await loadCategories();

    Swal.fire(
      "Selesai",
      `Diterapkan ke ${res.applied} dari ${res.totalTargets} produk target.`,
      "success"
    );
  }

  async function markStatus(productId: number, status: "dilewati" | "tidak_ditemukan" | "belum_dicari") {
    await api("/api/image-finder/status", {
      method: "POST",
      body: JSON.stringify({ productId, status }),
    });
    await loadProducts();
    await loadSummary();
    await loadDuplicates();
    await loadCategories();
  }

  async function runSearch(overrides?: {
    kategoriId?: number | null;
    nameContains?: string;
    autoSelect?: boolean;
    ignoreSelection?: boolean;
  }) {
    if (running) return;
    cancelRef.current = false;
    setCancelRequested(false);
    setPaused(false);
    setRunning(true);
    setProgress({ processed: 0, success: 0, failed: 0, notFound: 0 });
    setLastMessage("");

    try {
      while (!cancelRef.current) {
        if (pausedRef.current) {
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }

        const ids: number[] = [];
        const body: Record<string, unknown> = {
          limit,
          candidates,
          force: false,
          keyword: keyword.trim() || undefined,
          autoSelect: overrides?.autoSelect ?? autoSelect,
        };
        const targetCategory = overrides?.kategoriId ?? selectedCategoryId;
        if (targetCategory) body.kategoriId = targetCategory;
        if (overrides?.nameContains) body.nameContains = overrides.nameContains;
        if (ids.length > 0) body.productIds = ids;

        const res = await api<{
          processed: number;
          stopped: boolean;
          stopReason: string | null;
          results: Array<{ productId: number; status: string; error?: string }>;
        }>("/api/image-finder/search-batch", {
          method: "POST",
          body: JSON.stringify(body),
        });

        const success = res.results.filter((r) => r.status === "menunggu_review").length;
        const failed = res.results.filter((r) => r.status === "gagal").length;
        const notFound = res.results.filter((r) => r.status === "tidak_ditemukan").length;

        setProgress((prev) => ({
          processed: prev.processed + res.processed,
          success: prev.success + success,
          failed: prev.failed + failed,
          notFound: prev.notFound + notFound,
        }));

        await loadProducts();
        await loadSummary();
        await loadDuplicates();
        await loadCategories();

        if (res.stopped) {
          if (res.stopReason === "rate_limited" || res.stopReason === "quota") {
            setLastMessage("Kuota atau rate limit tercapai. Lanjutkan nanti.");
          } else if (res.stopReason === "invalid_key") {
            setLastMessage("API key SerpApi tidak valid.");
          }
          break;
        }

        if (res.processed === 0) break;
      }
    } catch (e) {
      setLastMessage(e instanceof Error ? e.message : "Pencarian gagal.");
    } finally {
      setRunning(false);
    }
  }

  function searchByKeyword(keywordValue: string) {
    if (running) return;
    void runSearch({
      kategoriId: selectedCategoryId,
      nameContains: keywordValue,
      autoSelect: true,
      ignoreSelection: true,
    });
  }

  function parseImportItems(text: string): { kode_produk: string; foto_url: string }[] {
    const items: { kode_produk: string; foto_url: string }[] = [];
    const trimmed = text.trim();
    if (!trimmed) return items;

    // Try JSON first
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        const arr = Array.isArray(parsed) ? parsed : parsed.items ?? [];
        for (const row of arr) {
          const kode = row.kode_produk ?? row.kode ?? row.code;
          const url = row.foto_url ?? row.url ?? row.foto;
          if (kode && url) items.push({ kode_produk: String(kode).trim(), foto_url: String(url).trim() });
        }
        return items;
      } catch {
        // fall through to SQL/CSV
      }
    }

    // SQL: UPDATE produk SET foto_url = '...' WHERE kode_produk = '...';
    const sqlRegex = /UPDATE\s+produk\s+SET\s+foto_url\s*=\s*'([^']+)'\s+WHERE\s+kode_produk\s*=\s*'([^']+)'/gi;
    let m: RegExpExecArray | null;
    while ((m = sqlRegex.exec(trimmed)) !== null) {
      items.push({ foto_url: m[1], kode_produk: m[2] });
    }
    if (items.length > 0) return items;

    // CSV: header + rows
    const lines = trimmed.split(/\\r?\\n/).filter((l) => l.trim());
    if (lines.length >= 2) {
      const header = lines[0].toLowerCase().split(/[;,]/).map((h) => h.trim());
      const kodeIdx = header.findIndex((h) => h === "kode_produk" || h === "kode" || h === "code");
      const urlIdx = header.findIndex((h) => h === "foto_url" || h === "url" || h === "foto");
      if (kodeIdx >= 0 && urlIdx >= 0) {
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/[;,]/).map((c) => c.trim().replace(/^"|"$/g, ""));
          if (cols[kodeIdx] && cols[urlIdx]) {
            items.push({ kode_produk: cols[kodeIdx], foto_url: cols[urlIdx] });
          }
        }
      }
    }
    return items;
  }

  async function handleImport() {
    if (importing) return;
    const items = parseImportItems(importText);
    if (items.length === 0) {
      Swal.fire("Info", "Tidak ada item yang bisa diparse. Periksa format (SQL/JSON/CSV).", "info");
      return;
    }
    const confirm = await Swal.fire({
      title: `Import ${items.length} foto URL?`,
      text: "Produk akan diperbarui berdasarkan kode_produk.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Import",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;

    setImporting(true);
    setImportResult(null);
    try {
      const res = await api<{
        total: number; updated: number; skipped: number; notFound: number;
      }>("/api/image-finder/import-foto-url", {
        method: "POST",
        body: JSON.stringify({ items }),
      });
      setImportResult(res);
      await loadSummary();
      Swal.fire(
        "Selesai",
        `Total ${res.total}: diperbarui ${res.updated}, dilewati ${res.skipped}, tidak ditemukan ${res.notFound}.`,
        "success"
      );
    } catch (e) {
      Swal.fire("Gagal", e instanceof Error ? e.message : "Import gagal.", "error");
    } finally {
      setImporting(false);
    }
  }

  function pause() {
    setPaused(true);
  }
  function resume() {
    setPaused(false);
  }
  function cancel() {
    cancelRef.current = true;
    setCancelRequested(true);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen space-y-6 bg-[#F2F5FC] p-4 sm:p-6 lg:p-7">
      <section>
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#A83D00]">
          <ImageIcon size={14} />
          Operational Command & Data Hub
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-[#172B4D] sm:text-3xl">
          Pencari Gambar Produk
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#64748B]">
          Cari gambar produk via SerpApi Google Images. Sistem otomatis menyimpan gambar dengan relevansi tinggi; produk yang tidak cocok bisa ditinjau manual.
        </p>
      </section>

      {/* Panduan cepat */}
      <section className="rounded-xl border border-[#E5EAF3] bg-white p-5">
        <h2 className="text-sm font-bold text-[#172B4D]">Panduan Cepat</h2>
        <ol className="mt-3 grid gap-2 text-sm text-[#172B4D] sm:grid-cols-2 lg:grid-cols-3">
          <li><span className="font-bold text-[#A83D00]">1.</span> Cek sisa kuota SerpApi.</li>
          <li><span className="font-bold text-[#A83D00]">2.</span> Klik <b>Mulai Pencarian Otomatis</b>.</li>
          <li><span className="font-bold text-[#A83D00]">3.</span> Tunggu batch selesai (Pause/Cancel jika perlu).</li>
          <li><span className="font-bold text-[#A83D00]">4.</span> Sistem otomatis menyimpan gambar relevansi tinggi (≥60).</li>
          <li><span className="font-bold text-[#A83D00]">5.</span> Hasil otomatis tersimpan; cek produk di katalog/admin produk.</li>
          <li><span className="font-bold text-[#A83D00]">6.</span> Ulangi sampai kuota habis/selesai.</li>
        </ol>
        <p className="mt-3 text-xs text-[#64748B]">
          Tip: pilih kategori dan/atau kata kunci; sistem memproses produk tanpa foto secara otomatis.
        </p>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {[
          { label: "Total produk", value: summary?.total ?? 0 },
          { label: "Tanpa foto", value: summary?.withoutPhoto ?? 0 },
          { label: "Sudah foto", value: summary?.withPhoto ?? 0 },
          { label: "Sudah dicari", value: summary?.searched ?? 0 },
          { label: "Belum dicari", value: summary?.notSearched ?? 0 },
          { label: "Menunggu review", value: summary?.menungguReview ?? 0 },
          { label: "Gagal", value: summary?.gagal ?? 0 },
          { label: "Tidak ditemukan", value: summary?.tidakDitemukan ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-[#E5EAF3] bg-white p-4">
            <p className="text-[11px] font-semibold text-[#64748B]">{item.label}</p>
            <p className="mt-1 text-xl font-black text-[#172B4D]">{item.value}</p>
          </div>
        ))}
      </section>

      {/* Statistik nama serupa */}
      <section className="rounded-xl border border-[#E5EAF3] bg-white p-5">
        <h2 className="text-sm font-bold text-[#172B4D]">Produk dengan Nama Sama</h2>
        {duplicates ? (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-[#F2F5FC] p-3">
                <p className="text-[11px] text-[#64748B]">Kata kunci umum</p>
                <p className="text-lg font-black text-[#172B4D]">{duplicates.commonKeywords.length}</p>
              </div>
              <div className="rounded-lg bg-[#F2F5FC] p-3">
                <p className="text-[11px] text-[#64748B]">Produk terdampak kata kunci</p>
                <p className="text-lg font-black text-[#172B4D]">
                  {duplicates.commonKeywords.reduce((sum, item) => sum + item.count, 0)}
                </p>
              </div>
              <div className="rounded-lg bg-[#F2F5FC] p-3">
                <p className="text-[11px] text-[#64748B]">Sudah dicari & punya foto</p>
                <p className="text-lg font-black text-[#172B4D]">{duplicates.alreadySearchedWithPhoto}</p>
              </div>
              <div className="rounded-lg bg-[#F2F5FC] p-3">
                <p className="text-[11px] text-[#64748B]">Total produk</p>
                <p className="text-lg font-black text-[#172B4D]">{duplicates.totalProducts}</p>
              </div>
            </div>
            {duplicates.groups.length > 0 ? (
              <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-[#E5EAF3]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F2F5FC] text-[#64748B]">
                    <tr>
                      <th className="px-3 py-2">Nama produk</th>
                      <th className="px-3 py-2">Jumlah</th>
                      <th className="px-3 py-2">Sudah dicari</th>
                      <th className="px-3 py-2">Punya foto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicates.groups.map((group) => (
                      <tr key={group.name} className="border-t border-[#E5EAF3]">
                        <td className="px-3 py-2 text-[#172B4D]">{group.name}</td>
                        <td className="px-3 py-2">{group.total}</td>
                        <td className="px-3 py-2">{group.searched}</td>
                        <td className="px-3 py-2">{group.withPhoto}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#64748B]">Tidak ada produk dengan nama yang sama.</p>
            )}

            <h3 className="mt-4 text-xs font-bold text-[#172B4D]">Kata Kunci Umum</h3>
            {duplicates.commonKeywords.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {duplicates.commonKeywords.map((item) => (
                  <button
                    key={item.keyword}
                    type="button"
                    onClick={() => searchByKeyword(item.keyword)}
                    disabled={running || item.withoutPhoto === 0}
                    className="rounded-full bg-[#F2F5FC] px-3 py-1 text-xs font-semibold text-[#172B4D] hover:bg-[#E5EAF3] disabled:opacity-50"
                    title={`Cari & simpan otomatis untuk produk "${item.keyword}" yang belum punya foto`}
                  >
                    {item.keyword} ({item.count}, {item.withoutPhoto} tanpa foto)
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[#64748B]">Belum ada kata kunci yang berulang.</p>
            )}

            <h3 className="mt-4 text-xs font-bold text-[#172B4D]">Produk Tanpa Foto per Kategori</h3>
            {categories.length > 0 ? (
              <div className="mt-2 overflow-x-auto rounded-lg border border-[#E5EAF3]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F2F5FC] text-[#64748B]">
                    <tr>
                      <th className="px-3 py-2">Kategori</th>
                      <th className="px-3 py-2">Total</th>
                      <th className="px-3 py-2">Tanpa foto</th>
                      <th className="px-3 py-2">Punya foto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id} className="border-t border-[#E5EAF3]">
                        <td className="px-3 py-2 text-[#172B4D]">{category.nama_kategori}</td>
                        <td className="px-3 py-2">{category.total}</td>
                        <td className="px-3 py-2 font-bold text-[#A83D00]">{category.withoutPhoto}</td>
                        <td className="px-3 py-2">{category.withPhoto}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-2 text-xs text-[#64748B]">Belum ada data kategori.</p>
            )}
          </>
        ) : (
          <p className="mt-3 text-xs text-[#64748B]">Memuat statistik...</p>
        )}
      </section>

      {/* Config + Quota */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#E5EAF3] bg-white p-5">
          <h2 className="text-sm font-bold text-[#172B4D]">Konfigurasi Pencarian</h2>
          <p className="mt-2 text-xs text-[#64748B]">
            Default aman: 10 produk per batch, 5 kandidat per produk, 5 request bersamaan.
          </p>

          <label className="mt-3 block text-xs font-semibold text-[#64748B]">
            Kategori
            <select
              value={selectedCategoryId ?? ""}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value ? Number(e.target.value) : null);
                setPage(1);
              }}
              className="field mt-1"
            >
              <option value="">Semua kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nama_kategori} ({category.withoutPhoto} tanpa foto)
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 block text-xs font-semibold text-[#64748B]">
            Keyword tambahan (opsional)
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="contoh: kemasan, resmi, supplier"
              className="field mt-1"
            />
          </label>

          <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#64748B]">
            <input
              type="checkbox"
              checked={autoSelect}
              onChange={(e) => setAutoSelect(e.target.checked)}
            />
            Mode otomatis (simpan gambar relevansi tinggi tanpa review)
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            {!running ? (
              <button
                onClick={() => runSearch()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#A83D00] px-4 py-2 text-sm font-bold text-white hover:bg-[#873100]"
              >
                <Play size={16} /> Mulai Pencarian Otomatis
              </button>
            ) : (
              <>
                {!paused ? (
                  <button onClick={pause} className="inline-flex items-center gap-2 rounded-lg bg-[#172B4D] px-4 py-2 text-sm font-bold text-white">
                    <Pause size={16} /> Pause
                  </button>
                ) : (
                  <button onClick={resume} className="inline-flex items-center gap-2 rounded-lg bg-[#21804a] px-4 py-2 text-sm font-bold text-white">
                    <Play size={16} /> Resume
                  </button>
                )}
                <button onClick={cancel} disabled={cancelRequested} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                  <Square size={16} /> Cancel
                </button>
              </>
            )}
            <button
              onClick={() => { loadSummary(); loadProducts(); loadQuota(true); loadDuplicates(); loadCategories(); }}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E5EAF3] bg-white px-4 py-2 text-sm font-bold text-[#172B4D]"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          <p className="mt-3 text-xs text-[#64748B]">
            Estimasi request: {limit} produk ≈ {limit} request SerpApi. Pilih produk spesifik via checkbox di grid, atau kosongkan untuk memproses produk yang belum selesai.
          </p>
          <button
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
            className="mt-3 text-xs font-semibold text-[#21804a] hover:underline"
          >
            {showAdvanced ? "Sembunyikan pengaturan lanjutan" : "Tampilkan pengaturan lanjutan"}
          </button>

          {showAdvanced && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-semibold text-[#64748B]">
                Jumlah per batch
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={limit}
                  onChange={(e) => setLimit(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                  className="field mt-1"
                />
              </label>
              <label className="text-xs font-semibold text-[#64748B]">
                Kandidat per produk
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={candidates}
                  onChange={(e) => setCandidates(Math.max(1, Math.min(5, Number(e.target.value) || 1)))}
                  className="field mt-1"
                />
              </label>
              <label className="text-xs font-semibold text-[#64748B]">
                Concurrency (tetap)
                <input
                  type="number"
                  value={5}
                  disabled
                  className="field mt-1 bg-[#F2F5FC]"
                />
              </label>
            </div>
          )}

          {lastMessage && (
            <p className="mt-2 text-xs font-semibold text-red-600">{lastMessage}</p>
          )}
        </div>

        <div className="rounded-xl border border-[#E5EAF3] bg-white p-5">
          <h2 className="text-sm font-bold text-[#172B4D]">Kuota SerpApi</h2>
          {quota ? (
            <div className="mt-3 space-y-1 text-sm text-[#172B4D]">
              <p>Plan: <b>{quota.planName ?? "-"}</b></p>
              <p>Batas per bulan: <b>{quota.searchesPerMonth ?? "-"}</b></p>
              <p>Pencarian bulan ini: <b>{quota.thisMonthUsage ?? "-"}</b></p>
              <p>Sisa plan: <b>{quota.planSearchesLeft ?? "-"}</b></p>
              <p>Sisa total: <b>{quota.totalSearchesLeft ?? "-"}</b></p>
              <p>Batas per jam: <b>{quota.hourlyLimit ?? "-"}</b></p>
              <p className="text-xs text-[#64748B]">Diperbarui: {new Date(quota.fetchedAt).toLocaleString("id-ID")}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-red-600">Kuota tidak dapat dibaca. Proses pencarian diblokir.</p>
          )}
          <p className="mt-3 text-xs text-[#64748B]">
            Tersedia: <b>{availableQuota ?? "-"}</b> request.
          </p>
        </div>
      </section>

      {/* Progress */}
      {running && (
        <section className="rounded-xl border border-[#E5EAF3] bg-white p-5">
          <h2 className="text-sm font-bold text-[#172B4D]">Progress</h2>
          <div className="mt-2 h-2 w-full overflow-hidden rounded bg-[#E5EAF3]">
          <div
            className="h-full bg-[#A83D00] transition-all"
            style={{ width: `${Math.min(100, progress.processed > 0 ? 100 : 0)}%` }}
          />
        </div>
        <div className="mt-2 grid grid-cols-4 gap-3 text-sm">
            <div>Processed: <b>{progress.processed}</b></div>
            <div>Berhasil: <b className="text-green-600">{progress.success}</b></div>
            <div>Gagal: <b className="text-red-600">{progress.failed}</b></div>
            <div>Tidak ditemukan: <b>{progress.notFound}</b></div>
          </div>
        </section>
      )}

      {/* Import Foto URL */}
      <section className="rounded-xl border border-[#E5EAF3] bg-white p-5">
        <h2 className="text-sm font-bold text-[#172B4D]">Import Foto URL (SQL/JSON/CSV)</h2>
        <p className="mt-2 text-xs text-[#64748B]">
          Tempel isi file atau upload. Format: SQL UPDATE, JSON array, atau CSV (header kode_produk,foto_url).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#172B4D] px-4 py-2 text-sm font-bold text-white hover:bg-[#0f1f38]">
            <Upload size={16} /> Pilih File
            <input
              type="file"
              accept=".sql,.json,.csv,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setImportText(String(reader.result ?? ""));
                reader.readAsText(file);
              }}
            />
          </label>
          <span className="text-xs text-[#64748B]">
            Format: .sql, .json, .csv, .txt
          </span>
        </div>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={6}
          placeholder="Tempel SQL/JSON/CSV di sini..."
          className="field mt-3 w-full font-mono text-xs"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={handleImport}
            disabled={importing || !importText.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#A83D00] px-4 py-2 text-sm font-bold text-white hover:bg-[#873100] disabled:opacity-50"
          >
            {importing ? "Mengimpor..." : "Import Foto URL"}
          </button>
          <span className="text-xs text-[#64748B]">
            Terdeteksi: {parseImportItems(importText).length} item
          </span>
        </div>
        {importResult && (
          <p className="mt-3 text-xs text-[#172B4D]">
            Total {importResult.total}: diperbarui {importResult.updated}, dilewati {importResult.skipped}, tidak ditemukan {importResult.notFound}.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-[#E5EAF3] bg-white p-4 text-xs text-[#64748B]">
        <AlertTriangle size={14} className="inline mr-1" />
        Gambar bersumber dari Google Images via SerpApi. Verifikasi hak penggunaan sebelum dipakai komersial. URL eksternal dapat berubah atau kedaluwarsa; fallback ditampilkan jika gagal dimuat.
      </section>
    </div>
  );
}
