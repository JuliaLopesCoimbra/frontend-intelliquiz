"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EnrichedQuiz } from "@/app/hooks/quiz";

export function AvailableQuizzesCard({
  loading,
  error,
  quizzes,
}: {
  loading: boolean;
  error: string | null;
  quizzes: EnrichedQuiz[];
}) {
  return (
    <Card
      className="
        mb-8 overflow-hidden rounded-2xl border border-neutral-800
        bg-neutral-950/70 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/50
      "
    >
      {/* top glow */}
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
            {quizzes.map((q) => (
              <li
                key={q.id}
                className="
                  group rounded-xl border border-neutral-800/70 bg-neutral-150
                  p-4 transition-all hover:border-amber-400/40 hover:shadow-[0_0_0_1px_rgba(251,191,36,0.35)]
                "
              >
                <div className="relative mb-3 h-28 w-full overflow-hidden rounded-lg">
              <img
  src="https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=800&q=80"
  alt="Quiz cover"
  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
/>

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                <div className="space-y-1">
                  <p className="font-medium text-neutral-100 truncate">{q.name}</p>
                  <p className="text-xs text-neutral-500 truncate">
                    Categoria: <span className="text-neutral-300">{q.categoryName}</span>
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    Por: <span className="text-neutral-300">{q.authorName}</span>
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Link
                    href={`/quiz/${q.id}`}
                    className="text-sm text-amber-300 hover:underline"
                  >
                    Responder →
                  </Link>
                  <Link
                    href={`/client/create?id=${q.id}`}
                    className="text-xs text-neutral-400 hover:text-neutral-200"
                  >
                    Ver detalhes
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
