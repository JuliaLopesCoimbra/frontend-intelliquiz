"use client";
import Link from "next/link";
import { useMemo } from "react";
import type { Quiz } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Flame, Sparkles } from "lucide-react";
import clsx from "clsx";

type Props = {
  suggestions: Quiz[];
  title?: string;
  ctaHref?: string; // opcional: "ver todos"
};

export default function QuizSuggestions({
  suggestions,
  title = "Sugestões para você",
  ctaHref,
}: Props) {
  const items = useMemo(
    () => suggestions.slice(0, 8), // limita visual (mantém rápido)
    [suggestions]
  );

  return (
    <section className="mt-10">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        {ctaHref && (
          <Link href={ctaHref}>
            <Button
              variant="outline"
              className="border-amber-400/40 text-amber-300 hover:bg-amber-400 hover:text-black"
            >
              Ver todos
            </Button>
          </Link>
        )}
      </div>

      {/* Lista horizontal com snap */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((q) => (
            <SuggestionCard key={q.id} quiz={q} />
          ))}
          {items.length === 0 && (
            <EmptyState />
          )}
        </div>
      </div>
    </section>
  );
}

function SuggestionCard({ quiz }: { quiz: Quiz }) {
  const difficultyTone =
    quiz.difficulty === "easy"
      ? "bg-emerald-500 text-white"
      : quiz.difficulty === "hard"
      ? "bg-rose-500 text-white"
      : "bg-amber-500 text-black";

  const cover = quiz.cover ?? "/placeholder/quiz-cover.jpg"; // troque por um placeholder real se quiser

  return (
    <Card
      className={clsx(
        "group relative w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950"
      )}
    >
      {/* Capa */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={cover}
          alt={quiz.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Badges na capa */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className={clsx("rounded-full px-2 py-1 text-xs", difficultyTone)}>
            {labelDiff(quiz.difficulty)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-neutral-200 backdrop-blur">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            {quiz.plays} plays
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-neutral-400">
          {quiz.category}
        </p>
        <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-neutral-100">
          {quiz.title}
        </h3>

        <div className="mt-3 flex items-center justify-between">
          <Link href={`/quiz/${quiz.slug}`}>
            <Button className="h-10 rounded-xl bg-amber-400 text-black hover:bg-amber-300">
              Responder agora
            </Button>
          </Link>

          <Link
            href={`/quiz/${quiz.slug}`}
            className="inline-flex items-center gap-1 text-sm text-amber-300 hover:underline"
          >
            <Trophy className="h-4 w-4" />
            Ranking
          </Link>
        </div>
      </div>

      {/* Glow sutil ao passar o mouse */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30"
           style={{ background: "radial-gradient(120px 60px at 80% 10%, rgba(251,191,36,0.6), transparent 60%)" }} />
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-40 w-full items-center justify-center rounded-xl border border-dashed border-neutral-800 text-neutral-400">
      Sem sugestões por enquanto.
    </div>
  );
}

function labelDiff(
  d: Quiz["difficulty"] | undefined
): "Fácil" | "Médio" | "Difícil" {
  if (d === "easy") return "Fácil";
  if (d === "hard") return "Difícil";
  return "Médio";
}
