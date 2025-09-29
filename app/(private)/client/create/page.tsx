"use client";
import { nanoid } from "nanoid";
import { useState } from "react";
import { api } from "@/lib/mockApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
export default function CreateQuiz() {
  const [title, setTitle] = useState("");
  const [category, setCat] = useState("");
  const [questions, setQ] = useState([
    {
      id: nanoid(),
      text: "",
      choices: [
        { id: nanoid(), text: "", correct: true },
        { id: nanoid(), text: "" },
        { id: nanoid(), text: "" },
        { id: nanoid(), text: "" },
      ],
    },
  ]);
  const save = async (status: "draft" | "published") => {
    const slug = title.toLowerCase().replace(/\s+/g, "-") + "-" + nanoid(6);
    await api.createQuiz({
      id: nanoid(),
      slug,
      title,
      category,
      status,
      cover: "",
      difficulty: "medium",
      plays: 0,
      creatorId: "me",
      createdAt: new Date().toISOString(),
      questions,
    });
    alert(status === "draft" ? "Rascunho salvo" : "Publicado!");
  };
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Card className="border-neutral-800">
        {" "}
        <CardHeader>
          <CardTitle>Novo Quiz</CardTitle>{" "}
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            {" "}
            <div>
              <Label className="mb-1 block">Título</Label>{" "}
              <Input
                placeholder="Ex.: História do Brasil"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />{" "}
            </div>
            <div>
              <Label className="mb-1 block">Categoria</Label>{" "}
              <Input
                placeholder="Ex.: História"
                value={category}
                onChange={(e) => setCat(e.target.value)}
              />{" "}
            </div>
          </div>
          {questions.map((q, idx) => (
            <div key={q.id} className="mb-6">
              {" "}
              <Label className="mb-2 block">Pergunta {idx + 1}</Label>{" "}
              <Input
                className="mb-3"
                placeholder="Digite a pergunta"
                value={q.text}
                onChange={(e) =>
                  setQ((prev) =>
                    prev.map((x) =>
                      x.id === q.id ? { ...x, text: e.target.value } : x
                    )
                  )
                }
              />
              <RadioGroup
                value={q.choices.find((c) => c.correct)?.id}
                onValueChange={(val) =>
                  setQ((prev) =>
                    prev.map((x) =>
                      x.id === q.id
                        ? {
                            ...x,
                            choices: x.choices.map((c) => ({
                              ...c,
                              correct: c.id === val,
                            })),
                          }
                        : x
                    )
                  )
                }
                className="space-y-3"
              >
                {q.choices.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    {" "}
                    <RadioGroupItem id={`c-${c.id}`} value={c.id} />{" "}
                    <Input
                      placeholder={`Alternativa ${i + 1}`}
                      value={c.text}
                      onChange={(e) =>
                        setQ((prev) =>
                          prev.map((x) =>
                            x.id === q.id
                              ? {
                                  ...x,
                                  choices: x.choices.map((cc) =>
                                    cc.id === c.id
                                      ? { ...cc, text: e.target.value }
                                      : cc
                                  ),
                                }
                              : x
                          )
                        )
                      }
                    />{" "}
                  </div>
                ))}{" "}
              </RadioGroup>{" "}
              <Separator className="my-6" />{" "}
            </div>
          ))}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => save("draft")}>
              Salvar rascunho
            </Button>
            <Button
              className="bg-amber-400 text-black hover:bg-amber-300"
              onClick={() => save("published")}
            >
              Publicar
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
