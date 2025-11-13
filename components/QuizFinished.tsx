"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getUserToken } from "@/lib/auth.client";

type Props = {
  score: number;
  maxScore?: number;
  quizTitle?: string;
  quizId: string;
};

export function QuizFinished({ score, maxScore = 100, quizTitle, quizId }: Props) {
 const pct = useMemo(() => {
    const p = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));
    return Number.isFinite(p) ? p : 0;
  }, [score, maxScore]);

  const circumference = 2 * Math.PI * 80;
  const dash = (pct / 100) * circumference;
 const params = useParams<{ slug?: string; quizId?: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  // --- Like / Dislike state ---
  const [vote, setVote] = useState<"like" | "dislike" | null>(null);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const slugFromParams = params?.slug || params?.quizId;
  const idFromQuery = sp?.get("quizId") || undefined;
  const effectiveQuizId = quizId || slugFromParams || idFromQuery;
   async function sendVote(kind: "like" | "dislike") {
    setErrorMsg(null);

    const token = getUserToken();
    if (!effectiveQuizId) {
      setErrorMsg("ID do quiz não encontrado.");
      return;
    }
    if (!token) {
      setErrorMsg("Sessão expirada. Faça login novamente.");
      // opcional: router.push("/auth/login?redirectTo=" + encodeURIComponent(location.pathname));
      return;
    }
    if (sending || vote !== null) return;

    setSending(true);
    setVote(kind); // otimista

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}quizzes/${effectiveQuizId}/${kind}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // <-- TOKEN AQUI
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setErrorMsg("Sem autorização. Faça login novamente.");
          // opcional: router.push("/auth/login?redirectTo=" + encodeURIComponent(location.pathname));
        } else {
          const text = await res.text().catch(() => "");
          setErrorMsg(`Erro ${res.status}: ${text || "Falha ao enviar feedback."}`);
        }
        setVote(null); // desfaz otimista em erro
        return;
      }
      // sucesso: mantém 'vote' setado
    } catch (err: any) {
      console.error(err);
      setVote(null);
      setErrorMsg("Não foi possível enviar seu voto. Verifique sua conexão.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center text-white px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `
            repeating-conic-gradient(
              from 0deg,
              #fbbf24 0deg 10deg,
              #f59e0b 10deg 20deg
            )
          `,
        }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-black/40" />

      <section className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-amber-400/40 bg-neutral-950/70 backdrop-blur p-6 md:p-10">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-2xl md:text-3xl animate-[fall_2.4s_linear_infinite] [animation-delay:var(--d)] [left:var(--x)]"
              style={
                {
                  "--x": `${Math.random() * 100}%`,
                  "--d": `${Math.random() * 1.3}s`,
                } as React.CSSProperties
              }
            >
              ⭐
            </span>
          ))}
        </div>

        <div className="relative grid gap-8 md:grid-cols-[1fr_auto] items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-amber-400">
              Quiz finalizado!
            </h2>

            {quizTitle && (
              <p className="mt-1 text-neutral-300">
                Você concluiu: <span className="font-semibold text-white">{quizTitle}</span>
              </p>
            )}

            <p className="mt-2 text-neutral-300">
              Pontuação:{" "}
              <span className="font-semibold text-amber-400">{score}</span>{" "}
              {maxScore !== 100 && (
                <>
                  / <span className="text-neutral-200">{maxScore}</span>
                </>
              )}
              <span className="ml-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-sm text-amber-400">
                {pct}%
              </span>
            </p>

            <div className="mt-6">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full origin-left animate-[grow_1.2s_ease-out] rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, #fbbf24, #fcd34d, #fbbf24)",
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-neutral-400">
                {pct >= 90
                  ? "Você destruiu! 👑"
                  : pct >= 70
                  ? "Muito bom! Continue assim!"
                  : pct >= 50
                  ? "Bom progresso! Bora melhorar!"
                  : "Não desista, próxima você arrebenta!"}
              </p>
            </div>

            {/* --- BLOCO LIKE / DISLIKE --- */}
            <div className="mt-8">
              <p className="text-sm text-neutral-300 mb-3">Curtiu o quiz?</p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                    // estilos “setado” quando like estiver escolhido
                  className={[
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 border transition",
                    vote === "like"
                      ? "border-emerald-400/60 bg-emerald-500/15 ring-2 ring-emerald-400/30"
                      : "border-white/10 bg-white/5 hover:bg-white/10",
                    sending || vote !== null ? "opacity-70 cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                  onClick={() => sendVote("like")}
                  disabled={sending || vote !== null}
                  aria-pressed={vote === "like"}
                >
                  <span className="text-xl">👍</span>
                  <span className="font-medium">Gostei</span>
                </button>

                <button
                  type="button"
                  className={[
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 border transition",
                    vote === "dislike"
                      ? "border-rose-400/60 bg-rose-500/15 ring-2 ring-rose-400/30"
                      : "border-white/10 bg-white/5 hover:bg-white/10",
                    sending || vote !== null ? "opacity-70 cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                  onClick={() => sendVote("dislike")}
                  disabled={sending || vote !== null}
                  aria-pressed={vote === "dislike"}
                >
                  <span className="text-xl">👎</span>
                  <span className="font-medium">Não gostei</span>
                </button>
              </div>

              {errorMsg && (
                <p className="mt-2 text-sm text-rose-400">{errorMsg}</p>
              )}
              {vote && !errorMsg && (
                <p className="mt-2 text-sm text-neutral-300">
                  {vote === "like" ? "Obrigado pelo feedback! 😊" : "Obrigado pelo feedback! Vamos melhorar. 🙏"}
                </p>
              )}
            </div>

            <div className="mt-8">
              <Link
                href="/client/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/40 text-black px-6 py-3 font-semibold shadow-[0_0_15px_#fbbf24] hover:scale-[1.03] transition"
                style={{ background: "linear-gradient(90deg,#fbbf24,#fcd34d,#fbbf24)" }}
              >
                ← Voltar ao painel
              </Link>
            </div>
          </div>

          <div className="relative mx-auto md:mx-0">
            <svg width="220" height="220" viewBox="0 0 220 220" className="drop-shadow-[0_0_40px_#fbbf24]">
              <defs>
                <linearGradient id="grad-amber" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#fcd34d" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>

              <circle cx="110" cy="110" r="80" stroke="rgba(255,255,255,0.09)" strokeWidth="18" fill="none" />
              <circle
                cx="110" cy="110" r="80"
                stroke="url(#grad-amber)" strokeWidth="18" fill="none" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={circumference - dash}
                transform="rotate(-90 110 110)" style={{ transition: "stroke-dashoffset 900ms ease-out" }}
              />
              <circle cx="110" cy="110" r="62" fill="rgba(251,191,36,0.08)" />
              <text x="110" y="110" textAnchor="middle" dominantBaseline="central" style={{ fontWeight: 800, fontSize: 34 }} className="fill-amber-400">
                {pct}%
              </text>
            </svg>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes grow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes fall {
          0% { transform: translateY(-20%) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(120vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
