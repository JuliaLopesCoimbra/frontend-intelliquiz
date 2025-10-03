import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuizCard from "@/components/QuizCard";
import { api } from "@/lib/mockApi";

export default async function Home() {
  const trending = await api.trending();
  return (
    <div className="flex min-h-screen flex-col "> 
      <Header />
    <main
  className="flex flex-1 items-center justify-center px-4 py-8"
>
  <div className="w-[100vh] text-center">
    <h1 className="mb-1 text-2xl font-semibold">Quizzes Originais - Trending</h1>
       <h6 className="mb-10 text-small ">Teste seu conhecimento</h6>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trending.map((q) => (
        <QuizCard key={q.id} quiz={q} />
      ))}
    </div>
  </div>
</main>

      <Footer />
    </div>
  );
}
