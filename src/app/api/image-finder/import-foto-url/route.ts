import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  kode_produk: z.string().trim().min(1).max(120),
  foto_url: z.string().trim().url().max(2048),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(5000),
});

function getLegacySkuParts(kodeProduk: string) {
  const code = kodeProduk.trim().toUpperCase();
  const twoWordMatch = code.match(/^(.+)-([A-Z0-9]{1,4})-([A-Z0-9]{1,4})-(\d+)$/);
  const oneWordMatch = twoWordMatch ? null : code.match(/^(.+)-([A-Z0-9]{1,4})-(\d+)$/);
  const prefix = twoWordMatch ? twoWordMatch[1] : oneWordMatch?.[1];
  const nameKey = twoWordMatch
    ? `${twoWordMatch[2]}-${twoWordMatch[3]}`
    : oneWordMatch?.[2];
  const sequenceText = twoWordMatch ? twoWordMatch[4] : oneWordMatch?.[3];
  if (!prefix || !nameKey || !sequenceText) return null;

  const sequence = Number(sequenceText);
  if (!Number.isSafeInteger(sequence) || sequence < 1) return null;

  return { prefix, nameKey, sequence };
}

function getProductSkuNameKey(namaProduk: string) {
  const words = namaProduk
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return null;
  return words.slice(0, 2).map((word) => word.slice(0, 4)).join("-");
}

function getStoredSkuPrefix(kodeProduk: string) {
  return kodeProduk.trim().toUpperCase().match(/^(.+)-\d+$/)?.[1] ?? null;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
    }

    const items = parsed.data.items;
    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    let matchedByLegacySku = 0;
    const errors: string[] = [];

    await prisma.$transaction(async (tx) => {
      // Legacy SKU suffixes follow the original product import order.
      const products = await tx.produk.findMany({
        select: { id: true, kode_produk: true, nama_produk: true, foto_url: true },
        orderBy: { id: "asc" },
      });
      const productsByCode = new Map(
        products.map((product) => [product.kode_produk.trim().toUpperCase(), product])
      );
      const productsByLegacySku = new Map<string, typeof products>();

      for (const product of products) {
        const prefix = getStoredSkuPrefix(product.kode_produk);
        const nameKey = getProductSkuNameKey(product.nama_produk);
        if (!prefix || !nameKey) continue;

        const key = `${prefix}\0${nameKey}`;
        const matches = productsByLegacySku.get(key) ?? [];
        matches.push(product);
        productsByLegacySku.set(key, matches);
      }

      for (const item of items) {
        let product = productsByCode.get(item.kode_produk.trim().toUpperCase());
        if (!product) {
          const legacySku = getLegacySkuParts(item.kode_produk);
          if (legacySku) {
            const key = `${legacySku.prefix}\0${legacySku.nameKey}`;
            product = productsByLegacySku.get(key)?.[legacySku.sequence - 1];
            if (product) matchedByLegacySku += 1;
          }
        }

        if (!product) {
          notFound += 1;
          continue;
        }

        if (product.foto_url === item.foto_url) {
          skipped += 1;
          continue;
        }

        await tx.produk.update({
          where: { id: product.id },
          data: { foto_url: item.foto_url },
        });
        product.foto_url = item.foto_url;
        updated += 1;
      }
    }, { timeout: 30_000 });

    return NextResponse.json({
      total: items.length,
      updated,
      skipped,
      notFound,
      matchedByLegacySku,
      errors,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Import foto URL error:", error);
    return NextResponse.json({ error: "Gagal mengimpor foto URL." }, { status: 500 });
  }
}