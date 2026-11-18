"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ClipboardList, Package, Tags } from "lucide-react";
import { api } from "@/lib/types";

type Summary = { produk: number; kategori: number; pesanan: number };
export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      api<{ produk: unknown[] }>("/api/produk"),
      api<{ kategori: unknown[] }>("/api/kategori"),
      api<{ pesanan: unknown[] }>("/api/pesanan")
    ]).then(([p, k, o]) => setSummary({ produk: p.produk.length, kategori: k.kategori.length, pesanan: o.pesanan.length })).catch((e: Error) => setError(e.message));
  }, []);
  const stats = [
    { title: "Produk katalog", value: summary?.produk ?? "—", icon: Package, href: "/admin/produk", tone: "bg-sky-50 text-sky-700" },
    { title: "Kategori", value: summary?.kategori ?? "—", icon: Tags, href: "/admin/kategori", tone: "bg-violet-50 text-violet-700" },
    { title: "Pesanan masuk", value: summary?.pesanan ?? "—", icon: ClipboardList, href: "/admin/pesanan", tone: "bg-amber-50 text-amber-700" }
  ];
  return <div>
    <section className="mb-8 rounded-3xl bg-forest-900 p-7 text-white md:p-9"><p className="text-sm font-bold text-lime-300">Pusat pengelolaan</p><h2 className="mt-2 max-w-2xl text-2xl font-black md:text-3xl">Selamat datang di dashboard E-Katalog MBG</h2><p className="mt-3 max-w-2xl leading-6 text-white/70">Perbarui menu bergizi, pantau pesanan, dan kelola informasi katalog Anda dari satu tempat.</p></section>
    {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="grid gap-4 md:grid-cols-3">{stats.map(({title,value,icon:Icon,href,tone}) => <a key={title} href={href} className="card flex items-center justify-between p-5 transition hover:-translate-y-1"><div className="flex items-center gap-4"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}><Icon size={21}/></span><span><small className="text-slate-500">{title}</small><b className="mt-1 block text-2xl">{value}</b></span></div><ArrowUpRight size={19} className="text-slate-400"/></a>)}</div>
    <section className="mt-8 card p-6"><h3 className="text-lg font-black">Mulai kelola katalog</h3><div className="mt-4 flex flex-wrap gap-3"><a className="btn-primary" href="/admin/produk">Kelola produk</a><a className="btn-secondary" href="/admin/pengaturan">Atur informasi WhatsApp</a></div></section>
  </div>;
}
