import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuizCard from "@/components/QuizCard";
import { getQuizzes, type QuizApi } from "@/lib/quizApi";
import { toQuiz } from "@/lib/quizAdapter";
import VideoBackground from "@/components/background/VideoBackground";

export default async function DashboardPublic() {
  const apiQuizzes: QuizApi[] = await getQuizzes();
  const quizzes = apiQuizzes.map(toQuiz);

  return (
    <div className="flex min-h-screen flex-col relative">

      {/* Vídeo atrás de tudo */}
      <VideoBackground />

      {/* Conteúdo que vem por cima do vídeo */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        {/* Adicione padding-top do tamanho do vídeo */}
        <main className="flex flex-1 items-center justify-center px-4 py-8 pt-[60vh]">
          <div className="w-full max-w-6xl">
            <h1 className="mb-1 text-2xl font-semibold">
              Quizzes Disponíveis para Responder
            </h1>
            <h6 className="mb-10 text-sm text-neutral-400">
              Teste seu conhecimento agora — lista sempre atualizada
            </h6>

            {quizzes.length === 0 ? (
              <p className="text-neutral-500">
                Nenhum quiz disponível no momento.
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {quizzes.map((quiz) => (
                  <li key={quiz.id}>
                    <QuizCard quiz={quiz} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
