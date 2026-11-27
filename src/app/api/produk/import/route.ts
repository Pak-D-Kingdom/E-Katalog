import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  hasPriceAmountChanged,
  hasPriceChanged,
} from "@/lib/pricing";
import { LEGACY_DEFAULT_PRODUCT_DESCRIPTION } from "@/lib/types";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

type ExcelRow = Record<string, unknown> & {
  __sourceRowNumber?: number;
};

type SheetConfig = {
  name: string;
  sheetAliases: string[];
  categoryAliases: string[];
  prefix: string;
};

const sourceSheets: SheetConfig[] = [
  {
    name: "Bahan Baku",
    sheetAliases: ["Bahan Baku & Food Supplies"],
    categoryAliases: [
      "Bahan Baku",
      "Bahan Baku & Food Supplies",
    ],
    prefix: "RAW",
  },
  {
    name: "Peralatan",
    sheetAliases: ["Peralatan Dapur"],
    categoryAliases: [
      "Peralatan",
      "Peralatan Dapur",
    ],
    prefix: "EQ",
  },
  {
    name: "Perizinan",
    sheetAliases: ["Perizinan & Legalitas"],
    categoryAliases: [
      "Perizinan",
      "Perizinan & Legalitas",
    ],
    prefix: "LEG",
  },
  {
    name: "Perawatan",
    sheetAliases: ["Perawatan & Maintenance"],
    categoryAliases: [
      "Perawatan",
      "Perawatan & Maintenance",
    ],
    prefix: "SRV",
  },
];

// Normalisasi teks untuk pencocokan kategori dan subkategori.
function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Normalisasi nama header Excel.
function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Membaca kolom dengan beberapa kemungkinan nama header.
function getCell(
  row: ExcelRow,
  ...headerNames: string[]
): unknown {
  const acceptedHeaders = headerNames.map(normalizeHeader);

  for (const [key, value] of Object.entries(row)) {
    if (acceptedHeaders.includes(normalizeHeader(key))) {
      return value;
    }
  }

  return undefined;
}

function getText(
  row: ExcelRow,
  ...headerNames: string[]
): string {
  return String(getCell(row, ...headerNames) ?? "").trim();
}

function getDescriptionText(row: ExcelRow): string {
  const description = getText(
    row,
    "Deskripsi Lengkap",
    "Deskripsi Lengkap Produk/Layanan",
    "Deskripsi Produk/Layanan",
    "Deskripsi Produk",
    "Deskripsi",
    "Description"
  );
  if (description) return description;

  const matchingColumn = Object.entries(row).find(
    ([header, value]) =>
      /deskripsi|description/i.test(header) &&
      String(value ?? "").trim() !== ""
  );

  return String(matchingColumn?.[1] ?? "").trim();
}

// Membaca harga dalam format angka maupun Rupiah Indonesia.
function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }

  let text = String(value)
    .trim()
    .replace(/^rp\.?\s*/i, "")
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "");

  if (!text) return NaN;

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    // Contoh 1.000.000,50
    if (lastComma > lastDot) {
      text = text.replace(/\./g, "").replace(",", ".");
    } else {
      // Contoh 1,000,000.50
      text = text.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    const parts = text.split(",");
    const lastPart = parts[parts.length - 1];

    if (parts.length > 2 || lastPart.length === 3) {
      text = text.replace(/,/g, "");
    } else {
      text = text.replace(",", ".");
    }
  } else if (lastDot !== -1) {
    const parts = text.split(".");
    const lastPart = parts[parts.length - 1];

    if (parts.length > 2 || lastPart.length === 3) {
      text = text.replace(/\./g, "");
    }
  }

  const result = Number(text);

  return Number.isFinite(result) ? result : NaN;
}

function parseNonnegativeNumber(value: unknown): number {
  const parsed = parsePrice(value);
  if (parsed === null) return 0;
  return parsed;
}

// Membuat slug otomatis dan memastikan tidak duplikat.
function toSlug(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 170)
      .replace(/-+$/g, "") || "produk"
  );
}

// Membuat nilai unik untuk SKU dan slug.
function createUniqueValue(
  base: string,
  used: Set<string>
): string {
  let candidate = base;
  let suffix = 2;

  while (used.has(candidate.toLowerCase())) {
    candidate = `${base}-${suffix}`;
    suffix++;
  }

  used.add(candidate.toLowerCase());

  return candidate;
}

// SKU mengikuti pola kategori dan nama produk.
// Contoh: EQ-KOMPOR-GAS-001
function generateSku(
  name: string,
  prefix: string,
  usedSkus: Set<string>
): string {
  const words = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const nameCode = words
    .slice(0, 2)
    .map((word) => word.slice(0, 4))
    .join("-");

  const base = `${prefix}-${nameCode || "PRODUK"}`;

  let index = 1;
  let candidate = `${base}-${String(index).padStart(3, "0")}`;

  while (usedSkus.has(candidate.toLowerCase())) {
    index++;
    candidate = `${base}-${String(index).padStart(3, "0")}`;
  }

  usedSkus.add(candidate.toLowerCase());

  return candidate;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    // Menerima file Excel.
    const formData = await request.formData();
    const file = formData.get("file");
    const modeValue = formData.get("mode");

    if (
      modeValue !== null &&
      modeValue !== "baru" &&
      modeValue !== "update" &&
      modeValue !== "semua"
    ) {
      return NextResponse.json(
        { error: "Mode import tidak valid." },
        { status: 400 }
      );
    }

    const importMode = modeValue ?? "semua";

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

    const firstSheetName = workbook.SheetNames[0];
    const firstSheet = firstSheetName
      ? workbook.Sheets[firstSheetName]
      : undefined;
    const firstSheetRows = firstSheet
      ? XLSX.utils.sheet_to_json<ExcelRow>(firstSheet, {
          defval: "",
          blankrows: false,
        })
      : [];
    const summaryHeaders = Object.keys(firstSheetRows[0] ?? {}).map(
      normalizeHeader
    );
    const isSummaryImport = [
      "kategori",
      "subkategori",
      "jumlahbarang",
    ].every((header) => summaryHeaders.includes(header));

    if (isSummaryImport) {
      let berhasil = 0;
      let dilewati = 0;
      const gagal: { baris: number; pesan: string }[] = [];

      for (let index = 0; index < firstSheetRows.length; index++) {
        const row = firstSheetRows[index];
        const kategori = getText(row, "Kategori");
        const subkategori = getText(row, "Subkategori");
        const jumlahBarang = Number(getCell(row, "Jumlah Barang"));

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
            baris: index + 2,
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
            baris: index + 2,
            pesan: "Gagal menyimpan rekap barang ke database.",
          });
        }
      }

      return NextResponse.json({
        message: "Import rekap selesai.",
        jenis: "rekap_subkategori",
        total: firstSheetRows.length,
        berhasil,
        dilewati,
        gagal: gagal.length,
        detailGagal: gagal,
      });
    }

    const knownCategorySheetNames = sourceSheets.flatMap((config) => [
      config.name,
      ...config.sheetAliases,
    ]);
    const hasKnownCategorySheet = workbook.SheetNames.some((name) =>
      knownCategorySheetNames.some(
        (knownName) => normalizeText(knownName) === normalizeText(name)
      )
    );

    let flatExport: {
      sheetName: string;
      rows: ExcelRow[];
    } | null = null;

    if (!hasKnownCategorySheet) {
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: "",
          blankrows: true,
        });
        const headerIndex = rawRows.findIndex((row, index) => {
          if (index > 10) return false;

          const normalizedHeaders = row.map((value) =>
            normalizeHeader(String(value ?? ""))
          );
          return ["namabarang", "kodesku", "kategori"].every((header) =>
            normalizedHeaders.includes(header)
          );
        });

        if (headerIndex === -1) continue;

        const headers = rawRows[headerIndex].map((value) =>
          String(value ?? "").trim()
        );
        const rows = rawRows
          .slice(headerIndex + 1)
          .map((values, index) => {
            const row: ExcelRow = {};
            headers.forEach((header, columnIndex) => {
              if (header) row[header] = values[columnIndex] ?? "";
            });
            Object.defineProperty(row, "__sourceRowNumber", {
              value: headerIndex + index + 2,
            });
            return row;
          })
          .filter((row) =>
            Object.entries(row).some(
              ([key, value]) =>
                key !== "__sourceRowNumber" &&
                String(value ?? "").trim() !== ""
            )
          );

        flatExport = { sheetName, rows };
        break;
      }
    }

    const rowWithoutCategory = flatExport?.rows.find(
      (row) => !getText(row, "Kategori")
    );
    if (rowWithoutCategory) {
      return NextResponse.json(
        {
          error: `Kolom Kategori wajib diisi pada baris ${rowWithoutCategory.__sourceRowNumber}.`,
        },
        { status: 400 }
      );
    }

    // Impor ekspor katalog yang berisi satu sheet dengan kolom kategori.
    const preparedSheets = flatExport
      ? (() => {
          const rowsByCategory = new Map<
            string,
            { categoryName: string; rows: ExcelRow[] }
          >();

          for (const row of flatExport.rows) {
            const categoryName = getText(row, "Kategori");
            const key = normalizeText(categoryName);
            const group = rowsByCategory.get(key) ?? {
              categoryName,
              rows: [],
            };
            group.rows.push(row);
            rowsByCategory.set(key, group);
          }

          return Array.from(rowsByCategory.values()).map(
            ({ categoryName, rows }) => {
              const config = sourceSheets.find((candidate) =>
                candidate.categoryAliases.some(
                  (alias) =>
                    normalizeText(alias) === normalizeText(categoryName)
                )
              ) ?? {
                name: categoryName,
                sheetAliases: [],
                categoryAliases: [categoryName],
                prefix: "PRD",
              };

              return {
                config,
                actualSheetName: flatExport.sheetName,
                rows,
              };
            }
          );
        })()
      : sourceSheets.map((config) => {
          const acceptedNames = [
            config.name,
            ...config.sheetAliases,
          ].map(normalizeText);

          const actualSheetName = workbook.SheetNames.find((name) =>
            acceptedNames.includes(normalizeText(name))
          );

          const sheet = actualSheetName
            ? workbook.Sheets[actualSheetName]
            : undefined;

          const rows = sheet
            ? XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
                defval: "",
                blankrows: false,
              })
            : [];

          return {
            config,
            actualSheetName: actualSheetName ?? config.name,
            rows,
          };
        });

    const activeSheets = preparedSheets.filter(({ rows }) =>
      rows.some((row) =>
        Object.values(row).some(
          (value) => String(value ?? "").trim() !== ""
        )
      )
    );

    if (activeSheets.length === 0) {
      return NextResponse.json(
        {
          error:
            "Tidak ditemukan data produk pada sheet Bahan Baku, Peralatan, Perizinan, atau Perawatan.",
        },
        { status: 400 }
      );
    }

    // Mengambil kategori dari database.
    const categories = await prisma.kategori.findMany({
      select: {
        id: true,
        nama_kategori: true,
      },
    });

    // Memastikan setiap sheet memiliki kategori di database.
    const resolvedSheets = [];

    for (const item of activeSheets) {
      const aliases = item.config.categoryAliases.map(normalizeText);

      const category = categories.find((category) =>
        aliases.includes(normalizeText(category.nama_kategori))
      );

      if (!category) {
        return NextResponse.json(
          {
            error: `Kategori untuk sheet "${item.actualSheetName}" belum ditemukan di database. Periksa kategori di Admin.`,
          },
          { status: 400 }
        );
      }

      resolvedSheets.push({
        ...item,
        category,
      });
    }

    // Memeriksa produk, SKU, dan slug yang sudah ada.
    const existingProducts = await prisma.produk.findMany({
      select: {
        id: true,
        kategori_id: true,
        nama_produk: true,
        kode_produk: true,
        slug: true,
        jenis_harga: true,
        harga: true,
        harga_min: true,
        harga_max: true,
      },
    });

    const existingBySku = new Map(
      existingProducts.map((item) => [
        item.kode_produk.toLowerCase(),
        item,
      ])
    );
    const existingByProduct = new Map<string, typeof existingProducts>();

    for (const product of existingProducts) {
      if (product.kategori_id === null) continue;

      const key =
        `${product.kategori_id}:${normalizeText(product.nama_produk)}`;
      const matches = existingByProduct.get(key) ?? [];
      matches.push(product);
      existingByProduct.set(key, matches);
    }

    const usedSkus = new Set(
      existingProducts.map((item) =>
        item.kode_produk.toLowerCase()
      )
    );

    const usedSlugs = new Set(
      existingProducts.map((item) =>
        item.slug.toLowerCase()
      )
    );

    // Cache subkategori agar tidak dibuat berulang.
    const subcategoryCache = new Map<string, number>();

    async function getSubcategoryId(
      categoryId: number,
      subcategoryName: string
    ): Promise<number> {
      const normalizedName = normalizeText(subcategoryName);
      const cacheKey = `${categoryId}:${normalizedName}`;

      const cached = subcategoryCache.get(cacheKey);

      if (cached !== undefined) return cached;

      const existing = await prisma.subkategori.findMany({
        where: { kategori_id: categoryId },
        select: {
          id: true,
          nama_subkategori: true,
        },
      });

      const matched = existing.find(
        (item) =>
          normalizeText(item.nama_subkategori) === normalizedName
      );

      if (matched) {
        subcategoryCache.set(cacheKey, matched.id);
        return matched.id;
      }

      // Jika belum ada, buat subkategori baru.
      const baseSlug = toSlug(subcategoryName);
      let slug = baseSlug;
      let suffix = 2;

      while (
        await prisma.subkategori.findFirst({
          where: {
            kategori_id: categoryId,
            slug,
          },
          select: { id: true },
        })
      ) {
        slug = `${baseSlug}-${suffix}`;
        suffix++;
      }

      const created = await prisma.subkategori.create({
        data: {
          kategori_id: categoryId,
          nama_subkategori: subcategoryName,
          slug,
        },
      });

      subcategoryCache.set(cacheKey, created.id);

      return created.id;
    }

    let berhasil = 0;
    let produkBaru = 0;
    let hargaBerubah = 0;
    let satuanBerubah = 0;
    let deskripsiBerubah = 0;
    let dataBerubah = 0;
    let deskripsiTerbaca = 0;
    let deskripsiKosong = 0;
    let dilewati = 0;
    let totalBaris = 0;
    const processedImportRows = new Set<string>();

    const gagal: {
      sheet: string;
      baris: number;
      nama: string;
      pesan: string;
    }[] = [];

    // Mulai proses import setiap sheet.
    for (const { config, actualSheetName, rows, category } of resolvedSheets) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const barisExcel = row.__sourceRowNumber ?? i + 2;

        // Lewati baris yang benar-benar kosong.
        if (
          Object.values(row).every(
            (value) => String(value ?? "").trim() === ""
          )
        ) {
          continue;
        }

        totalBaris++;

        const namaProduk = getText(
          row,
          "Nama Barang",
          "Nama Produk"
        );

        const kategoriExcel = getText(row, "Kategori");

        const subcategoryName = getText(
          row,
          "Subkategori",
          "Sub Kategori"
        );
        const hasSubcategoryColumn =
          getCell(row, "Subkategori", "Sub Kategori") !== undefined;

        const skuExcel = getText(
          row,
          "Kode SKU",
          "Kode Produk",
          "SKU"
        );

        const jenisHargaExcel = normalizeText(
          getText(row, "Jenis Harga")
        );
        const hasPriceColumns = [
          "Jenis Harga",
          "Harga Tetap (IDR)",
          "Harga Jual",
          "Harga",
          "Harga Minimal (IDR)",
          "Harga Maksimal (IDR)",
        ].some((header) => getCell(row, header) !== undefined);

        // Harga tetap mendukung header Excel lama.
        const hargaTetap = parsePrice(
          getCell(
            row,
            "Harga Tetap (IDR)",
            "Harga Jual",
            "Harga"
          )
        );

        const hargaMin = parsePrice(
          getCell(row, "Harga Minimal (IDR)")
        );

        const hargaMax = parsePrice(
          getCell(row, "Harga Maksimal (IDR)")
        );

        const satuanCell = getCell(row, "Satuan Produk", "Satuan");
        const hasSatuanColumn = satuanCell !== undefined;
        const satuan = getText(row, "Satuan Produk", "Satuan") || "unit";

        const deskripsiExcel = getDescriptionText(row);
        const hasDescriptionColumn = Object.keys(row).some((header) =>
          /deskripsi|description/i.test(header)
        );

        const fotoCell = getCell(row, "Foto URL", "URL Foto");
        const hasFotoColumn = fotoCell !== undefined;
        const fotoUrl = String(fotoCell ?? "").trim() || null;
        const slugExcel = getText(row, "Slug URL", "Slug");
        const informasiGizi = {
          kalori: parseNonnegativeNumber(getCell(row, "Kalori")),
          protein: parseNonnegativeNumber(getCell(row, "Protein")),
          karbohidrat: parseNonnegativeNumber(
            getCell(row, "Karbohidrat")
          ),
          lemak: parseNonnegativeNumber(getCell(row, "Lemak")),
        };
        const stokCell = getCell(row, "Stok", "Jumlah Barang");
        const hasStokColumn = stokCell !== undefined;
        const stok =
          stokCell === null ||
          stokCell === undefined ||
          String(stokCell).trim() === ""
            ? null
            : parsePrice(stokCell);
        const hasNutritionColumns = [
          "Kalori",
          "Protein",
          "Karbohidrat",
          "Lemak",
        ].some((header) => getCell(row, header) !== undefined);
        const availabilityCell = getCell(row, "Tersedia", "Status");
        let tersedia: boolean | undefined;
        if (
          availabilityCell !== undefined &&
          String(availabilityCell).trim() !== ""
        ) {
          const normalizedAvailability = normalizeText(availabilityCell);
          if (["true", "aktif", "ya", "yes", "1"].includes(normalizedAvailability)) {
            tersedia = true;
          } else if (
            ["false", "nonaktif", "tidak", "no", "0"].includes(
              normalizedAvailability
            )
          ) {
            tersedia = false;
          } else {
            gagal.push({
              sheet: actualSheetName,
              baris: barisExcel,
              nama: namaProduk,
              pesan: 'Kolom "Tersedia" harus berisi TRUE/FALSE atau Aktif/Nonaktif.',
            });
            continue;
          }
        }

        // Validasi nama produk.
        if (!namaProduk) {
          gagal.push({
            sheet: actualSheetName,
            baris: barisExcel,
            nama: "",
            pesan: "Nama Barang wajib diisi.",
          });
          continue;
        }

        if (namaProduk.length > 191) {
          gagal.push({
            sheet: actualSheetName,
            baris: barisExcel,
            nama: namaProduk,
            pesan: "Nama Barang maksimal 191 karakter.",
          });
          continue;
        }

        let targetCategory = category;
        if (kategoriExcel && importMode === "update") {
          const matchingConfig = sourceSheets.find((candidate) =>
            candidate.categoryAliases.some(
              (alias) =>
                normalizeText(alias) === normalizeText(kategoriExcel)
            )
          );
          const target = categories.find(
            (item) =>
              normalizeText(item.nama_kategori) ===
              normalizeText(kategoriExcel)
          ) ?? (matchingConfig
            ? categories.find((item) =>
                matchingConfig.categoryAliases.some(
                  (alias) =>
                    normalizeText(alias) ===
                    normalizeText(item.nama_kategori)
                )
              )
            : undefined);

          if (!target) {
            gagal.push({
              sheet: actualSheetName,
              baris: barisExcel,
              nama: namaProduk,
              pesan: `Kategori "${kategoriExcel}" tidak ditemukan.`,
            });
            continue;
          }
          targetCategory = target;
        } else if (
          kategoriExcel &&
          ![
            category.nama_kategori,
            ...config.categoryAliases,
          ].some(
            (name) =>
              normalizeText(name) === normalizeText(kategoriExcel)
          )
        ) {
          gagal.push({
            sheet: actualSheetName,
            baris: barisExcel,
            nama: namaProduk,
            pesan: `Kategori "${kategoriExcel}" tidak sesuai dengan sheet "${actualSheetName}".`,
          });
          continue;
        }

        if (subcategoryName.length > 120) {
          gagal.push({
            sheet: actualSheetName,
            baris: barisExcel,
            nama: namaProduk,
            pesan: "Nama subkategori maksimal 120 karakter.",
          });
          continue;
        }

        if (skuExcel.length > 80) {
          gagal.push({
            sheet: actualSheetName,
            baris: barisExcel,
            nama: namaProduk,
            pesan: "Kode SKU maksimal 80 karakter.",
          });
          continue;
        }

        if (
          importMode === "update" &&
          slugExcel &&
          (slugExcel.length > 191 ||
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugExcel))
        ) {
          gagal.push({
            sheet: actualSheetName,
            baris: barisExcel,
            nama: namaProduk,
            pesan: "Slug URL harus huruf kecil, angka, dan tanda hubung.",
          });
          continue;
        }

        if (fotoUrl && fotoUrl.length > 500) {
          gagal.push({
            sheet: actualSheetName,
            baris: barisExcel,
            nama: namaProduk,
            pesan: "Foto URL maksimal 500 karakter.",
          });
          continue;
        }

        if (satuan.length > 40) {
          gagal.push({
            sheet: actualSheetName,
            baris: barisExcel,
            nama: namaProduk,
            pesan: "Satuan Produk maksimal 40 karakter.",
          });
          continue;
        }

        if (
          Object.values(informasiGizi).some(
            (value) => !Number.isFinite(value) || value < 0
          )
        ) {
          gagal.push({
            sheet: actualSheetName,
            baris: barisExcel,
            nama: namaProduk,
            pesan: "Informasi gizi harus berupa angka nol atau lebih.",
          });
          continue;
        }

        if (
          stok !== null &&
          (!Number.isInteger(stok) ||
            stok < 0 ||
            stok > 4294967295)
        ) {
          gagal.push({
            sheet: actualSheetName,
            baris: barisExcel,
            nama: namaProduk,
            pesan: "Stok harus berupa bilangan bulat antara 0 dan 4294967295.",
          });
          continue;
        }

        // Menentukan jenis harga.
        let jenisHarga: "tetap" | "rentang";
        const preservePrice = importMode === "update" && !hasPriceColumns;

        if (preservePrice) {
          jenisHarga = "tetap";
        } else if (
          jenisHargaExcel === "tetap" ||
          jenisHargaExcel === "harga tetap"
        ) {
          jenisHarga = "tetap";
        } else if (
          jenisHargaExcel === "rentang" ||
          jenisHargaExcel === "harga rentang"
        ) {
          jenisHarga = "rentang";
        } else if (!jenisHargaExcel) {
          // Kompatibilitas: jika jenis harga kosong,
          // sistem melihat kolom harga yang diisi.
          jenisHarga =
            hargaMin !== null || hargaMax !== null
              ? "rentang"
              : "tetap";
        } else {
          gagal.push({
            sheet: actualSheetName,
            baris: barisExcel,
            nama: namaProduk,
            pesan:
              'Jenis Harga harus diisi "tetap" atau "rentang".',
          });
          continue;
        }

        // Validasi harga sesuai jenisnya.
        let harga: number | null = null;
        let harga_min: number | null = null;
        let harga_max: number | null = null;

        if (!preservePrice && jenisHarga === "tetap") {
          if (
            hargaTetap === null ||
            !Number.isFinite(hargaTetap) ||
            hargaTetap <= 0
          ) {
            gagal.push({
              sheet: actualSheetName,
              baris: barisExcel,
              nama: namaProduk,
              pesan: "Harga Tetap wajib diisi dengan angka lebih dari 0.",
            });
            continue;
          }

          harga = hargaTetap;
        } else if (!preservePrice) {
          if (
            hargaMin === null ||
            hargaMax === null ||
            !Number.isFinite(hargaMin) ||
            !Number.isFinite(hargaMax) ||
            hargaMin <= 0 ||
            hargaMax <= 0
          ) {
            gagal.push({
              sheet: actualSheetName,
              baris: barisExcel,
              nama: namaProduk,
              pesan:
                "Harga Minimal dan Harga Maksimal wajib diisi dengan angka lebih dari 0.",
            });
            continue;
          }

          if (hargaMax < hargaMin) {
            gagal.push({
              sheet: actualSheetName,
              baris: barisExcel,
              nama: namaProduk,
              pesan: "Harga Maksimal tidak boleh lebih kecil dari Harga Minimal.",
            });
            continue;
          }

          harga_min = hargaMin;
          harga_max = hargaMax;
        }

        // SKU menjadi identitas utama; nama dan kategori dipakai sebagai fallback.
        const productKey =
          `${targetCategory.id}:${normalizeText(namaProduk)}`;
        const importRowKey = skuExcel
          ? `sku:${skuExcel.toLowerCase()}`
          : `product:${productKey}`;

        if (processedImportRows.has(importRowKey)) {
          dilewati++;
          continue;
        }

        const matchingBySku = skuExcel
          ? existingBySku.get(skuExcel.toLowerCase())
          : undefined;
        const matchingByName = existingByProduct.get(productKey) ?? [];

        if (
          importMode !== "update" &&
          matchingBySku?.kategori_id != null &&
          matchingBySku.kategori_id !== targetCategory.id
        ) {
          gagal.push({
            sheet: actualSheetName,
            baris: barisExcel,
            nama: namaProduk,
            pesan: `Kode SKU "${skuExcel}" terdaftar pada kategori lain.`,
          });
          continue;
        }

        if (!matchingBySku && matchingByName.length > 1) {
          gagal.push({
            sheet: actualSheetName,
            baris: barisExcel,
            nama: namaProduk,
            pesan: "Nama produk tidak unik. Isi Kode SKU untuk menentukan produk.",
          });
          continue;
        }

        const existingProduct = matchingBySku ?? matchingByName[0];

        if (
          (importMode === "baru" && existingProduct) ||
          (importMode === "update" && !existingProduct)
        ) {
          processedImportRows.add(importRowKey);
          dilewati++;
          continue;
        }

        if (existingProduct) {
          try {
            let targetSubcategoryId: number | null = null;
            if (hasSubcategoryColumn && subcategoryName) {
              targetSubcategoryId = await getSubcategoryId(
                targetCategory.id,
                subcategoryName
              );
            }

            const changes = await prisma.$transaction(async (transaction) => {
              const current = await transaction.produk.findUnique({
                where: { id: existingProduct.id },
                include: {
                  kategori: { select: { nama_kategori: true } },
                  subkategori: { select: { nama_subkategori: true } },
                },
              });

              if (!current) {
                throw new Error("Produk tidak ditemukan saat import.");
              }

              const categoryChanged =
                current.kategori_id !== targetCategory.id;
              const nextSubcategoryId = hasSubcategoryColumn
                ? targetSubcategoryId
                : categoryChanged
                  ? null
                  : current.subkategori_id;
              const subcategoryChanged =
                current.subkategori_id !== nextSubcategoryId;
              const unitChanged =
                hasSatuanColumn && current.satuan !== satuan;
              const descriptionChanged =
                hasDescriptionColumn &&
                (deskripsiExcel !== ""
                  ? current.deskripsi !== deskripsiExcel
                  : current.deskripsi.trim() === LEGACY_DEFAULT_PRODUCT_DESCRIPTION);
              const nextDescription = deskripsiExcel || "";
              const photoChanged =
                hasFotoColumn && current.foto_url !== fotoUrl;
              const stockChanged =
                hasStokColumn && current.stok !== stok;
              const currentNutrition =
                typeof current.informasi_gizi === "object" &&
                current.informasi_gizi !== null &&
                !Array.isArray(current.informasi_gizi)
                  ? current.informasi_gizi
                  : null;
              const nutritionChanged =
                hasNutritionColumns &&
                Object.entries(informasiGizi).some(
                  ([key, value]) =>
                    Number(currentNutrition?.[key] ?? 0) !== value
                );
              const availabilityChanged =
                tersedia !== undefined && current.tersedia !== tersedia;
              const slugChanged =
                slugExcel !== "" && current.slug !== slugExcel;

              if (slugChanged) {
                const conflictingSlug = await transaction.produk.findFirst({
                  where: {
                    slug: slugExcel,
                    id: { not: current.id },
                  },
                  select: { id: true },
                });
                if (conflictingSlug) {
                  throw new Error(`Slug "${slugExcel}" sudah digunakan.`);
                }
              }

              const nextPrice = {
                jenis_harga: preservePrice ? current.jenis_harga : jenisHarga,
                harga: preservePrice ? current.harga : harga,
                harga_min: preservePrice ? current.harga_min : harga_min,
                harga_max: preservePrice ? current.harga_max : harga_max,
              };

              const priceChanged = hasPriceChanged(current, nextPrice);
              const dataChanged =
                priceChanged ||
                categoryChanged ||
                subcategoryChanged ||
                unitChanged ||
                descriptionChanged ||
                photoChanged ||
                stockChanged ||
                nutritionChanged ||
                availabilityChanged ||
                slugChanged;

              if (!dataChanged) {
                return {
                  priceChanged: false,
                  descriptionChanged: false,
                  unitChanged: false,
                  dataChanged: false,
                };
              }

              const updated = await transaction.produk.update({
                where: { id: current.id },
                data: {
                  ...(priceChanged ? nextPrice : {}),
                  ...(categoryChanged
                    ? { kategori_id: targetCategory.id }
                    : {}),
                  ...(subcategoryChanged
                    ? { subkategori_id: nextSubcategoryId }
                    : {}),
                  ...(unitChanged ? { satuan } : {}),
                  ...(descriptionChanged ? { deskripsi: nextDescription } : {}),
                  ...(photoChanged ? { foto_url: fotoUrl } : {}),
                  ...(stockChanged ? { stok } : {}),
                  ...(nutritionChanged
                    ? { informasi_gizi: informasiGizi }
                    : {}),
                  ...(availabilityChanged ? { tersedia } : {}),
                  ...(slugChanged ? { slug: slugExcel } : {}),
                },
                include: {
                  kategori: { select: { nama_kategori: true } },
                  subkategori: { select: { nama_subkategori: true } },
                },
              });

              if (
                priceChanged ||
                categoryChanged ||
                subcategoryChanged ||
                descriptionChanged ||
                unitChanged
              ) {
                await transaction.riwayat_perubahan_harga.create({
                  data: {
                    produk_id: current.id,
                    kode_produk: current.kode_produk,
                    nama_produk: current.nama_produk,
                    kategori_lama:
                      current.kategori?.nama_kategori ?? null,
                    kategori_baru:
                      updated.kategori?.nama_kategori ?? null,
                    subkategori_lama:
                      current.subkategori?.nama_subkategori ?? null,
                    subkategori_baru:
                      updated.subkategori?.nama_subkategori ?? null,
                    kategori_berubah: categoryChanged,
                    subkategori_berubah: subcategoryChanged,
                    satuan_lama: current.satuan,
                    satuan_baru: updated.satuan,
                    satuan_berubah: unitChanged,
                    deskripsi_lama: current.deskripsi,
                    deskripsi_baru: updated.deskripsi,
                    deskripsi_berubah: descriptionChanged,
                    jenis_harga_berubah:
                      current.jenis_harga !== updated.jenis_harga,
                    harga_berubah: hasPriceAmountChanged(
                      current,
                      nextPrice
                    ),
                    jenis_harga_lama: current.jenis_harga,
                    harga_lama: current.harga,
                    harga_min_lama: current.harga_min,
                    harga_max_lama: current.harga_max,
                    jenis_harga_baru: updated.jenis_harga,
                    harga_baru: updated.harga,
                    harga_min_baru: updated.harga_min,
                    harga_max_baru: updated.harga_max,
                  },
                });
              }

              return {
                priceChanged,
                descriptionChanged,
                unitChanged,
                dataChanged,
              };
            });

            processedImportRows.add(importRowKey);
            berhasil++;
            if (changes.priceChanged) hargaBerubah++;
            if (changes.unitChanged) satuanBerubah++;
            if (changes.descriptionChanged) deskripsiBerubah++;
            if (changes.dataChanged) dataBerubah++;
            if (deskripsiExcel) {
              deskripsiTerbaca++;
            } else {
              deskripsiKosong++;
            }
          } catch (error) {
            gagal.push({
              sheet: actualSheetName,
              baris: barisExcel,
              nama: namaProduk,
              pesan:
                error instanceof Error
                  ? error.message
                  : "Gagal memperbarui harga produk.",
            });
          }

          continue;
        }

        try {
          // Membuat atau mengambil subkategori.
          let subkategoriId: number | null = null;

          if (subcategoryName) {
            subkategoriId = await getSubcategoryId(
              category.id,
              subcategoryName
            );
          }

          // SKU manual dipakai bila diisi.
          // Jika kosong, SKU dibuat otomatis.
          let kodeProduk: string;

          if (skuExcel) {
            if (usedSkus.has(skuExcel.toLowerCase())) {
              gagal.push({
                sheet: actualSheetName,
                baris: barisExcel,
                nama: namaProduk,
                pesan: `Kode SKU "${skuExcel}" sudah digunakan.`,
              });
              continue;
            }

            kodeProduk = skuExcel;
            usedSkus.add(kodeProduk.toLowerCase());
          } else {
            kodeProduk = generateSku(
              namaProduk,
              config.prefix,
              usedSkus
            );
          }

          // Slug selalu dibuat otomatis dari nama produk.
          const slug = createUniqueValue(
            toSlug(namaProduk),
            usedSlugs
          );

          // Simpan produk ke database.
          const created = await prisma.produk.create({
            data: {
              kategori_id: category.id,
              subkategori_id: subkategoriId,

              kode_produk: kodeProduk,
              nama_produk: namaProduk,
              slug,
              deskripsi: deskripsiExcel,
              informasi_gizi: informasiGizi,
              stok,

              jenis_harga: jenisHarga,
              harga,
              harga_min,
              harga_max,

              satuan,
              foto_url: fotoUrl,

              // Kolom Tersedia tidak ada di Excel.
              // Produk hasil import otomatis aktif.
              tersedia: true,
            },
            select: {
              id: true,
              kategori_id: true,
              nama_produk: true,
              kode_produk: true,
              slug: true,
              jenis_harga: true,
              harga: true,
              harga_min: true,
              harga_max: true,
            },
          });

          const matches = existingByProduct.get(productKey) ?? [];
          matches.push(created);
          existingByProduct.set(productKey, matches);
          existingBySku.set(created.kode_produk.toLowerCase(), created);
          processedImportRows.add(importRowKey);
          berhasil++;
          produkBaru++;
          if (deskripsiExcel) {
            deskripsiTerbaca++;
          } else {
            deskripsiKosong++;
          }
        } catch (error) {
          const code =
            typeof error === "object" &&
            error !== null &&
            "code" in error
              ? String(error.code)
              : "";

          gagal.push({
            sheet: actualSheetName,
            baris: barisExcel,
            nama: namaProduk,
            pesan:
              code === "P2002"
                ? "SKU atau slug sudah digunakan."
                : error instanceof Error
                  ? error.message
                  : "Gagal menyimpan produk.",
          });
        }
      }
    }

    return NextResponse.json({
      message: "Import katalog selesai.",
      jenis: "produk",
      mode: importMode,
      total: totalBaris,
      berhasil,
      produkBaru,
      hargaBerubah,
      satuanBerubah,
      deskripsiBerubah,
      dataBerubah,
      deskripsiTerbaca,
      deskripsiKosong,
      dilewati,
      gagal: gagal.length,
      detailGagal: gagal.slice(0, 100),
      detailGagalTerpotong: gagal.length > 100,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "Tidak berizin." },
        { status: 401 }
      );
    }

    console.error("Import produk error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat import produk.",
      },
      { status: 500 }
    );
  }
}
