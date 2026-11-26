import type { ImageCandidate, ImageSearchOutcome, ImageSearchProvider } from "./types";
import { domainFromUrl, isSafeImageUrl, safeSourceUrl } from "./url";

export type ImageSearchErrorKind =
  | "invalid_key"
  | "rate_limited"
  | "quota"
  | "server"
  | "network"
  | "bad_response";

export class ImageSearchError extends Error {
  kind: ImageSearchErrorKind;
  status?: number;
  requestCount: number;

  constructor(kind: ImageSearchErrorKind, message: string, options?: { status?: number; requestCount?: number }) {
    super(message);
    this.name = "ImageSearchError";
    this.kind = kind;
    this.status = options?.status;
    this.requestCount = options?.requestCount ?? 0;
  }
}

type SerpApiImage = {
  thumbnail?: string;
  original?: string;
  link?: string;
  source?: string;
  title?: string;
  is_product?: boolean;
};

type SerpApiPayload = {
  error?: string;
  images_results?: SerpApiImage[];
};

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 700;
const REQUEST_TIMEOUT_MS = 20_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(response: Response): number | null {
  const value = response.headers.get("retry-after");
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(value);
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  return null;
}

function truncate(value: string | undefined, max: number): string | null {
  if (!value) return null;
  return value.trim().slice(0, max) || null;
}

export class SerpApiImageSearchProvider implements ImageSearchProvider {
  name = "serpapi";

  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("SERPAPI_API_KEY belum diatur.");
    this.apiKey = apiKey;
  }

  async search(query: string, limit: number): Promise<ImageSearchOutcome> {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_images");
    url.searchParams.set("q", query);
    url.searchParams.set("gl", "id");
    url.searchParams.set("hl", "id");
    url.searchParams.set("google_domain", "google.co.id");
    url.searchParams.set("safe", "active");
    url.searchParams.set("imgsz", "qsvga");
    url.searchParams.set("ijn", "0");
    url.searchParams.set("api_key", this.apiKey);

    let requestCount = 0;
    let lastError: ImageSearchError | null = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      requestCount++;
      let response: Response;

      try {
        response = await fetch(url, {
          cache: "no-store",
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (error) {
        lastError = new ImageSearchError(
          "network",
          error instanceof Error ? error.message : "Gagal menghubungi SerpApi.",
          { requestCount }
        );
        if (attempt < MAX_ATTEMPTS - 1) {
          await sleep(BASE_BACKOFF_MS * 2 ** attempt + Math.random() * 250);
          continue;
        }
        throw lastError;
      }

      if (response.status === 401 || response.status === 403) {
        throw new ImageSearchError("invalid_key", "API key SerpApi tidak valid atau tidak berizin.", {
          status: response.status,
          requestCount,
        });
      }

      if (response.status === 429 || response.status >= 500) {
        const message =
          response.status === 429
            ? "Kuota atau batas laju SerpApi tercapai."
            : `SerpApi mengembalikan error ${response.status}.`;
        lastError = new ImageSearchError(response.status === 429 ? "rate_limited" : "server", message, {
          status: response.status,
          requestCount,
        });

        if (attempt < MAX_ATTEMPTS - 1) {
          const wait = retryAfterMs(response) ?? BASE_BACKOFF_MS * 2 ** attempt + Math.random() * 250;
          await sleep(wait);
          continue;
        }
        throw lastError;
      }

      if (!response.ok) {
        throw new ImageSearchError("server", `SerpApi mengembalikan error ${response.status}.`, {
          status: response.status,
          requestCount,
        });
      }

      let payload: SerpApiPayload;
      try {
        payload = (await response.json()) as SerpApiPayload;
      } catch {
        throw new ImageSearchError("bad_response", "Respons SerpApi tidak dapat dibaca.", {
          status: response.status,
          requestCount,
        });
      }

      if (payload.error) {
        const message = String(payload.error);
        if (/run out|quota|credit|searches left/i.test(message)) {
          throw new ImageSearchError("quota", message, { status: response.status, requestCount });
        }
        throw new ImageSearchError("bad_response", message, { status: response.status, requestCount });
      }

      const results = Array.isArray(payload.images_results) ? payload.images_results : [];
      const candidates: ImageCandidate[] = [];
      const seen = new Set<string>();

      for (const item of results) {
        const imageUrl = item.original?.trim() || item.thumbnail?.trim() || "";
        if (!imageUrl || !isSafeImageUrl(imageUrl)) continue;
        if (seen.has(imageUrl)) continue;
        seen.add(imageUrl);

        const sourceUrl = safeSourceUrl(item.link);
        candidates.push({
          title: truncate(item.title, 500),
          imageUrl,
          thumbnailUrl: isSafeImageUrl(item.thumbnail) ? item.thumbnail!.trim() : null,
          sourceUrl,
          domain: domainFromUrl(sourceUrl) ?? domainFromUrl(imageUrl),
          provider: this.name,
          relevance: 0,
          isProduct: Boolean(item.is_product),
        });

        if (candidates.length >= Math.max(limit * 2, 10)) break;
      }

      return { candidates, requestCount };
    }

    throw lastError ?? new ImageSearchError("network", "Pencarian gambar gagal.", { requestCount });
  }
}
