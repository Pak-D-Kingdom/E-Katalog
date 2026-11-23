import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getCatalogSettings = cache(() =>
  prisma.pengaturan_katalog.findFirst({
    select: {
      nama_instansi: true,
      nomor_whatsapp: true,
      alamat: true,
      email: true,
      hak_cipta: true,
    },
    orderBy: { id: "asc" },
  })
);
