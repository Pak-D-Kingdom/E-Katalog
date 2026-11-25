
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    Settings,
    Store,
    X,
    Tags,
    ShoppingBag,
} from "lucide-react";

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
        title: "Kelola Pesanan",
        href: "/admin/dashboard/pesanan",
        icon: ShoppingBag,
    },
    {
        title: "Pengaturan",
        href: "/admin/dashboard/pengaturan",
        icon: Settings,
    },
];

interface SidebarProps {
    instanceName: string;
    collapsed?: boolean;
    onNavigate?: () => void;
    onCloseMobile?: () => void;
}

export default function Sidebar({
    instanceName,
    collapsed = false,
    onNavigate,
    onCloseMobile,
}: SidebarProps) {
    const pathname = usePathname();

    const brandInitials = instanceName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase() || "DK";

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
                        {brandInitials}
                    </div>
                ) : (
                    <div className="text-center">
                        <h1 className="text-[19px] font-black tracking-tight text-[#172B4D]">
                            {instanceName}
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
                                className={`flex h-9 items-center rounded-md text-[12px] font-semibold transition-colors ${collapsed
                                    ? "lg:justify-center lg:px-0"
                                    : "gap-3 px-3"
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
                    className={`flex h-9 items-center rounded-md text-[12px] font-semibold text-[#51443E] transition hover:bg-white/80 ${collapsed
                        ? "lg:justify-center lg:px-0"
                        : "gap-3 px-3"
                        }`}
                >
                    <Store size={17} />
                    {!collapsed && <span>Kunjungi Portal Publik</span>}
                </Link>

            </nav>
        </aside>
    );
}
