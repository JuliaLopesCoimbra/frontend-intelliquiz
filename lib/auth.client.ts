export const TOKEN_KEY = "app:token";
export const REFRESH_KEY = "app:refresh";

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
export function clearRefreshToken() {
  try { localStorage.removeItem(REFRESH_KEY); } catch {}
}
export async function logout(router?: any) {
  try {
    await fetch("/api/auth/clear", { method: "POST" });
  } finally {
    // se você usa zustand:
    try {
      const { useApp } = await import("@/lib/store");
      useApp.getState().logout?.();
    } catch {}
    if (router?.push) router.push("/login");
  }
}
