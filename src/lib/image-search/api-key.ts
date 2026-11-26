import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

const ALG = "aes-256-gcm";
const VERSION = "v1";

function encryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SECRET belum diatur di environment server.");
  return crypto.scryptSync(secret, "serpapi-api-key", 32);
}

export function maskApiKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 4) return "••••";
  return "••••" + trimmed.slice(-4);
}

export function encryptApiKey(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptApiKey(stored: string): string | null {
  try {
    const parts = stored.split(":");
    if (parts.length !== 4 || parts[0] !== VERSION) return null;
    const iv = Buffer.from(parts[1], "base64");
    const tag = Buffer.from(parts[2], "base64");
    const data = Buffer.from(parts[3], "base64");
    const decipher = crypto.createDecipheriv(ALG, encryptionKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export type SerpApiKeySource = "db" | "env" | "none";

export async function getSerpApiKey(): Promise<{
  key: string | null;
  source: SerpApiKeySource;
  decryptError: boolean;
}> {
  const row = await prisma.pengaturan_katalog.findFirst({
    select: { serpapi_api_key: true },
    orderBy: { id: "asc" },
  });

  const stored = row?.serpapi_api_key?.trim();
  if (stored) {
    const decrypted = decryptApiKey(stored);
    if (decrypted) return { key: decrypted.trim(), source: "db", decryptError: false };
    // Could not decrypt (e.g. AUTH_SECRET changed) -> fall back to env
    const envKey = process.env.SERPAPI_API_KEY?.trim();
    return { key: envKey || null, source: envKey ? "env" : "none", decryptError: true };
  }

  const envKey = process.env.SERPAPI_API_KEY?.trim();
  return { key: envKey || null, source: envKey ? "env" : "none", decryptError: false };
}

export async function saveSerpApiKey(plain: string | null): Promise<void> {
  const row = await prisma.pengaturan_katalog.findFirst({
    select: { id: true },
    orderBy: { id: "asc" },
  });
  if (!row) throw new Error("Pengaturan katalog belum ada. Buat pengaturan dasar terlebih dahulu.");

  const value = plain && plain.trim() ? encryptApiKey(plain.trim()) : null;
  await prisma.pengaturan_katalog.update({
    where: { id: row.id },
    data: { serpapi_api_key: value },
  });
}