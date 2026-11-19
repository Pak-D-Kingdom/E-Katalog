
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
    LayoutDashboard,
    Package,
    Settings,
    Store,
    LogOut,
} from "lucide-react";
import { api } from "@/lib/types";

const menuItems = [
    {
        title: "Dashboard Operasional",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Kelola Produk (CRUD)",
        href: "/admin/dashboard/produk",
        icon: Package,
    },
    {
        title: "Konfigurasi & Pajak",
        href: "/admin/dashboard/pengaturan",
        icon: Settings,
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState("");

    async function handleLogout() {
        setIsLoggingOut(true);
        setLogoutError("");

        try {
            await api<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
            router.replace("/admin/auth/login");
            router.refresh();
        } catch (error) {
            setLogoutError(
                error instanceof Error ? error.message : "Gagal keluar. Silakan coba kembali."
            );
            setIsLoggingOut(false);
        }
    }

    return (
        <aside className="flex h-full w-full flex-col overflow-y-auto bg-[#EEF3FF]">

            {/* Logo */}
            <div className="flex h-[105px] items-center justify-center border-b border-[#E1E8F5]">
                <div className="text-center">
                    <h1 className="text-[19px] font-black tracking-tight text-[#172B4D]">
                        DapurKita
                    </h1>
                    <p className="text-[9px] font-extrabold tracking-wider text-[#A83D00]">
                        B2B ADMIN
                    </p>
                    <p className="text-[9px] font-extrabold tracking-wider text-[#A83D00]">
                        CONSOLE
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6">

                <p className="mb-3 px-2 text-[9px] font-bold tracking-wider text-[#64748B]">
                    MANAJEMEN INVENTARIS
                </p>

                <div className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex h-9 items-center gap-3 rounded-md px-3 text-[12px] font-semibold transition-colors ${active
                                        ? "bg-[#A83D00] text-white"
                                        : "text-[#51443E] hover:bg-white/80"
                                    }`}
                            >
                                <Icon size={17} />
                                {item.title}
                            </Link>
                        );
                    })}
                </div>

                <p className="mb-3 mt-8 px-2 text-[9px] font-bold tracking-wider text-[#64748B]">
                    CUSTOMER VIEW
                </p>

                <Link
                    href="/"
                    className="flex h-9 items-center gap-3 rounded-md px-3 text-[12px] font-semibold text-[#51443E] transition hover:bg-white/80"
                >
                    <Store size={17} />
                    Kunjungi Portal Publik
                </Link>

            </nav>

            {/* Admin Profile */}
            <div className="m-3 rounded-lg bg-[#E3EBFA] p-3">

                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#CBD5E1] text-sm font-bold text-[#334155]">
                        BS
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold text-[#172B4D]">
                            Budi Santoso, S.T.
                        </p>
                        <p className="text-[10px] text-[#64748B]">
                            Head of Procurement
                        </p>
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <span className="text-[9px] text-[#64748B]">
                        Branch: Jakarta Pusat
                    </span>

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#A83D00] hover:text-[#873100] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <LogOut size={12} />
                        {isLoggingOut ? "Keluar..." : "Keluar"}
                    </button>
                </div>

                {logoutError && (
                    <p role="alert" className="mt-2 text-[10px] text-red-600">
                        {logoutError}
                    </p>
                )}
            </div>

        </aside>
    );
}
