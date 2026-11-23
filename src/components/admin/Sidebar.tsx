
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
    X,
    Tags,
    ShoppingBag,
} from "lucide-react";
import { api } from "@/lib/types";
import Swal from "sweetalert2";

const menuItems = [
    {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Kelola Produk (CRUD)",
        href: "/admin/dashboard/produk",
        icon: Package,
    },
    {
        title: "Kelola Kategori",
        href: "/admin/dashboard/kategori",
        icon: Tags,
    },
    {
        title: "Pengaturan WhatsApp",
        href: "/admin/dashboard/pengaturan",
        icon: Settings,
    },
];

interface SidebarProps {
    collapsed?: boolean;
    onNavigate?: () => void;
    onCloseMobile?: () => void;
}

export default function Sidebar({
    collapsed = false,
    onNavigate,
    onCloseMobile,
}: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState("");

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
                error instanceof Error ? error.message : "Gagal keluar. Silakan coba kembali."
            );
            setIsLoggingOut(false);
        }
    }

    return (
        <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-[#E5EAF3] bg-white">

            {/* Logo */}
            <div className="relative flex h-[105px] items-center justify-center border-b border-[#E1E8F5]">
                <button
                    type="button"
                    aria-label="Tutup menu navigasi"
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] hover:bg-white lg:hidden"
                    onClick={onCloseMobile}
                >
                    <X size={19} />
                </button>
                {collapsed ? (
                    <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-[#A83D00] text-sm font-black text-white lg:flex">
                        DK
                    </div>
                ) : (
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
                )}
            </div>

            {/* Navigation */}
            <nav className={`flex-1 px-3 py-6 ${collapsed ? "lg:px-2" : ""}`}>

                {!collapsed && (
                    <p className="mb-3 px-2 text-[9px] font-bold tracking-wider text-[#64748B]">
                        MANAJEMEN INVENTARIS
                    </p>
                )}

                <div className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active =
                            item.href === "/admin/dashboard"
                                ? pathname === item.href
                                : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={collapsed ? item.title : undefined}
                                onClick={onNavigate}
                                className={`flex h-9 items-center rounded-md text-[12px] font-semibold transition-colors ${
                                    collapsed ? "lg:justify-center lg:px-0" : "gap-3 px-3"
                                } ${active
                                        ? "bg-[#A83D00] text-white"
                                        : "text-[#51443E] hover:bg-white/80"
                                    }`}
                            >
                                <Icon size={17} />
                                {!collapsed && <span>{item.title}</span>}
                            </Link>
                        );
                    })}
                </div>

                {!collapsed && (
                    <p className="mb-3 mt-8 px-2 text-[9px] font-bold tracking-wider text-[#64748B]">
                        CUSTOMER VIEW
                    </p>
                )}

                <Link
                    href="/"
                    title={collapsed ? "Kunjungi Portal Publik" : undefined}
                    onClick={onNavigate}
                    className={`flex h-9 items-center rounded-md text-[12px] font-semibold text-[#51443E] transition hover:bg-white/80 ${
                        collapsed ? "lg:justify-center lg:px-0" : "gap-3 px-3"
                    }`}
                >
                    <Store size={17} />
                    {!collapsed && <span>Kunjungi Portal Publik</span>}
                </Link>

            </nav>

            {/* Admin Profile */}
            <div className={`m-3 rounded-lg bg-[#E3EBFA] ${collapsed ? "lg:p-2" : "p-3"}`}>

                <div className={`flex items-center ${collapsed ? "lg:justify-center" : "gap-2"}`}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#CBD5E1] text-sm font-bold text-[#334155]">
                        BS
                    </div>

                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="truncate text-[11px] font-bold text-[#172B4D]">
                                Budi Santoso, S.T.
                            </p>
                            <p className="text-[10px] text-[#64748B]">
                                Head of Procurement
                            </p>
                        </div>
                    )}
                </div>

                {collapsed ? (
                    <button
                        type="button"
                        aria-label="Keluar"
                        title="Keluar"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="mx-auto mt-3 hidden h-8 w-8 items-center justify-center rounded-md text-[#A83D00] hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-60 lg:flex"
                    >
                        <LogOut size={15} />
                    </button>
                ) : (
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
                )}

                {logoutError && (
                    <p role="alert" className="mt-2 text-[10px] text-red-600">
                        {logoutError}
                    </p>
                )}
            </div>

        </aside>
    );
}
