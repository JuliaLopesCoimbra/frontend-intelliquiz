// app/components/QuizCard.tsx
"use client";

import { useRouter } from "next/navigation";
import { Heart, Play, Gamepad2 } from "lucide-react"; // <-- aqui corrige o import
import { Button } from "@/components/ui/button";
import { getUserToken } from "@/lib/auth.client";

export type Quiz = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  likes?: number;
  games?: number;          // <-- adicionando a propriedade
  slug?: string;
};

export default function QuizCard({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const hasId = Boolean(quiz?.id);
  const hasSlug = Boolean(quiz?.slug);

  const quizKey = hasId ? quiz.id : (hasSlug ? quiz.slug : "");
  const answerBase = quizKey ? `/quizzes/${quizKey}` : "";
  const answerUrl = answerBase ? `${answerBase}/answer` : "";

  function handleResponder() {
    if (!quizKey) {
      console.error("Quiz sem id/slug:", quiz);
      alert("Não foi possível abrir este quiz (sem ID). Tente outro ou atualize a página.");
      return;
    }

    const token = getUserToken();
    if (!token) {
      router.push(`/login?next=${encodeURIComponent(answerUrl)}`);
      return;
    }

    router.push(answerUrl);
  }

  return (
    <div className="group overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
      <div className="relative h-40 w-full">
   <img
  src={
    quiz.imageUrl
      ? quiz.imageUrl
      : `https://picsum.photos/seed/${quiz.id}/600/400`
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
          <p className="line-clamp-2 text-sm text-neutral-400">{quiz.description}</p>
        )}

        <div className="mt-1 flex items-center justify-between">
          {/* MÉTRICAS → LIKES + GAMES */}
          <div className="flex items-center gap-3 text-neutral-300 select-none">
            {/* Likes */}
            <span className="inline-flex items-center gap-1 text-xs">
              <Heart className="h-4 w-4" aria-hidden />
              <span className="text-sm">{quiz.likes ?? 0}</span>
            </span>

            {/* Games */}
            {/* <span className="inline-flex items-center gap-1 text-xs">
              <Gamepad2 className="h-4 w-4" aria-hidden />
              <span className="text-sm">{quiz.games ?? 0}</span> {/* ← aqui */}
           
          </div>

          <Button
            onClick={handleResponder}
            aria-label="Responder quiz"
            className="
              gap-2 
              bg-amber-400 text-black font-semibold 
              hover:bg-amber-500 hover:shadow-[0_0_12px_#fbbf24] 
              active:scale-95
              transition-all duration-200
            "
          >
            <Play className="h-4 w-4" aria-hidden />
            Responder
          </Button>
        </div>
      </div>
    </div>
  );
}
