"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

function CreateSuccessInner() {
  const router = useRouter();
  const params = useSearchParams();

  const title = params.get("title") || "Seu quiz";
  const slug = params.get("slug") || "";
  const id = params.get("id") || "";

  // soltar confete 1x
  useEffect(() => {
    let mounted = true;
    (async () => {
      // @ts-expect-error - canvas-confetti has no type declarations neste projeto
      const confetti = (await import("canvas-confetti")).default as any;
      if (!mounted) return;
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      setTimeout(
        () =>
          confetti({
            particleCount: 60,
            spread: 80,
            origin: { y: 0.6 },
          }),
        350
      );
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // redirecionar automático após 3.5s
  useEffect(() => {
    const t = setTimeout(() => router.replace("/client/dashboard"), 3500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
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
      <div className="relative w-full max-w-xl">
        {/* Glow Amber em volta do card */}
        <div
          aria-hidden="true"
          className="absolute -inset-6 z-0 rounded-[28px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 opacity-60 blur-3xl"
        />

        <div className="relative z-10 rounded-[26px] p-[2px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400">
          <Card className="w-full max-w-xl bg-neutral-950/90 border-neutral-800 text-neutral-100 backdrop-blur rounded-2xl">
            <CardContent className="p-10">
              <div className="flex flex-col items-center text-center gap-6">
                {/* Ícone com animação */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  className="grid place-items-center h-20 w-20 rounded-full bg-emerald-500/20 border border-emerald-400/40"
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    className="text-emerald-400"
                  >
                    <path
                      fill="currentColor"
                      d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"
                    />
                  </svg>
                </motion.div>

                {/* Título maior */}
                <motion.h1
                  initial={{ y: 6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05 }}
                  className="text-3xl md:text-4xl font-bold"
                >
                  Quiz criado com sucesso!
                </motion.h1>

                {/* Subtítulo */}
                <p className="text-neutral-300 text-lg">
                  <span className="text-neutral-200 font-semibold">
                    {title}
                  </span>{" "}
                  foi salvo.
                </p>

                {/* Ações */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                  {slug ? (
                    <Button
                      onClick={() => router.push(`/quiz/${slug}`)}
                      className="h-14 px-8 text-lg font-semibold bg-amber-400 text-black hover:bg-amber-300 rounded-xl shadow-[0_0_20px_#fbbf24]"
                    >
                      Ver quiz agora 🚀
                    </Button>
                  ) : (
                    <Button
                      onClick={() => router.push(`/client/dashboard`)}
                      className="h-14 px-8 text-lg font-semibold bg-amber-400 text-black hover:bg-amber-300 rounded-xl shadow-[0_0_20px_#fbbf24]"
                    >
                      Ir para o dashboard
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => router.push(`/client/create`)}
                    className="h-14 px-8 text-lg font-semibold border-neutral-600 text-neutral-100 hover:bg-neutral-800 rounded-xl"
                  >
                    Criar outro
                  </Button>
                </div>

                <p className="text-sm text-neutral-500 mt-3">
                  Você será redirecionado automaticamente em instantes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

export default function CreateSuccess() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="text-neutral-200 text-lg">
            Carregando resultado do quiz...
          </div>
        </main>
      }
    >
      <CreateSuccessInner />
    </Suspense>
  );
}
