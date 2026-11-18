"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Leaf, LockKeyhole } from "lucide-react";
import { api } from "@/lib/types";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, kata_sandi: kataSandi }) });
      router.replace("/admin");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return <main className="flex min-h-[calc(100vh-0px)] items-center justify-center bg-[#f0f4eb] px-5 py-10">
    <div className="w-full max-w-md">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-forest-700"><ArrowLeft size={17}/>Kembali ke katalog</Link>
      <section className="rounded-3xl bg-white p-7 shadow-soft sm:p-9">
        <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-600 text-white"><Leaf size={24}/></div>
        <p className="text-sm font-bold uppercase tracking-widest text-forest-600">Area pengelola</p><h1 className="mt-2 text-3xl font-black">Masuk admin</h1><p className="mt-2 text-sm leading-6 text-slate-500">Kelola produk, kategori, dan pesanan katalog MBG.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required autoComplete="username" className="field" placeholder="admin@instansi.id" value={email} onChange={(e) => setEmail(e.target.value)}/></div>
          <div><label className="label" htmlFor="password">Kata sandi</label><input id="password" type="password" required autoComplete="current-password" className="field" placeholder="Masukkan kata sandi" value={kataSandi} onChange={(e) => setKataSandi(e.target.value)}/></div>
          {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <button disabled={loading} className="btn-primary w-full"><LockKeyhole size={17}/>{loading ? "Memverifikasi..." : "Masuk ke dashboard"}</button>
        </form>
      </section>
      <p className="mt-5 text-center text-xs text-slate-500">Akses khusus administrator katalog.</p>
    </div>
  </main>;
}
