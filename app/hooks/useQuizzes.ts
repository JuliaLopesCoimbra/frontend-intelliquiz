"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { http } from "@/lib/http";
import { httpRetry } from "@/lib/http-retry";
import { getUserToken } from "@/lib/auth.client";
import type { ApiQuiz, EnrichedQuiz } from "./quiz";

export function useQuizzes(search: string, opts?: { enabled?: boolean }) {
  const router = useRouter();
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [apiQuizzes, setApiQuizzes] = useState<EnrichedQuiz[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
 const enabled = opts?.enabled ?? true;
  // caches para enriquecer
  const categoryNameCache = useMemo(() => new Map<string, string>(), []);
  const userNameCache = useMemo(() => new Map<string, string>(), []);

  // throttle simples (sem libs): até 3 requests concorrentes
const MAX_CONCURRENCY = 3;
let active = 0;
const queue: Array<() => void> = [];
async function throttle<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENCY) {
    await new Promise<void>((res) => queue.push(res));
  }
  active++;
  try {
    return await fn();
  } finally {
    active--;
    const next = queue.shift();
    if (next) next();
  }
}

// dedupe em voo: evita pedir o mesmo recurso 2x ao mesmo tempo
const inflight = new Map<string, Promise<any>>();

async function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const p = inflight.get(key);
  if (p) return p;
  const newP = fn().finally(() => inflight.delete(key));
  inflight.set(key, newP);
  return newP;
}

async function getCategoryName(id: string, token: string): Promise<string> {
  if (!id) return "—";
  const cached = categoryNameCache.get(id);
  if (cached) return cached;

  const name = await dedup(`cat:${id}`, () =>
    throttle(async () => {
      const r = await httpRetry<{ data: { id: string; name: string } }>(
        `/categories/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return r?.data?.name ?? "—";
    })
  );

  categoryNameCache.set(id, name);
  return name;
}

async function getUserName(id: string, token: string): Promise<string> {
  if (!id) return "—";
  const cached = userNameCache.get(id);
  if (cached) return cached;

  const name = await dedup(`user:${id}`, () =>
    throttle(async () => {
      const r = await httpRetry<{ data: { id: string; username: string; name?: string } }>(
        `/users/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return r?.data?.username || "—";
    })
  );

  userNameCache.set(id, name);
  return name;
}

  useEffect(() => {
     if (!enabled) return;
    (async () => {
      try {
        setLoadingQuizzes(true);
        setFetchError(null);
        const token = getUserToken();
        if (!token) {
          router.replace("/login?next=/client/dashboard");
          return;
        }
        await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 300)));
       const res = await httpRetry<{ data: ApiQuiz[] }>("/quizzes", {
  headers: { Authorization: `Bearer ${token}` },
});
        const base = res?.data ?? [];

        const enriched = await Promise.all(
          base.map(async (q) => {
            const [categoryName, authorName] = await Promise.all([
              getCategoryName(q.category_id, token),
              getUserName(q.created_by, token),
            ]);
            return { ...q, categoryName, authorName };
          })
        );
        setApiQuizzes(enriched);
      } catch (err: any) {
        const status = err?.status || err?.response?.status;
        if (status === 401 || status === 403) {
          router.replace("/login?next=/client/dashboard");
          return;
        }
        setFetchError(err?.body || err?.message || "Erro ao carregar quizzes.");
        console.error("GET /quizzes falhou:", status, err);
      } finally {
        setLoadingQuizzes(false);
      }
    })();
  }, [enabled,router]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return apiQuizzes;
    return apiQuizzes.filter(
      (q) =>
        q.name.toLowerCase().includes(s) ||
        q.categoryName.toLowerCase().includes(s) ||
        q.authorName.toLowerCase().includes(s)
    );
  }, [apiQuizzes, search]);

  return { loadingQuizzes, fetchError, quizzes: filtered };
}
