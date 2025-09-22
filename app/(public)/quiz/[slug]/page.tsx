"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/mockApi";
import { Question } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Play({ params }: { params: { slug: string } }) {
  const [qzs, set] = useState<any>(null);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const timer = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const quiz = await api.bySlug(params.slug);
      if (!quiz) return router.push("/");
      set(quiz);
      api.addPlay(quiz.id);
      timer.current = setInterval(() => setTime((t) => t + 100), 100);
    })();
    return () => clearInterval(timer.current);
  }, [params.slug, router]);

  const cur: Question | undefined = useMemo(() => qzs?.questions[i], [qzs, i]);
  if (!qzs) return <div className="p-8">Carregando…</div>;

  const choose = (choiceId: string) => {
    const correct = cur?.choices.find((c) => c.id === choiceId)?.correct;
    if (correct) setScore((s) => s + 1);
    if (i < qzs.questions.length - 1) setI(i + 1);
    else
      router.push(
        `/leaderboard/${qzs.id}?score=${score + (correct ? 1 : 0)}&time=${time}`
      );
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Card className="border-neutral-800">
        <CardHeader>
          <CardTitle>{qzs.title}</CardTitle>
          <p className="text-sm text-neutral-400">
            Pergunta {i + 1}/{qzs.questions.length}
          </p>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-lg">{cur?.text}</p>
          <div className="grid gap-3">
            {cur?.choices.map((c) => (
              <Button
                key={c.id}
                variant="outline"
                className="justify-start border-neutral-700 hover:border-amber-400/40"
                onClick={() => choose(c.id)}
              >
                {c.text}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
