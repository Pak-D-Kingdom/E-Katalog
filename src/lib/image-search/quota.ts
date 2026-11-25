export type SerpApiQuota = {
  planName: string | null;
  searchesPerMonth: number | null;
  planSearchesLeft: number | null;
  totalSearchesLeft: number | null;
  thisMonthUsage: number | null;
  hourlyLimit: number | null;
  fetchedAt: string;
};

type AccountPayload = {
  error?: string;
  plan_name?: string;
  searches_per_month?: number;
  plan_searches_left?: number;
  total_searches_left?: number;
  this_month_usage?: number;
  account_rate_limit_per_hour?: number;
};

let cache: { data: SerpApiQuota; expiresAt: number } | null = null;
const CACHE_MS = 60_000;

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function getSerpApiQuota(force = false): Promise<SerpApiQuota> {
  if (!force && cache && cache.expiresAt > Date.now()) return cache.data;

  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey) throw new Error("SERPAPI_API_KEY belum diatur di environment server.");

  const url = new URL("https://serpapi.com/account.json");
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Gagal membaca kuota SerpApi (HTTP ${response.status}).`);
  }

  const payload = (await response.json()) as AccountPayload;
  if (payload.error) throw new Error(String(payload.error));

  const data: SerpApiQuota = {
    planName: typeof payload.plan_name === "string" ? payload.plan_name : null,
    searchesPerMonth: numberOrNull(payload.searches_per_month),
    planSearchesLeft: numberOrNull(payload.plan_searches_left),
    totalSearchesLeft: numberOrNull(payload.total_searches_left),
    thisMonthUsage: numberOrNull(payload.this_month_usage),
    hourlyLimit: numberOrNull(payload.account_rate_limit_per_hour),
    fetchedAt: new Date().toISOString(),
  };

  cache = { data, expiresAt: Date.now() + CACHE_MS };
  return data;
}
