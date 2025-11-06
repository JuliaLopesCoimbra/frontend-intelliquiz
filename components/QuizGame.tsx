// components/QuizGame.tsx
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { httpRetry } from "@/lib/http-retry";
import { getUserToken } from "@/lib/auth.client";
import { useRouter } from "next/navigation";

type QuizQuestion = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
};

type QuizData = {
  id: string;
  title: string;
  category?: string;
  questions: QuizQuestion[];
  timeLimitSec?: number;
  slug: string;
};

export default function QuizGame({ quiz }: { quiz: QuizData }) {
    console.log("QuizGame render", quiz);
  const router = useRouter();
  const total = quiz.questions.length;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<{
    score?: number;
    correctCount?: number;
    total?: number;
    details?: any;
  } | null>(null);

  const q = quiz.questions[index];

  const progress = useMemo(() => {
    const answeredCount = Object.keys(answers).length;
    return Math.round((answeredCount / total) * 100);
  }, [answers, total]);

  function selectOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function next() {
    if (index < total - 1) setIndex((i) => i + 1);
  }

  function prev() {
    if (index > 0) setIndex((i) => i - 1);
  }

  async function submit() {
    try {
      setSubmitting(true);
      setSubmitError(null);

      const token = getUserToken();
      if (!token) {
        // fallback de segurança
        router.replace(`/login?next=${encodeURIComponent(location.pathname)}`);
        return;
      }

      // Ajuste a rota conforme seu backend
      const res = await httpRetry<{
        data: { score: number; correctCount: number; total: number; details?: any };
      }>(`/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });

      setSubmitResult(res?.data ?? { score: 0, correctCount: 0, total });
      // opcional: router.push(`/quizzes/${quiz.slug}/resultado`)
    } catch (e: any) {
      setSubmitError(e?.message || "Erro ao enviar suas respostas.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitResult) {
    return (
      <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
        <h2 className="text-xl font-semibold mb-2">Resultado</h2>
        <p className="text-neutral-300 mb-4">
          Pontuação: <span className="font-medium">{submitResult.score}</span>
          <br />
          Acertos:{" "}
          <span className="font-medium">
            {submitResult.correctCount}/{submitResult.total}
          </span>
        </p>
        <Button onClick={() => router.push("/")} className="w-full sm:w-auto">
          Voltar para início
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
      {/* Progresso */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-neutral-400">
            Progresso: {progress}%
          </span>
          <span className="text-sm text-neutral-400">
            {index + 1} / {total}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded bg-neutral-800">
          <div
            className="h-2 bg-amber-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Pergunta */}
      <h2 className="mb-4 text-lg font-semibold">{q.text}</h2>

      {/* Opções */}
      <ul className="mb-6 grid gap-3">
        {q.options.map((opt) => {
          const selected = answers[q.id] === opt.id;
          return (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => selectOption(q.id, opt.id)}
                className={[
                  "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                  selected
                    ? "border-amber-400 bg-amber-400/10"
                    : "border-neutral-800 hover:bg-neutral-900",
                ].join(" ")}
              >
                {opt.text}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Navegação */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={prev} disabled={index === 0}>
            Voltar
          </Button>
          {index < total - 1 ? (
            <Button onClick={next} disabled={!answers[q.id]}>
              Próxima
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting || !answers[q.id]}>
              {submitting ? "Enviando..." : "Enviar respostas"}
            </Button>
          )}
        </div>

        {/* status */}
        {submitError && (
          <p className="text-sm text-red-400">{submitError}</p>
        )}
      </div>
    </section>
  );
}
