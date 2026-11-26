import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSerpApiKey, saveSerpApiKey, maskApiKey } from "@/lib/image-search/api-key";
import { clearSerpApiQuotaCache } from "@/lib/image-search/quota";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  apiKey: z.string().max(500).optional().default(""),
});

export async function GET() {
  try {
    await requireAdmin();
    const { key, source, decryptError } = await getSerpApiKey();
    return NextResponse.json({
      hasKey: Boolean(key),
      source,
      masked: key ? maskApiKey(key) : null,
      decryptError,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("SerpApi key GET error:", error);
    return NextResponse.json({ error: "Gagal membaca API key." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
    }

    const value = parsed.data.apiKey.trim();
    await saveSerpApiKey(value === "" ? null : value);
    clearSerpApiQuotaCache();

    const { key, source } = await getSerpApiKey();
    return NextResponse.json({
      hasKey: Boolean(key),
      source,
      masked: key ? maskApiKey(key) : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("SerpApi key POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menyimpan API key." },
      { status: 500 }
    );
  }
}