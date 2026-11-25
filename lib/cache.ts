type Entry<T> = { value: T; expires: number };

const PREFIX = "tutor-cache-v3:";
const WEEK = 7 * 24 * 60 * 60 * 1000;

export function cacheKey(...parts: (string | number | undefined)[]): string {
  return (
    PREFIX +
    parts
      .filter((p) => p !== undefined && p !== null && p !== "")
      .map((p) => String(p).trim().toLowerCase())
      .join("|")
  );
}

export function getCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (!entry || typeof entry.expires !== "number") return null;
    if (Date.now() > entry.expires) {
      window.localStorage.removeItem(key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, value: T, ttlMs = WEEK): void {
  if (typeof window === "undefined") return;
  try {
    const entry: Entry<T> = { value, expires: Date.now() + ttlMs };
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // storage full or blocked — silently skip caching
  }
}
