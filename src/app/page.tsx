import type { Metadata } from "next";
import Catalog from "@/components/Catalog";

export const metadata: Metadata = {
  title: "DapurKita | Kitchen Supply & B2B Solutions",
<<<<<<< Updated upstream
  description: "Penyedia solusi pengadaan dapur komersial, bahan baku, legalitas, perawatan, dan peralatan heavy duty."
=======
  description: "Solusi pengadaan dapur profesional, peralatan heavy duty, bahan baku, legalitas, dan layanan maintenance HORECA."
>>>>>>> Stashed changes
};

export default function HomePage() {
  return <Catalog page="home" />;
}
