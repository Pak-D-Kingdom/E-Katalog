import type { Metadata } from "next";
import PublicCatalog from "@/components/Public/Catalog";

export const metadata: Metadata = {
  title: "Katalog DapurKita | Pengadaan HORECA B2B",
  description: "Jelajahi katalog produk dan layanan pengadaan untuk dapur profesional, HORECA, hotel, restoran, dan catering."
};

export default function CatalogPage() {
  return <PublicCatalog page="catalog" />;
}
