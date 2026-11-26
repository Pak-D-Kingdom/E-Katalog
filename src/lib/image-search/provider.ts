import { SerpApiImageSearchProvider } from "./serpapi";
import { getSerpApiKey } from "./api-key";
import type { ImageSearchProvider } from "./types";

export async function getImageSearchProvider(): Promise<ImageSearchProvider> {
  const provider = process.env.IMAGE_SEARCH_PROVIDER?.trim().toLowerCase() || "serpapi";

  if (provider === "serpapi") {
    const { key } = await getSerpApiKey();
    if (!key) throw new Error("SERPAPI_API_KEY belum diatur (env atau pengaturan).");
    return new SerpApiImageSearchProvider(key);
  }

  throw new Error(`Provider pencarian gambar "${provider}" belum didukung.`);
}