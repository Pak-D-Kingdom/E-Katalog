import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const extensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif"
};

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File) || !extensions[file.type]) {
      return NextResponse.json({ error: "Pilih file gambar JPG, PNG, WebP, atau AVIF." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Ukuran gambar maksimal 5 MB." }, { status: 413 });
    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}${extensions[file.type]}`;
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()), { flag: "wx" });
    return NextResponse.json({ foto_url: `/uploads/${filename}` }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    throw error;
  }
}
