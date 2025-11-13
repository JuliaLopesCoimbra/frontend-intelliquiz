"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EnrichedQuiz } from "@/app/hooks/quiz";
import { getUserToken } from "@/lib/auth.client";
import { Heart, Gamepad2 } from "lucide-react";

export function AvailableQuizzesCard({
  loading,
  error,
  quizzes,
}: {
  loading: boolean;
  error: string | null;
  quizzes: EnrichedQuiz[];
}) {
  const router = useRouter();

  function handleResponder(quiz: EnrichedQuiz) {
    if (!quiz?.id) {
      console.error("Quiz sem ID:", quiz);
      alert("Não foi possível abrir este quiz (sem ID).");
      return;
    }

    const answerUrl = `/quizzes/${quiz.id}/answer`;

    const token = getUserToken();
    console.log("token len:", getUserToken()?.length ?? 0);

    if (!token) {
      router.push(`/login?next=${encodeURIComponent(answerUrl)}`);
      return;
    }

    router.push(answerUrl);
  }

  return (
    <Card
      className="
        mb-8 overflow-hidden rounded-2xl border border-neutral-800
        bg-neutral-950/70 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/50
      "
    >
      <div className="pointer-events-none h-px w-full bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      <CardHeader className="pb-2">
        <CardTitle className="text-neutral-100">Quizzes disponíveis</CardTitle>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </CardHeader>

      <CardContent className="pt-0">
        {loading ? (
          <p className="text-sm text-neutral-400">Carregando quizzes...</p>
        ) : quizzes.length === 0 ? (
          <p className="text-sm text-neutral-400">Nenhum quiz encontrado.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((q) => {
              // compat: aceita likes/games em ambos formatos
              const likes = (q as any).likes ?? 0;
              const games =
                (q as any).gamesPlayed ??
                (q as any).games_played ??
                0;

              return (
                <li
                  key={q.id}
                  className="
                    group rounded-xl border border-neutral-800/70 bg-neutral-950
                    p-4 transition-all hover:border-amber-400/40 hover:shadow-[0_0_0_1px_rgba(251,191,36,0.35)]
                  "
                >
             <div className="relative mb-3 h-28 w-full overflow-hidden rounded-lg">
  {(() => {
    const coverUrl =
      (q as any).imageUrl ||
      (q as any).image_url ||
      `https://picsum.photos/seed/${encodeURIComponent(q.id)}/600/300`;

    return (
      <>
        <img
          src={coverUrl}
          alt={q.name || "Quiz cover"}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </>
    );
  })()}
</div>


                  <div className="space-y-1">
                    <p className="truncate font-medium text-neutral-100">{q.name}</p>
                    <p className="truncate text-xs text-neutral-500">
                      Categoria: <span className="text-neutral-300">{(q as any).categoryName ?? (q as any).category?.name ?? "—"}</span>
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      Por: <span className="text-neutral-300">{(q as any).authorName ?? (q as any).user?.name ?? "Anônimo"}</span>
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleResponder(q)}
                      className="text-sm text-amber-300 hover:underline"
                    >
                      Responder →
                    </button>

                    {/* métricas: likes e jogos */}
                    <div className="flex items-center gap-3 text-neutral-400">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Heart className="h-4 w-4" aria-hidden />
                        <span className="text-sm">{likes}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Gamepad2 className="h-4 w-4" aria-hidden />
                        <span className="text-sm">{games}</span>
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
