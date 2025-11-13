// app/(public)/dashboard/page.tsx
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuizCard from "@/components/QuizCard";
import { getQuizzes, type QuizApi } from "@/lib/quizApi";
import { toQuiz } from "@/lib/quizAdapter";
import VideoBackground from "@/components/background/VideoBackground";

export default async function DashboardPublic({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const page = Number.isFinite(Number(searchParams?.page))
    ? Number(searchParams?.page)
    : 0;

  const limit = 9;

  let data: { quizzes: QuizApi[]; maxPage: number } = { quizzes: [], maxPage: 0 };
  try {
    data = await getQuizzes({ page, limit });
  } catch (e) {
    console.error("Erro ao carregar quizzes:", e);
  }

  const quizzes = Array.isArray(data.quizzes) ? data.quizzes.map(toQuiz) : [];
  const hasPrev = page > 0;
  const hasNext = page < (data.maxPage ?? 0); // zero-based

  return (
    <div className="flex min-h-screen flex-col relative">
      <VideoBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex flex-1 items-center justify-center px-4 py-8 pt-[60vh]">
          <div className="w-full max-w-6xl">
            <h1 className="mb-1 text-2xl font-semibold">Quizzes Disponíveis para Responder</h1>
            <h6 className="mb-10 text-sm text-neutral-400">
              Teste seu conhecimento agora — lista sempre atualizada
            </h6>

            {quizzes.length === 0 ? (
              <p className="text-neutral-500">Nenhum quiz disponível no momento.</p>
            ) : (
              <>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {quizzes.map((quiz) => (
                    <li key={quiz.id}>
                      <QuizCard quiz={quiz} />
                    </li>
                  ))}
                </ul>

                {/* Paginação */}
                <div className="mt-8 flex items-center justify-center gap-3">
                  <Link
                    href={`?page=${Math.max(page - 1, 0)}`}
                    aria-disabled={!hasPrev}
                    className={`rounded-md border px-3 py-2 text-sm ${
                      hasPrev
                        ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                        : "pointer-events-none border-neutral-800 text-neutral-600"
                    }`}
                  >
                    ← Anterior
                  </Link>

                  <span className="text-xs text-neutral-400">
                    Página {page + 1} de {Number(data.maxPage ?? 0) + 1}
                  </span>

                  <Link
                    href={`?page=${hasNext ? page + 1 : page}`}
                    aria-disabled={!hasNext}
                    className={`rounded-md border px-3 py-2 text-sm ${
                      hasNext
                        ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                        : "pointer-events-none border-neutral-800 text-neutral-600"
                    }`}
                  >
                    Próxima →
                  </Link>
                </div>
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
