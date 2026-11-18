
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
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

      router.replace("/admin");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F2F5FC] px-5 py-10">

      {/* Background Decoration */}
      <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#DCE6F7] opacity-60 blur-3xl" />

      <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#FCE8DC] opacity-60 blur-3xl" />

      <div className="relative z-10 w-full max-w-[440px]">

        {/* Brand */}
        <div className="mb-8 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#A83D00] text-white shadow-md">
              <Package size={25} />
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

          <div className="hidden rounded-lg border border-[#DCE3F0] bg-white px-3 py-2 text-[10px] font-bold text-[#64748B] sm:block">
            ADMIN ACCESS
          </div>

        </div>

        {/* Login Card */}
        <section className="rounded-[24px] border border-[#E5EAF3] bg-white p-7 shadow-[0_15px_50px_rgba(30,50,90,0.08)] sm:p-10">

          {/* Icon */}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0E7] text-[#A83D00]">
            <ShieldCheck size={29} />
          </div>

          {/* Heading */}
          <div className="mb-8">

            <p className="mb-2 text-xs font-bold uppercase tracking-[2px] text-[#A83D00]">
              Administrator Area
            </p>

            <h1 className="text-3xl font-black tracking-tight text-[#172B4D]">
              Selamat Datang!
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#718096]">
              Silakan masuk untuk mengakses dashboard
              dan mengelola katalog produk MBG.
            </p>

          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">

            {/* Email */}
            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-[#334155]"
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
                  className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#FAFBFD] pl-11 pr-4 text-sm text-[#172B4D] outline-none transition placeholder:text-[#A0AEC0] focus:border-[#A83D00] focus:bg-white focus:ring-4 focus:ring-[#A83D00]/10"
                />

              </div>

            </div>

            {/* Password */}
            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold text-[#334155]"
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
                  className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#FAFBFD] pl-11 pr-12 text-sm text-[#172B4D] outline-none transition placeholder:text-[#A0AEC0] focus:border-[#A83D00] focus:bg-white focus:ring-4 focus:ring-[#A83D00]/10"
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
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#A83D00] text-sm font-bold text-white shadow-md shadow-[#A83D00]/20 transition hover:bg-[#873100] disabled:cursor-not-allowed disabled:opacity-60"
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
          <div className="mt-7 flex items-start gap-3 rounded-xl bg-[#F5F7FC] p-4">

            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-[#A83D00]"
            />

            <p className="text-xs leading-5 text-[#64748B]">
              Halaman ini merupakan area khusus administrator.
              Pastikan akun dan kata sandi kamu tetap terjaga.
            </p>

          </div>

        </section>

        {/* Footer */}
       
      </div>

    </main>
  );
}
