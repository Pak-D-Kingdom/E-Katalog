import { SerpApiImageSearchProvider } from "./serpapi";
import type { ImageSearchProvider } from "./types";

export function getImageSearchProvider(): ImageSearchProvider {
  const provider = process.env.IMAGE_SEARCH_PROVIDER?.trim().toLowerCase() || "serpapi";

  if (provider === "serpapi") {
    const apiKey = process.env.SERPAPI_API_KEY?.trim();
    if (!apiKey) throw new Error("SERPAPI_API_KEY belum diatur di environment server.");
    return new SerpApiImageSearchProvider(apiKey);
  }

  throw new Error(`Provider pencarian gambar "${provider}" belum didukung.`);
}
