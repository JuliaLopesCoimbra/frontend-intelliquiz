import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuizCard from "@/components/QuizCard";
import { api } from "@/lib/mockApi";

export default async function Home() {
  const trending = await api.trending();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold">Trending</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trending.map((q) => (
            <QuizCard key={q.id} quiz={q} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
