import type { Quiz } from "@/lib/types";
import type { QuizApi } from "@/lib/quizApi";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function placeholderCover(q: QuizApi) {
  // coloque uma imagem sua se quiser (ex: /images/quiz-cover.jpg)
  // ou use uma aleatória determinística por id para evitar 404
  return `https://picsum.photos/seed/${encodeURIComponent(q.id)}/600/300`;
}

export function toQuiz(q: QuizApi): Quiz {
  const title = q.name ?? "Quiz";
  const slug = slugify(title);

  return {
    id: q.id,
    slug,
    title,
    category: q.category?.name ?? "Geral",
    difficulty: undefined,            // não veio do backend
    cover: placeholderCover(q),       // fallback de capa
    questions: [],                    // não veio do backend
    status: "published",              // público na vitrine
    plays: q.games_played ?? 0,
    creatorId: q.user?.id ?? "",
    createdAt: q.created_at ?? new Date().toISOString(),
    author: q.user?.username ?? "anônimo",
    likes: q.likes ?? 0,
    play: `/quiz/${slug}`,            // só para satisfazer o tipo
  };
}
