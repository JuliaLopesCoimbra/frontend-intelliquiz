// app/quizzes/[quizId]/responder/QuizResponderClient.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getUserToken } from "@/lib/auth.client";
import { httpRetry } from "@/lib/http-retry";
import QuizGameApi from "@/components/QuizGameApi";
type ApiChoice = { id: string; content: string };
type ApiQuestion = { id: string; content: string; choices: ApiChoice[] };
type PlayBody = { game_id: string; question: ApiQuestion };
//helper para desembrulhar Axios/fetch + APIs com/sem "data"
function unwrap<T = any>(res: any): T {
  const lvl1 = res?.data ?? res;
  const lvl2 = lvl1?.data ?? lvl1;
  return lvl2 as T;
}
export default function QuizResponderClient({ quizId }: { quizId: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const [showCTA, setShowCTA] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
const [initialPlay, setInitialPlay] = useState<PlayBody | null>(null);

  // Guard de login
  useEffect(() => {
    const token = getUserToken();
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [router, pathname]);

 const handleStart = async () => {
  try {
    setStarting(true);
    setError(null);

    const token = getUserToken();
    if (!token) throw new Error("Faça login para jogar.");

    const res = await httpRetry(`/quizzes/${quizId}/play`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    // agora body = { game_id, question }
    const body = unwrap<PlayBody>(res);

    if (!body?.game_id || !body?.question) {
      console.log("DEBUG /play shape:", res);
      throw new Error("Resposta inválida ao iniciar o jogo.");
    }

    setInitialPlay(body);
  } catch (e: any) {
    setError(e?.message || "Não foi possível iniciar o jogo.");
    setStarting(false);
  }
};

  if (initialPlay) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <QuizGameApi quizId={quizId} initialPlay={initialPlay} />
    </main>
  );
}


  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden bg-black">
      <video
        src="/video/challenge.mp4"
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        onEnded={() => setShowCTA(true)}
        onError={() => setShowCTA(true)}
      />
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          showCTA ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden={!showCTA}
      >
        <div className="absolute inset-0 bg-white" />
      </div>

      {showCTA && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-6 text-center">
            <img src="/logo.png" alt="IntelliQuiz Logo"
                 className="w-80 h-80 object-contain drop-shadow-xl animate-pulse" />

            {error && (
              <p className="text-sm text-red-600 bg-white/80 px-3 py-2 rounded">
                {error}
              </p>
            )}

            <div className="flex gap-4 mt-2">
              <button
                onClick={() => router.back()}
                className="rounded-xl border border-neutral-800 px-6 py-3 text-base font-semibold
                           bg-neutral-200 text-neutral-800 hover:bg-neutral-300 active:scale-95 transition"
              >
                Voltar
              </button>

              <button
                onClick={handleStart}
                disabled={starting}
                className="rounded-xl px-8 py-3 text-base font-semibold
                           bg-amber-400 text-white shadow-lg
                           hover:brightness-110 active:scale-95 transition
                           disabled:opacity-60"
              >
                {starting ? "Carregando..." : "Iniciar Quiz"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
