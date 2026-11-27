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

export const LEGACY_DEFAULT_PRODUCT_DESCRIPTION =
  "Detail produk belum tersedia. Silakan hubungi Admin untuk informasi lebih lanjut.";

export function getProductDescription(description: string): string {
  const value = description.trim();
  return value.toLowerCase() === LEGACY_DEFAULT_PRODUCT_DESCRIPTION.toLowerCase()
    ? ""
    : value;
}

export type Gizi = {
  kalori: number;
  protein: number;
  karbohidrat: number;
  lemak: number;
};

export type Product = {
  id: number;
  kategori_id: number | null;
  subkategori_id: number | null;
  kode_produk: string;
  nama_produk: string;
  slug: string;
  deskripsi: string;
  informasi_gizi: Gizi;
  jenis_harga: JenisHarga;
  harga: string | number | null;
  harga_min: string | number | null;
  harga_max: string | number | null;
  stok: number | null;
  satuan: string;
  foto_url: string | null;
  tersedia: boolean;
  jumlah_barang_subkategori?: number | null;
  kategori?: Category | null;
  subkategori?: Subcategory | null;
};

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...init?.headers }
  });
  const result = await response.json().catch((error) => {
    // Request yang dibatalkan (AbortController) tidak boleh dianggap respons kosong.
    if ((error as Error)?.name === "AbortError") throw error;
    return {};
  });
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

export function hargaRentang(
  product: Product
): { min: number; max: number } | null {
  if (
    product.jenis_harga !== "rentang" ||
    product.harga_min == null ||
    product.harga_max == null
  ) {
    return null;
  }

  const min = Number(product.harga_min);
  const max = Number(product.harga_max);

  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) {
    return null;
  }

  return { min, max };
}

// Menampilkan harga produk sesuai jenis harganya
export function formatProductPrice(product: Product): string {
  if (product.jenis_harga === "rentang") {
    const range = hargaRentang(product);
    return range ? `${rupiah(range.min)} – ${rupiah(range.max)}` : "Hubungi Admin";
  }

  const price = hargaSatuan(product);

  return price !== null ? rupiah(price) : "Harga belum tersedia";
}

export function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
