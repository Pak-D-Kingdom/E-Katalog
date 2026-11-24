import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHomeSlides } from "@/lib/catalog-settings";
import { zodErrorMessage } from "@/lib/validation";

export const dynamic = "force-dynamic";

const slidesSchema = z.object({
  slides: z.array(
    z.object({
      foto_url: z.string().trim().min(1).max(500),
    })
  ).min(1, "Slider harus memiliki minimal satu foto.")
    .max(10, "Slider maksimal memiliki 10 foto."),
});

export async function GET() {
  return NextResponse.json({ slides: await getHomeSlides() });
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const parsed = slidesSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodErrorMessage(parsed.error), details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.slider_beranda.deleteMany();
      await transaction.slider_beranda.createMany({
        data: parsed.data.slides.map((slide, urutan) => ({
          foto_url: slide.foto_url,
          urutan,
        })),
      });
    });

    return NextResponse.json({ slides: parsed.data.slides });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Tidak berizin." }, { status: 401 });
    }
    throw error;
  }
}
