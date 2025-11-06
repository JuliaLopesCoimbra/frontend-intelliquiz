"use server";

export type QuizApi = {
  id: string;
  name: string;
  category_id: string;
  category?: { id: string; name: string };
  created_by: string;
  user?: { id: string; username: string; name?: string };
  likes: number;
  curator_pick: boolean;
  games_played: number;
  created_at: string;
  updated_at: string;
};


export async function getQuizzes(): Promise<QuizApi[]> {
  const base =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
    console.log("Backend base URL:", base);
  const url = `${base}/quizzes`;
console.log("Fetching quizzes from:", url);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",          // 🔒 sempre buscar do backend
      next: { revalidate: 0 },    // redundante, mas explícito no App Router
    });

    if (!res.ok) throw new Error(`GET /quizzes falhou: ${res.status}`);

    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch (err) {
    console.error("Erro ao buscar quizzes:", err);
    return [];
  }
}
