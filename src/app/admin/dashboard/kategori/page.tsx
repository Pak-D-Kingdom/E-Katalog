"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import CategoryCard from "@/components/admin/dashboard/CategoryCard";
import { api, Category, slugify } from "@/lib/types";
import Swal from "sweetalert2";

type CategoryForm = {
  nama_kategori: string;
  slug: string;
  ikon_url: string;
};

const emptyForm: CategoryForm = {
  nama_kategori: "",
  slug: "",
  ikon_url: "",
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const result = await api<{ kategori?: Category[] }>("/api/kategori");

    setCategories(
      Array.isArray(result.kategori) ? result.kategori : []
    );
  }

  useEffect(() => {
    load().catch((cause: Error) => setError(cause.message));
  }, []);

  function startEdit(category?: Category) {
    setEditing(category?.id ?? null);
    setForm(category
      ? {
        nama_kategori: category.nama_kategori,
        slug: category.slug,
        ikon_url: category.ikon_url ?? "",
      }
      : emptyForm);
    setError("");
    setOpen(true);
  }

  function changeName(value: string) {
    setForm((current) => ({
      ...current,
      nama_kategori: value,
      slug: slugify(value),
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api(editing ? `/api/kategori/${editing}` : "/api/kategori", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          ...form,
          ikon_url: form.ikon_url || null,
        }),
      });
      setOpen(false);
      await load();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: number) {
    const confirmation = await Swal.fire({
      title: "Hapus kategori?",
      text: "Produk di dalamnya tidak akan ikut terhapus.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#A83D00",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) return;
    setError("");

    try {
      await api(`/api/kategori/${id}`, { method: "DELETE" });
      await load();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  const filtered = (Array.isArray(categories) ? categories : []).filter(
    (category) =>
      `${category.nama_kategori} ${category.slug}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );  

  return (
    <div className="min-h-screen space-y-5 bg-[#F2F5FC] p-4 sm:p-6 lg:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-black text-[#172B4D]">Daftar kategori</h1>
          <p className="mt-1 text-sm text-slate-500">Atur kategori yang digunakan pada katalog produk.</p>
        </div>
        <button type="button" onClick={() => startEdit()} className="btn-primary">
          <Plus size={18} /> Tambah kategori
        </button>
      </div>

      {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="card">
        <label className="relative block max-w-sm">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="field field-with-icon py-2.5"
            placeholder="Cari nama atau slug kategori..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={startEdit}
              onDelete={remove}
            />
          ))}
        </div>
      ) : (
        <div className="card py-12 text-center text-sm text-slate-500">
          {query ? "Kategori tidak ditemukan." : "Belum ada kategori."}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
          onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <section className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#172B4D]">{editing ? "Edit kategori" : "Tambah kategori"}</h2>
                <p className="mt-1 text-sm text-slate-500">Masukkan nama dan slug kategori.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Tutup">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="category-name" className="label">Nama kategori</label>
                <input
                  id="category-name"
                  required
                  className="field"
                  value={form.nama_kategori}
                  onChange={(event) => changeName(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="category-slug" className="label">Slug</label>
                <input
                  id="category-slug"
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  className="field"
                  value={form.slug}
                  onChange={(event) => setForm({ ...form, slug: event.target.value })}
                />
              </div>
              <div>
                <label htmlFor="category-icon" className="label">URL ikon (opsional)</label>
                <input
                  id="category-icon"
                  type="url"
                  className="field"
                  placeholder="https://..."
                  value={form.ikon_url}
                  onChange={(event) => setForm({ ...form, ikon_url: event.target.value })}
                />
              </div>
              {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Batal</button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "Menyimpan..." : editing ? "Simpan perubahan" : "Simpan kategori"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
