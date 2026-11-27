const CATEGORY_SKU_PREFIX: Record<string, string> = {
  "Bahan Baku": "RAW",
  "Peralatan": "EQ",
  "Perawatan": "SRV",
  "Perizinan": "LEG",
};

const KNOWN_PREFIXES = new Set([
  "PRD", "RAW", "SNK", "PKG", "EQ", "SRV", "LEG",
]);

export function prefixForCategory(namaKategori: string | null | undefined): string {
  if (!namaKategori) return "PRD";
  return CATEGORY_SKU_PREFIX[namaKategori.trim()] || "PRD";
}

export function isKnownSkuPrefix(prefix: string): boolean {
  return KNOWN_PREFIXES.has(prefix.toUpperCase());
}

/**
 * Ganti segmen prefix SKU sesuai kategori baru, jaga keunikan.
 * SKU non-standar (prefix tidak dikenal) dikembalikan apa adanya.
 */
export function rewriteSkuPrefix(
  currentSku: string,
  newPrefix: string,
  usedSkus: Set<string>
): string {
  const sku = (currentSku || "").trim();
  const match = sku.match(/^([A-Z0-9]+)-(.+)$/i);
  if (!match) return sku;

  const currentPrefix = match[1].toUpperCase();
  if (!isKnownSkuPrefix(currentPrefix)) return sku;
  if (currentPrefix === newPrefix.toUpperCase()) return sku;

  const rest = match[2];
  const base = `${newPrefix.toUpperCase()}-${rest}`;

  if (!usedSkus.has(base.toLowerCase())) return base;

  // Bentrok: naikkan nomor urut di belakang.
  const trailing = rest.match(/^(.*?)(\d+)$/);
  if (trailing) {
    const stem = trailing[1];
    const width = trailing[2].length;
    let index = Number(trailing[2]);
    let candidate = `${newPrefix.toUpperCase()}-${stem}${String(index).padStart(width, "0")}`;
    while (usedSkus.has(candidate.toLowerCase())) {
      index += 1;
      candidate = `${newPrefix.toUpperCase()}-${stem}${String(index).padStart(width, "0")}`;
    }
    return candidate;
  }

  // Tidak ada nomor urut: tambahkan -001, -002, ...
  let index = 1;
  let candidate = `${base}-${String(index).padStart(3, "0")}`;
  while (usedSkus.has(candidate.toLowerCase())) {
    index += 1;
    candidate = `${base}-${String(index).padStart(3, "0")}`;
  }
  return candidate;
}