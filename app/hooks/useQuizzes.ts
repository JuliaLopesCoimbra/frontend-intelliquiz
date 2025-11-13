// app/hooks/useQuizzes.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { httpRetry } from "@/lib/http-retry";
import { getUserToken } from "@/lib/auth.client";
import type { MyQuizApi, EnrichedQuiz } from "./quiz";

type ListQuizzesResponse = {
  maxPage: number;          // zero-based vindo da API
  quizzes: MyQuizApi[];
};

type UseQuizzesOpts = {
  enabled?: boolean;
  page?: number;            // ← novo
  limit?: number;           // ← novo
};

export function useQuizzes(search: string, opts?: UseQuizzesOpts) {
  const router = useRouter();
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [apiQuizzes, setApiQuizzes] = useState<EnrichedQuiz[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [maxPage, setMaxPage] = useState(0);

  const enabled = opts?.enabled ?? true;
  const page = opts?.page ?? 0;
  const limit = opts?.limit ?? 10;

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

        // pequeno jitter
        await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 300)));

        const url = `/quizzes?page=${page}&limit=${limit}`; // ← paginação aqui
        const res = await httpRetry(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const lvl1 = (res as any)?.data ?? res;
        const lvl2 = (lvl1 as any)?.data ?? lvl1;

        const payload = lvl2 as Partial<ListQuizzesResponse> | null | undefined;
        const base: MyQuizApi[] = Array.isArray(payload?.quizzes) ? payload!.quizzes : [];

        // normalizações úteis pro front
        const enriched: EnrichedQuiz[] = base.map((q) => ({
          ...q,
          categoryName: q.category?.name ?? "—",
          authorName: q.user?.username ?? q.user?.name ?? "—",
          // garante existência dos contadores no tipo enriquecido
          likes: (q as any).likes ?? 0,
          games_played: (q as any).games_played ?? 0,
        }));

        setApiQuizzes(enriched);
        setMaxPage(Number(payload?.maxPage ?? 0));
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
  }, [enabled, page, limit, router]); // ← importante: refetch quando page/limit mudarem

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return apiQuizzes;

    return apiQuizzes.filter((q) => {
      const name = q.name?.toLowerCase() ?? "";
      const cat =
        q.categoryName?.toLowerCase?.() ??
        q.category?.name?.toLowerCase?.() ??
        "";
      const author =
        q.authorName?.toLowerCase?.() ??
        q.user?.username?.toLowerCase?.() ??
        q.user?.name?.toLowerCase?.() ??
        "";
      return name.includes(s) || cat.includes(s) || author.includes(s);
    });
  }, [apiQuizzes, search]);

  return {
    loadingQuizzes,
    fetchError,
    quizzes: Array.isArray(filtered) ? filtered : [],
    maxPage,                       // ← expõe total (zero-based)
  };
}
