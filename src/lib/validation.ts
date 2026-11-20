import { z } from "zod";

export const produkSchema = z.object({
  kategori_id: z.number().int().positive().nullable().optional(),
  subkategori: z.string().trim().max(120).nullable().optional(),
  kode_produk: z.string().trim().min(1).max(80),
  nama_produk: z.string().trim().min(1).max(191),
  slug: z.string().trim().min(1).max(191).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  deskripsi: z.string().trim().min(1),
  informasi_gizi: z.object({
    kalori: z.number().nonnegative(),
    protein: z.number().nonnegative(),
    karbohidrat: z.number().nonnegative(),
    lemak: z.number().nonnegative()
  }),
  harga: z.number().positive(),
  satuan: z.string().trim().min(1).max(40),
  foto_url: z.string().trim().max(500).nullable().optional(),
  tersedia: z.boolean()
});

export const kategoriSchema = z.object({
  nama_kategori: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(191).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  ikon_url: z.string().trim().max(500).nullable().optional()
});

export const pengaturanSchema = z.object({
  nama_instansi: z.string().trim().min(1).max(191),
  nomor_whatsapp: z.string().trim().regex(/^[0-9+()\-\s]{8,30}$/),
  alamat: z.string().trim().nullable().optional(),
  template_pesan: z.string().trim().min(1)
});
