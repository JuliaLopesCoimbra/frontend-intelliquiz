"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getUserToken } from "@/lib/auth.client";
import { http } from "@/lib/http";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Choice = { content: string; is_correct: boolean };
type Question = { content: string; choices: Choice[] };

export default function CreateQuizStep2() {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  const categoryId = params.get("category") || "";
  const categoryName = params.get("categoryName") || "";

  const name = params.get("title") || "";

  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // estado do formulário
  const [questions, setQuestions] = useState<Question[]>([
    { content: "", choices: [{ content: "", is_correct: true }, { content: "", is_correct: false }] },
  ]);

  // guard de auth
  useEffect(() => {
    const t = getUserToken();
    if (!t) {
      const next = `${pathname}?${params.toString()}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setChecking(false);
  }, [router, pathname, params]);

  // helpers de UI
  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { content: "", choices: [{ content: "", is_correct: true }, { content: "", is_correct: false }] },
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
      if (q.choices.length >= 5) return prev; // limite 5
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
      if (q.choices.length <= 2) return prev; // manter mínimo 2
      const newChoices = q.choices.filter((_, i) => i !== cIndex);
      // se removi a correta, define a primeira como correta
      const stillHasCorrect = newChoices.some((c) => c.is_correct);
      if (!stillHasCorrect) newChoices[0] = { ...newChoices[0], is_correct: true };
      clone[qIndex] = { ...q, choices: newChoices };
      return clone;
    });
  }
  function updateChoiceContent(qIndex: number, cIndex: number, value: string) {
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
      const choices = q.choices.map((c, i) => ({ ...c, is_correct: i === cIndex }));
      clone[qIndex] = { ...q, choices };
      return clone;
    });
  }

  // validação
  const validationError = useMemo(() => {
    if (!name.trim()) return "Título do quiz é obrigatório.";
    if (!categoryId) return "Categoria é obrigatória.";
    if (questions.length === 0) return "Adicione pelo menos 1 pergunta.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) return `Pergunta ${i + 1}: enunciado é obrigatório.`;
      if (q.choices.length < 2) return `Pergunta ${i + 1}: adicione pelo menos 2 respostas.`;
      if (q.choices.length > 5) return `Pergunta ${i + 1}: máximo de 5 respostas.`;
      const haveCorrect = q.choices.some((c) => c.is_correct);
      if (!haveCorrect) return `Pergunta ${i + 1}: selecione a resposta correta.`;
      for (let j = 0; j < q.choices.length; j++) {
        if (!q.choices[j].content.trim()) return `Pergunta ${i + 1}: resposta ${j + 1} está vazia.`;
      }
    }
    return null;
  }, [name, categoryId, questions]);

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
      questions: questions.map((q) => ({
        content: q.content.trim(),
        choices: q.choices.map((c) => ({
          content: c.content.trim(),
          is_correct: !!c.is_correct,
        })),
      })),
    };

    const res = await http<{ data?: { id: string; slug?: string } } | { id: string; slug?: string }>(
      "/quizzes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    // compat: algumas APIs devolvem { data: ... }, outras só o objeto
    const created = (res as any)?.data ?? (res as any);

    // ➜ vai para a tela de sucesso (que depois redireciona sozinha)
    router.replace(
      `/client/create/success?title=${encodeURIComponent(name)}&id=${created?.id ?? ""}&slug=${created?.slug ?? ""}`
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
      {/* HEADER */}
      <header className="w-full p-4 flex items-center justify-between bg-neutral-950 border-b border-neutral-800">
        <button onClick={() => router.back()} className="text-neutral-300 hover:text-amber-400 transition-colors text-sm">
          ⭠ Voltar
        </button>
        <div className="text-sm text-neutral-400">Criando: <span className="text-neutral-200">{name || "Sem título"}</span></div>
        <div className="h-8 w-8 rounded-full bg-neutral-700 overflow-hidden">
          <img
            src={
              typeof window !== "undefined"
                ? localStorage.getItem("user_avatar") ?? "https://ui-avatars.com/api/?name=User"
                : "https://ui-avatars.com/api/?name=User"
            }
            alt="avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      {/* MAIN */}
      <main className="mt-8 px-4 flex justify-center">
        <Card className="w-full max-w-4xl bg-neutral-950 border-neutral-800 text-neutral-100">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-400">Perguntas & Respostas</CardTitle>
           <p className="text-sm text-neutral-400">
  Categoria: <span className="text-neutral-200">{categoryName}</span>
</p>
          </CardHeader>
          <CardContent className="space-y-8">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="rounded-xl border border-neutral-800 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Pergunta {qIndex + 1}</Label>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-xs text-neutral-400 hover:text-red-400"
                    disabled={questions.length === 1}
                    title={questions.length === 1 ? "Mantenha pelo menos uma pergunta" : "Remover pergunta"}
                  >
                    Remover
                  </button>
                </div>

                <Input
                  value={q.content}
                  onChange={(e) => updateQuestionContent(qIndex, e.target.value)}
                  placeholder="Ex.: Qual a capital da França?"
                  className="h-11 bg-neutral-900 border-neutral-700"
                />

                <div className="space-y-3">
                  <Label className="text-sm text-neutral-400">Respostas (máx. 5) — selecione a correta</Label>

                  {q.choices.map((c, cIndex) => (
                    <div key={cIndex} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                      {/* radio da correta */}
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={c.is_correct}
                        onChange={() => setCorrectChoice(qIndex, cIndex)}
                        className="accent-amber-400"
                        title="Resposta correta"
                      />
                      {/* conteúdo da alternativa */}
                      <Input
                        value={c.content}
                        onChange={(e) => updateChoiceContent(qIndex, cIndex, e.target.value)}
                        placeholder={`Alternativa ${cIndex + 1}`}
                        className="h-10 bg-neutral-900 border-neutral-700"
                      />
                      {/* remover alternativa */}
                      <button
                        type="button"
                        onClick={() => removeChoice(qIndex, cIndex)}
                        className="text-xs px-2 py-1 rounded-md border border-neutral-700 hover:border-red-500 hover:text-red-400"
                        disabled={q.choices.length <= 2}
                        title={q.choices.length <= 2 ? "Mínimo de 2 respostas" : "Remover resposta"}
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
                      className="h-9 border-neutral-700 text-neutral-200 disabled:opacity-40"
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
                className="h-10 border-neutral-700 text-neutral-200"
              >
                + Adicionar pergunta
              </Button>

              <div className="flex items-center gap-3">
                {error && <span className="text-sm text-red-400">{error}</span>}
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
