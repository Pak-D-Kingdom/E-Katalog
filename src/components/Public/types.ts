import type { Product } from "@/lib/types";

export type CartItem = { product: Product; quantity: number };

export type CatalogSettings = {
  nama_instansi: string;
  logo_url: string | null;
  nomor_whatsapp: string;
  alamat: string | null;
  email: string | null;
  hak_cipta: string;
};
