// app/quizzes/[slug]/responder/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { getUserToken } from "@/lib/auth.client";
import { httpRetry } from "@/lib/http-retry";
import QuizGame from "@/components/QuizGame";

type QuizQuestion = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  // Opcional: correctOptionId?: string // no cliente geralmente não vem
};

type QuizData = {
  id: string;
  title: string;
  category?: string;
  questions: QuizQuestion[];
  timeLimitSec?: number; // se tiver tempo
  slug: string;
};

export default function QuizResponderPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const pathname = usePathname();

  const slug = useMemo(() => params?.slug, [params]);

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1) Checa token e redireciona pro login com next se não houver
  useEffect(() => {
    const token = getUserToken();
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    // 2) Carrega dados do quiz
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Ajuste esta URL conforme seu backend (ex.: /quiz/by-slug/:slug)
        const res = await httpRetry<{ data: QuizData }>(`/quizzes/${slug}`);
        setQuiz(res?.data ?? null);
      } catch (e: any) {
        setError(
          e?.message || "Não foi possível carregar o quiz. Tente novamente."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [router, pathname, slug]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-neutral-400">Carregando quiz...</p>
      </main>
    );
  }

  if (error || !quiz) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-red-400">{error || "Quiz não encontrado."}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">{quiz.title}</h1>
      {quiz.category && (
        <p className="mb-6 text-sm text-amber-300">{quiz.category}</p>
      )}
      <QuizGame quiz={quiz} />
    </main>
  );
}
