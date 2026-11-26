import assert from "node:assert/strict";
import { buildSearchQuery, relevanceScore, relevanceLabel } from "../src/lib/image-search/query";
import { isSafeImageUrl, parseSafeHttpUrl } from "../src/lib/image-search/url";

// Query builder
const q1 = buildSearchQuery({ nama_produk: "Minyak Goreng Tropical 2 Liter", satuan: "botol" });
assert.ok(q1.includes("Minyak Goreng Tropical 2 Liter"));
assert.ok(q1.includes("kemasan produk"));

const q2 = buildSearchQuery({ nama_produk: "TAHU", satuan: "unit", kategori: { nama_kategori: "Bahan Baku" }, subkategori: { nama_subkategori: "Hewani" } });
assert.ok(q2.includes("Hewani") || q2.includes("Bahan Baku"));

// Relevance
const scoreHigh = relevanceScore(
  { nama_produk: "ULTRA MILK FULLCREAM 125ml", satuan: "unit" },
  { title: "Ultra Milk Fullcream 125ml kemasan", isProduct: true }
);
assert.ok(scoreHigh >= 60, `expected high, got ${scoreHigh}`);
assert.equal(relevanceLabel(scoreHigh), "Tinggi");

const scoreLow = relevanceScore(
  { nama_produk: "GALON CLUB", satuan: "unit" },
  { title: "Random unrelated image", isProduct: false }
);
assert.ok(scoreLow < 60);

// URL safety
assert.equal(isSafeImageUrl("https://example.com/a.jpg"), true);
assert.equal(isSafeImageUrl("http://localhost/x.png"), false);
assert.equal(isSafeImageUrl("http://127.0.0.1/x.png"), false);
assert.equal(isSafeImageUrl("http://10.0.0.1/x.png"), false);
assert.equal(isSafeImageUrl("http://192.168.1.1/x.png"), false);
assert.equal(isSafeImageUrl("ftp://example.com/x.png"), false);
assert.equal(isSafeImageUrl("https://user:pass@example.com/x.png"), false);
assert.equal(parseSafeHttpUrl("https://example.com/" + "a".repeat(2100)), null);

console.log("All image-finder helper tests passed.");
