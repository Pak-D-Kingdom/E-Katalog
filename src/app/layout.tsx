import type { Metadata } from "next";
import "sweetalert2/dist/sweetalert2.min.css";
import "./globals.css";
import PageTransition from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "E-Katalog MBG | Makan Bergizi Gratis",
  description: "Katalog menu bergizi untuk sekolah dan komunitas."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
