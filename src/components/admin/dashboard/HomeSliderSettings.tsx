"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Save, Trash2 } from "lucide-react";
import { api } from "@/lib/types";
import type { HomeSlide } from "@/lib/home-slides";

export default function HomeSliderSettings() {
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api<{ slides: HomeSlide[] }>("/api/pengaturan/slider")
      .then(({ slides: initialSlides }) => setSlides(initialSlides))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function addSlide(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (slides.length >= 10) {
      setError("Slider maksimal memiliki 10 foto.");
      return;
    }

    setError("");
    setMessage("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await api<{ foto_url: string }>("/api/upload", {
        method: "POST",
        body: formData,
      });
      setSlides((current) => [...current, { foto_url: result.foto_url }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah foto.");
    } finally {
      setUploading(false);
    }
  }

  function moveSlide(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;

    setSlides((current) => {
      const updated = [...current];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
    setMessage("");
  }

  async function saveSlides() {
    setError("");
    setMessage("");
    setSaving(true);

    try {
      await api("/api/pengaturan/slider", {
        method: "PUT",
        body: JSON.stringify({ slides }),
      });
      setMessage("Pengaturan slider berhasil disimpan.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan slider.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-[#E5EAF3] bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 border-b border-[#EAF0F8] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[#172B4D]">Slider Halaman Utama</h2>
          <p className="mt-1 text-xs text-[#64748B]">
            Unggah foto, atur urutan tampil, lalu simpan perubahan. Maksimal 10 foto.
          </p>
        </div>

        <label className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#DCE4F0] px-4 py-2 text-sm font-semibold text-[#172B4D] transition hover:bg-[#F8FAFD]">
          <ImagePlus size={17} />
          {uploading ? "Mengunggah..." : "Tambah Foto"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            disabled={loading || uploading || saving || slides.length >= 10}
            onChange={addSlide}
          />
        </label>
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-[#64748B]">Memuat slider...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((slide, index) => (
            <article
              key={`${slide.foto_url}-${index}`}
              className="overflow-hidden rounded-lg border border-[#E5EAF3] bg-[#F8FAFD]"
            >
              <div className="aspect-video bg-slate-200">
                <img
                  src={slide.foto_url}
                  alt={`Pratinjau slide ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="text-xs font-semibold text-[#172B4D]">
                  Slide {index + 1}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveSlide(index, -1)}
                    disabled={index === 0 || saving || uploading}
                    aria-label={`Pindahkan slide ${index + 1} ke atas`}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-[#DCE4F0] text-[#172B4D] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlide(index, 1)}
                    disabled={index === slides.length - 1 || saving || uploading}
                    aria-label={`Pindahkan slide ${index + 1} ke bawah`}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-[#DCE4F0] text-[#172B4D] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSlides((current) => current.filter((_, itemIndex) => itemIndex !== index));
                      setMessage("");
                    }}
                    disabled={slides.length <= 1 || saving || uploading}
                    aria-label={`Hapus slide ${index + 1}`}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
      {message && <p role="status" className="mt-4 text-sm text-green-700">{message}</p>}

      <div className="mt-5 flex justify-end border-t border-[#EAF0F8] pt-5">
        <button
          type="button"
          onClick={saveSlides}
          disabled={loading || saving || uploading || slides.length === 0}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#A83D00] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#873100] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={17} />
          {saving ? "Menyimpan..." : "Simpan Slider"}
        </button>
      </div>
    </section>
  );
}
