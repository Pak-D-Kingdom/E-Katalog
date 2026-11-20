export type Gizi = {
  kalori: number;
  protein: number;
  karbohidrat: number;
  lemak: number;
};

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



export type Product = {
  id: number;
  kategori_id: number | null;
  subkategori_id: number | null;
  kode_produk: string;
  nama_produk: string;
  slug: string;
  deskripsi: string;
  informasi_gizi: Gizi;
  harga: string | number;
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

export function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
