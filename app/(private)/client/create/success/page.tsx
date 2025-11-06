"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function CreateSuccess() {
  const router = useRouter();
  const params = useSearchParams();

  const title = params.get("title") || "Seu quiz";
  const slug = params.get("slug") || "";
  const id = params.get("id") || "";

  // soltar confete 1x
  useEffect(() => {
    let mounted = true;
    (async () => {
      // @ts-ignore - canvas-confetti has no type declarations in this project
      const confetti = (await import("canvas-confetti")).default as any;
      if (!mounted) return;
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } }), 350);
    })();
    return () => { mounted = false; };
  }, []);

  // redirecionar automático após 3.5s
  useEffect(() => {
    const t = setTimeout(() => router.replace("/client/dashboard"), 30500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* fundo sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 10% 10%, rgba(124,58,237,0.16), transparent 60%), radial-gradient(900px 500px at 90% 30%, rgba(34,211,238,0.12), transparent 60%), radial-gradient(800px 500px at 50% 85%, rgba(168,85,247,0.12), transparent 60%)",
        }}
      />

      <Card className="w-full max-w-xl bg-neutral-950/90 border-neutral-800 text-neutral-100 backdrop-blur">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center gap-4">

            {/* Ícone com animação */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="grid place-items-center h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-400/40"
            >
              <svg width="34" height="34" viewBox="0 0 24 24" className="text-emerald-400">
                <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
              </svg>
            </motion.div>

            <motion.h1
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="text-2xl font-semibold"
            >
              Quiz criado com sucesso!
            </motion.h1>

            <p className="text-neutral-400">
              <span className="text-neutral-200 font-medium">{title}</span> foi salvo.
            </p>

            {/* Ações */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {slug ? (
                <Button
                  onClick={() => router.push(`/quiz/${slug}`)}
                  className="h-11 bg-amber-400 text-black hover:bg-amber-300"
                >
                  Ver quiz agora
                </Button>
              ) : (
                <Button
                  onClick={() => router.push(`/client/dashboard`)}
                  className="h-11 bg-amber-400 text-black hover:bg-amber-300"
                >
                  Ir para o dashboard
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => router.push(`/client/create`)}
                className="h-11 border-neutral-700 text-black hover:bg-neutral-100"
              >
                Criar outro
              </Button>
            </div>

            <p className="text-xs text-neutral-500 mt-2">
              Você será redirecionado para o dashboard automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
