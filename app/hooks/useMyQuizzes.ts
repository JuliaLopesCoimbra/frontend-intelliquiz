"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { httpRetry } from "@/lib/http-retry";
import { getUserToken } from "@/lib/auth.client";
import { displayUser } from "./format";
import type { MyQuizApi } from "./quiz";

export function useMyQuizzes(search: string, opts?: { enabled?: boolean }) {
  const router = useRouter();
  const [loadingMy, setLoadingMy] = useState(true);
  const [myQuizzes, setMyQuizzes] = useState<MyQuizApi[]>([]);
  const [myError, setMyError] = useState<string | null>(null);
const enabled = opts?.enabled ?? true;
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
        await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 300)));
        const res = await httpRetry<{ data: MyQuizApi[] }>("/me/quizzes", {
  headers: { Authorization: `Bearer ${token}` },
});

        setMyQuizzes(res?.data ?? []);
      } catch (err: any) {
        const status = err?.status || err?.response?.status;
        if (status === 401 || status === 403) {
          router.replace("/login?next=/client/dashboard");
          return;
        }
        console.error("GET /me/quizzes falhou:", err);
        setMyError(err?.body || err?.message || "Erro ao carregar Meus Quizzes.");
      } finally {
        setLoadingMy(false);
      }
    })();
  }, [enabled,router]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return myQuizzes;
    return myQuizzes.filter((q) => {
      const byName = q.name.toLowerCase().includes(s);
      const byCat = q.category?.name?.toLowerCase().includes(s);
      const byAuthor =
        displayUser(q.user).toLowerCase().includes(s) ||
        (q.user?.username || "").toLowerCase().includes(s);
      return byName || byCat || byAuthor;
    });
  }, [myQuizzes, search]);

  return { loadingMy, myError, myQuizzes: filtered };
}
