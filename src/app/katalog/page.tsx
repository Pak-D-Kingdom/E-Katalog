import type { Metadata } from "next";
import { Suspense } from "react";
import PublicCatalog from "@/components/Public/Catalog";
import { getCatalogSettings } from "@/lib/catalog-settings";

const description = "Jelajahi katalog produk dan layanan pengadaan untuk dapur profesional, HORECA, hotel, restoran, dan catering.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCatalogSettings();
  const name = settings?.nama_instansi.trim() || "Katalog";

  return {
    title: `Katalog ${name} | Pengadaan HORECA B2B`,
    description,
  };
}

export default async function CatalogPage() {
  const settings = await getCatalogSettings();

  return (
    <Suspense fallback={null}>
      <PublicCatalog page="catalog" initialSettings={settings} />
    </Suspense>
  );
}
