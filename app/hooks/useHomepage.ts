"use client";

import { useEffect, useState } from "react";
import { httpRetry as http } from "@/lib/http-retry";


export type HomepageQuiz = {
  id: string;
  name: string;
  category_id: string;
  category?: {
    id: string;
    name: string;
  } | null;
  created_by: string;
  user?: {
    id: string;
    username: string;
  } | null;
  likes?: number;
  score?: number;
  curator_pick?: boolean;
  games?: {
    id: string;
    quiz_id: string;
    total_questions: number;
    correct_answers: number;
    total_seconds_taken: number;
  }[];
  games_played?: number;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type HomepagePayload = {
  bestQuizzesOfMonth: HomepageQuiz[];
  curatedQuizzes: HomepageQuiz[];
  mostLikedQuizzes: HomepageQuiz[];
  mostPlayedQuizzes: HomepageQuiz[];
  newlyAddedQuizzes: HomepageQuiz[];
};

export function useHomepage(enabled: boolean) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HomepagePayload | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const client: any = http as any;

    
        const res =
          typeof client === "function" && !client.get
            ? await client("/homepage", { method: "GET" })
            : await client.get("/homepage");

        // Suporta axios (res.data) e fetch wrapper (json direto)
        const raw = (res as any)?.data ?? res;

        // Seu backend retorna: { data: { bestQuizzesOfMonth, ... }, message, statusCode, success }
        const payload = (raw as any)?.data ?? raw;

        if (!cancelled) {
          setData(payload as HomepagePayload);
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error("Erro ao carregar /homepage:", err);
        setError(err?.message ?? "Erro ao carregar overview de quizzes");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { loading, error, data };
}
