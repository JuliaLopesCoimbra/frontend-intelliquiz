import type { Quiz } from "@/lib/types";
import type { QuizApi } from "@/lib/quizApi";

function slugify(input: string) {
  return (input || "quiz")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function placeholderCover(q: QuizApi) {
  return `https://picsum.photos/seed/${encodeURIComponent(q.id)}/600/300`;
}

export function toQuiz(q: QuizApi): Quiz {
  const title = q.name ?? "Quiz";

  return {
    id: q.id,
    title,
    slug: slugify(title),

    description: q.description ?? undefined,

    // 👇 usa a imagem real se existir, senão usa o placeholder
    imageUrl: q.image_url ? q.image_url : placeholderCover(q),

    category: q.category?.name ?? "Geral",
    likes: q.likes ?? 0,
    games: q.games ?? 0, // se existir no backend, senão remova
  };
}
