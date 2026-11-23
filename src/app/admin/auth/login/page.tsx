
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  ShieldCheck,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import { api } from "@/lib/types";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          kata_sandi: kataSandi,
        }),
      });

      router.replace("/admin/dashboard");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#F2F5FC] px-5 py-5 sm:py-7">

      {/* Background Decoration */}
      <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#DCE6F7] opacity-60 blur-3xl" />

      <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#FCE8DC] opacity-60 blur-3xl" />

      <div className="relative z-10 w-full max-w-[400px] md:max-w-[820px]">
        <section className="overflow-hidden rounded-2xl border border-[#E5EAF3] bg-white shadow-[0_15px_50px_rgba(30,50,90,0.12)] md:grid md:grid-cols-[.95fr_1.05fr]">
          <aside className="relative hidden min-h-[520px] flex-col justify-between overflow-hidden bg-[#FFF0E7] p-9 md:flex">
            <div className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-[#F8D0BA] opacity-70" />
            <div className="absolute right-10 top-16 h-24 w-24 rounded-full border-[18px] border-white/70" />

            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#A83D00] text-white shadow-md">
                <Package size={24} />
              </div>
              <div>
                <h2 className="text-base font-black tracking-wide text-[#172B4D]">
                  E-KATALOG MBG
                </h2>
                <p className="text-[10px] font-bold tracking-[2px] text-[#A83D00]">
                  PORTAL ADMINISTRATOR
                </p>
              </div>
            </div>

            <div className="relative mx-auto flex h-48 w-48 items-center justify-center rounded-[38px] border border-white/80 bg-white/70 shadow-[0_20px_50px_rgba(168,61,0,.12)]">
              <Package size={92} strokeWidth={1.35} className="text-[#A83D00]" />
              <div className="absolute bottom-7 right-7 flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#FFF0E7] bg-[#A83D00] text-white">
                <ShieldCheck size={22} />
              </div>
            </div>

            <p className="relative max-w-[260px] text-sm leading-6 text-[#64748B]">
              Kelola katalog, kategori, pesanan, dan pengaturan dalam satu portal terintegrasi.
            </p>
          </aside>

          <div className="p-5 sm:p-6 md:p-8">

          <div className="mb-5 flex items-center gap-3 md:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#A83D00] text-white">
              <Package size={22} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide text-[#172B4D]">E-KATALOG MBG</h2>
              <p className="text-[10px] font-bold tracking-[2px] text-[#A83D00]">PORTAL ADMINISTRATOR</p>
            </div>
          </div>

          {/* Icon */}
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF0E7] text-[#A83D00]">
            <ShieldCheck size={25} />
          </div>

          {/* Heading */}
          <div className="mb-5">

            <p className="mb-2 text-xs font-bold uppercase tracking-[2px] text-[#A83D00]">
              Administrator Area
            </p>

            <h1 className="text-[28px] font-black tracking-tight text-[#172B4D]">
              Selamat Datang!
            </h1>

            <p className="mt-2 text-sm leading-5 text-[#718096]">
              Silakan masuk untuk mengakses dashboard
              dan mengelola katalog produk MBG.
            </p>

          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">

            {/* Email */}
            <div>

              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-bold text-[#334155]"
              >
                Email Administrator
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />

                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="admin@instansi.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#FAFBFD] pl-11 pr-4 text-sm text-[#172B4D] outline-none transition placeholder:text-[#A0AEC0] focus:border-[#A83D00] focus:bg-white focus:ring-4 focus:ring-[#A83D00]/10"
                />

              </div>

            </div>

            {/* Password */}
            <div>

              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-bold text-[#334155]"
              >
                Kata Sandi
              </label>

              <div className="relative">

                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  value={kataSandi}
                  onChange={(e) => setKataSandi(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#FAFBFD] pl-11 pr-12 text-sm text-[#172B4D] outline-none transition placeholder:text-[#A0AEC0] focus:border-[#A83D00] focus:bg-white focus:ring-4 focus:ring-[#A83D00]/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] transition hover:text-[#A83D00]"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#A83D00] text-sm font-bold text-white shadow-md shadow-[#A83D00]/20 transition hover:bg-[#873100] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <LockKeyhole size={17} />
                  Masuk ke Dashboard
                </>
              )}

            </button>

          </form>

          {/* Security Info */}
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#F5F7FC] p-3">

            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-[#A83D00]"
            />

            <p className="text-xs leading-5 text-[#64748B]">
              Halaman ini merupakan area khusus administrator.
              Pastikan akun dan kata sandi kamu tetap terjaga.
            </p>

          </div>
          </div>
        </section>
      </div>

    </main>
  );
}
