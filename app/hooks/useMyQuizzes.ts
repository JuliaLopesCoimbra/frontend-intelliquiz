"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { httpRetry } from "@/lib/http-retry";
import { getUserToken } from "@/lib/auth.client";
import type { MyQuizApi, EnrichedQuiz } from "./quiz";

interface UseMyQuizzesOpts {
  enabled?: boolean;
  page?: number;   // página zero-based
  limit?: number;  // quantos por página (vamos usar 6)
}

export function useMyQuizzes(search: string, opts?: UseMyQuizzesOpts) {
  const router = useRouter();
  const [loadingMy, setLoadingMy] = useState(true);
  const [myQuizzes, setMyQuizzes] = useState<EnrichedQuiz[]>([]);
  const [myError, setMyError] = useState<string | null>(null);

  const enabled = opts?.enabled ?? true;
  const page = opts?.page ?? 0;
  const limit = opts?.limit ?? 6;

  useEffect(() => {
    if (!enabled) return;

    (async () => {
      try {
        setLoadingMy(true);
        setMyError(null);

        const token = getUserToken();
        if (!token) {
          router.replace("/login?next=/client/dashboard");
          return;
        }

        // jitter leve
        await new Promise((r) =>
          setTimeout(r, Math.floor(Math.random() * 300))
        );

        const res = await httpRetry("/me/quizzes", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // unwrap seguro: res -> data -> data
        const lvl1 = (res as any)?.data ?? res;
        const lvl2 = (lvl1 as any)?.data ?? lvl1;

        // suporta formatos:
        // { quizzes: [...] }
        // { maxPage, quizzes: [...] }
        // ou array direto
        const base: MyQuizApi[] = Array.isArray(lvl2?.quizzes)
          ? lvl2.quizzes
          : Array.isArray(lvl2)
          ? lvl2
          : [];

        // transforma em EnrichedQuiz (o formato que o MyQuizzesCard usa)
        const enriched: EnrichedQuiz[] = base.map((q) => ({
          ...q,
          categoryName: q.category?.name ?? "—",
          authorName: q.user?.username ?? q.user?.name ?? "—",
        }));

        setMyQuizzes(enriched);
      } catch (err: any) {
        const status = err?.status || err?.response?.status;
        if (status === 401 || status === 403) {
          router.replace("/login?next=/client/dashboard");
          return;
        }
        console.error("GET /me/quizzes falhou:", status, err);
        setMyError(
          err?.body || err?.message || "Erro ao carregar Meus Quizzes."
        );
      } finally {
        setLoadingMy(false);
      }
    })();
  }, [enabled, router]);

  const { pageItems, maxPage, total } = useMemo(() => {
    const s = search.trim().toLowerCase();

    // primeiro aplica a busca
    const filteredAll = !s
      ? myQuizzes
      : myQuizzes.filter((q) => {
          return (
            q.name.toLowerCase().includes(s) ||
            q.categoryName.toLowerCase().includes(s) ||
            q.authorName.toLowerCase().includes(s)
          );
        });

    const total = filteredAll.length;
    const safeLimit = limit > 0 ? limit : 6;

    const maxPage =
      total > 0 ? Math.max(0, Math.ceil(total / safeLimit) - 1) : 0;

    const currentPage = Math.min(page, maxPage); // evita page estourada
    const start = currentPage * safeLimit;
    const end = start + safeLimit;

    const pageItems = filteredAll.slice(start, end);

    return { pageItems, maxPage, total };
  }, [myQuizzes, search, page, limit]);

  return {
    loadingMy,
    myError,
    myQuizzes: pageItems, // só os da página atual
    maxPage,              // zero-based (pra usar igual a lista geral)
    total,                // se quiser mostrar "X quizzes encontrados"
  };
}
