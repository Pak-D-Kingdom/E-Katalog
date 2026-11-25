import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { defaultHomeSlides } from "@/lib/home-slides";

export const getCatalogSettings = cache(async () => {
  try {
    return await prisma.pengaturan_katalog.findFirst({
      select: {
        nama_instansi: true,
        logo_url: true,
        nomor_whatsapp: true,
        alamat: true,
        email: true,
        hak_cipta: true,
      },
      orderBy: { id: "asc" },
    });
  } catch (error) {
    console.warn("Database unavailable during getCatalogSettings, using null:", error);
    return null;
  }
});

export const getHomeSlides = cache(async () => {
  try {
    const slides = await prisma.slider_beranda.findMany({
      select: { foto_url: true },
      orderBy: [{ urutan: "asc" }, { id: "asc" }],
    });

    return slides.length > 0 ? slides : defaultHomeSlides;
  } catch (error) {
    console.warn("Database unavailable during getHomeSlides, using defaultHomeSlides:", error);
    return defaultHomeSlides;
  }
});
