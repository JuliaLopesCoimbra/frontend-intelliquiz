"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/mockApi";
import type { Quiz, LeaderboardEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import clsx from "clsx";
import QuizSuggestions from "@/components/QuizSugestion";
type Tab = "meus" | "ranking" | "historico";

export default function Dashboard() {
  const [active, setActive] = useState<Tab>("meus");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<
    { quizId: string; score: number; timeMs: number; date: string }[]
  >([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.listQuizzes().then(setQuizzes);

    // Carrega ranking se existir na API mock
    (api as any).listLeaderboard?.().then(setLeaderboard).catch(() => setLeaderboard([]));

    // Carrega histórico do usuário se existir na API mock
    (api as any).listMyHistory?.().then(setHistory).catch(() => setHistory([]));
  }, []);

  const drafts = useMemo(
    () => quizzes.filter((q) => q.status === "draft"),
    [quizzes]
  );
  const published = useMemo(
    () => quizzes.filter((q) => q.status === "published"),
    [quizzes]
  );

  const filterBySearch = (q: Quiz) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      q.title.toLowerCase().includes(s) ||
      q.slug.toLowerCase().includes(s) ||
      q.category.toLowerCase().includes(s)
    );
  };

  const draftsFiltered = drafts.filter(filterBySearch);
  const publishedFiltered = published.filter(filterBySearch);

  // Mapa rápido id->Quiz para usar em links/títulos no ranking/histórico
  const quizById = useMemo(() => {
    const m = new Map<string, Quiz>();
    quizzes.forEach((q) => m.set(q.id, q));
    return m;
  }, [quizzes]);

  useEffect(() => { api.listQuizzes().then(setQuizzes); }, []);

  // Exemplo simples de curadoria (pode trocar por um endpoint próprio):
  const suggestions = quizzes
    .filter((q) => q.status === "published")
    .sort((a, b) => b.plays - a.plays) // mais jogados no topo
    .slice(0, 10);

  return (
    <main className="mx-auto max-w-6xl p-6">
      {/* Top bar: título, busca, botão novo quiz */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <div className="flex w-full items-center gap-3 sm:w-auto sm:flex-1 sm:justify-end">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar quizzes (título, slug, categoria)"
            className="h-11 sm:max-w-md"
          />
          <Link href="/client/create">
            <Button className="h-11 bg-amber-400 text-black hover:bg-amber-300">
              Novo Quiz
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-2 border-b border-neutral-800">
        {[
          { key: "meus", label: "Meus Quizzes" },
          { key: "ranking", label: "Ranking Geral" },
          { key: "historico", label: "Histórico" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key as Tab)}
            className={clsx(
              "px-4 py-2 text-sm transition-colors",
              active === t.key
                ? "border-b-2 border-amber-400 text-amber-300"
                : "text-neutral-400 hover:text-neutral-200"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {active === "meus" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-neutral-800">
            <CardHeader>
              <CardTitle>Rascunhos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {draftsFiltered.map((q) => (
                  <li key={q.id} className="flex items-center justify-between">
                    <span className="truncate">{q.title}</span>
                    <Link
                      className="text-sm text-amber-300"
                      href={`/create?id=${q.id}`}
                    >
                      Editar
                    </Link>
                  </li>
                ))}
                {draftsFiltered.length === 0 && (
                  <p className="text-sm text-neutral-400">Nenhum rascunho.</p>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-neutral-800">
            <CardHeader>
              <CardTitle>Publicados</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {publishedFiltered.map((q) => (
                  <li key={q.id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate">{q.title}</p>
                      <p className="text-xs text-neutral-500">
                        {q.category} • {q.difficulty ?? "medium"} • {q.plays} jogadas
                      </p>
                    </div>
                    <Link
                      className="shrink-0 text-sm text-amber-300"
                      href={`/quiz/${q.slug}`}
                    >
                      Ver
                    </Link>
                  </li>
                ))}
                {publishedFiltered.length === 0 && (
                  <p className="text-sm text-neutral-400">
                    Nada publicado ainda.
                  </p>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {active === "ranking" && (
        <Card className="border-neutral-800">
          <CardHeader>
            <CardTitle>Ranking Geral</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-neutral-400">
                Ainda não há entradas no ranking.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-neutral-400">
                    <tr className="border-b border-neutral-800">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Usuário</th>
                      <th className="py-2 pr-3">Quiz</th>
                      <th className="py-2 pr-3">Score</th>
                      <th className="py-2 pr-3">Tempo</th>
                      <th className="py-2 pr-3">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row, idx) => {
                      // Se sua API incluir quizId, acrescente aqui; se não, adapte conforme seu shape
                      const quiz = quizById.get((row as any).quizId) as Quiz | undefined;
                      const quizLabel =
                        quiz?.title ?? (row as any).quizTitle ?? "—";
                      const fmtTime = `${Math.floor(row.timeMs / 1000)}s`;
                      return (
                        <tr
                          key={`${row.user}-${row.date}-${idx}`}
                          className="border-b border-neutral-900/60"
                        >
                          <td className="py-2 pr-3 text-neutral-400">
                            {idx + 1}
                          </td>
                          <td className="py-2 pr-3">{row.user}</td>
                          <td className="py-2 pr-3">
                            {quiz ? (
                              <Link
                                className="text-amber-300"
                                href={`/quiz/${quiz.slug}`}
                              >
                                {quizLabel}
                              </Link>
                            ) : (
                              quizLabel
                            )}
                          </td>
                          <td className="py-2 pr-3">{row.score}</td>
                          <td className="py-2 pr-3">{fmtTime}</td>
                          <td className="py-2 pr-3">
                            {new Date(row.date).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {active === "historico" && (
        <Card className="border-neutral-800">
          <CardHeader>
            <CardTitle>Histórico de Quizzes Respondidos</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-neutral-400">
                Você ainda não respondeu a nenhum quiz.
              </p>
            ) : (
              <ul className="space-y-2">
                {history.map((h, i) => {
                  const quiz = quizById.get(h.quizId);
                  const label = quiz?.title ?? "Quiz";
                  const slug = quiz?.slug ?? "";
                  return (
                    <li
                      key={`${h.quizId}-${h.date}-${i}`}
                      className="flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate">{label}</p>
                        <p className="text-xs text-neutral-500">
                          Pontuação {h.score} •{" "}
                          {Math.floor(h.timeMs / 1000)}s •{" "}
                          {new Date(h.date).toLocaleString()}
                        </p>
                      </div>
                      {slug && (
                        <Link
                          className="shrink-0 text-sm text-amber-300"
                          href={`/quiz/${slug}`}
                        >
                          Ver
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
       <QuizSuggestions
        suggestions={suggestions}
        title="Sugestões que você vai curtir"
        ctaHref="/explore" // opcional
      />
    </main>
  );
}
