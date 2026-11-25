import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

const STOP_WORDS = new Set([
  "DAN",
  "UNTUK",
  "DENGAN",
  "UKURAN",
  "KEMASAN",
  "PRODUK",
  "ISI",
  "PER",
  "THE",
  "OF",
  "FOR",
  "WITH",
  "PACK",
  "PCS",
]);

const UNIT_WORDS = new Set([
  "KG",
  "GR",
  "GRAM",
  "G",
  "ML",
  "L",
  "LT",
  "LITER",
  "LITRE",
  "PCS",
  "PC",
  "PACK",
  "PAK",
  "DUS",
  "BOX",
  "SACHET",
  "BOTOL",
  "KALENG",
  "KARUNG",
  "JERIGEN",
  "ROLL",
  "RIM",
  "SET",
  "UNIT",
  "PORSI",
]);

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const kategoriId = Number(searchParams.get("kategoriId") ?? "");

    const products = await prisma.produk.findMany({
      where: Number.isInteger(kategoriId) && kategoriId > 0 ? { kategori_id: kategoriId } : undefined,
      select: {
        id: true,
        nama_produk: true,
        foto_url: true,
        pencarian_gambar: { select: { status: true } },
      },
    });

    const groups = new Map<
      string,
      { name: string; total: number; searched: number; withPhoto: number }
    >();

    for (const product of products) {
      const key = normalizeName(product.nama_produk);
      const group = groups.get(key) ?? {
        name: product.nama_produk.trim(),
        total: 0,
        searched: 0,
        withPhoto: 0,
      };

      group.total += 1;
      if (product.pencarian_gambar) group.searched += 1;
      if (product.foto_url) group.withPhoto += 1;
      groups.set(key, group);
    }

    const duplicates = Array.from(groups.values())
      .filter((group) => group.total > 1)
      .sort((a, b) => b.total - a.total);

    const alreadySearchedWithPhoto = products.filter(
      (product) => product.pencarian_gambar && product.foto_url
    ).length;

    const keywordCounts = new Map<string, { count: number; withoutPhoto: number }>();
    for (const product of products) {
      const tokens = product.nama_produk
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, " ")
        .split(" ")
        .filter(
          (token) =>
            token.length > 2 &&
            !/[0-9]/.test(token) &&
            !STOP_WORDS.has(token) &&
            !UNIT_WORDS.has(token)
        );
      const unique = new Set(tokens);
      for (const token of unique) {
        const current = keywordCounts.get(token) ?? { count: 0, withoutPhoto: 0 };
        current.count += 1;
        if (!product.foto_url) current.withoutPhoto += 1;
        keywordCounts.set(token, current);
      }
    }

    const commonKeywords = Array.from(keywordCounts.entries())
      .filter(([, data]) => data.count > 1)
      .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
      .slice(0, 40)
      .map(([keyword, data]) => ({
        keyword,
        count: data.count,
        withoutPhoto: data.withoutPhoto,
      }));

    return NextResponse.json({
      duplicateGroups: duplicates.length,
      duplicateProducts: duplicates.reduce((sum, group) => sum + group.total, 0),
      groups: duplicates,
      alreadySearchedWithPhoto,
      totalProducts: products.length,
      commonKeywords,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Image finder duplicates error:", error);
    return NextResponse.json({ error: "Gagal mengambil statistik duplikat." }, { status: 500 });
  }
}
