// src/lib/http-retry.ts
import { http as baseHttp } from "@/lib/http";

/** Sleep util */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Wrapper de http com retry para 429/503 (rate limit / service unavailable)
 * - Respeita Retry-After (segundos) se presente
 * - Exponential backoff com jitter
 */
export async function httpRetry<T>(
  url: string,
  options: RequestInit & { headers?: Record<string, string> } = {},
  attempt = 1,
  maxAttempts = 5
): Promise<T> {
  try {
    // passe tudo para o seu http base
    return await baseHttp<T>(url, options as any);
  } catch (err: any) {
    const status =
      err?.status || err?.response?.status || err?.data?.statusCode || err?.statusCode;

    if ((status === 429 || status === 503) && attempt < maxAttempts) {
      // tenta ler Retry-After
      const retryAfterHeader =
        err?.response?.headers?.["retry-after"] ??
        err?.headers?.["retry-after"] ??
        err?.response?.headers?.get?.("retry-after");

      const retryAfterSec = retryAfterHeader ? parseInt(String(retryAfterHeader), 10) : 0;

      // backoff exponencial com jitter (cap em 30s)
      const baseDelay = Math.min(30000, Math.pow(2, attempt) * 250);
      const jitter = Math.floor(Math.random() * 250);
      const delayMs = retryAfterSec > 0 ? retryAfterSec * 1000 : baseDelay + jitter;

      // opcional: log
      // console.warn(`429/503 em ${url}. Tentativa ${attempt}/${maxAttempts}. Aguardando ${delayMs}ms...`);

      await sleep(delayMs);
      return httpRetry<T>(url, options, attempt + 1, maxAttempts);
    }

    // outros erros ou estourou tentativas: propaga
    throw err;
  }
}
