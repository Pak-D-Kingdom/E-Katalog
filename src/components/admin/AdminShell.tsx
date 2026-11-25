
"use client";

import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { api } from "@/lib/types";
import Swal from "sweetalert2";

interface AdminShellProps {
  children: React.ReactNode;
  initialInstanceName: string;
  initialLogoUrl: string | null;
}

export default function AdminShell({
  children,
  initialInstanceName,
  initialLogoUrl,
}: AdminShellProps) {
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [instanceName, setInstanceName] = useState(initialInstanceName);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const menuTitle =
    pathname === "/admin/dashboard"
      ? "Dashboard Operasional"
      : pathname.startsWith("/admin/dashboard/produk")
        ? "Kelola Produk"
        : pathname.startsWith("/admin/dashboard/kategori")
          ? "Kelola Kategori"
          : pathname.startsWith("/admin/dashboard/pesanan")
            ? "Kelola Pesanan"
            : pathname.startsWith("/admin/dashboard/pengaturan")
              ? "Pengaturan WhatsApp"
              : "Dashboard Admin";

  async function handleLogout() {
    const confirmation = await Swal.fire({
      title: "Keluar dari dashboard?",
      text: "Anda perlu masuk kembali untuk mengakses dashboard.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#A83D00",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, keluar",
      cancelButtonText: "Batal",
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) return;

    setIsLoggingOut(true);
    setLogoutError("");

    try {
      await api<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
      router.replace("/admin/auth/login");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Gagal keluar. Silakan coba kembali."
      );
      setIsLoggingOut(false);
    }
  }

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    const updateName = (event: Event) => {
      const { nama_instansi, logo_url } = (event as CustomEvent<{
        nama_instansi?: string;
        logo_url?: string | null;
      }>).detail ?? {};
      if (nama_instansi?.trim()) setInstanceName(nama_instansi.trim());
      if (logo_url !== undefined) setLogoUrl(logo_url);
    };

    window.addEventListener("instance-settings-updated", updateName);
    return () => {
      window.removeEventListener("instance-settings-updated", updateName);
    };
  }, []);

  return (
    <div className="admin-area min-h-screen bg-[#F2F5FC]">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu navigasi"
          className="fixed inset-0 z-[55] bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-[60] h-screen w-[230px] transition-transform duration-300 lg:z-50 lg:transition-[width,transform] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${desktopCollapsed ? "lg:w-[76px]" : "lg:w-[230px]"}`}
        aria-label="Navigasi admin"
      >
        <Sidebar
          logoUrl={logoUrl}
          collapsed={desktopCollapsed}
          onNavigate={() => setMobileOpen(false)}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </aside>

      <main
        className={`min-h-screen min-w-0 transition-[margin] duration-300 ${
          desktopCollapsed ? "lg:ml-[76px]" : "lg:ml-[230px]"
        }`}
      >
        <header className="relative sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#E5EAF3] bg-white/95 px-4 backdrop-blur sm:px-6 lg:h-16">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Buka menu navigasi"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E1E8F5] text-[#172B4D] hover:bg-[#F2F5FC] lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>

            <button
              type="button"
              aria-label={desktopCollapsed ? "Lebarkan sidebar" : "Kecilkan sidebar"}
              title={desktopCollapsed ? "Lebarkan sidebar" : "Kecilkan sidebar"}
              className="hidden h-10 w-10 items-center justify-center rounded-lg border border-[#E1E8F5] text-[#172B4D] transition hover:bg-[#F2F5FC] lg:flex"
              onClick={() => setDesktopCollapsed((current) => !current)}
            >
              {desktopCollapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#172B4D] sm:text-base">
                {menuTitle}
              </p>
              <p className="hidden text-[10px] text-[#64748B] sm:block">
                {instanceName} B2B
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#CBD5E1] text-xs font-bold text-[#334155]">
              PD
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-[11px] font-bold text-[#172B4D]">
                Pak D Group
              </p>
              <p className="truncate text-[10px] text-[#64748B]">
                Head of Procurement
              </p>
            </div>
            <button
              type="button"
              aria-label={isLoggingOut ? "Keluar..." : "Keluar"}
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E1E8F5] px-2.5 text-xs font-semibold text-[#A83D00] transition hover:bg-[#FFF4ED] disabled:cursor-not-allowed disabled:opacity-60 sm:px-3"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">
                {isLoggingOut ? "Keluar..." : "Keluar"}
              </span>
            </button>
          </div>

          {logoutError && (
            <p
              role="alert"
              className="absolute right-4 top-full z-50 mt-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-sm"
            >
              {logoutError}
            </p>
          )}
        </header>

        {children}
      </main>
    </div>
  );
}
