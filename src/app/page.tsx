import type { Metadata } from "next";
import { Suspense } from "react";
import PublicCatalog from "@/components/Public/Catalog";
import { getCatalogSettings, getHomeSlides } from "@/lib/catalog-settings";

const description = "Penyedia solusi pengadaan dapur profesional, peralatan heavy duty, bahan baku, legalitas, perawatan, dan maintenance HORECA.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCatalogSettings();
  const name = settings?.nama_instansi.trim() || "Katalog";

  return {
    title: `${name} | Kitchen Supply & B2B Solutions`,
    description,
  };
}

export default async function HomePage() {
  const [settings, homeSlides] = await Promise.all([
    getCatalogSettings(),
    getHomeSlides(),
  ]);

  return (
    <Suspense fallback={null}>
      <PublicCatalog page="home" initialSettings={settings} homeSlides={homeSlides} />
    </Suspense>
  );
}
