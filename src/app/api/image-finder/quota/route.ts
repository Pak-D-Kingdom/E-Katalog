import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSerpApiQuota } from "@/lib/image-search/quota";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "1";

    const quota = await getSerpApiQuota(force);
    return NextResponse.json(quota);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    console.error("Image finder quota error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membaca kuota." },
      { status: 502 }
    );
  }
}
