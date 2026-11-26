export type SearchableProduct = {
  nama_produk: string;
  satuan: string | null;
  kategori?: { nama_kategori: string } | null;
  subkategori?: { nama_subkategori: string } | null;
};

const SIZE_PATTERN =
  /\b\d+(?:[.,]\d+)?\s*(?:ml|l|lt|liter|litre|kg|gr|g|gram|pcs|pc|pack|pak|dus|box|sachet|botol|kaleng|karung|jerigen|roll|rim|set|unit|porsi)\b/i;

const STOP_WORDS = new Set([
  "dan",
  "untuk",
  "dengan",
  "ukuran",
  "kemasan",
  "produk",
  "isi",
  "per",
  "the",
  "of",
  "for",
  "with",
  "pack",
  "pcs",
]);

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function sizeTokens(value: string): string[] {
  return (
    normalizeText(value).match(
      /\b\d+(?:[.,]\d+)?\s*(?:ml|l|lt|liter|litre|kg|gr|g|gram|pcs|pc|pack|pak|dus|box|sachet|botol|kaleng|karung|jerigen|roll|rim|set|unit|porsi)\b/g
    ) ?? []
  ).map((token) => token.replace(/\s+/g, ""));
}

export function buildSearchQuery(product: SearchableProduct, keyword?: string): string {
  const name = product.nama_produk.trim();
  const parts = [name];

  if (!SIZE_PATTERN.test(name) && product.satuan) {
    const satuan = product.satuan.trim();
    if (satuan && !["unit", "porsi"].includes(satuan.toLowerCase())) {
      parts.push(satuan);
    }
  }

  if (name.split(/\s+/).filter(Boolean).length <= 2) {
    const context = product.subkategori?.nama_subkategori ?? product.kategori?.nama_kategori;
    if (context) parts.push(context);
  }

  const extraKeyword = keyword?.trim();
  if (extraKeyword) parts.push(extraKeyword);

  parts.push("kemasan produk");

  return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, 500);
}

export function relevanceScore(
  product: SearchableProduct,
  candidate: { title: string | null; isProduct: boolean }
): number {
  const productName = normalizeText(product.nama_produk);
  const title = normalizeText(candidate.title ?? "");

  if (!title) return candidate.isProduct ? 25 : 10;

  let score = 15;

  if (productName && title.includes(productName)) {
    score += 55;
  } else {
    const productTokens = new Set(tokens(product.nama_produk));
    const titleTokens = new Set(tokens(candidate.title ?? ""));

    if (productTokens.size > 0) {
      let overlap = 0;
      for (const token of productTokens) {
        if (titleTokens.has(token)) overlap++;
      }
      score += Math.round((overlap / productTokens.size) * 45);
    }
  }

  const productSizes = new Set(sizeTokens(product.nama_produk));
  const titleSizes = new Set(sizeTokens(candidate.title ?? ""));
  if (productSizes.size > 0 && titleSizes.size > 0) {
    let sizeMatch = false;
    for (const size of productSizes) {
      if (titleSizes.has(size)) {
        sizeMatch = true;
        break;
      }
    }
    if (sizeMatch) score += 15;
  }

  const context = normalizeText(
    `${product.kategori?.nama_kategori ?? ""} ${product.subkategori?.nama_subkategori ?? ""}`
  );
  if (context) {
    const contextTokens = tokens(context);
    const titleTokens = new Set(tokens(candidate.title ?? ""));
    if (contextTokens.some((token) => titleTokens.has(token))) score += 5;
  }

  if (candidate.isProduct) score += 10;

  return Math.max(0, Math.min(100, score));
}

export function relevanceLabel(score: number): "Tinggi" | "Sedang" | "Rendah" {
  if (score >= 60) return "Tinggi";
  if (score >= 35) return "Sedang";
  return "Rendah";
}
