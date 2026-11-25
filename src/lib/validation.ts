
import { z } from "zod";

export function zodErrorMessage(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).filter(Boolean).join("; ");
}

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
export const produkSchema = z
  .object({
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

    informasi_gizi: z
      .object({
        kalori: z.number().nonnegative(),
        protein: z.number().nonnegative(),
        karbohidrat: z.number().nonnegative(),
        lemak: z.number().nonnegative(),
      })
      .default({ kalori: 0, protein: 0, karbohidrat: 0, lemak: 0 }),

    // Jenis harga
    jenis_harga: z.enum(["tetap", "rentang"]).default("tetap"),

    stok: z.number().int().nonnegative().max(4294967295).nullable().optional(),

    // Harga tetap
    harga: z.number().positive().nullable().optional(),

    // Harga rentang
    harga_min: z.number().positive().nullable().optional(),
    harga_max: z.number().positive().nullable().optional(),

    satuan: z.string().trim().min(1).max(40),

    foto_url: z.string().trim().max(2048).nullable().optional(),

    tersedia: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.jenis_harga === "tetap") {
      if (data.harga == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["harga"],
          message: "Harga tetap wajib diisi.",
        });
      }
    }

    if (data.jenis_harga === "rentang") {
      if (data.harga_min == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["harga_min"],
          message: "Harga minimal wajib diisi.",
        });
      }

      if (data.harga_max == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["harga_max"],
          message: "Harga maksimal wajib diisi.",
        });
      }

      if (
        data.harga_min != null &&
        data.harga_max != null &&
        data.harga_max < data.harga_min
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["harga_max"],
          message: "Harga maksimal tidak boleh lebih kecil dari harga minimal.",
        });
      }
    }
  })
  .transform((data) => ({
    ...data,

    // Kosongkan kolom harga yang tidak digunakan
    harga: data.jenis_harga === "tetap" ? data.harga! : null,

    harga_min: data.jenis_harga === "rentang" ? data.harga_min! : null,

    harga_max: data.jenis_harga === "rentang" ? data.harga_max! : null,
  }));

// VALIDASI KATEGORI
export const kategoriSchema = z.object({
  nama_kategori: z.string().trim().min(1).max(120),

  slug: slugSchema,

  ikon_url: z.string().trim().max(500).nullable().optional(),
});

// VALIDASI PENGATURAN KATALOG
export const pengaturanSchema = z.object({
  nama_instansi: z.string().trim().min(1).max(191),

  logo_url: z.string().trim().max(500).nullable().optional(),

  nomor_whatsapp: z
    .string()
    .trim()
    .regex(
      /^[0-9+()\s-]{8,30}$/,
      "Format nomor WhatsApp tidak valid."
    ),

  alamat: z.string().trim().nullable().optional(),

  email: z.string().trim().email("Format email tidak valid.").max(191).nullable().optional(),

  hak_cipta: z.string().trim().min(1).max(500),

  template_pesan: z.string().trim().min(1),
});
