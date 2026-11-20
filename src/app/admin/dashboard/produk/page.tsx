
"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
  Package,
  Star,
  Wallet,
  RefreshCw,
  MessageSquare,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Save,
  RotateCcw,
  Building2,
} from "lucide-react";
import {
  api,
  Category,
  Subcategory,
  Product,
  rupiah,
  slugify,
} from "@/lib/types";

type ProductForm = {
  kategori_id: string;
  subkategori_id: string;

  kode_produk: string;
  nama_produk: string;
  slug: string;
  deskripsi: string;
  kalori: string;
  protein: string;
  karbohidrat: string;
  lemak: string;
  harga: string;
  satuan: string;
  foto_url: string;
  tersedia: boolean;
};

const empty: ProductForm = {
  kategori_id: "",
  subkategori_id: "",
  kode_produk: "",
  nama_produk: "",
  slug: "",
  deskripsi: "",
  kalori: "0",
  protein: "0",
  karbohidrat: "0",
  lemak: "0",
  harga: "",
  satuan: "porsi",
  foto_url: "",
  tersedia: true,
};

const PAGE_SIZE = 4;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [form, setForm] = useState<ProductForm>(empty);

  const [editing, setEditing] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const [p, c, s] = await Promise.all([
      api<{ produk?: Product[] }>("/api/produk"),
      api<{ kategori?: Category[] }>("/api/kategori"),
      api<{ subkategori?: Subcategory[] }>("/api/subkategori"),
    ]);

    setProducts(Array.isArray(p.produk) ? p.produk : []);
    setCategories(Array.isArray(c.kategori) ? c.kategori : []);
    setSubcategories(
      Array.isArray(s.subkategori) ? s.subkategori : []
    );
  }

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, []);

  function startEdit(product?: Product) {
    if (product) {
      setEditing(product.id);

      setForm({
        kategori_id: product.kategori_id
          ? String(product.kategori_id)
          : "",
        subkategori_id: product.subkategori_id
          ? String(product.subkategori_id)
          : "",
        kode_produk: product.kode_produk,
        nama_produk: product.nama_produk,
        slug: product.slug,
        deskripsi: product.deskripsi,
        kalori: String(product.informasi_gizi.kalori),
        protein: String(product.informasi_gizi.protein),
        karbohidrat: String(product.informasi_gizi.karbohidrat),
        lemak: String(product.informasi_gizi.lemak),
        harga: String(product.harga),
        satuan: product.satuan,
        foto_url: product.foto_url || "",
        tersedia: product.tersedia,
      });
    } else {
      setEditing(null);
      setForm(empty);
    }

    setError("");
    setMessage("");
  }

  function changeName(value: string) {
    setForm((current) => ({
      ...current,
      nama_produk: value,
      ...(editing ? {} : {
        slug: slugify(value),
        kode_produk: current.kode_produk || generateSku(value, current.kategori_id),
      }),
    }));
  }

  function generateSku(name: string, categoryId: string) {
    const category = categories.find((item) => String(item.id) === categoryId);
    const prefixes: Record<string, string> = {
      "Bahan Baku": "RAW",
      "Peralatan": "EQ",
      "Perawatan": "SRV",
      "Perizinan": "LEG",
    };
    const prefix = category ? (prefixes[category.nama_kategori] || "PRD") : "PRD";
    const words = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const nameCode = words.slice(0, 2).map((word) => word.slice(0, 4)).join("-");
    const base = nameCode ? `${prefix}-${nameCode}` : prefix;

    let index = 1;
    let candidate = `${base}-${String(index).padStart(3, "0")}`;
    const used = new Set(products.map((product) => product.kode_produk.toUpperCase()));
    while (used.has(candidate)) {
      index += 1;
      candidate = `${base}-${String(index).padStart(3, "0")}`;
    }
    return candidate;
  }

  function changeCategory(value: string) {
    setForm((current) => ({
      ...current,
      kategori_id: value,
      subkategori_id: "",
      ...(editing
        ? {}
        : {
          kode_produk: /^(PRD|RAW|SNK|PKG|EQ|SRV|LEG)-/.test(
            current.kode_produk
          )
            ? generateSku(current.nama_produk, value)
            : current.kode_produk ||
            generateSku(current.nama_produk, value),
        }),
    }));
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append("file", file);

    setUploading(true);
    setError("");

    try {
      const result = await api<{ foto_url: string }>("/api/upload", {
        method: "POST",
        body,
      });

      setForm((current) => ({
        ...current,
        foto_url: result.foto_url,
      }));

      setMessage("Foto produk berhasil diunggah.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const generatedKode = form.kode_produk.trim()
      || generateSku(form.nama_produk, form.kategori_id);
    const generatedSlug = form.slug.trim()
      || slugify(form.nama_produk);

    const payload = {
      kategori_id: Number(form.kategori_id),
      subkategori_id: form.subkategori_id
        ? Number(form.subkategori_id)
        : null,
      kode_produk: generatedKode,
      nama_produk: form.nama_produk,
      slug: generatedSlug,
      deskripsi: form.deskripsi,
      informasi_gizi: {
        kalori: Number(form.kalori),
        protein: Number(form.protein),
        karbohidrat: Number(form.karbohidrat),
        lemak: Number(form.lemak),
      },
      harga: Number(form.harga),
      satuan: form.satuan,
      foto_url: form.foto_url || null,
      tersedia: form.tersedia,
    };

    try {
      await api(
        editing ? `/api/produk/${editing}` : "/api/produk",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      await load();
      setForm(empty);
      setEditing(null);
      setMessage(
        editing
          ? "Produk berhasil diperbarui."
          : "Produk baru berhasil ditambahkan."
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: number) {
    if (
      !window.confirm(
        "Hapus produk ini? Riwayat pesanan tetap menyimpan snapshot item."
      )
    ) {
      return;
    }

    try {
      await api(`/api/produk/${id}`, { method: "DELETE" });
      await load();
      setMessage("Produk berhasil dihapus.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const availableSubcategories = useMemo(
    () =>
      subcategories.filter(
        (item) => String(item.kategori_id) === form.kategori_id
      ),
    [subcategories, form.kategori_id]
  );

  const filterSubcategories = useMemo(
    () =>
      categoryFilter === "all"
        ? subcategories
        : subcategories.filter(
          (item) => String(item.kategori_id) === categoryFilter
        ),
    [subcategories, categoryFilter]
  );
  const filtered = useMemo(() => {
    return products.filter((product) => {
      const keyword = query.toLowerCase();

      const matchesSearch =
        `${product.nama_produk} ${product.kode_produk} ${product.subkategori?.nama_subkategori || ""}`
          .toLowerCase()
          .includes(keyword);

      const matchesCategory =
        categoryFilter === "all" ||
        String(product.kategori_id) === categoryFilter;

      const matchesSubcategory =
        subcategoryFilter === "all" ||
        String(product.subkategori_id ?? "") === subcategoryFilter;

      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [products, query, categoryFilter, subcategoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const visibleProducts = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const availableCount = products.filter((p) => p.tersedia).length;
  const photoCount = products.filter((p) => p.foto_url).length;

  const stats = [
    {
      title: "TOTAL KATALOG AKTIF",
      value: `${availableCount} Produk`,
      description: `${products.length} produk terdaftar`,
      icon: Package,
      color: "text-[#A83D00]",
      background: "bg-[#E8F0FF]",
    },
    {
      title: "PRODUK TERSEDIA",
      value: `${availableCount} Item`,
      description: "Produk aktif di katalog",
      icon: CheckCircle2,
      color: "text-emerald-700",
      background: "bg-emerald-50",
    },
    {
      title: "STRUKTUR KATEGORI",
      value: `${(categories ?? []).length} Kategori`,
      description: "Kelompok produk terdaftar",
      icon: Star,
      color: "text-[#A83D00]",
      background: "bg-[#FCE9E1]",
    },
    {
      title: "FOTO PRODUK",
      value: `${photoCount} Foto`,
      description: "Produk dengan gambar",
      icon: Wallet,
      color: "text-[#42577E]",
      background: "bg-[#E8F0FF]",
    },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-[#F2F5FC] p-4 sm:p-6 lg:p-7">

      {/* HEADER */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-md bg-[#EAF0FC] px-3 py-2 text-[11px] font-semibold text-[#42577E]">
            <Building2 size={14} />
            Warehouse Utama: Marunda Logistik Hub
          </div>

          <div className="flex items-center gap-3 text-[#596780]">
            <button
              type="button"
              aria-label="Notifikasi"
              className="rounded-lg p-2 hover:bg-white"
            >
              <MessageSquare size={18} />
            </button>
            <button
              type="button"
              aria-label="Muat ulang data"
              onClick={() => load().catch((e: Error) => setError(e.message))}
              className="rounded-lg p-2 hover:bg-white"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#A83D00]">
              <SlidersHorizontal size={14} />
              Operational Command & Data Hub
            </p>

            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-[#172B4D] sm:text-3xl">
              Manajemen Katalog Produk & Pengaturan WhatsApp B2B
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#64748B]">
              Kelola listing produk komersial, spesifikasi teknis peralatan
              kitchen, dan informasi katalog B2B.
            </p>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex w-full rounded-xl bg-[#EAF0FC] p-1.5 xl:w-[340px]">
            <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-3 py-3 text-[#172B4D] shadow-sm">
              <Package size={17} className="shrink-0 text-[#A83D00]" />
              <span className="text-center text-[11px] font-bold">
                Manajemen Produk (CRUD)
              </span>
              <span className="rounded-full bg-[#FCE9E1] px-2 py-1 text-[9px] font-bold text-[#A83D00]">
                {products.length}
              </span>
            </div>

            <a
              href="/admin/dashboard/pengaturan"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-[#596780] transition hover:bg-white/70"
            >
              <MessageSquare size={16} />
              <span className="text-center text-[11px] font-semibold">
                Pengaturan WhatsApp & Brand
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex min-h-[112px] items-center justify-between gap-3 rounded-xl border border-[#E5EAF3] bg-white p-4"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-wide text-[#596780]">
                  {item.title}
                </p>

                <h2 className="mt-2 text-xl font-extrabold text-[#172B4D]">
                  {item.value}
                </h2>

                <p className="mt-1 text-[10px] text-[#64748B]">
                  {item.description}
                </p>
              </div>

              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${item.background} ${item.color}`}
              >
                <Icon size={21} />
              </div>
            </div>
          );
        })}
      </section>

      {/* ALERTS */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          <CheckCircle2 size={17} />
          {message}
        </div>
      )}

      {/* MAIN TWO-COLUMN LAYOUT */}
      <section className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.55fr_0.85fr]">

        {/* PRODUCT LIST */}
        <div className="min-w-0 rounded-xl border border-[#E5EAF3] bg-white p-5 sm:p-6">

          {/* FILTERS */}
          <div className="mb-5 flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex flex-1 items-center gap-2 rounded-md border border-[#E5EAF3] bg-[#F8FAFD] px-3">
                <Search size={16} className="shrink-0 text-[#64748B]" />

                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari nama produk atau SKU..."
                  className="w-full bg-transparent py-3 text-xs text-[#172B4D] outline-none placeholder:text-[#94A3B8]"
                />

                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Hapus pencarian"
                  >
                    <X size={15} className="text-[#64748B]" />
                  </button>
                )}
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setSubcategoryFilter("all");
                  setPage(1);
                }}
                className="rounded-md border border-[#E5EAF3] bg-[#EAF0FC] px-3 py-3 text-xs text-[#172B4D] outline-none"
                aria-label="Filter kategori"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nama_kategori}
                  </option>
                ))}
              </select>
              <select
                value={subcategoryFilter}
                onChange={(e) => {
                  setSubcategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-md border border-[#E5EAF3] bg-[#EAF0FC] px-3 py-3 text-xs text-[#172B4D] outline-none"
                aria-label="Filter subkategori"
              >
                <option value="all">Semua Subkategori</option>
                {filterSubcategories.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.nama_subkategori}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[#64748B]">
                Daftar SKU dan produk katalog
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit()}
                  className="flex items-center gap-2 rounded-md bg-[#A83D00] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#873100]"
                >
                  <Plus size={15} />
                  Tambah SKU
                </button>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[590px] border-collapse text-left">
              <thead>
                <tr className="bg-[#EEF3FF] text-[10px] font-bold uppercase tracking-wide text-[#596780]">
                  <th className="px-3 py-3">Item & Identitas SKU</th>
                  <th className="px-3 py-3">Kategori Logistik</th>
                  <th className="px-3 py-3">Harga B2B Satuan</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {visibleProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-[#EDF1F7] transition hover:bg-[#F8FAFD]"
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#EAF0FC] text-[#A83D00]">
                          {product.foto_url ? (
                            <img
                              src={product.foto_url}
                              alt={product.nama_produk}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImagePlus size={18} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[210px] text-xs font-bold text-[#172B4D]">
                            {product.nama_produk}
                          </p>

                          <p className="mt-1 text-[9px] font-semibold tracking-wide text-[#64748B]">
                            SKU: {product.kode_produk}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-block max-w-[150px] rounded-sm bg-[#DCE7FF] px-2 py-1 text-[9px] font-medium text-[#172B4D]">
                          {product.kategori?.nama_kategori || "Tanpa kategori"}
                        </span>

                        {product.subkategori?.nama_subkategori && (
                          <span className="inline-block max-w-[150px] rounded-sm bg-[#FCE9E1] px-2 py-1 text-[9px] font-medium text-[#A83D00]">
                            {product.subkategori.nama_subkategori}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-4 text-[11px] font-bold text-[#172B4D]">
                      {rupiah(product.harga)}
                      <span className="block text-[9px] font-normal text-[#64748B]">
                        /{product.satuan}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${product.tersedia
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                          }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${product.tersedia
                            ? "bg-emerald-500"
                            : "bg-slate-400"
                            }`}
                        />
                        {product.tersedia ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          aria-label={`Edit ${product.nama_produk}`}
                          className="rounded-md p-2 text-[#64748B] hover:bg-[#FCE9E1] hover:text-[#A83D00]"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => remove(product.id)}
                          aria-label={`Hapus ${product.nama_produk}`}
                          className="rounded-md p-2 text-[#64748B] hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {visibleProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-xs text-[#64748B]"
                    >
                      Produk tidak ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EAF0F8] pt-4">
            <p className="text-[10px] text-[#64748B]">
              Menampilkan{" "}
              <b className="text-[#172B4D]">{visibleProducts.length}</b> dari{" "}
              <b className="text-[#172B4D]">{filtered.length}</b> produk terdaftar
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md bg-[#E5EDFF] p-2 text-[#172B4D] disabled:opacity-40"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(
                  Math.max(0, Math.min(currentPage - 2, totalPages - 3)),
                  Math.max(3, Math.min(currentPage + 1, totalPages))
                )
                .map((number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => setPage(number)}
                    className={`min-w-8 rounded-md px-2 py-2 text-[10px] font-bold ${currentPage === number
                      ? "bg-[#A83D00] text-white"
                      : "bg-[#E5EDFF] text-[#172B4D]"
                      }`}
                  >
                    {number}
                  </button>
                ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md bg-[#E5EDFF] p-2 text-[#172B4D] disabled:opacity-40"
                aria-label="Halaman selanjutnya"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* PRODUCT FORM */}
        <div className="min-w-0 rounded-xl border border-[#E5EAF3] bg-white p-5 sm:p-6">

          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-sm bg-[#A83D00] px-2 py-1 text-[9px] font-bold text-white">
                  {editing ? "EDIT PRODUK" : "TAMBAH BARU"}
                </span>

                <span className="text-[9px] font-bold tracking-wide text-[#64748B]">
                  AUTO-GEN SKU
                </span>
              </div>

              <h2 className="text-lg font-semibold text-[#172B4D]">
                {editing ? "Form Edit Produk" : "Form Input Produk Baru"}
              </h2>

              <p className="mt-1 text-[11px] text-[#64748B]">
                Lengkapi informasi produk komersial.
              </p>
            </div>

            <button
              type="button"
              onClick={() => startEdit()}
              title="Reset form"
              className="rounded-md p-2 text-[#64748B] hover:bg-[#EEF3FF] hover:text-[#A83D00]"
            >
              <RotateCcw size={17} />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">

            {/* PHOTO */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#172B4D]">
                Foto Produk Komersial
              </label>

              <div className="rounded-lg bg-[#EEF3FF] p-3">
                {form.foto_url ? (
                  <div className="relative">
                    <img
                      src={form.foto_url}
                      alt="Preview produk"
                      className="h-36 w-full rounded-md object-contain"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setForm({ ...form, foto_url: "" })
                      }
                      className="absolute right-2 top-2 rounded-md bg-white p-2 text-red-600 shadow"
                      aria-label="Hapus foto"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg text-center transition hover:bg-[#E3ECFC]">
                    <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#A83D00]">
                      {uploading ? (
                        <RefreshCw size={21} className="animate-spin" />
                      ) : (
                        <UploadCloud size={22} />
                      )}
                    </span>

                    <span className="text-xs font-bold text-[#172B4D]">
                      {uploading
                        ? "Mengunggah foto..."
                        : "Seret & Lepas file foto ke sini"}
                    </span>

                    <span className="mt-1 text-[10px] text-[#64748B]">
                      JPG, PNG atau WebP
                    </span>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                      disabled={uploading}
                      onChange={upload}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* NAME */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#172B4D]">
                Nama Produk / Layanan <span className="text-red-500">*</span>
              </label>

              <input
                required
                value={form.nama_produk}
                onChange={(e) => changeName(e.target.value)}
                placeholder="Contoh: Spiral Dough Mixer 30L"
                className="w-full rounded-md border border-[#DCE4F0] bg-[#F8FAFD] px-3 py-3 text-xs text-[#172B4D] outline-none focus:border-[#A83D00] focus:bg-white"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#172B4D]">
                Kode SKU
              </label>

              <input
                value={form.kode_produk}
                onChange={(e) =>
                  setForm({ ...form, kode_produk: e.target.value })
                }
                placeholder="Contoh: EQ-MIX-0030"
                className="w-full rounded-md border border-[#DCE4F0] bg-[#F8FAFD] px-3 py-3 text-xs text-[#172B4D] outline-none focus:border-[#A83D00] focus:bg-white"
              />
            </div>


            {/* CATEGORY & SUBCATEGORY */}
            <div className="grid grid-cols-2 gap-3">
              {/* CATEGORY */}
              <div className="min-w-0">
                <label className="mb-2 block text-xs font-bold text-[#172B4D]">
                  Kategori <span className="text-red-500">*</span>
                </label>

                <select
                  required
                  value={form.kategori_id}
                  onChange={(e) => changeCategory(e.target.value)}
                  className="w-full rounded-md border border-[#DCE4F0] bg-[#F8FAFD] px-2 py-3 text-[11px] text-[#172B4D] outline-none focus:border-[#A83D00]"
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama_kategori}
                    </option>
                  ))}
                </select>
              </div>

              {/* SUBCATEGORY */}
              <div className="min-w-0">
                <label className="mb-2 block text-xs font-bold text-[#172B4D]">
                  Subkategori
                </label>

                <select
                  value={form.subkategori_id}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      subkategori_id: e.target.value,
                    }))
                  }
                  disabled={
                    !form.kategori_id ||
                    availableSubcategories.length === 0
                  }
                  className="w-full rounded-md border border-[#DCE4F0] bg-[#F8FAFD] px-2 py-3 text-[11px] text-[#172B4D] outline-none focus:border-[#A83D00] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {!form.kategori_id
                      ? "Pilih kategori dahulu"
                      : availableSubcategories.length === 0
                        ? "Belum ada subkategori"
                        : "Tanpa subkategori"}
                  </option>

                  {availableSubcategories.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.nama_subkategori}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PRICE */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#172B4D]">
                Harga B2B (IDR)
              </label>

              <input
                required
                type="number"
                min="1"
                value={form.harga}
                onChange={(e) =>
                  setForm({ ...form, harga: e.target.value })
                }
                placeholder="25000000"
                className="w-full rounded-md border border-[#DCE4F0] bg-[#F8FAFD] px-3 py-3 text-xs text-[#172B4D] outline-none focus:border-[#A83D00]"
              />
            </div>

            {/* UNIT */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#172B4D]">
                Satuan Harga
              </label>

              <input
                required
                value={form.satuan}
                onChange={(e) =>
                  setForm({ ...form, satuan: e.target.value })
                }
                placeholder="Unit / Kg / Porsi / Bulan"
                className="w-full rounded-md border border-[#DCE4F0] bg-[#F8FAFD] px-3 py-3 text-xs text-[#172B4D] outline-none focus:border-[#A83D00]"
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#172B4D]">
                Deskripsi Lengkap Produk/Layanan
              </label>

              <textarea
                required
                rows={3}
                value={form.deskripsi}
                onChange={(e) =>
                  setForm({ ...form, deskripsi: e.target.value })
                }
                placeholder="Jelaskan spesifikasi produk, keandalan, manfaat, dan ketentuan layanan..."
                className="w-full resize-y rounded-md border border-[#DCE4F0] bg-[#F8FAFD] px-3 py-3 text-xs leading-relaxed text-[#172B4D] outline-none focus:border-[#A83D00]"
              />
            </div>

            {/* NUTRITION */}
            <div className="rounded-lg bg-[#EEF3FF] p-3">
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wide text-[#42577E]">
                Informasi Gizi
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {(
                  ["kalori", "protein", "karbohidrat", "lemak"] as const
                ).map((key) => (
                  <div key={key}>
                    <label className="mb-1 block text-[10px] font-semibold capitalize text-[#596780]">
                      {key}
                    </label>

                    <input
                      required
                      type="number"
                      min="0"
                      step="0.1"
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                      className="w-full rounded-md border border-[#DCE4F0] bg-white px-2 py-2 text-xs text-[#172B4D] outline-none focus:border-[#A83D00]"
                    />
                  </div>
                ))}
              </div>

              <p className="mt-2 text-[9px] text-[#64748B]">
                Kalori dalam kkal; protein, karbohidrat, dan lemak dalam gram.
              </p>
            </div>

            {/* SLUG */}
            <div>
              <label className="mb-2 block text-xs font-bold text-[#172B4D]">
                Slug URL
              </label>

              <input
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                value={form.slug}
                onChange={(e) =>
                  setForm({ ...form, slug: e.target.value })
                }
                className="w-full rounded-md border border-[#DCE4F0] bg-[#F8FAFD] px-3 py-3 text-xs text-[#172B4D] outline-none focus:border-[#A83D00]"
              />
            </div>

            {/* AVAILABILITY */}
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#E5EAF3] p-3">
              <input
                type="checkbox"
                checked={form.tersedia}
                onChange={(e) =>
                  setForm({ ...form, tersedia: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 accent-[#A83D00]"
              />

              <span>
                <span className="block text-xs font-bold text-[#172B4D]">
                  Tampilkan sebagai produk tersedia
                </span>
                <span className="mt-1 block text-[10px] text-[#64748B]">
                  Produk dapat ditampilkan pada katalog publik.
                </span>
              </span>
            </label>

            {/* FORM ERROR */}
            {error && (
              <div
                role="alert"
                className="rounded-md bg-red-50 p-3 text-xs text-red-700"
              >
                {error}
              </div>
            )}

            {/* FORM ACTION */}
            <div className="flex flex-wrap justify-end gap-2 border-t border-[#EAF0F8] pt-4">
              <button
                type="button"
                onClick={() => startEdit()}
                disabled={loading || uploading}
                className="rounded-md bg-[#E5EDFF] px-4 py-3 text-xs font-bold text-[#172B4D] transition hover:bg-[#D5E2FA] disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={loading || uploading}
                className="flex items-center gap-2 rounded-md bg-[#A83D00] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#873100] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={15} />
                {loading
                  ? "Menyimpan..."
                  : editing
                    ? "Simpan Perubahan"
                    : "Simpan Produk"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
