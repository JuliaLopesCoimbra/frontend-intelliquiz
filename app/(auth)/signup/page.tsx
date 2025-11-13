"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import { Gamepad2, ClipboardList } from "lucide-react";
import { setUserToken, clearUserToken, setRefreshToken, clearRefreshToken } from "@/lib/http-retry"; // <-- mude o import

import clsx from "clsx";

import type { Role } from "@/lib/types";
import { http } from "@/lib/http";
import type { SignUpPayload, SignUpResponse } from "@/lib/auth.types";

export default function SignUp() {
  const [step, setStep] = useState<"role" | "form">("role");
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const roleForStore: Role = "user";
  const { login } = useApp();
  const router = useRouter();

  const canSubmit = Boolean(
    nome.trim() && sobrenome.trim() && email.trim() && senha.trim()
  );

  // transforma "john.smith+abc@gmail.com" em "johnsmith"
  function deriveUsernameFromEmail(e: string) {
    const left = e.split("@")[0] || "";
    return left.replace(/[^a-zA-Z0-9_.-]/g, "").replace(/\.+/g, ".").slice(0, 24) || "user";
  }

async function submit() {
  if (!canSubmit || loading) return;
  setErrMsg(null);
  setLoading(true);

  const payload: SignUpPayload = {
    email: email.trim().toLowerCase(),
    name: `${nome.trim()} ${sobrenome.trim()}`.trim(),
    password: senha,
    username: deriveUsernameFromEmail(email),
  };

  try {
    // 0) Limpa sessão/tokens antigos (client + server)
    try { clearUserToken(); } catch {}
    try { clearRefreshToken(); } catch {}
    try {
      await fetch("/api/auth/clear", {
        method: "POST",
        // nada de headers extras aqui
        credentials: "include",
        cache: "no-store",
      });
    } catch {}

    // 1) Cria conta (deixe só Content-Type)
    const res = await http<any>("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // ❗ remova "Cache-Control" do request
      body: JSON.stringify(payload),
    });

    // suporta { data: { token, refreshToken, user } } ou direto
    const lvl1 = res?.data ?? res;
    const token: string | undefined = lvl1?.token;
    const refreshToken: string | undefined = lvl1?.refreshToken;
    if (!token) throw new Error("Token não retornado pelo servidor.");

    // 2) Guarda tokens no CLIENT (o que seus hooks usam)
    setUserToken(token);
    if (refreshToken) setRefreshToken(refreshToken);

    // 3) Tenta setar cookie httpOnly no SERVER (não quebre o fluxo se falhar)
    try {
      const setResp = await fetch("/api/auth/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // ❗ sem "Cache-Control"
        body: JSON.stringify({ token, refreshToken }),
        credentials: "include",
        cache: "no-store",
      });
      if (!setResp.ok) {
        const txt = await setResp.text().catch(() => "");
        console.warn(`/api/auth/set falhou (${setResp.status}):`, txt);
        // não lançar erro aqui — o client já está autenticado via localStorage
      }
    } catch (e) {
      console.warn("/api/auth/set erro:", e);
    }

    // 4) Atualiza store visual (dados não sensíveis)
    login({
      id: lvl1?.user?.id ?? lvl1?.id ?? "me",
      name: lvl1?.user?.name ?? lvl1?.name ?? `${nome} ${sobrenome}`,
      role: roleForStore,
    });

    // 5) Navega e força revalidação
    router.replace("/client/dashboard");
    router.refresh();
    // Se ainda ver sessão antiga por cache agressivo:
    // window.location.assign("/client/dashboard");
  } catch (err: any) {
    const map: Record<string, string> = {
      email_already_in_use: "Este e-mail já está em uso.",
      username_taken: "Este nome de usuário já está em uso.",
      weak_password: "A senha não atende os requisitos mínimos.",
    };
    const msg = String(err?.message || "Erro ao criar conta.");
    setErrMsg(map[msg] || msg);
  } finally {
    setLoading(false);
  }
}

  return (
    <>
      <Header />
      <div className="relative min-h-[88vh]  ">
        <main className="mx-auto grid max-w-[150vh] place-items-center px-4 py-10">
          <Card className="w-full border-neutral-800/80 bg-neutral-950/10 ">
            <div className="px-6 -mt-2 mb-1">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="inline-flex items-center gap-2 text-sm rounded-lg text-neutral-300 hover:text-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                aria-label="Voltar para a tela de login"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao login</span>
              </button>
            </div>

            <CardHeader>
              <CardTitle className="text-3xl font-semibold tracking-tight text-amber-400">
                Criar Conta
              </CardTitle>
              <p className="mt-1 text-sm text-neutral-400">
                Aqui você pode:
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {step === "role" && (
                <div className="space-y-1">
                  <Label className="text-base text-white">Como você quer participar?</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        title: "Responder Quizzes",
                        subtitle: "Entre, jogue e se divirta respondendo quizzes.",
                        icon: Gamepad2,
                        points: [
                          "Perfil de usuário participante",
                          "Responde quizzes temáticos",
                          "Pontuação em tempo real",
                          "Aparece no ranking",
                        ],
                      },
                      {
                        title: "Criar Quizzes",
                        subtitle:
                          "Crie quizzes sobre temas que você domina e acompanhe resultados.",
                        icon: ClipboardList,
                        points: [
                          "Cria e gerencia quizzes",
                          "Vê participantes e respostas",
                          "Pontuação, ranking e métricas",
                          "Atualiza temas e perguntas",
                        ],
                      },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.title}
                          type="button"
                          className={clsx(
                            "group relative w-full rounded-2xl border p-4 text-left transition-all",
                            "bg-neutral-900/70 backdrop-blur"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl p-2 transition-all">
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-lg font-semibold text-neutral-100">
                                {opt.title}
                              </div>
                              <div className="text-xs text-neutral-400">
                                {opt.subtitle}
                              </div>
                            </div>
                          </div>

                          <ul className="mt-3 space-y-1.5 text-sm text-neutral-300">
                            {opt.points.map((p) => (
                              <li key={p} className="flex items-start gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current/80" />
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 justify-end items-end flex">
                    <Button
                      onClick={() => setStep("form")}
                      className="h-12 w-[35vh] rounded-xl text-lg font-semibold bg-amber-400 text-black hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              )}

              {step === "form" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="nome" className="text-sm font-medium text-neutral-200">
                        Nome
                      </Label>
                      <Input
                        id="nome"
                        autoComplete="given-name"
                        placeholder="Seu nome"
                        className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="sobrenome" className="text-sm font-medium text-neutral-200">
                        Sobrenome
                      </Label>
                      <Input
                        id="sobrenome"
                        autoComplete="family-name"
                        placeholder="Seu sobrenome"
                        className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                        value={sobrenome}
                        onChange={(e) => setSobrenome(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-neutral-200">
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="voce@exemplo.com"
                      className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="senha" className="text-sm font-medium text-neutral-200">
                      Senha
                    </Label>
                    <Input
                      id="senha"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Mínimo de 8 caracteres"
                      className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                    />
                  </div>

                  {errMsg && (
                    <p className="text-sm text-red-400">{errMsg}</p>
                  )}

                  <Button
                    className="h-12 w-full rounded-xl text-lg font-semibold bg-amber-400 text-black hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={submit}
                    disabled={!canSubmit || loading}
                  >
                    {loading ? "Criando..." : "Criar Conta"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
