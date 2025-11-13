// src/lib/http-retry.ts
import { http as baseHttp } from "@/lib/http";

// ====== CONFIG ======
export const TOKEN_KEY = "app:token";
export const REFRESH_KEY = "app:refresh";

// ====== TOKEN HELPERS (CLIENT) ======
export function setUserToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}
export function getUserToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function clearUserToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

export function setRefreshToken(refresh?: string) {
  if (!refresh) return;
  try { localStorage.setItem(REFRESH_KEY, refresh); } catch {}
}
export function getRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
}
export function clearRefreshToken() {
  try { localStorage.removeItem(REFRESH_KEY); } catch {}
}

// ====== Utils ======
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Redireciona para "/" somente no browser */
function redirectToLogin() {
  if (typeof window !== "undefined") {
    try { clearUserToken(); } catch {}
    try { clearRefreshToken(); } catch {}
    window.location.assign("/");
  }
}

// ====== Refresh com single-flight ======
let refreshPromise: Promise<string | null> | null = null;

/** Faz o refresh apenas uma vez por rajada de falhas */
async function getFreshTokenSingleFlight(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = getRefreshToken();
      if (!refresh) return null;

      try {
        // use baseHttp para manter o mesmo tratamento de erros/URL base
        const res = await baseHttp<any>("/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: refresh }),
        });

        const lvl1 = (res as any)?.data ?? res;
        const newToken: string | undefined = lvl1?.token;
        const newRefresh: string | undefined = lvl1?.refreshToken ?? refresh;

        if (newToken) {
          setUserToken(newToken);
          if (newRefresh) setRefreshToken(newRefresh);
          return newToken;
        }
      } catch (err) {
        console.warn("Falha ao renovar token", err);
      }
      return null;
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

// ====== Cliente com retry + refresh ======
export async function httpRetry<T>(
  url: string,
  options: RequestInit & { headers?: Record<string, string> } = {},
  attempt = 1,
  maxAttempts = 5
): Promise<T> {
  const token = getUserToken();

  // normaliza headers (evita spread de Headers/tuplas)
  const normalizeHeaders = (h?: HeadersInit | Record<string, string>): Record<string, string> => {
    if (!h) return {};
    if (typeof (h as Headers)?.forEach === "function") {
      const out: Record<string, string> = {};
      (h as Headers).forEach((v, k) => { out[k] = v; });
      return out;
    }
    if (Array.isArray(h)) {
      const out: Record<string, string> = {};
      for (const [k, v] of h as Array<[string, string]>) out[k] = v;
      return out;
    }
    return { ...(h as Record<string, string>) };
  };

  const baseHeaders = normalizeHeaders(options.headers as any);

  // injeta Authorization se não veio
  const mergedHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...baseHeaders,
    ...(token && !baseHeaders.Authorization ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    return await baseHttp<T>(url, { ...options, headers: mergedHeaders } as any);
  } catch (err: any) {
    const status =
      err?.status ||
      err?.response?.status ||
      err?.data?.statusCode ||
      err?.statusCode;

    // Se 401 OU 403 (Forbidden por token expirado), tenta refresh UMA vez
    if ((status === 401 || status === 403) && attempt === 1) {
      const newToken = await getFreshTokenSingleFlight();
      if (newToken) {
        const retryHeaders = {
          ...mergedHeaders,
          Authorization: `Bearer ${newToken}`,
        };
        return httpRetry<T>(url, { ...options, headers: retryHeaders }, attempt + 1, maxAttempts);
      }
      // Refresh falhou → limpar tokens e mandar para login
      redirectToLogin();
      // Propaga erro para quem chamou (caso SSR ou testes)
      throw err;
    }

    // 429/503 → exponential backoff + jitter
    if ((status === 429 || status === 503) && attempt < maxAttempts) {
      const retryAfterHeader =
        err?.response?.headers?.["retry-after"] ??
        err?.headers?.["retry-after"] ??
        err?.response?.headers?.get?.("retry-after");

      const retryAfterSec = retryAfterHeader ? parseInt(String(retryAfterHeader), 10) : 0;

      const baseDelay = Math.min(30000, Math.pow(2, attempt) * 250);
      const jitter = Math.floor(Math.random() * 250);
      const delayMs = retryAfterSec > 0 ? retryAfterSec * 1000 : baseDelay + jitter;

      await sleep(delayMs);
      return httpRetry<T>(url, { ...options, headers: mergedHeaders }, attempt + 1, maxAttempts);
    }

    throw err;
  }
}
