import type { Metadata } from "next";
import Catalog from "@/components/Public/Home/Catalog";

export const metadata: Metadata = {
  title: "DapurKita | Kitchen Supply & B2B Solutions",
  description: "Penyedia solusi pengadaan dapur profesional, peralatan heavy duty, bahan baku, legalitas, perawatan, dan maintenance HORECA."
};

export default function HomePage() {
  return <Catalog page="home" />;
}
