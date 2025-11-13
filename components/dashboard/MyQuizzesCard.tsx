"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, displayUser } from "@/app/hooks/format";
import type { EnrichedQuiz } from "@/app/hooks/quiz";

export function MyQuizzesCard({
  loading,
  error,
  quizzes,
}: {
  loading: boolean;
  error: string | null;
  quizzes?: EnrichedQuiz[] | null;
}) {
  const list: EnrichedQuiz[] = Array.isArray(quizzes) ? quizzes : [];

  return (
    <Card
      className="
        mb-8 overflow-hidden rounded-2xl border border-neutral-800
        bg-neutral-950/70 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/50
      "
    >
      {/* linha de glow no topo */}
      <div className="pointer-events-none h-px w-full bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      <CardHeader className="pb-2">
        <CardTitle className="text-neutral-100">Meus Quizzes</CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        {loading ? (
          <p className="text-sm text-neutral-400">Carregando seus quizzes...</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-neutral-400">Você ainda não criou nenhum quiz.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((q) => (
              <li
                key={q.id}
                className="
                  group rounded-xl border border-neutral-800/70 bg-neutral-900 p-4
                  transition-all hover:border-amber-400 hover:shadow-[0_0_0_1px_rgba(167,139,250,0.35)]
                "
              >
               <div className="relative mb-3 h-28 w-full overflow-hidden rounded-lg">
  {(() => {
    const coverUrl =
      // tenta camelCase primeiro
      (q as any).imageUrl ||
      // depois snake_case vindo direto da API
      (q as any).image_url ||
      // fallback
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


                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-amber-400 bg-amber-400 px-2 py-[2px] text-[11px] font-semibold text-black">
                    {q.category?.name || q.categoryName || "Sem categoria"}
                  </span>
                  {q.curator_pick && (
                    <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-[2px] text-[11px] font-semibold text-emerald-200">
                      Curadoria
                    </span>
                  )}
                </div>

                <p className="truncate font-medium text-neutral-100">{q.name}</p>

                <div className="mt-1 space-y-1 text-xs text-neutral-400">
                  <p className="truncate">
                    Autor:{" "}
                    <span className="text-neutral-200">
                      {q.user ? displayUser(q.user) : q.authorName ?? "—"}
                    </span>
                  </p>
                  <p className="truncate">
                    Likes: <span className="text-neutral-200">{q.likes}</span> · Partidas:{" "}
                    <span className="text-neutral-200">{q.games_played}</span>
                  </p>
                  <p className="truncate">
                    Criado:{" "}
                    <span className="text-neutral-300">{formatDate(q.created_at)}</span>
                  </p>
                  <p className="truncate">
                    Atualizado:{" "}
                    <span className="text-neutral-300">{formatDate(q.updated_at)}</span>
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Link
                    href={`/client/edit?id=${q.id}`}
                    className="text-xs text-amber-400 hover:text-neutral-200"
                  >
                    Editar / Detalhes
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
