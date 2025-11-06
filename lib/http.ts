// src/lib/http.ts
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

type FetchOptions = RequestInit & { parseJson?: boolean };

export async function http<T = unknown>(
  path: string,
  { parseJson = true, headers, ...init }: FetchOptions = {}
): Promise<T> {
  // importa dinamicamente para evitar SSR usar window
  const { getUserToken } = await import("./auth.client");
  const token = getUserToken();

  const rel = path.startsWith("/") ? path : `/${path}`;
  const url = API_URL ? `${API_URL}${rel}` : rel;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    ...init,
  });

  let data: any = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return (parseJson ? (data as T) : (undefined as unknown as T));
}
