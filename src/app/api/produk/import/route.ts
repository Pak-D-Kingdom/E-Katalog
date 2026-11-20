
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { produkSchema } from "@/lib/validation";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;

  const text = String(value).trim().toLowerCase();

  if (["true", "1", "ya", "yes"].includes(text)) return true;
  if (["false", "0", "tidak", "no"].includes(text)) return false;

  return null;
}

function parseNumber(value: unknown): number {
  if (value === "" || value === null || value === undefined) {
    return NaN;
  }

  return Number(value);
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File Excel tidak ditemukan." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 5 MB." },
        { status: 400 }
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["xlsx", "xls", "csv"].includes(extension ?? "")) {
      return NextResponse.json(
        { error: "Format file harus XLSX, XLS, atau CSV." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {
      return NextResponse.json(
        { error: "Sheet Excel tidak ditemukan." },
        { status: 400 }
      );
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    let berhasil = 0;
    const gagal: { baris: number; pesan: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Lewati baris kosong
      if (
        Object.values(row).every(
          (value) => String(value).trim() === ""
        )
      ) {
        continue;
      }

      const tersedia = parseBoolean(row.tersedia);

      const data = {
        kode_produk: String(row.kode_produk ?? "").trim(),
        nama_produk: String(row.nama_produk ?? "").trim(),
        slug: String(row.slug ?? "").trim(),
        deskripsi: String(row.deskripsi ?? "").trim(),

        kategori_id:
          row.kategori_id === "" || row.kategori_id === undefined
            ? null
            : parseNumber(row.kategori_id),

        informasi_gizi: {
          kalori: parseNumber(row.kalori),
          protein: parseNumber(row.protein),
          karbohidrat: parseNumber(row.karbohidrat),
          lemak: parseNumber(row.lemak),
        },

        harga: parseNumber(row.harga),
        satuan: String(row.satuan ?? "").trim(),
        foto_url: String(row.foto_url ?? "").trim() || null,
        tersedia,
      };

      const parsed = produkSchema.safeParse(data);

      if (!parsed.success) {
        gagal.push({
          baris: i + 2,
          pesan: "Data tidak valid. Periksa kolom wajib dan formatnya.",
        });
        continue;
      }

      try {
        await prisma.produk.create({
          data: {
            ...parsed.data,
            kategori_id: parsed.data.kategori_id ?? null,
            foto_url: parsed.data.foto_url ?? null,
          },
        });

        berhasil++;
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "P2002"
        ) {
          gagal.push({
            baris: i + 2,
            pesan: "Kode produk atau slug sudah digunakan.",
          });
        } else {
          gagal.push({
            baris: i + 2,
            pesan: "Gagal menyimpan data produk.",
          });
        }
      }
    }

    return NextResponse.json({
      message: "Import selesai.",
      total: rows.length,
      berhasil,
      gagal: gagal.length,
      detailGagal: gagal,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Tidak berizin." },
        { status: 401 }
      );
    }

    console.error("Import produk error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan saat import produk." },
      { status: 500 }
    );
  }
}
