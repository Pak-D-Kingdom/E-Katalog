export type Category = {
  id: number;
  nama_kategori: string;
  slug: string;
  ikon_url: string | null;
};

export type Subcategory = {
  id: number;
  kategori_id: number;
  nama_subkategori: string;
  slug: string;
  dibuat_pada?: string;
  kategori?: Category;
  _count?: {
    produk: number;
  };
};


export type JenisHarga = "tetap" | "rentang";

export type Product = {
  id: number;
  kategori_id: number | null;
  subkategori_id: number | null;
  kode_produk: string;
  nama_produk: string;
  slug: string;
  deskripsi: string;

  // Informasi harga
  jenis_harga: JenisHarga;
  harga: string | number | null;
  harga_min: string | number | null;
  harga_max: string | number | null;

  satuan: string;
  foto_url: string | null;
  tersedia: boolean;
  kategori?: Category | null;
  subkategori?: Subcategory | null;
};

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...init?.headers }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/auth/login")) {
      window.location.assign("/admin/auth/login");
    }
    const message = typeof result.error === "string"
      ? result.error
      : "Permintaan gagal. Silakan coba kembali.";
    throw new Error(message);
  }
  return result as T;
}

export const rupiah = (value: number | string) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));

// Mengambil harga satuan untuk produk harga tetap
export function hargaSatuan(product: Product): number | null {
  if (product.jenis_harga !== "tetap" || product.harga == null) {
    return null;
  }

  const price = Number(product.harga);

  return Number.isFinite(price) && price > 0 ? price : null;
}

// Menampilkan harga produk sesuai jenis harganya
export function formatProductPrice(product: Product): string {
  if (product.jenis_harga === "rentang") {
    if (product.harga_min == null || product.harga_max == null) {
      return "Hubungi Admin";
    }

    const min = Number(product.harga_min);
    const max = Number(product.harga_max);

    if (
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      min <= 0 ||
      max < min
    ) {
      return "Hubungi Admin";
    }

    return `${rupiah(min)} – ${rupiah(max)}`;
  }

  const price = hargaSatuan(product);

  return price !== null ? rupiah(price) : "Harga belum tersedia";
}

export function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
