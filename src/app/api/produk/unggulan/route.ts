import { NextResponse } from "next/server";
import { getProdukUnggulanPerKategori } from "@/lib/produk-unggulan";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const hasil = await getProdukUnggulanPerKategori();

        return NextResponse.json(hasil);
    } catch (error) {
        console.error("Get produk unggulan error:", error);

        return NextResponse.json(
            { error: "Gagal mengambil produk unggulan." },
            { status: 500 }
        );
    }
}