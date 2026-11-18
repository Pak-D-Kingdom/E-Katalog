"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ClipboardList, LayoutDashboard, LogOut, Settings, Tags, Utensils } from "lucide-react";
import { api } from "@/lib/types";

const links = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/admin/produk", label: "Produk", icon: Utensils },
  { href: "/admin/kategori", label: "Kategori", icon: Tags },
  { href: "/admin/pesanan", label: "Pesanan", icon: ClipboardList },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings }
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<{ nama: string; email: string } | null>(null);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }
    api<{ admin: { nama: string; email: string } }>("/api/auth/me")
      .then((result) => setAdmin(result.admin))
      .catch(() => router.replace("/admin/login"))
      .finally(() => setReady(true));
  }, [pathname, router]);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  if (pathname === "/admin/login") return <>{children}</>;
  if (!ready || !admin) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Memeriksa sesi admin...</div>;
  return <div className="min-h-screen md:flex">
    <aside className="flex shrink-0 flex-col bg-forest-900 text-white md:sticky md:top-0 md:h-screen md:w-64">
      <a href="/admin" className="flex items-center gap-3 border-b border-white/10 px-6 py-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-forest-900"><BookOpen size={20}/></span><span><b className="block">E-Katalog MBG</b><small className="text-xs text-white/55">Panel pengelola</small></span></a>
      <nav className="scrollbar-hide flex gap-1 overflow-x-auto px-3 py-3 md:block md:flex-1 md:space-y-1 md:overflow-visible md:px-4 md:py-6">
        {links.map(({ href, label, icon: Icon }) => <a key={href} href={href} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition md:mb-1 ${pathname === href ? "bg-white/15 text-lime-200" : "text-white/65 hover:bg-white/10 hover:text-white"}`}><Icon size={18}/>{label}</a>)}
      </nav>
      <div className="hidden border-t border-white/10 p-4 md:block"><div className="mb-3 truncate px-2"><b className="block text-sm">{admin.nama}</b><small className="text-white/55">{admin.email}</small></div><button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/10"><LogOut size={17}/>Keluar</button></div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 lg:px-8"><div><p className="text-xs font-bold uppercase tracking-widest text-forest-600">Administrator</p><h1 className="mt-1 text-xl font-black">{links.find((item) => item.href === pathname)?.label || "Dashboard"}</h1></div><button onClick={logout} className="btn-secondary px-3 py-2 md:hidden"><LogOut size={17}/></button><span className="hidden text-sm text-slate-500 md:block">{admin.nama}</span></header>
      <main className="mx-auto max-w-7xl p-5 lg:p-8">{children}</main>
    </div>
  </div>;
}
