const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
  /^\[?::1\]?$/,
  /\.local$/i,
  /^metadata\./i,
];

function isPrivateHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();

  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(host))) return true;

  // IPv6 private / link-local ranges.
  if (host.includes(":")) {
    if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) {
      return true;
    }
  }

  return false;
}

export function parseSafeHttpUrl(value: string | null | undefined): URL | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (isPrivateHost(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

export function isSafeImageUrl(value: string | null | undefined): boolean {
  return parseSafeHttpUrl(value) !== null;
}

export function safeSourceUrl(value: string | null | undefined): string | null {
  return parseSafeHttpUrl(value)?.toString() ?? null;
}

export function domainFromUrl(value: string | null | undefined): string | null {
  const url = parseSafeHttpUrl(value);
  if (!url) return null;
  return url.hostname.replace(/^www\./i, "").slice(0, 191);
}
