import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isSafeImageUrl } from "@/lib/image-search/url";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(1000),
  foto_url: z.string().trim().min(1).max(2048),
});

const TIMEOUT_MS = 7000;

async function isReachableImage(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (res.status === 405 || res.status === 501 || res.status === 416) {
      res = await fetch(url, { method: "GET", signal: controller.signal, cache: "no-store" });
    }
    if (!res.ok) return false;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct && !ct.startsWith("image/") && !ct.includes("octet-stream")) return false;
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
    }

    const { ids, foto_url } = parsed.data;
    const uniqueIds = Array.from(new Set(ids));

    if (!isSafeImageUrl(foto_url)) {
      return NextResponse.json({ error: "URL gambar tidak valid." }, { status: 400 });
    }

    const reachable = await isReachableImage(foto_url);
    if (!reachable) {
      return NextResponse.json(
        { error: "Gambar tidak dapat diakses atau bukan gambar." },
        { status: 400 }
      );
    }

    const result = await prisma.produk.updateMany({
      where: { id: { in: uniqueIds } },
      data: { foto_url },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Set photo error:", error);
    return NextResponse.json({ error: "Gagal menyimpan foto." }, { status: 500 });
  }
}