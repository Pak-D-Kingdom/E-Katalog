
"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Check,
  MessageCircle,
  Save,
  Building2,
  Phone,
  MapPin,
  FileText,
  Info,
  Mail,
  Settings,
  RotateCcw,
} from "lucide-react";
import { api } from "@/lib/types";
import Swal from "sweetalert2";

type Settings = {
  nama_instansi: string;
  nomor_whatsapp: string;
  alamat: string | null;
  email: string | null;
  hak_cipta: string;
  template_pesan: string;
};

type SettingsSection = "instansi" | "template";

const initial: Settings = {
  nama_instansi: "",
  nomor_whatsapp: "",
  alamat: "",
  email: "procurement@dapurkita.co.id",
  hak_cipta: "© 2026 PT DapurKita Solusi Kuliner Internasional. Hak Cipta Dilindungi Undang-Undang.",
  template_pesan: `Halo {nama_instansi}, saya {nama_pemesan} dari {nama_sekolah} ingin meminta penawaran:

Nomor telepon: {telepon_pemesan}

Rangkuman pilihan:
{daftar_pesanan}

Total estimasi: {total_harga}
Catatan: {catatan}
Kode permintaan: {kode_pesanan}`,
};

const variables = [
  "{nama_instansi}",
  "{nama_pemesan}",
  "{nama_sekolah}",
  "{telepon_pemesan}",
  "{daftar_pesanan}",
  "{total_harga}",
  "{catatan}",
  "{kode_pesanan}",
];

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>(initial);
  const [savedForm, setSavedForm] = useState<Settings | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [settingsReady, setSettingsReady] = useState(false);
  const [savingSection, setSavingSection] = useState<SettingsSection | null>(null);

  useEffect(() => {
    api<{ pengaturan: Settings | null }>("/api/pengaturan")
      .then(({ pengaturan }) => {
        if (pengaturan) {
          setForm(pengaturan);
          setSavedForm(pengaturan);
        }
        setSettingsReady(true);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  async function submit(e: FormEvent, section: SettingsSection) {
    e.preventDefault();

    const confirmation = await Swal.fire({
      title: section === "instansi"
        ? "Simpan informasi instansi?"
        : "Simpan template WhatsApp?",
      text: section === "instansi"
        ? "Informasi instansi, email, dan teks hak cipta footer akan diperbarui."
        : "Template yang digunakan untuk pesan WhatsApp akan diperbarui.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#A83D00",
      cancelButtonColor: "#64748B",
      confirmButtonText: section === "instansi" ? "Ya, simpan informasi" : "Ya, simpan template",
      cancelButtonText: "Batal",
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) return;

    setError("");
    setMessage("");
    setSavingSection(section);

    try {
      const payload: Settings = {
        ...(savedForm ?? initial),
        ...(section === "instansi"
          ? {
              nama_instansi: form.nama_instansi,
              nomor_whatsapp: form.nomor_whatsapp,
              alamat: form.alamat,
              email: form.email,
              hak_cipta: form.hak_cipta,
            }
          : { template_pesan: form.template_pesan }),
      };
      const result = await api<{ pengaturan: Settings }>(
        "/api/pengaturan",
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      setSavedForm(result.pengaturan);
      if (section === "instansi") {
        window.dispatchEvent(new CustomEvent("instance-settings-updated", {
          detail: { nama_instansi: result.pengaturan.nama_instansi },
        }));
      }
      setForm((current) => section === "instansi"
        ? {
            ...current,
            nama_instansi: result.pengaturan.nama_instansi,
            nomor_whatsapp: result.pengaturan.nomor_whatsapp,
            alamat: result.pengaturan.alamat,
            email: result.pengaturan.email,
            hak_cipta: result.pengaturan.hak_cipta,
          }
        : { ...current, template_pesan: result.pengaturan.template_pesan });
      const successMessage = section === "instansi"
        ? "Informasi instansi berhasil disimpan."
        : "Template pesan WhatsApp berhasil disimpan.";
      setMessage(successMessage);
      await Swal.fire({
        title: "Berhasil disimpan",
        text: successMessage,
        icon: "success",
        confirmButtonColor: "#A83D00",
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingSection(null);
    }
  }

  function resetTemplate() {
    setForm((current) => ({ ...current, template_pesan: initial.template_pesan }));
    setMessage("");
    setError("");
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#F2F5FC] p-4 sm:p-6 lg:p-7">

      {/* HEADER */}
      <section className="rounded-xl border border-[#E5EAF3] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F9EDE6] text-[#A83D00]">
            <Settings size={23} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-[#172B4D] sm:text-2xl">
                Pengaturan Katalog
              </h1>

              <span className="rounded-full bg-[#E5EDFF] px-3 py-1 text-[10px] font-bold text-[#42577E]">
                KONFIGURASI
              </span>
            </div>

            <p className="mt-1 text-sm text-[#64748B]">
              Kelola informasi instansi dan format pesan WhatsApp untuk
              kebutuhan pemesanan katalog B2B.
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-5">

        {/* INFORMASI INSTANSI */}
        <form onSubmit={(e) => submit(e, "instansi")}>
        <section className="rounded-xl border border-[#E5EAF3] bg-white p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3 border-b border-[#EAF0F8] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F0FF] text-[#172B4D]">
              <Building2 size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-[#172B4D]">
                Informasi Instansi
              </h2>
              <p className="text-xs text-[#64748B]">
                Informasi utama yang ditampilkan pada katalog.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* NAMA INSTANSI */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#172B4D]">
                Nama Instansi
              </label>

              <div className="flex items-center rounded-lg border border-[#DCE4F0] bg-white px-3 transition focus-within:border-[#A83D00] focus-within:ring-2 focus-within:ring-[#A83D00]/10">
                <Building2 size={17} className="shrink-0 text-[#94A3B8]" />

                <input
                  required
                  maxLength={191}
                  value={form.nama_instansi}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nama_instansi: e.target.value,
                    })
                  }
                  placeholder="Masukkan nama instansi"
                  className="w-full bg-transparent px-3 py-3 text-sm text-[#172B4D] outline-none placeholder:text-[#A0AEC0]"
                />
              </div>
            </div>

            {/* NOMOR WHATSAPP */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#172B4D]">
                Nomor WhatsApp Tujuan
              </label>

              <div className="flex items-center rounded-lg border border-[#DCE4F0] bg-white px-3 transition focus-within:border-[#A83D00] focus-within:ring-2 focus-within:ring-[#A83D00]/10">
                <Phone size={17} className="shrink-0 text-[#94A3B8]" />

                <input
                  required
                  type="tel"
                  value={form.nomor_whatsapp}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nomor_whatsapp: e.target.value,
                    })
                  }
                  placeholder="6281234567890"
                  className="w-full bg-transparent px-3 py-3 text-sm text-[#172B4D] outline-none placeholder:text-[#A0AEC0]"
                />
              </div>

              <p className="mt-2 text-[11px] text-[#94A3B8]">
                Gunakan kode negara, misalnya 62 untuk Indonesia.
              </p>
            </div>

            {/* ALAMAT */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-[#172B4D]">
                Alamat Instansi
                <span className="ml-1 font-normal text-[#94A3B8]">
                  (Opsional)
                </span>
              </label>

              <div className="flex items-start rounded-lg border border-[#DCE4F0] bg-white px-3 transition focus-within:border-[#A83D00] focus-within:ring-2 focus-within:ring-[#A83D00]/10">
                <MapPin size={17} className="mt-3 shrink-0 text-[#94A3B8]" />

                <textarea
                  rows={3}
                  value={form.alamat || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      alamat: e.target.value || null,
                    })
                  }
                  placeholder="Masukkan alamat lengkap instansi"
                  className="w-full resize-y bg-transparent px-3 py-3 text-sm text-[#172B4D] outline-none placeholder:text-[#A0AEC0]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#172B4D]">
                Email Footer
                <span className="ml-1 font-normal text-[#94A3B8]">(Opsional)</span>
              </label>

              <div className="flex items-center rounded-lg border border-[#DCE4F0] bg-white px-3 transition focus-within:border-[#A83D00] focus-within:ring-2 focus-within:ring-[#A83D00]/10">
                <Mail size={17} className="shrink-0 text-[#94A3B8]" />
                <input
                  type="email"
                  maxLength={191}
                  value={form.email || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value || null,
                    })
                  }
                  placeholder="email@instansi.id"
                  className="w-full bg-transparent px-3 py-3 text-sm text-[#172B4D] outline-none placeholder:text-[#A0AEC0]"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-[#172B4D]">
                Teks Hak Cipta Footer
              </label>
              <textarea
                required
                maxLength={500}
                rows={2}
                value={form.hak_cipta}
                onChange={(e) =>
                  setForm({
                    ...form,
                    hak_cipta: e.target.value,
                  })
                }
                placeholder="© 2026 Nama Instansi. Hak Cipta Dilindungi Undang-Undang."
                className="w-full resize-y rounded-lg border border-[#DCE4F0] bg-white px-3 py-3 text-sm text-[#172B4D] outline-none transition focus:border-[#A83D00] focus:ring-2 focus:ring-[#A83D00]/10 placeholder:text-[#A0AEC0]"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-[#EAF0F8] pt-5">
            <button
              type="submit"
              disabled={!settingsReady || savingSection !== null}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#A83D00] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#873100] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />
              {savingSection === "instansi" ? "Menyimpan..." : "Simpan Informasi Instansi"}
            </button>
          </div>
        </section>
        </form>

        {/* TEMPLATE WHATSAPP */}
        <form onSubmit={(e) => submit(e, "template")}>
        <section className="rounded-xl border border-[#E5EAF3] bg-white p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#EAF0F8] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F9EDE6] text-[#A83D00]">
                <MessageCircle size={20} />
              </div>

              <div>
                <h2 className="text-base font-bold text-[#172B4D]">
                  Template Pesan WhatsApp
                </h2>

                <p className="text-xs text-[#64748B]">
                  Atur format pesan otomatis saat pelanggan melakukan pemesanan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={resetTemplate}
              className="flex items-center gap-2 rounded-md bg-[#E5EDFF] px-3 py-2 text-xs font-semibold text-[#172B4D] transition hover:bg-[#D5E2FA]"
            >
              <RotateCcw size={14} />
              Reset Template
            </button>
          </div>

          <label className="mb-2 block text-sm font-semibold text-[#172B4D]">
            Isi Template Pesan
          </label>

          <div className="overflow-hidden rounded-lg border border-[#DCE4F0] transition focus-within:border-[#A83D00] focus-within:ring-2 focus-within:ring-[#A83D00]/10">
            <div className="flex items-center gap-2 border-b border-[#EAF0F8] bg-[#F8FAFD] px-4 py-3">
              <FileText size={16} className="text-[#64748B]" />
              <span className="text-xs font-semibold text-[#596780]">
                Format Pesan Otomatis
              </span>
            </div>

            <textarea
              required
              rows={9}
              value={form.template_pesan}
              onChange={(e) =>
                setForm({
                  ...form,
                  template_pesan: e.target.value,
                })
              }
              className="w-full resize-y bg-white p-4 font-mono text-sm leading-7 text-[#172B4D] outline-none"
            />
          </div>

          {/* VARIABLES */}
          <div className="mt-5 rounded-lg bg-[#F2F5FC] p-4">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-[#A83D00]" />

              <p className="text-sm font-bold text-[#172B4D]">
                Variabel yang Tersedia
              </p>
            </div>

            <p className="mt-1 text-xs text-[#64748B]">
              Gunakan variabel berikut untuk memasukkan informasi secara
              otomatis ke dalam pesan.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {variables.map((variable) => (
                <code
                  key={variable}
                  className="rounded-md border border-[#DCE4F0] bg-white px-3 py-2 text-[11px] font-semibold text-[#A83D00]"
                >
                  {variable}
                </code>
              ))}
            </div>
          </div>

          {settingsReady && !savedForm && (
            <p className="mt-4 text-xs text-[#64748B]">
              Simpan informasi instansi terlebih dahulu sebelum menyimpan template.
            </p>
          )}

          <div className="mt-6 flex justify-end border-t border-[#EAF0F8] pt-5">
            <button
              type="submit"
              disabled={!settingsReady || !savedForm || savingSection !== null}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#A83D00] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#873100] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />
              {savingSection === "template" ? "Menyimpan..." : "Simpan Template WhatsApp"}
            </button>
          </div>
        </section>
        </form>

        {/* NOTIFIKASI */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <Info size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700"
          >
            <Check size={18} />
            {message}
          </div>
        )}

        {/* INFORMASI */}
        <div className="flex items-start gap-3 rounded-xl border border-[#DCE7FF] bg-[#EAF0FC] p-4">
          <MessageCircle
            size={20}
            className="mt-0.5 shrink-0 text-[#A83D00]"
          />

          <div>
            <p className="text-sm font-bold text-[#172B4D]">
              Format Pesan Dapat Dipersonalisasi
            </p>

            <p className="mt-1 text-xs leading-relaxed text-[#596780]">
              Pesan WhatsApp dapat memuat daftar item, total harga, identitas
              pemesan, dan kode pesanan yang tercatat di sistem.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
