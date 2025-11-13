// app/hooks/useMyGames.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { httpRetry } from "@/lib/http-retry";
import { getUserToken } from "@/lib/auth.client";

export type Game = {
  id: string;
  user_id: string;
  finished_at: string | null;
  total_questions: number;
  correct_answers: number;
  total_seconds_taken: number;
  created_at: string;
  updated_at: string;
};

type Options = {
  enabled?: boolean;
  page?: number;   // ← novo
  limit?: number;  // ← novo
};

type GamesResponse = {
  maxPage: number; // zero-based
  games: Game[];
};

function unwrap<T = any>(res: any): T {
  const lvl1 = res?.data ?? res;
  const lvl2 = lvl1?.data ?? lvl1;
  return lvl2 as T;
}

export function useMyGames({ enabled = true, page = 0, limit = 9}: Options = {}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [maxPage, setMaxPage] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getUserToken();
        if (!token) throw new Error("Faça login para ver seu histórico.");

        const res = await httpRetry(`/me/games?page=${page}&limit=${limit}`, {
  method: "GET",
  headers: { Authorization: `Bearer ${token}` },
});

const data = unwrap<Partial<GamesResponse> | Game[]>(res);

// aceita { maxPage, games } ou apenas [ ...games ]
let list: Game[] = [];
let mPage = 0;

if (Array.isArray(data)) {
  list = data as Game[];
  mPage = 0;
} else {
  list = Array.isArray((data as any)?.games) ? (data as any).games : [];
  mPage = Number((data as any)?.maxPage ?? 0);
}

/** Fallback de segurança: limita no cliente */
const listLimited = Array.isArray(list) ? list.slice(0, limit) : [];

if (!cancelled) {
  setGames(listLimited);
  setMaxPage(mPage);
}

      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Não foi possível carregar o histórico.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, page, limit]);

  const summary = useMemo(() => {
    if (!games.length) return null;
    const total = games.length;
    const totalQuestions = games.reduce((s, g) => s + (g.total_questions ?? 0), 0);
    const totalCorrect = games.reduce((s, g) => s + (g.correct_answers ?? 0), 0);
    const acc = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
    const time = games.reduce((s, g) => s + (g.total_seconds_taken ?? 0), 0);
    return { total, totalQuestions, totalCorrect, accuracy: acc, totalSeconds: time };
  }, [games]);

  return {
    loadingGames: loading,
    gamesError: error,
    games,
    summary,
    maxPage, // ← expõe o total (zero-based)
  };
}
