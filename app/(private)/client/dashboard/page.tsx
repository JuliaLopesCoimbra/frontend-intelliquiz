"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/mockApi";
import { Quiz } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  useEffect(() => {
    api.listQuizzes().then(setQuizzes);
  }, []);

  const drafts = quizzes.filter((q) => q.status === "draft");
  const published = quizzes.filter((q) => q.status === "published");

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meus Quizzes</h1>
        <Link href="/create">
          <Button className="bg-amber-400 text-black hover:bg-amber-300">
            Novo Quiz
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-neutral-800">
          <CardHeader>
            <CardTitle>Rascunhos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {drafts.map((q) => (
                <li key={q.id} className="flex items-center justify-between">
                  <span>{q.title}</span>
                  <Link
                    className="text-sm text-amber-300"
                    href={`/create?id=${q.id}`}
                  >
                    Editar
                  </Link>
                </li>
              ))}
              {drafts.length === 0 && (
                <p className="text-sm text-neutral-400">Nenhum rascunho.</p>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-neutral-800">
          <CardHeader>
            <CardTitle>Publicados</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {published.map((q) => (
                <li key={q.id} className="flex items-center justify-between">
                  <span>{q.title}</span>
                  <Link
                    className="text-sm text-amber-300"
                    href={`/quiz/${q.slug}`}
                  >
                    Ver
                  </Link>
                </li>
              ))}
              {published.length === 0 && (
                <p className="text-sm text-neutral-400">
                  Nada publicado ainda.
                </p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
