import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-Katalog MBG | Makan Bergizi Gratis",
  description: "Katalog menu bergizi untuk sekolah dan komunitas."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
