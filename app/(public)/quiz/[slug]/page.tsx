"use client";
import {useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/mockApi";
import { Question } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Timer as TimerIcon, Trophy } from "lucide-react";

export default function Play({ params }: { params: { slug: string } }) {
  const { slug } = params; 
  const [qzs, set] = useState<any>(null);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const timer = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const quiz = await api.bySlug(slug);
      if (!quiz) return router.push("/");
      set(quiz);
      api.addPlay(quiz.id);
      timer.current = setInterval(() => setTime((t) => t + 100), 100);
    })();
    return () => clearInterval(timer.current);
  }, [slug, router]);

  const total = Array.isArray(qzs?.questions) ? qzs.questions.length : 0;
  const cur: Question | undefined = useMemo(() => {
    if (!Array.isArray(qzs?.questions)) return undefined;
    return qzs.questions[i];
  }, [qzs, i]);

  // progresso: mostra o passo atual (i começa em 0)
  const progressPct = total ? Math.round(((i + 1) / total) * 100) : 0;

  const fmtTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = `${s % 60}`.padStart(2, "0");
    return `${m}:${ss}`;
  };

  if (!qzs) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
        <main className="mx-auto max-w-3xl px-4 py-12 text-neutral-300">
          Carregando…
        </main>
      </div>
    );
  }
  if (qzs && total === 0) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
        <main className="mx-auto max-w-3xl px-4 py-12 text-neutral-300">
          <p className="mb-4">Este quiz ainda não possui perguntas.</p>
          <button
            onClick={() => router.push("/")}
            className="text-amber-300 underline underline-offset-4 hover:text-amber-200"
          >
            Voltar para a página inicial
          </button>
        </main>
      </div>
    );
  }

  const choose = (choiceId: string) => {
    const correct = cur?.choices.find((c) => c.id === choiceId)?.correct;
    if (correct) setScore((s) => s + 1);
    if (i < total - 1) setI(i + 1);
    else
      router.push(
        `/leaderboard/${qzs.id}?score=${score + (correct ? 1 : 0)}&time=${time}`
      );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
      <main className="mx-auto max-w-3xl px-4 py-10">
        {/* Barra superior: voltar */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 text-sm rounded-lg text-neutral-300 hover:text-amber-300 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>

        <Card className="border-neutral-800/80 bg-neutral-950/70 backdrop-blur shadow-2xl shadow-black/40">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-2xl font-semibold tracking-tight text-neutral-100">
                  {qzs.title}
                </CardTitle>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-amber-400/40 text-amber-200"
                  >
                    {qzs.category}
                  </Badge>
                  <span className="text-xs text-neutral-500">
                    Pergunta {i + 1}/{total}
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="flex items-center justify-end gap-2 text-neutral-300">
                  <TimerIcon className="h-4 w-4" />
                  <span className="text-sm">{fmtTime(time)}</span>
                </div>
                <div className="mt-1 flex items-center justify-end gap-2 text-amber-300">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm">{score} pts</span>
                </div>
              </div>
            </div>

            {/* Cover opcional */}
            {qzs.cover && (
              <div
                className="mt-4 h-36 w-full overflow-hidden rounded-xl border border-neutral-900"
                style={{
                  backgroundImage: `url(${qzs.cover})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            )}

            {/* Progresso */}
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full rounded-full bg-amber-400 transition-[width] duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <p className="text-lg text-neutral-200">{cur?.text}</p>

            <div className="grid gap-3">
              {cur?.choices.map((c, idx) => (
                <Button
                  key={c.id}
                  variant="outline"
                  onClick={() => choose(c.id)}
                  className="group h-auto justify-start whitespace-normal rounded-xl border-neutral-700 bg-neutral-900/60 px-4 py-3 text-left text-neutral-100 hover:border-amber-400/40 hover:bg-neutral-900/80 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                >
                  <span className="mr-3 inline-flex h-5 w-5 items-center justify-center rounded-md border border-neutral-700 text-xs text-neutral-300 group-hover:border-amber-400/40">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{c.text}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
