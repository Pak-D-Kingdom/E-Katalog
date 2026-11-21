
import { z } from "zod";

// Pola slug: huruf kecil, angka, dan tanda hubung
const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug wajib diisi.")
  .max(191)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Format slug tidak valid. Gunakan huruf kecil, angka, dan tanda hubung."
  );

// VALIDASI PRODUK
export const produkSchema = z.object({
  // Kategori utama wajib dipilih
  kategori_id: z.number().int().positive(),

  // Subkategori boleh kosong
  subkategori_id: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  kode_produk: z.string().trim().min(1).max(80),

  nama_produk: z.string().trim().min(1).max(191),

  slug: slugSchema,

  deskripsi: z.string().trim().min(1),

  informasi_gizi: z.object({
    kalori: z.number().nonnegative(),
    protein: z.number().nonnegative(),
    karbohidrat: z.number().nonnegative(),
    lemak: z.number().nonnegative(),
  }),

  harga: z.number().positive(),

  stok: z.number().int().nonnegative().max(4294967295).nullable().optional(),

  satuan: z.string().trim().min(1).max(40),

  foto_url: z.string().trim().max(500).nullable().optional(),

  tersedia: z.boolean(),
});

// VALIDASI KATEGORI
export const kategoriSchema = z.object({
  nama_kategori: z.string().trim().min(1).max(120),

  slug: slugSchema,

  ikon_url: z.string().trim().max(500).nullable().optional(),
});

// VALIDASI PENGATURAN KATALOG
export const pengaturanSchema = z.object({
  nama_instansi: z.string().trim().min(1).max(191),

  nomor_whatsapp: z
    .string()
    .trim()
    .regex(
      /^[0-9+()\s-]{8,30}$/,
      "Format nomor WhatsApp tidak valid."
    ),

  alamat: z.string().trim().nullable().optional(),

  template_pesan: z.string().trim().min(1),
});
