
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { produkSchema } from "@/lib/validation";
import { slugify } from "@/lib/types";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;

  const text = String(value).trim().toLowerCase();

  if (["true", "1", "ya", "yes", "tersedia", "aktif", "ready"].includes(text)) {
    return true;
  }
  if (["false", "0", "tidak", "no", "tidak tersedia", "nonaktif", "habis"].includes(text)) {
    return false;
  }

  return null;
}

function normalizeRow(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.trim().toLowerCase().replace(/[\s-]+/g, "_"),
      value,
    ])
  );
}

function getValue(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && String(value ?? "").trim() !== "") {
      return value;
    }
  }

  return "";
}

function parseNumber(value: unknown): number {
  if (value === "" || value === null || value === undefined) {
    return NaN;
  }

  return Number(value);
}

function parseNumberOrDefault(value: unknown, fallback: number): number {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
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
    const firstRow = rows[0] ? normalizeRow(rows[0]) : {};
    const hasSummaryColumns = [
      "kategori",
      "subkategori",
      "jumlah_barang",
    ].every((key) => Object.prototype.hasOwnProperty.call(firstRow, key));
    const hasProductColumns = [
      "kode_produk",
      "kode_barang",
      "sku",
      "kode",
      "nama_produk",
      "nama_barang",
      "nama",
    ].some((key) => Object.prototype.hasOwnProperty.call(firstRow, key));

    if (hasSummaryColumns && !hasProductColumns) {
      let berhasil = 0;
      let dilewati = 0;
      const gagal: { baris: number; pesan: string }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = normalizeRow(rows[i]);
        const kategori = String(getValue(row, "kategori")).trim();
        const subkategori = String(getValue(row, "subkategori")).trim();
        const jumlahBarang = parseNumber(getValue(row, "jumlah_barang"));

        if (
          !subkategori &&
          ["total barang", "total"].includes(kategori.toLowerCase())
        ) {
          dilewati++;
          continue;
        }

        if (
          !kategori ||
          kategori.length > 120 ||
          !subkategori ||
          subkategori.length > 120 ||
          !Number.isInteger(jumlahBarang) ||
          jumlahBarang < 0 ||
          jumlahBarang > 2147483647
        ) {
          gagal.push({
            baris: i + 2,
            pesan: "Kategori, subkategori, atau jumlah barang tidak valid.",
          });
          continue;
        }

        try {
          await prisma.rekap_barang.upsert({
            where: {
              kategori_subkategori: { kategori, subkategori },
            },
            create: { kategori, subkategori, jumlah_barang: jumlahBarang },
            update: { jumlah_barang: jumlahBarang },
          });
          await prisma.produk.updateMany({
            where: {
              kategori: { is: { nama_kategori: kategori } },
              subkategori: { is: { nama_subkategori: subkategori } },
              stok: null,
            },
            data: { stok: jumlahBarang },
          });
          berhasil++;
        } catch (error) {
          console.error("Import rekap barang error:", error);
          gagal.push({
            baris: i + 2,
            pesan: "Gagal menyimpan rekap barang ke database.",
          });
        }
      }

      return NextResponse.json({
        message: "Import rekap selesai.",
        jenis: "rekap_subkategori",
        total: rows.length,
        berhasil,
        dilewati,
        gagal: gagal.length,
        detailGagal: gagal,
      });
    }

    const categories = await prisma.kategori.findMany({
      select: { id: true, nama_kategori: true, slug: true },
    });

    let berhasil = 0;
    const gagal: { baris: number; pesan: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const sourceRow = rows[i];

      // Lewati baris kosong
      if (
        Object.values(sourceRow).every(
          (value) => String(value).trim() === ""
        )
      ) {
        continue;
      }

      const row = normalizeRow(sourceRow);
      const namaProduk = String(
        getValue(row, "nama_produk", "nama_barang", "nama")
      ).trim();
      const kodeProduk = String(
        getValue(row, "kode_produk", "kode_barang", "sku", "kode")
      ).trim();
      const kategoriValue = getValue(
        row,
        "kategori_id",
        "nama_kategori",
        "kategori"
      );
      const kategoriNumber = parseNumber(kategoriValue);
      const kategoriByName = categories.find((category) => {
        const categoryValue = String(kategoriValue).trim().toLowerCase();
        return (
          category.nama_kategori.trim().toLowerCase() === categoryValue ||
          category.slug === slugify(String(kategoriValue))
        );
      });
      const kategoriId =
        Number.isInteger(kategoriNumber) && kategoriNumber > 0
          ? kategoriNumber
          : kategoriByName?.id ?? null;
      const deskripsi =
        String(getValue(row, "deskripsi", "keterangan")).trim() ||
        "Detail produk belum tersedia. Silakan hubungi Admin untuk informasi lebih lanjut.";
      const tersedia = parseBoolean(
        getValue(row, "tersedia", "status_ketersediaan", "status")
      ) ?? true;
      const stockValue = getValue(row, "stok", "jumlah_barang");

      const data = {
        kode_produk: kodeProduk,
        nama_produk: namaProduk,
        slug: String(getValue(row, "slug")).trim() || slugify(namaProduk),
        deskripsi,
        kategori_id: kategoriId,

        informasi_gizi: {
          kalori: parseNumberOrDefault(getValue(row, "kalori"), 0),
          protein: parseNumberOrDefault(getValue(row, "protein"), 0),
          karbohidrat: parseNumberOrDefault(getValue(row, "karbohidrat"), 0),
          lemak: parseNumberOrDefault(getValue(row, "lemak"), 0),
        },

        harga: parseNumber(getValue(row, "harga", "harga_satuan", "price")),
        stok: stockValue === "" ? null : parseNumber(stockValue),
        satuan: String(getValue(row, "satuan", "unit") || "unit").trim(),
        foto_url: String(getValue(row, "foto_url", "gambar")).trim() || null,
        tersedia,
      };

      const parsed = produkSchema.safeParse(data);

      if (!parsed.success) {
        const pesan = parsed.error.issues
          .map((issue) => `${issue.path.join(".") || "data"}: ${issue.message}`)
          .join("; ");
        gagal.push({
          baris: i + 2,
          pesan,
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
