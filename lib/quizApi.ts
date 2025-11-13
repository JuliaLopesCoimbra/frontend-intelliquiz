// lib/quizApi.ts
"use server";

import { cookies } from "next/headers";

export type QuizApi = {
  id: string;
  name: string;
  category_id: string;
  category?: { id: string; name: string };

  
  description?: string;
  image_url?: string;

  created_by: string;
  user?: { id: string; username: string; name?: string };

  likes: number;
  curator_pick: boolean;

 
  games?: number;
  games_played?: number;

  created_at: string;
  updated_at: string;
};


export type ListQuizzesResponse = {
  maxPage: number;   
  quizzes: QuizApi[];
};

export async function getQuizzes(
  { page = 0, limit = 10 }: { page?: number; limit?: number } = {}
): Promise<ListQuizzesResponse> {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  if (!base) {
    console.warn("NEXT_PUBLIC_API_URL não definido; retornando lista vazia.");
    return { maxPage: 0, quizzes: [] };
  }

  const url = `${base}/quizzes?page=${page}&limit=${limit}`;
  console.log("Fetching quizzes from:", url);

    try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("access_token")?.value ||
      cookieStore.get("token")?.value ||
      "";


    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`GET /quizzes falhou: ${res.status} ${body}`);
    }

    const json = await res.json();
    const lvl1 = json?.data ?? json;

    // Formato paginado esperado: { maxPage, quizzes: [...] }
    if (Array.isArray(lvl1?.quizzes)) {
      return {
        maxPage: Number(lvl1.maxPage ?? 0),
        quizzes: lvl1.quizzes as QuizApi[],
      };
    }

    // Sem paginação? Cai de pé.
    if (Array.isArray(lvl1)) {
      return { maxPage: 0, quizzes: lvl1 as QuizApi[] };
    }
    if (Array.isArray(json?.quizzes)) {
      return {
        maxPage: Number(json.maxPage ?? 0),
        quizzes: json.quizzes as QuizApi[],
      };
    }

    console.warn("Formato inesperado em /quizzes; retornando []. Payload:", json);
    return { maxPage: 0, quizzes: [] };
  } catch (err) {
    console.error("Erro ao buscar quizzes:", err);
    return { maxPage: 0, quizzes: [] };
  }
}
