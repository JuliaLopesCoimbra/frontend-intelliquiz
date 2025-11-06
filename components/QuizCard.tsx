// app/components/QuizCard.tsx
"use client";

import { useRouter } from "next/navigation";
import { Heart, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserToken } from "@/lib/auth.client";

export type Quiz = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  likes?: number;
  slug?: string; // se existir, usamos para URL amigável
};

export default function QuizCard({ quiz }: { quiz: Quiz }) {
  const router = useRouter();

  const answerBase = `/quizzes/${quiz.id}`; // ajuste se seu path for outro
  const answerUrl = `${answerBase}/answer`;

  function handleResponder() {
    const token = getUserToken();
    if (!token) {
      // sem token -> login com redirecionamento para responder após logar
      router.push(`/login?next=${encodeURIComponent(answerUrl)}`);
      return;
    }
    // com token -> vai direto responder
    router.push(answerUrl);
  }

  return (
    <div className="group overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
      <div className="relative h-40 w-full">
      <img
  src={
    quiz.imageUrl ||
    `https://picsum.photos/seed/${quiz.id}/600/400`
  }
  alt={quiz.title}
  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
/>


        {quiz.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-amber-300 backdrop-blur">
            {quiz.category}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        <h3 className="line-clamp-1 text-base font-semibold">{quiz.title}</h3>
        {quiz.description && (
          <p className="line-clamp-2 text-sm text-neutral-400">
            {quiz.description}
          </p>
        )}

        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-1 text-neutral-300">
            <Heart className="h-4 w-4" aria-hidden />
            <span className="text-sm">{quiz.likes ?? 0}</span>
          </div>

          <Button
            onClick={handleResponder}
            className="gap-2"
            aria-label="Responder quiz"
          >
            <Play className="h-4 w-4" aria-hidden />
            Responder
          </Button>
        </div>
      </div>
    </div>
  );
}
