import type { Metadata } from "next";
import { Suspense } from "react";
import PublicCatalog from "@/components/Public/Catalog";

export const metadata: Metadata = {
  title: "Katalog DapurKita | Pengadaan HORECA B2B",
  description: "Jelajahi katalog produk dan layanan pengadaan untuk dapur profesional, HORECA, hotel, restoran, dan catering."
};

export default function CatalogPage() {
  return (
    <Suspense fallback={null}>
      <PublicCatalog page="catalog" />
    </Suspense>
  );
}
