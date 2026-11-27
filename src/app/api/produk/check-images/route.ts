import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CONCURRENCY = 8;
const TIMEOUT_MS = 7000;

async function checkOne(url: string): Promise<boolean> {
  // returns true if image is available
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Try partial GET first (minimizes payload).
    let res = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      signal: controller.signal,
      cache: "no-store",
    });

    if (res.status === 405 || res.status === 501 || res.status === 416) {
      // Server doesn't support Range; retry full GET.
      res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
    }

    if (!res.ok) return false;

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    // If content-type is present and clearly not an image, treat as broken.
    if (ct && !ct.startsWith("image/") && !ct.includes("octet-stream")) {
      return false;
    }
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  limit: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function run() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i]);
    }
  }
  const runners = Array.from({ length: Math.min(limit, items.length) }, () => run());
  await Promise.all(runners);
  return results;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const products = await prisma.produk.findMany({
      where: { foto_url: { not: null } },
      select: { id: true, foto_url: true },
    });

    const list = products.filter((p) => p.foto_url && p.foto_url.trim());

    const broken: number[] = [];
    const statuses = await runWithConcurrency(
      list,
      async (p) => {
        const ok = await checkOne(p.foto_url as string);
        if (!ok) broken.push(p.id);
        return ok;
      },
      CONCURRENCY
    );
    void statuses;

    return NextResponse.json({
      total: list.length,
      checked: list.length,
      broken,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Check images error:", error);
    return NextResponse.json({ error: "Gagal mengecek gambar." }, { status: 500 });
  }
}