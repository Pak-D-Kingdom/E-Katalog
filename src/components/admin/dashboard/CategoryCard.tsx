"use client";

import { FormEvent, useState } from "react";
import {
  ChevronDown,
  Pencil,
  Tags,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import type { Category, Subcategory } from "@/lib/types";
import { api, slugify } from "@/lib/types";

export interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  deleting?: boolean;
}

type SubcategoryForm = {
  nama_subkategori: string;
  slug: string;
};

const emptyForm: SubcategoryForm = {
  nama_subkategori: "",
  slug: "",
};

export default function CategoryCard({
  category,
  onEdit,
  onDelete,
  deleting = false,
}: CategoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<number | null>(null);
  const [form, setForm] = useState<SubcategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadSubcategories() {
    setLoadingSubcategories(true);
    setError("");

    try {
      const result = await api<{ subkategori: Subcategory[] }>("/api/subkategori");

      setSubcategories(
        result.subkategori.filter(
          (item) => item.kategori_id === category.id
        )
      );
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoadingSubcategories(false);
    }
  }

  async function toggleSubcategories() {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);

    if (nextExpanded) {
      await loadSubcategories();
    }
  }

  function startAddSubcategory() {
    setEditingSubcategory(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function startEditSubcategory(subcategory: Subcategory) {
    setEditingSubcategory(subcategory.id);
    setForm({
      nama_subkategori: subcategory.nama_subkategori,
      slug: subcategory.slug,
    });
    setError("");
    setModalOpen(true);
  }

  function changeSubcategoryName(value: string) {
    setForm((current) => ({
      ...current,
      nama_subkategori: value,
      slug: slugify(value),
    }));
  }

  async function submitSubcategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        kategori_id: category.id,
        nama_subkategori: form.nama_subkategori,
        slug: form.slug,
      };

      await api(
        editingSubcategory
          ? `/api/subkategori/${editingSubcategory}`
          : "/api/subkategori",
        {
          method: editingSubcategory ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setModalOpen(false);
      setForm(emptyForm);
      setEditingSubcategory(null);
      await loadSubcategories();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function removeSubcategory(subcategory: Subcategory) {
    const confirmed = window.confirm(
      `Hapus subkategori "${subcategory.nama_subkategori}"?`
    );

    if (!confirmed) return;

    setError("");

    try {
      await api(`/api/subkategori/${subcategory.id}`, {
        method: "DELETE",
      });

      await loadSubcategories();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <article className="group rounded-xl border border-[#E5EAF3] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#D3DDF0] hover:shadow-md">
      {/* Icon and Actions */}
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[#EAF0FC] text-[#A83D00]">
          {category.ikon_url ? (
            <img
              src={category.ikon_url}
              alt={`Ikon ${category.nama_kategori}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Tags size={22} />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(category)}
            aria-label={`Edit ${category.nama_kategori}`}
            className="rounded-lg border border-[#E5EAF3] p-2 text-[#64748B] transition hover:border-[#A83D00] hover:bg-[#FFF4ED] hover:text-[#A83D00]"
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(category.id)}
            disabled={deleting}
            aria-label={`Hapus ${category.nama_kategori}`}
            className="rounded-lg border border-[#E5EAF3] p-2 text-[#64748B] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Category Information */}
      <div className="mt-5">
        <h3 className="truncate text-sm font-bold text-[#172B4D]">
          {category.nama_kategori}
        </h3>

        <p className="mt-1 truncate text-xs text-[#94A3B8]">
          {category.slug}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[#EEF1F6] pt-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
          Kategori katalog
        </span>

        <span className="rounded-md bg-[#EAF0FC] px-2 py-1 text-[10px] font-bold text-[#42577E]">
          Terdaftar
        </span>
      </div>

      {/* Subcategory Toggle */}
      <button
        type="button"
        onClick={toggleSubcategories}
        className="mt-4 flex w-full items-center justify-between rounded-lg border border-[#E5EAF3] bg-[#F8FAFD] px-3 py-2.5 text-sm font-semibold text-[#42577E] transition hover:border-[#C9D7EC] hover:bg-[#EAF0FC]"
      >
        <span className="flex items-center gap-2">
          <Tags size={15} />
          Subkategori
          {expanded && (
            <span className="rounded-full bg-[#DCE7F8] px-2 py-0.5 text-[10px]">
              {subcategories.length}
            </span>
          )}
        </span>

        <ChevronDown
          size={16}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Subcategory List */}
      {expanded && (
        <div className="mt-3 space-y-3">
          {loadingSubcategories ? (
            <p className="py-3 text-center text-xs text-slate-400">
              Memuat subkategori...
            </p>
          ) : (
            <>
              {subcategories.length > 0 ? (
                <div className="space-y-2">
                  {subcategories.map((subcategory) => (
                    <div
                      key={subcategory.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#EEF1F6] bg-white p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-[#172B4D]">
                          {subcategory.nama_subkategori}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          {subcategory._count?.produk ?? 0} produk
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEditSubcategory(subcategory)}
                          aria-label={`Edit ${subcategory.nama_subkategori}`}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-orange-50 hover:text-[#A83D00]"
                        >
                          <Pencil size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeSubcategory(subcategory)}
                          aria-label={`Hapus ${subcategory.nama_subkategori}`}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-slate-50 py-4 text-center text-xs text-slate-400">
                  Belum ada subkategori.
                </p>
              )}
            </>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={startAddSubcategory}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#D5DFEF] px-3 py-2.5 text-xs font-semibold text-[#A83D00] transition hover:border-[#A83D00] hover:bg-[#FFF4ED]"
          >
            <Plus size={15} />
            Tambah subkategori
          </button>
        </div>
      )}

      {/* Subcategory Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
          onMouseDown={(event) =>
            event.target === event.currentTarget && !saving && setModalOpen(false)
          }
        >
          <section className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#172B4D]">
                  {editingSubcategory
                    ? "Edit subkategori"
                    : "Tambah subkategori"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Kategori: {category.nama_kategori}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                aria-label="Tutup"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitSubcategory} className="space-y-4">
              <div>
                <label htmlFor={`subcategory-name-${category.id}`} className="label">
                  Nama subkategori
                </label>

                <input
                  id={`subcategory-name-${category.id}`}
                  required
                  maxLength={120}
                  className="field"
                  placeholder="Contoh: Tepung"
                  value={form.nama_subkategori}
                  onChange={(event) =>
                    changeSubcategoryName(event.target.value)
                  }
                />
              </div>

              <div>
                <label htmlFor={`subcategory-slug-${category.id}`} className="label">
                  Slug
                </label>

                <input
                  id={`subcategory-slug-${category.id}`}
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  className="field"
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      slug: event.target.value,
                    }))
                  }
                />

                <p className="mt-1 text-[10px] text-slate-400">
                  Slug otomatis dibuat dari nama, tetapi masih dapat diubah.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="rounded-lg border border-[#DCE4F0] bg-white px-4 py-2.5 text-sm font-bold text-[#172B4D] transition hover:bg-[#EEF3FF]"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#A83D00] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#873100] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Menyimpan..."
                    : editingSubcategory
                      ? "Simpan perubahan"
                      : "Simpan subkategori"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </article>
  );
}