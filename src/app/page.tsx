import type { Metadata } from "next";
import Catalog from "@/components/Catalog";

export const metadata: Metadata = {
  title: "DapurKita | Kitchen Supply & B2B Solutions",
  description: "Penyedia solusi pengadaan dapur komersial, bahan baku, legalitas, perawatan, dan peralatan heavy duty."
};

export default function HomePage() {
  return <Catalog page="home" />;
}
