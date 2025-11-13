// app/components/dashboard/MyGamesCard.tsx (GameHistoryCard)
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Game } from "@/app/hooks/useMyGames";

function secondsToHMS(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso as string;
  }
}

export function GameHistoryCard({
  loading,
  error,
  games,
  onRefresh,
  page = 0,                 // ← novo
  maxPage = 0,              // ← novo (zero-based)
  onPageChange,             // ← novo
}: {
  loading: boolean;
  error: string | null;
  games: Game[];
  onRefresh?: () => void;
  page?: number;
  maxPage?: number;         // zero-based
  onPageChange?: (p: number) => void;
}) {
  const hasPrev = page > 0;
  const hasNext = page < (maxPage ?? 0);

  return (
    <Card className="mt-6 border border-neutral-800 bg-neutral-950/40 ">
      <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-800">
        <CardTitle className="text-white">Histórico de Quizzes</CardTitle>


      </CardHeader>

      <CardContent className="space-y-4 py-6">
        {loading && (
          <p className="text-sm text-neutral-400 animate-pulse">
            Carregando seu histórico…
          </p>
        )}

        {error && !loading && (
          <p className="text-sm text-red-400">Erro: {error}</p>
        )}

        {!loading && !error && games.length === 0 && (
          <p className="text-sm text-neutral-500">
            Você ainda não respondeu a nenhum quiz.
          </p>
        )}

        {!loading && !error && games.length > 0 && (
          <>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((g) => {
                const pct = Math.round((g.correct_answers / g.total_questions) * 100);
                return (
                  <li
                    key={g.id}
                    className="group rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 transition-all hover:border-amber-400/70 hover:shadow-[0_0_20px_rgba(251,191,36,0.25)]"
                  >
                    <div className="flex flex-col gap-5">
                      {/* Datas */}
                      <div className="flex justify-between text-xs text-neutral-400">
                        <span>Início: <strong className="text-neutral-300">{fmtDate(g.created_at)}</strong></span>
                        <span>Fim: <strong className="text-neutral-300">{fmtDate(g.finished_at)}</strong></span>
                      </div>

                      {/* Resultados */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm text-neutral-400">Acertos</span>
                          <span className="text-2xl font-bold text-amber-400">
                            {g.correct_answers}/{g.total_questions}
                          </span>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="text-sm text-neutral-400">Tempo</span>
                          <span className="text-lg text-amber-300 font-semibold">
                            {secondsToHMS(g.total_seconds_taken)}
                          </span>
                        </div>
                      </div>

                      {/* Barra de progresso */}
                      <div className="space-y-2">
                        <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-neutral-700 via-amber-400 to-amber-300 transition-all duration-300 group-hover:scale-[1.02]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-neutral-500 text-right">{pct}% de aproveitamento</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Paginação */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onPageChange?.(Math.max(page - 1, 0))}
                disabled={!hasPrev}
                className={`rounded-md border px-3 py-2 text-sm ${
                  hasPrev
                    ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                    : "pointer-events-none border-neutral-800 text-neutral-600"
                }`}
              >
                ← Anterior
              </button>

              <span className="text-xs text-neutral-400">
                Página {page + 1} de {Number(maxPage ?? 0) + 1}
              </span>

              <button
                type="button"
                onClick={() => onPageChange?.(hasNext ? page + 1 : page)}
                disabled={!hasNext}
                className={`rounded-md border px-3 py-2 text-sm ${
                  hasNext
                    ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                    : "pointer-events-none border-neutral-800 text-neutral-600"
                }`}
              >
                Próxima →
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
