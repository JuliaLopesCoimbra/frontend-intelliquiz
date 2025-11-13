"use client";

import {
  useRef,
  useEffect,
  useMemo,
  useState,
  Suspense,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getUserToken } from "@/lib/auth.client";
import { httpRetry as http } from "@/lib/http-retry";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthMe } from "@/app/hooks/useAuthMe";

type Choice = { id?: string; content: string; is_correct: boolean };
type Question = { id?: string; content: string; choices: Choice[] };

type ApiChoice = { id: string; content: string; is_correct: boolean };
type ApiQuestion = { id: string; content: string; choices: ApiChoice[] };
type SnapChoice = { id: string; content: string; is_correct: boolean };
type SnapQuestion = { id: string; content: string; choices: SnapChoice[] };
type SnapState = { questions: SnapQuestion[] };

function EditQuizStep2Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  const quizId = params.get("quizId") || "";
  const categoryId = params.get("category") || "";
  const categoryName = params.get("categoryName") || "";
  const quizTitle = params.get("title") || "";

  const { me, loadingMe } = useAuthMe();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const initialSnapshotRef = useRef<SnapState | null>(null);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const t = getUserToken();
    if (!t) {
      const next = `${pathname}?${params.toString()}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setChecking(false);
    loadQuizForQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadQuizForQuestions() {
    if (!quizId) return;
    setLoading(true);

    try {
      const res = await http<{ data?: { questions?: ApiQuestion[] } }>(
        `/quizzes/${quizId}`
      );

      const payload = (res as any)?.data ?? res;
      const apiQs: ApiQuestion[] = Array.isArray(payload?.questions)
        ? payload.questions
        : [];

      const qs: Question[] = apiQs.map((q) => ({
        id: q.id,
        content: q.content ?? "",
        choices: (q.choices ?? []).map((c) => ({
          id: c.id,
          content: c.content ?? "",
          is_correct: !!c.is_correct,
        })),
      }));

      initialSnapshotRef.current = {
        questions: qs
          .filter((q) => !!q.id)
          .map((q) => ({
            id: q.id as string,
            content: q.content ?? "",
            choices: (q.choices ?? [])
              .filter((c) => !!c.id)
              .map((c) => ({
                id: c.id as string,
                content: c.content ?? "",
                is_correct: !!c.is_correct,
              })),
          })),
      };

      setQuestions(
        qs.length
          ? qs
          : [
              {
                content: "",
                choices: [
                  { content: "", is_correct: true },
                  { content: "", is_correct: false },
                ],
              },
            ]
      );
    } catch (err: any) {
      const msg =
        err?.data?.message || err?.message || "Erro ao carregar perguntas.";
      setError(msg);
      console.error("GET /quizzes/{id} (questions) falhou:", err);
    } finally {
      setLoading(false);
    }
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        content: "",
        choices: [
          { content: "", is_correct: true },
          { content: "", is_correct: false },
        ],
      },
    ]);
  }

  function removeQuestion(qIndex: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== qIndex));
  }

  function updateQuestionContent(qIndex: number, value: string) {
    setQuestions((prev) => {
      const clone = [...prev];
      clone[qIndex] = { ...clone[qIndex], content: value };
      return clone;
    });
  }

  function addChoice(qIndex: number) {
    setQuestions((prev) => {
      const clone = [...prev];
      const q = clone[qIndex];
      if (q.choices.length >= 5) return prev;
      clone[qIndex] = {
        ...q,
        choices: [...q.choices, { content: "", is_correct: false }],
      };
      return clone;
    });
  }

  function removeChoice(qIndex: number, cIndex: number) {
    setQuestions((prev) => {
      const clone = [...prev];
      const q = clone[qIndex];
      if (q.choices.length <= 2) return prev;
      const newChoices = q.choices.filter((_, i) => i !== cIndex);
      const stillHasCorrect = newChoices.some((c) => c.is_correct);
      if (!stillHasCorrect)
        newChoices[0] = { ...newChoices[0], is_correct: true };
      clone[qIndex] = { ...q, choices: newChoices };
      return clone;
    });
  }

  function updateChoiceContent(
    qIndex: number,
    cIndex: number,
    value: string
  ) {
    setQuestions((prev) => {
      const clone = [...prev];
      const q = clone[qIndex];
      const choices = [...q.choices];
      choices[cIndex] = { ...choices[cIndex], content: value };
      clone[qIndex] = { ...q, choices };
      return clone;
    });
  }

  function setCorrectChoice(qIndex: number, cIndex: number) {
    setQuestions((prev) => {
      const clone = [...prev];
      const q = clone[qIndex];
      const choices = q.choices.map((c, i) => ({
        ...c,
        is_correct: i === cIndex,
      }));
      clone[qIndex] = { ...q, choices };
      return clone;
    });
  }

  const validationError = useMemo(() => {
    if (!quizId) return "ID do quiz inválido.";
    if (questions.length === 0) return "Adicione pelo menos 1 pergunta.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim())
        return `Pergunta ${i + 1}: enunciado é obrigatório.`;
      if (q.choices.length < 2)
        return `Pergunta ${i + 1}: adicione pelo menos 2 respostas.`;
      if (q.choices.length > 5)
        return `Pergunta ${i + 1}: máximo de 5 respostas.`;
      const haveCorrect = q.choices.some((c) => c.is_correct);
      if (!haveCorrect)
        return `Pergunta ${i + 1}: selecione a resposta correta.`;
      for (let j = 0; j < q.choices.length; j++) {
        if (!q.choices[j].content.trim())
          return `Pergunta ${i + 1}: resposta ${j + 1} está vazia.`;
      }
    }
    return null;
  }, [quizId, questions]);

  async function patchQuestion(
    questionId: string,
    content: string,
    quizId: string
  ) {
    const token = getUserToken();
    return http(`/questions/${questionId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, quiz_id: quizId }),
    });
  }

  async function patchChoice(
    choiceId: string,
    content: string,
    isCorrect: boolean
  ) {
    const token = getUserToken();
    return http(`/choices/${choiceId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, is_correct: !!isCorrect }),
    });
  }

  async function postQuestion(
    quizId: string,
    content: string,
    choices: { content: string; is_correct: boolean }[]
  ) {
    const token = getUserToken();
    return http<{ data: { id: string } }>(`/questions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quiz_id: quizId, content, choices }),
    });
  }

  async function postChoice(questionId: string, content: string) {
    const token = getUserToken();
    return http<{ data: { id: string } }>(`/questions/${questionId}/choices`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });
  }

  async function deleteQuestion(questionId: string) {
    const token = getUserToken();
    return http(`/questions/${questionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async function deleteChoice(choiceId: string) {
    const token = getUserToken();
    return http(`/choices/${choiceId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async function handleSaveQuestions() {
    setError(null);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const initial = initialSnapshotRef.current;

      const deletedQuestionIds: string[] = [];
      const deletedChoiceIds: string[] = [];

      if (initial) {
        const currentQuestionIds = new Set(
          questions.filter((q) => q.id).map((q) => q.id as string)
        );

        for (const iq of initial.questions) {
          if (!currentQuestionIds.has(iq.id)) {
            deletedQuestionIds.push(iq.id);
          }
        }

        for (const iq of initial.questions) {
          const currentQuestion = questions.find((q) => q.id === iq.id);
          if (!currentQuestion) continue;

          const currentChoiceIds = new Set(
            currentQuestion.choices
              .filter((c) => c.id)
              .map((c) => c.id as string)
          );

          for (const ic of iq.choices) {
            if (!currentChoiceIds.has(ic.id)) {
              deletedChoiceIds.push(ic.id);
            }
          }
        }
      }

      for (const id of deletedChoiceIds) await deleteChoice(id);
      for (const id of deletedQuestionIds) await deleteQuestion(id);

      const initialByQ: Record<
        string,
        {
          content: string;
          choices: Record<string, { content: string; is_correct: boolean }>;
        }
      > = {};

      if (initial) {
        for (const iq of initial.questions) {
          initialByQ[iq.id] = {
            content: iq.content ?? "",
            choices: Object.fromEntries(
              iq.choices.map((ic) => [
                ic.id,
                { content: ic.content ?? "", is_correct: !!ic.is_correct },
              ])
            ),
          };
        }
      }

      for (const q of questions) {
        if (q.id) {
          const baseline = initialByQ[q.id];
          const contentChanged =
            !baseline || q.content.trim() !== (baseline.content ?? "");

          if (contentChanged) {
            await patchQuestion(q.id, q.content.trim(), quizId);
          }

          for (const c of q.choices) {
            if (c.id) {
              const baseC = baseline?.choices?.[c.id];
              const contentChanged = baseC
                ? c.content.trim() !== (baseC.content ?? "")
                : true;
              const flagChanged = baseC
                ? !!c.is_correct !== !!baseC.is_correct
                : true;

              if (contentChanged || flagChanged) {
                await patchChoice(c.id, c.content.trim(), !!c.is_correct);
              }
            }
          }

          for (const c of q.choices) {
            if (!c.id) {
              const created = await postChoice(q.id, c.content.trim());
              const newId = created?.data?.id;

              if (newId && c.is_correct) {
                await patchChoice(newId, c.content.trim(), true);
              }
            }
          }
        } else {
          await postQuestion(
            quizId,
            q.content.trim(),
            q.choices.map((c) => ({
              content: c.content.trim(),
              is_correct: !!c.is_correct,
            }))
          );
        }
      }

      router.replace("/client/dashboard");
    } catch (err: any) {
      setError("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-400">Verificando sessão...</p>
      </main>
    );
  }

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `
        repeating-conic-gradient(
          from 45deg,
          rgba(251,191,36,0.10) 0deg 12deg,
          rgba(0,0,0,1) 12deg 24deg
        )
      `,
          filter: "blur(4px)",
          opacity: 0.15,
        }}
      />
      <header className="w-full p-4 flex items-center justify-between bg-neutral-950 border-b border-neutral-800">
        <button
          onClick={() => router.back()}
          className="text-neutral-300 hover:text-amber-400 transition-colors text-sm"
        >
          ⭠ Voltar
        </button>
        <div className="text-sm text-neutral-400">
          Editando:&nbsp;
          <span className="text-neutral-200">{quizTitle || "Sem título"}</span>
          &nbsp;·&nbsp;Categoria:&nbsp;
          <span className="text-neutral-200">{categoryName || "—"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-300">
            {loadingMe ? "Carregando..." : me?.username || "Usuário"}
          </span>
          <div className="h-9 w-9 rounded-full bg-neutral-700 overflow-hidden">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                me?.name || me?.username || "User"
              )}`}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      <main className="mt-8 px-4 flex justify-center">
        <Card className="w-full max-w-4xl bg-neutral-950 border-neutral-800 text-neutral-100">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-400">
              Perguntas & Respostas
            </CardTitle>
            <p className="text-sm text-neutral-400">
              Edite as perguntas e alternativas do seu quiz.
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {error && <p className="text-sm text-red-400">{error}</p>}
            {loading ? (
              <p className="text-neutral-500">Carregando perguntas…</p>
            ) : (
              <>
                {questions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="rounded-xl border border-neutral-800 p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Pergunta {qIndex + 1}</Label>
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-xs text-neutral-400 hover:text-red-400"
                        disabled={questions.length === 1}
                        title={
                          questions.length === 1
                            ? "Mantenha pelo menos uma pergunta"
                            : "Remover pergunta"
                        }
                      >
                        Remover
                      </button>
                    </div>

                    <Input
                      value={q.content}
                      onChange={(e) =>
                        updateQuestionContent(qIndex, e.target.value)
                      }
                      placeholder="Ex.: Qual a capital da França?"
                      className="h-11 bg-neutral-900 border-neutral-700"
                    />

                    <div className="space-y-3">
                      <Label className="text-sm text-neutral-400">
                        Respostas (máx. 5) — selecione a correta
                      </Label>

                      {q.choices.map((c, cIndex) => (
                        <div
                          key={cIndex}
                          className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
                        >
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={c.is_correct}
                            onChange={() => setCorrectChoice(qIndex, cIndex)}
                            className="accent-amber-400"
                            title="Resposta correta"
                          />
                          <Input
                            value={c.content}
                            onChange={(e) =>
                              updateChoiceContent(
                                qIndex,
                                cIndex,
                                e.target.value
                              )
                            }
                            placeholder={`Alternativa ${cIndex + 1}`}
                            className="h-10 bg-neutral-900 border-neutral-700"
                          />
                          <button
                            type="button"
                            onClick={() => removeChoice(qIndex, cIndex)}
                            className="text-xs px-2 py-1 rounded-md border border-neutral-700 hover:border-red-500 hover:text-red-400"
                            disabled={q.choices.length <= 2}
                            title={
                              q.choices.length <= 2
                                ? "Mínimo de 2 respostas"
                                : "Remover resposta"
                            }
                          >
                            Remover
                          </button>
                        </div>
                      ))}

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addChoice(qIndex)}
                          disabled={q.choices.length >= 5}
                          className="h-9 border-neutral-700 text-black disabled:opacity-40"
                        >
                          Adicionar resposta
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addQuestion}
                    className="h-10 border-neutral-700 text-black"
                  >
                    + Adicionar pergunta
                  </Button>

                  <div className="flex items-center gap-3">
                    {error && (
                      <span className="text-sm text-red-400">{error}</span>
                    )}
                    <Button
                      onClick={handleSaveQuestions}
                      disabled={!!validationError || saving}
                      className="h-11 bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-40"
                    >
                      {saving ? "Salvando..." : "Salvar perguntas"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}

export default function EditQuizStep2() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4">
          <p className="text-neutral-200 text-lg">
            Carregando editor de perguntas...
          </p>
        </main>
      }
    >
      <EditQuizStep2Inner />
    </Suspense>
  );
}
