
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Package,
  ShieldCheck,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
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
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#f3f7ff] px-4 py-4 sm:px-6 sm:py-6 lg:py-8">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-44 h-[28rem] w-[28rem] rounded-full border-[42px] border-[#dce9ff]/70" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-52 -right-40 h-[34rem] w-[34rem] rounded-full border-[56px] border-[#d7e6ff]/70" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[9%] top-[34%] hidden h-24 w-24 rounded-full bg-[#dbeafe]/70 blur-2xl md:block" />

      <section className="relative z-10 mx-auto w-full max-w-[560px] overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_20px_56px_rgba(37,99,235,.15)] lg:max-w-[960px] lg:rounded-[26px] lg:grid lg:min-h-[570px] lg:grid-cols-[.95fr_1.05fr]">
        <aside className="relative hidden min-h-[570px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#eff6ff] via-[#dceaff] to-[#c9ddff] p-7 lg:flex lg:p-8">
          <div aria-hidden="true" className="absolute -right-24 top-0 h-[27rem] w-[27rem] rounded-full bg-[#a9ccff]/35" />
          <div aria-hidden="true" className="absolute -left-28 bottom-20 h-64 w-64 rounded-full border-[28px] border-white/40" />
          <div aria-hidden="true" className="absolute right-9 top-20 h-20 w-20 rounded-full border-[15px] border-white/60" />

          <div className="relative z-10 flex h-12 w-fit items-center overflow-hidden rounded-xl border border-white/80 bg-white/90 px-2 shadow-sm">
            <Image
              src="/beli-indonesia-logo.jpeg"
              alt="CV. Beli Indonesia â€” Portal Administrator"
              width={220}
              height={70}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>

          <div className="relative flex flex-col items-center py-5">
            <div className="relative flex h-44 w-44 items-center justify-center rounded-[30px] border border-white/80 bg-white/80 shadow-[0_22px_55px_rgba(37,99,235,.12)]">
              <Image src="/LOGO BELI INDONESIA.png" alt="Logo Beli Indonesia" width={120} height={120} className="h-28 w-28 object-contain" />
              <span className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white bg-[#102b58] text-[#7dd3fc] shadow-md">
                <ShieldCheck size={20} />
              </span>
            </div>
          </div>

          <p className="relative z-10 max-w-[360px] text-[13px] leading-5 text-[#40536f]">
            Kelola katalog pengadaan, kategori, pesanan B2B, dan pengaturan dalam satu portal terintegrasi.
          </p>

          <svg aria-hidden="true" viewBox="0 0 720 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full">
            <path fill="#60B7CD" fillOpacity=".22" d="M0 48c115-22 190-10 289 11 118 25 227 7 431-30v91H0Z" />
            <path fill="#2563EB" fillOpacity=".12" d="M0 73c127-35 199-14 305 2 141 22 267-6 415-29v64H0Z" />
          </svg>
        </aside>

        <div className="relative z-10 p-5 sm:p-7 lg:p-8 xl:p-9">
          <div className="mb-5 flex items-center lg:hidden">
            <Image
              src="/beli-indonesia-logo.jpeg"
              alt="CV. Beli Indonesia â€” Portal Administrator"
              width={220}
              height={70}
              className="h-12 w-auto object-contain"
              priority
            />
          </div>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#dbeafe] text-[#2563EB]"><ShieldCheck size={22} /></div>
          <div className="mb-5">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[2px] text-[#2563EB]">Administrator Area</p>
            <h1 className="text-[26px] font-black tracking-tight text-[#102b58] sm:text-[29px]">Selamat Datang!</h1>
            <p className="mt-1.5 max-w-md text-[13px] leading-5 text-[#64748b]">Silakan masuk untuk mengakses dashboard dan mengelola katalog produk MBG.</p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label htmlFor="email" className="mb-1 block text-[13px] font-bold text-[#20375c]">Email Administrator</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7189ad]" />
                <input id="email" type="email" required autoComplete="username" placeholder="admin@instansi.id" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-xl border border-[#d6e2f5] bg-[#f8faff] pl-11 pr-4 text-sm text-[#172b4d] outline-none transition placeholder:text-[#91a2bd] focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-[13px] font-bold text-[#20375c]">Kata Sandi</label>
              <div className="relative">
                <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7189ad]" />
                <input id="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" placeholder="Masukkan kata sandi" value={kataSandi} onChange={(e) => setKataSandi(e.target.value)} className="h-11 w-full rounded-xl border border-[#d6e2f5] bg-[#f8faff] pl-11 pr-12 text-sm text-[#172b4d] outline-none transition placeholder:text-[#91a2bd] focus:border-[#2563EB] focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7189ad] transition hover:text-[#2563EB]" aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1676df] text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:from-[#1d4ed8] hover:to-[#1266c7] disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <><Loader2 size={18} className="animate-spin" />Memverifikasi...</> : <><LockKeyhole size={17} />Masuk ke Dashboard<ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="my-3 flex items-center gap-3 text-xs text-[#7189ad]"><span className="h-px flex-1 bg-[#e5edf8]" /><span className="h-px flex-1 bg-[#e5edf8]" /></div>
          <div className="flex items-start gap-3 rounded-xl bg-[#edf4ff] p-3.5">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#16a982]" />
            <p className="text-xs leading-5 text-[#486389]">Halaman ini merupakan area khusus administrator. Pastikan akun dan kata sandi kamu tetap terjaga.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
