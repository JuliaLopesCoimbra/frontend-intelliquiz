"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HomepagePayload, HomepageQuiz } from "@/app/hooks/useHomepage";

type Props = {
  loading: boolean;
  error: string | null;
  data: HomepagePayload | null;
};

function QuizHighlight({
  label,
  quiz,
}: {
  label: string;
  quiz?: HomepageQuiz;
}) {
  if (!quiz) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-white/5 p-3 text-xs text-neutral-500">
        Nenhum dado ainda
      </div>
    );
  }

  const likes = quiz.likes ?? 0;
  const games = quiz.games_played ?? quiz.games?.length ?? 0;

  return (
    <div
      className="
        group relative flex gap-3 rounded-xl border border-neutral-800 
        bg-white/5 p-4 transition-all duration-200 ease-out
        hover:border-amber-300/40 hover:bg-white/[0.08] hover:shadow-lg 
        hover:shadow-amber-300/5 hover:-translate-y-[2px]
      "
    >
      {/* highlight glow externo no hover */}
      <div
        className="
          pointer-events-none absolute inset-0 -z-10 rounded-xl
          opacity-0 group-hover:opacity-10
          bg-amber-300 blur-xl transition-all duration-300
        "
      />

      {quiz.image_url && (
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/70 group-hover:border-amber-300/40 transition-all">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={quiz.image_url}
            alt={quiz.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-[0.65rem] uppercase tracking-wide text-amber-300/90">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-neutral-100">
          {quiz.name}
        </p>
        <p className="truncate text-[0.75rem] text-neutral-400">
          {quiz.category?.name ?? "Sem categoria"} ·{" "}
          {quiz.user?.username ?? "Autor desconhecido"}
        </p>
        <p className="mt-1 text-[0.7rem] text-neutral-500">
          {likes} curtidas · {games} jogos
        </p>
      </div>
    </div>
  );
}


export function HomepageMiniDashboard({ loading, error, data }: Props) {
  const best = data?.bestQuizzesOfMonth?.[0];
  const mostLiked = data?.mostLikedQuizzes?.[0];
  const mostPlayed = data?.mostPlayedQuizzes?.[0];
  const newest = data?.newlyAddedQuizzes?.[0];

  return (
   <Card className="mb-6 border-neutral-800 bg-white/5 backdrop-blur-md">

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm text-neutral-200">
            Visão geral dos quizzes
          </CardTitle>
          {loading && (
            <span className="text-[0.7rem] text-neutral-500">
              Atualizando...
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-400">
            {error || "Erro ao carregar overview de quizzes."}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {!data && !loading && !error && (
          <p className="text-xs text-neutral-500">
            Nenhum dado carregado ainda para overview.
          </p>
        )}

        {data && (
          <>
            <p className="text-xs text-neutral-400">
              Acompanhe rapidamente quais quizzes estão performando melhor no
              mês, em curtidas, jogos e novidades recentes.
            </p>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <QuizHighlight label="Melhor do mês" quiz={best} />
              <QuizHighlight label="Mais curtido" quiz={mostLiked} />
              <QuizHighlight label="Mais jogado" quiz={mostPlayed} />
              <QuizHighlight
                label="Recém adicionado em destaque"
                quiz={newest}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
