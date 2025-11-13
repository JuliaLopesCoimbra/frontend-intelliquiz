"use client";

import {
  useEffect,
  useMemo,
  useState,
  Suspense,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getUserToken } from "@/lib/auth.client";
import { http } from "@/lib/http";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthMe } from "@/app/hooks/useAuthMe";
import { Sparkles } from "lucide-react";

type Choice = { content: string; is_correct: boolean };
type Question = {
  content: string;
  choices: Choice[];
  aiSuggestions?: string[];
  aiChoiceSuggestions?: string[];
};

function CreateQuizStep2Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  const categoryId = params.get("category") || "";
  const categoryName = params.get("categoryName") || "";
  const imageUrl = params.get("imageUrl") || "";
  const name = params.get("title") || "";

  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([
    {
      content: "",
      choices: [
        { content: "", is_correct: true },
        { content: "", is_correct: false },
      ],
      aiSuggestions: [],
      aiChoiceSuggestions: [],
    },
  ]);

  const { me, loadingMe } = useAuthMe();

  const [aiLoadingIndex, setAiLoadingIndex] = useState<number | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // guarda sessão
  useEffect(() => {
    const t = getUserToken();
    if (!t) {
      const next = `${pathname}?${params.toString()}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setChecking(false);
  }, [router, pathname, params]);

  // carrega quiz gerado pela IA (step1)
  useEffect(() => {
    if (checking) return;

    try {
      const raw = sessionStorage.getItem("iq:generatedQuiz");
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) return;

      const mapped: Question[] = parsed.map((q: any) => {
        const baseChoices: Choice[] =
          Array.isArray(q?.choices) && q.choices.length
            ? q.choices.map((c: any) => ({
                content: String(c?.content ?? ""),
                is_correct: !!c?.is_correct,
              }))
            : [
                { content: "", is_correct: true },
                { content: "", is_correct: false },
              ];

        if (!baseChoices.some((c) => c.is_correct) && baseChoices.length > 0) {
          baseChoices[0].is_correct = true;
        }

        return {
          content: String(q?.question_content ?? ""),
          choices: baseChoices,
          aiSuggestions: [],
          aiChoiceSuggestions: baseChoices
            .map((c) => c.content)
            .filter(Boolean),
        };
      });

      setQuestions(mapped);
      sessionStorage.removeItem("iq:generatedQuiz");
    } catch (e) {
      console.error("Erro ao carregar quiz gerado da IA:", e);
    }
  }, [checking]);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        content: "",
        choices: [
          { content: "", is_correct: true },
          { content: "", is_correct: false },
        ],
        aiSuggestions: [],
        aiChoiceSuggestions: [],
      },
    ]);
  }

  function removeQuestion(qIndex: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== qIndex));
  }

  function updateQuestionContent(qIndex: number, value: string) {
    setQuestions((prev) => {
      const clone = [...prev];
      const q = clone[qIndex];
      if (!q) return prev;
      clone[qIndex] = { ...q, content: value };
      return clone;
    });
  }

  function addChoice(qIndex: number) {
    setQuestions((prev) => {
      const clone = [...prev];
      const q = clone[qIndex];
      if (!q || q.choices.length >= 5) return prev;
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
      if (!q) return prev;
      if (q.choices.length <= 2) return prev;

      const newChoices = q.choices.filter((_, i) => i !== cIndex);
      const stillHasCorrect = newChoices.some((c) => c.is_correct);
      if (!stillHasCorrect && newChoices.length > 0) {
        newChoices[0] = { ...newChoices[0], is_correct: true };
      }

      clone[qIndex] = { ...q, choices: newChoices };
      return clone;
    });
  }

  function updateChoiceContent(qIndex: number, cIndex: number, value: string) {
    setQuestions((prev) => {
      const clone = [...prev];
      const q = clone[qIndex];
      if (!q) return prev;
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
      if (!q) return prev;
      const choices = q.choices.map((c, i) => ({
        ...c,
        is_correct: i === cIndex,
      }));
      clone[qIndex] = { ...q, choices };
      return clone;
    });
  }

  function applyChoiceSuggestion(qIndex: number, suggestion: string) {
    setQuestions((prev) => {
      const clone = [...prev];
      const q = clone[qIndex];
      if (!q) return prev;

      const choices = [...q.choices];

      let targetIdx = choices.findIndex((c) => !c.content.trim());

      if (targetIdx === -1) {
        if (choices.length < 5) {
          choices.push({ content: suggestion, is_correct: false });
        } else {
          let lastIdx = -1;
          for (let i = choices.length - 1; i >= 0; i--) {
            if (!choices[i].is_correct) {
              lastIdx = i;
              break;
            }
          }
          if (lastIdx === -1) lastIdx = choices.length - 1;
          choices[lastIdx] = { ...choices[lastIdx], content: suggestion };
        }
      } else {
        choices[targetIdx] = { ...choices[targetIdx], content: suggestion };
      }

      clone[qIndex] = { ...q, choices };
      return clone;
    });
  }

  async function handleGenerateQuestionAI(qIndex: number) {
    if (!categoryId || !name.trim()) return;

    try {
      setAiError(null);
      setAiLoadingIndex(qIndex);

      const token = getUserToken();
      if (!token) {
        const next = `${pathname}?${params.toString()}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      const res = await http<any>("/ai/generate-question", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_id: categoryId,
          quiz_title: name.trim(),
        }),
      });

      const payload = res?.data?.data ?? res?.data ?? res;
      const questionContent: string | undefined = payload?.question_content;
      const choicesFromIa: any[] = Array.isArray(payload?.choices)
        ? payload.choices
        : [];

      const choiceTexts = choicesFromIa
        .map((c) => String(c?.content ?? "").trim())
        .filter((s) => s.length > 0);

      if (!questionContent && !choiceTexts.length) {
        setAiError("IA não retornou dados suficientes para gerar a questão.");
        return;
      }

      setQuestions((prev) => {
        const clone = [...prev];
        const qPrev = clone[qIndex];
        if (!qPrev) return prev;

        clone[qIndex] = {
          ...qPrev,
          aiSuggestions: questionContent ? [questionContent] : [],
          aiChoiceSuggestions: choiceTexts,
        };
        return clone;
      });
    } catch (err: any) {
      console.error("Erro ao chamar /ai/generate-question:", err);
      setAiError("Não foi possível gerar a questão agora. Tente novamente.");
    } finally {
      setAiLoadingIndex(null);
    }
  }

  const validationError = useMemo(() => {
    if (!name.trim()) return "Título do quiz é obrigatório.";
    if (!categoryId) return "Categoria é obrigatória.";
    if (!imageUrl.trim()) return "O link da imagem (image_url) é obrigatório.";
    try {
      const u = new URL(imageUrl);
      if (!/^https?:$/.test(u.protocol))
        return "Link da imagem inválido (use http/https).";
    } catch {
      return "Link da imagem inválido.";
    }
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
  }, [name, categoryId, imageUrl, questions]);

  async function handleSubmit() {
    setError(null);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const token = getUserToken();
      if (!token) {
        const next = `${pathname}?${params.toString()}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      const payload = {
        name: name.trim(),
        category_id: categoryId,
        image_url: imageUrl,
        questions: questions.map((q) => ({
          content: q.content.trim(),
          choices: q.choices.map((c) => ({
            content: c.content.trim(),
            is_correct: !!c.is_correct,
          })),
        })),
      };

      const res = await http<
        | { data?: { id: string; slug?: string } }
        | { id: string; slug?: string }
      >("/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const created = (res as any)?.data ?? (res as any);

      router.replace(
        `/client/create/success?title=${encodeURIComponent(
          name
        )}&id=${created?.id ?? ""}&slug=${created?.slug ?? ""}`
      );
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      if (status === 401 || status === 403) {
        const next = `${pathname}?${params.toString()}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      setError(err?.body || err?.message || "Erro ao criar quiz.");
      console.error("POST /quizzes falhou:", status, err);
    } finally {
      setSubmitting(false);
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
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
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
          className="absolute inset-0"
        />
      </div>

      {/* HEADER */}
      <header className="w-full p-4 flex items-center justify-between bg-neutral-950 border-b border-neutral-800">
        <button
          onClick={() => router.back()}
          className="text-neutral-300 hover:text-amber-400 transition-colors text-sm"
        >
          ⭠ Voltar
        </button>
        <div className="text-sm text-neutral-400">
          Criando:{" "}
          <span className="text-neutral-200">{name || "Sem título"}</span>
        </div>
        {/* User Info */}
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

      {/* MAIN */}
      <main className="mt-8 px-4 flex justify-center">
        <Card className="w-full max-w-4xl bg-neutral-950 border-neutral-800 text-neutral-100">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-400">
              Perguntas & Respostas
            </CardTitle>
            <p className="text-sm text-neutral-400">
              Categoria:{" "}
              <span className="text-neutral-200">{categoryName}</span>
            </p>
            {imageUrl && (
              <div className="mt-3 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Imagem do quiz"
                  className="w-full h-40 object-cover"
                />
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-8">
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="rounded-xl border border-neutral-800 p-4 space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-base">Pergunta {qIndex + 1}</Label>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => handleGenerateQuestionAI(qIndex)}
                      disabled={
                        !categoryId ||
                        !name.trim() ||
                        aiLoadingIndex === qIndex
                      }
                      className="
                        h-9 px-3 text-xs font-semibold
                        flex items-center gap-1
                        bg-black border border-amber-400
                        text-amber-400 
                        hover:bg-amber-400/20 hover:text-amber-300
                        rounded-md transition-all
                        disabled:opacity-40 disabled:hover:bg-black disabled:hover:text-amber-400
                      "
                    >
                      <Sparkles size={14} className="text-amber-400" />
                      {aiLoadingIndex === qIndex
                        ? "Gerando..."
                        : "Gerar com IA"}
                    </Button>

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
                </div>

                {q.aiSuggestions && q.aiSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs mb-1">
                    {q.aiSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setQuestions((prev) => {
                            const clone = [...prev];
                            const qPrev = clone[qIndex];
                            if (!qPrev) return prev;
                            clone[qIndex] = {
                              ...qPrev,
                              content: s,
                            };
                            return clone;
                          })
                        }
                        className="rounded-full border border-amber-400/60 px-3 py-1 bg-neutral-900 hover:bg-amber-400/10 text-amber-300 text-left"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {aiError && (
                  <p className="text-xs text-red-400">{aiError}</p>
                )}

                <Input
                  value={q.content}
                  onChange={(e) =>
                    updateQuestionContent(qIndex, e.target.value)
                  }
                  placeholder="Ex.: Qual a capital da França?"
                  className="h-11 bg-neutral-900 border-neutral-700"
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-sm text-neutral-400">
                      Respostas (máx. 5) — selecione a correta
                    </Label>
                  </div>

                  {q.aiChoiceSuggestions &&
                    q.aiChoiceSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs mb-1">
                        {q.aiChoiceSuggestions.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              applyChoiceSuggestion(qIndex, s)
                            }
                            className="rounded-full border border-amber-400/60 px-3 py-1 bg-neutral-900 hover:bg-amber-400/10 text-amber-300 text-left"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                  {q.choices.map((c, cIndex) => (
                    <div
                      key={cIndex}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
                    >
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={c.is_correct}
                        onChange={() =>
                          setCorrectChoice(qIndex, cIndex)
                        }
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
                  onClick={handleSubmit}
                  disabled={!!validationError || submitting}
                  className="h-11 bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-40"
                >
                  {submitting ? "Enviando..." : "Salvar quiz"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

export default function CreateQuizStep2() {
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
      <CreateQuizStep2Inner />
    </Suspense>
  );
}
