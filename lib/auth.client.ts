// src/lib/auth.client.ts (ou onde você mantém esses helpers)
import { http } from "@/lib/http";

export const TOKEN_KEY = "app:token";
export const REFRESH_KEY = "app:refresh";

/** Access token */
export function setUserToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}
export function getUserToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function clearUserToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

/** Refresh token */
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

/** Logout helper (limpa server-side cookie e store local) */
export async function logout(router?: any) {
  try {
    await fetch("/api/auth/clear", { method: "POST", credentials: "include" });
  } finally {
    try {
      const { useApp } = await import("@/lib/store");
      useApp.getState().logout?.();
    } catch {}
    try { clearUserToken(); } catch {}
    try { clearRefreshToken(); } catch {}
    if (router?.push) router.push("/login");
  }
}

/** Tenta renovar o access token usando o refresh token atual */
export async function refreshTokenIfNeeded(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await http<any>("/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    // suporta { data: { token, refreshToken } } ou { token, refreshToken }
    const lvl1 = res?.data ?? res;
    const token: string | undefined = lvl1?.token;
    const newRefresh: string | undefined = lvl1?.refreshToken ?? refresh;

    if (token) {
      setUserToken(token);
      if (newRefresh) setRefreshToken(newRefresh);
      return token;
    }
  } catch (err) {
    console.warn("Falha ao renovar token", err);
  }

  return null;
}
