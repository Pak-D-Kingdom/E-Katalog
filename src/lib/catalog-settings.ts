import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { defaultHomeSlides } from "@/lib/home-slides";

export const getCatalogSettings = cache(() =>
  prisma.pengaturan_katalog.findFirst({
    select: {
      nama_instansi: true,
      logo_url: true,
      nomor_whatsapp: true,
      alamat: true,
      email: true,
      hak_cipta: true,
    },
    orderBy: { id: "asc" },
  })
);

export const getHomeSlides = cache(async () => {
  const slides = await prisma.slider_beranda.findMany({
    select: { foto_url: true },
    orderBy: [{ urutan: "asc" }, { id: "asc" }],
  });

  return slides.length > 0 ? slides : defaultHomeSlides;
});
