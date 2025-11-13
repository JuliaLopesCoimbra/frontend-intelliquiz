// lib/http.ts
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

type FetchOptions = RequestInit & { parseJson?: boolean };

export class HttpError extends Error {
  status: number;
  data?: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "HttpError";
  }
}

export async function http<T = unknown>(
  path: string,
  { parseJson = true, headers, ...init }: FetchOptions = {}
): Promise<T> {
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
    throw new HttpError(res.status, msg, data);
  }
  return (parseJson ? (data as T) : (undefined as unknown as T));
}
