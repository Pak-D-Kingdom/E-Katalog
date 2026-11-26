export const IMAGE_SEARCH_STATUSES = [
  "belum_dicari",
  "mencari",
  "menunggu_review",
  "dipilih",
  "gagal",
  "tidak_ditemukan",
  "dilewati",
] as const;

export type ImageSearchStatus = (typeof IMAGE_SEARCH_STATUSES)[number];

export const TERMINAL_STATUSES: ImageSearchStatus[] = [
  "dipilih",
  "tidak_ditemukan",
  "dilewati",
];

export const RETRYABLE_STATUSES: ImageSearchStatus[] = ["gagal", "belum_dicari"];

export function isSearchableStatus(status: string): boolean {
  return status === "belum_dicari" || status === "gagal" || status === "mencari";
}

export function statusLabel(status: string): string {
  switch (status) {
    case "belum_dicari":
      return "Belum dicari";
    case "mencari":
      return "Sedang dicari";
    case "menunggu_review":
      return "Menunggu review";
    case "dipilih":
      return "Sudah dipilih";
    case "gagal":
      return "Gagal";
    case "tidak_ditemukan":
      return "Tidak ditemukan";
    case "dilewati":
      return "Dilewati";
    default:
      return status;
  }
}
