// components/QuizGameApi.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { httpRetry } from "@/lib/http-retry";
import { getUserToken } from "@/lib/auth.client";
import { QuizFinished } from "./QuizFinished";
export type ApiChoice = { id: string; content: string };
export type ApiQuestion = { id: string; content: string; choices: ApiChoice[] };

export type PlayBody = {
  game_id: string;
  question: ApiQuestion;
};

export type AnswerBody = {
  is_correct: boolean;
  is_finished: boolean;
  next_question?: ApiQuestion | null;
};

type Props = {
  quizId: string;
  initialPlay: PlayBody;
};

function unwrap<T = any>(res: any): T {
  const lvl1 = res?.data ?? res;
  const lvl2 = lvl1?.data ?? lvl1;
  return lvl2 as T;
}

export default function QuizGameApi({ quizId, initialPlay }: Props) {
  const [gameId] = useState<string>(initialPlay.game_id);
  const [currentQuestion, setCurrentQuestion] = useState<ApiQuestion>(initialPlay.question);

  const [questionIndex, setQuestionIndex] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [lastSelected, setLastSelected] = useState<string | null>(null);
  const [nextQuestion, setNextQuestion] = useState<ApiQuestion | null>(null);

  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs para evitar stale closures
  const nextQuestionRef = useRef<ApiQuestion | null>(null);
  const lastCorrectRef = useRef<boolean | null>(null);
  const pendingFinishRef = useRef<boolean>(false);

  useEffect(() => { nextQuestionRef.current = nextQuestion; }, [nextQuestion]);
  useEffect(() => { lastCorrectRef.current = lastCorrect; }, [lastCorrect]);

  // Auto-avanço
  const [autonextPct, setAutonextPct] = useState(0);
  const [autonextActive, setAutonextActive] = useState(false);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const token = useMemo(() => getUserToken(), []);

  useEffect(() => {
    return () => { if (autoTimerRef.current) clearInterval(autoTimerRef.current); };
  }, []);

  const stopAutonext = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    setAutonextActive(false);
    setAutonextPct(0);
  }, []);

  const goNext = useCallback(() => {
    stopAutonext();
    if (isFinished) return;

    const hasPendingFinish = pendingFinishRef.current;
    const hasNext = !!nextQuestionRef.current;
    const hadAnswer = lastCorrectRef.current !== null;

    if ((hadAnswer && !hasNext) || hasPendingFinish) {
      setIsFinished(true);
      pendingFinishRef.current = false;
      // limpeza de estado de rodada
      setLastCorrect(null);
      lastCorrectRef.current = null;
      setLastSelected(null);
      return;
    }

    if (hasNext && nextQuestionRef.current) {
      setCurrentQuestion(nextQuestionRef.current);
      setQuestionIndex((i) => i + 1);
    }

    // limpeza para próxima rodada
    nextQuestionRef.current = null;
    setNextQuestion(null);
    setLastCorrect(null);
    lastCorrectRef.current = null;
    setLastSelected(null);
  }, [isFinished, stopAutonext]);

  const startAutonext = useCallback((ms = 900) => {
    setAutonextActive(true);
    setAutonextPct(0);
    const started = performance.now();
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      const pct = Math.min(100, ((performance.now() - started) / ms) * 100);
      setAutonextPct(pct);
      if (pct >= 100) {
        if (autoTimerRef.current) clearInterval(autoTimerRef.current);
        setAutonextActive(false);
        goNext();
      }
    }, 16);
  }, [goNext]);

  // Atalhos 1..9
  useEffect(() => {
    if (!currentQuestion || loading || lastCorrect !== null) return;
    const handler = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (!Number.isNaN(n) && n >= 1 && n <= currentQuestion.choices.length) {
        const choice = currentQuestion.choices[n - 1];
        if (choice) onChoose(choice.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentQuestion, loading, lastCorrect]);

  const onChoose = useCallback(
    async (choiceId: string) => {
      if (!token) {
        setError("Sessão expirada. Faça login novamente.");
        return;
      }
      try {
        setLoading(true);
        setError(null);
        setLastSelected(choiceId);

        const res = await httpRetry(`/games/${gameId}/answer/${choiceId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        const body = unwrap<AnswerBody>(res);
        if (typeof body?.is_correct !== "boolean" || typeof body?.is_finished !== "boolean") {
          console.log("DEBUG /answer shape:", res);
          throw new Error("Resposta inválida do servidor.");
        }

        setLastCorrect(body.is_correct);
        lastCorrectRef.current = body.is_correct;
        if (body.is_correct) setScore((s) => s + 1);

        if (body.is_finished || !body.next_question) {
          // termina depois de mostrar feedback
          setNextQuestion(null);
          nextQuestionRef.current = null;
          pendingFinishRef.current = true;
          startAutonext(5000);
          return;
        }

        // guarda próxima pergunta em state + ref (garante leitura atual no goNext)
        setNextQuestion(body.next_question);
        nextQuestionRef.current = body.next_question;
        pendingFinishRef.current = false;
        startAutonext(5000);
      } catch (e: any) {
        setError(e?.message || "Não foi possível enviar a resposta.");
        setLastCorrect(null);
        lastCorrectRef.current = null;
        setLastSelected(null);
        nextQuestionRef.current = null;
        setNextQuestion(null);
        pendingFinishRef.current = false;
      } finally {
        setLoading(false);
      }
    },
    [gameId, token, startAutonext]
  );

if (isFinished) {
  return <QuizFinished score={score} maxScore={questionIndex} quizId={quizId} />;
}



  return (
    <div className="min-h-screen  text-white grid place-items-center px-4 py-10">
      <div className="relative w-full max-w-4xl">
      <div
  aria-hidden="true"
  className="absolute -inset-10 z-0 rounded-[40px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 opacity-50 blur-3xl"
/>

<div className="relative z-10 rounded-[36px] p-[2px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400">

          <section className="rounded-3xl border border-white/10 bg-neutral-950 p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="text-xs tracking-widest uppercase text-neutral-400">
                Pergunta <span className="text-white">{questionIndex}</span>
              </div>
              <div className="text-xs tracking-widest uppercase text-neutral-400">
                Pontos: <span className="text-white font-semibold">{score}</span>
              </div>
            </div>

            <header className="mb-7 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
                {currentQuestion.content}
              </h2>
            </header>

            {error && (
              <p className="mb-6 text-sm md:text-base text-rose-300 bg-rose-500/10 px-4 py-3 rounded-lg border border-rose-400/30">
                {error}
              </p>
            )}

            <form className="grid gap-4 md:gap-5 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
              {currentQuestion.choices.map((c, idx) => {
                const isSelected = lastSelected === c.id;
                const isCorrectSel = lastCorrect === true && isSelected;
                const isWrongSel = lastCorrect === false && isSelected;

                const base =
                  "group relative w-full cursor-pointer rounded-2xl border px-5 py-5 md:px-6 md:py-7 text-left text-lg md:text-xl transition-all outline-none";
                const idle =
                  "border-white/10 bg-neutral-900 hover:bg-neutral-800 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)] focus:ring-2 focus:ring-cyan-500/40";
                const ok =
                  "border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_0_2px_rgba(16,185,129,0.5)]";
                const bad =
                  "border-rose-400/50 bg-rose-500/10 shadow-[0_0_0_2px_rgba(244,63,94,0.5)]";

                const classes = `${base} ${isCorrectSel ? ok : isWrongSel ? bad : idle}`;

                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={loading || lastCorrect !== null}
                    onClick={() => onChoose(c.id)}
                    className={classes}
                  >
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-neutral-800 text-sm text-neutral-300">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="block leading-snug">{c.content}</span>
                          <span className="hidden md:inline-flex text-[10px] uppercase tracking-widest text-neutral-500">
                            {idx + 1}
                          </span>
                        </div>

                        {isCorrectSel && (
                          <span
                            aria-hidden
                            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-emerald-300 text-xs"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Correta
                          </span>
                        )}
                        {isWrongSel && (
                          <span
                            aria-hidden
                            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-500/10 px-2 py-1 text-rose-300 text-xs"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Incorreta
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </form>

            <div className="mt-7">
              {lastCorrect !== null && (
                <>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full ${lastCorrect ? "bg-emerald-400" : "bg-rose-400"}`}
                      style={{ width: `${autonextPct}%`, transition: "width 80ms linear" }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-neutral-400">
                    <span>{autonextActive ? "Avançando..." : "Pronto para avançar"}</span>
                    <div className="flex gap-2">
                      {autonextActive && (
                        <button
                          type="button"
                          onClick={goNext}
                          className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-800"
                        >
                          Próxima
                        </button>
                      )}
                      {autonextActive && (
                        <button
                          type="button"
                          onClick={stopAutonext}
                          className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-800"
                        >
                          Pausar
                        </button>
                      )}
                      {!autonextActive && lastCorrect !== null && (
                        <button
                          type="button"
                          onClick={goNext}
                          className="rounded-lg bg-white text-black px-3 py-1.5 font-medium hover:brightness-95"
                        >
                          Próxima
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {lastCorrect === null && (
                <div className="flex justify-between text-xs md:text-sm text-neutral-400 mt-1">
                  <span>Clique em uma alternativa</span>
                  <span>Atalho: 1–9</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
