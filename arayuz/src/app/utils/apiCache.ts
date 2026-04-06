// Basit in-memory cache - sayfa yenilenene kadar geçerli
const TTL = 5 * 60 * 1000; // 5 dakika

interface Entry { data: any; ts: number }
const store: Record<string, Entry> = {};

export function getCached(key: string): any | null {
  const e = store[key];
  if (!e) return null;
  if (Date.now() - e.ts > TTL) { delete store[key]; return null; }
  return e.data;
}

export function setCached(key: string, data: any): void {
  store[key] = { data, ts: Date.now() };
}

export function invalidateCache(...keys: string[]): void {
  if (keys.length === 0) Object.keys(store).forEach(k => delete store[k]);
  else keys.forEach(k => delete store[k]);
}
