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
import {
  Gamepad2,
  ClipboardList,
  Trophy,
  Users,
  CheckCircle2,
} from "lucide-react";
import clsx from "clsx";

import type { Role } from "@/lib/types"; // <<< usa o mesmo tipo da store

type QuizMode = "responder" | "criador";

export default function SignUp() {
  const [step, setStep] = useState<"role" | "form">("role");
  const [mode, setMode] = useState<QuizMode | null>(null); // <<< separado do Role da store
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // Se você quiser já criar o usuário com um Role válido da store:
  // escolha um default (ex.: "user") ou pergunte em outro passo.
  const roleForStore: Role = "user";

  const { login } = useApp();
  const router = useRouter();

  const canSubmit =
    nome.trim() &&
    sobrenome.trim() &&
    cpf.trim() &&
    email.trim() &&
    senha.trim() &&
    mode;

  const submit = () => {
    if (!canSubmit || !mode) return;

    login({
      id: crypto.randomUUID(),
      name: `${nome} ${sobrenome}`,
      role: roleForStore, 
    });

    if (mode === "responder") {
      router.push("/user/dashboard");
    } else {
      router.push("/client/dashboard");
    }
  };

  return (
    <>
      <Header />
      <div className="relative min-h-[88vh] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
        <main className="mx-auto grid max-w-[150vh] place-items-center px-4 py-10"
        //  style={{border:"solid 1px red"}}
         >
          <Card className="w-full border-neutral-800/80 bg-neutral-950/70 backdrop-blur-md shadow-2xl shadow-black/40">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold tracking-tight text-amber-400">
                Criar Conta
              </CardTitle>
              <p className="mt-1 text-sm text-neutral-400">
                Escolha como deseja participar.
              </p>
            </CardHeader>
            {/* Voltar para login */}
<div className="px-6 -mt-2 mb-1">
  <button
    type="button"
    onClick={() => router.push("/login")} // ou router.back()
    className="inline-flex items-center gap-2 text-sm rounded-lg text-neutral-300 hover:text-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
    aria-label="Voltar para a tela de login"
  >
    <ArrowLeft className="h-4 w-4" />
    <span>Voltar ao login</span>
  </button>
</div>


            <CardContent className="space-y-6">
              {step === "role" && (
                <div className="space-y-1">
                  <Label className="text-base">
                    Como você quer participar?
                  </Label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        key: "responder" as QuizMode,
                        title: "Responder Quizzes",
                        subtitle:
                          "Entre, jogue e se divirta respondendo quizzes.",
                        icon: Gamepad2,
                        points: [
                          "Perfil de usuário participante",
                          "Responde quizzes temáticos",
                          "Pontuação em tempo real",
                          "Aparece no ranking",
                        ],
                      },
                      {
                        key: "criador" as QuizMode,
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
                      const active = mode === opt.key;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setMode(opt.key);
                            setStep("form");
                          }}
                          aria-pressed={active}
                          className={clsx(
                            "group relative w-full rounded-2xl border p-4 text-left transition-all",
                            "bg-neutral-900/70 backdrop-blur",
                            active
                              ? "border-amber-400 ring-2 ring-amber-400/40"
                              : "border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/90"
                          )}
                        >
                          {/* Header */}
                          <div className="flex items-center gap-3">
                            <div
                              className={clsx(
                                "rounded-xl p-2 transition-all",
                                active
                                  ? "bg-amber-400 text-black"
                                  : "bg-neutral-800 text-neutral-200"
                              )}
                            >
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-lg font-semibold text-neutral-100">
                                {opt.title}
                              </div>
                              <div className="text-xs text-neutral-400">
                                {opt.subtitle}
                              </div>
                            </div>
                            {active && (
                              <CheckCircle2 className="ml-auto h-5 w-5 text-amber-400" />
                            )}
                          </div>

                          {/* Bullets */}
                          <ul className="mt-3 space-y-1.5 text-sm text-neutral-300">
                            {opt.points.map((p) => (
                              <li key={p} className="flex items-start gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current/80" />
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Rodapé pequeno com reforço */}
                          <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
                            {opt.key === "responder" ? (
                              <>
                                <Trophy className="h-4 w-4" />
                                <span>Valendo pontos e ranking</span>
                              </>
                            ) : (
                              <>
                                <Users className="h-4 w-4" />
                                <span>Veja quem participa e como pontua</span>
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-neutral-500">
                    Você pode alterar sua escolha depois nas configurações.
                  </p>
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
    <Label htmlFor="cpf" className="text-sm font-medium text-neutral-200">
      CPF
    </Label>
    <Input
      id="cpf"
      inputMode="numeric"
      maxLength={14}
      placeholder="000.000.000-00"
      className="h-12 bg-neutral-800/50 border-neutral-700 text-neutral-100 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      value={cpf}
      onChange={(e) => setCpf(e.target.value)}
    />
    <p className="text-xs text-neutral-400">Use apenas números (formatação opcional).</p>
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

  <Button
    className="h-12 w-full rounded-xl text-lg font-semibold bg-amber-400 text-black hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:opacity-60 disabled:cursor-not-allowed"
    onClick={submit}
    disabled={!canSubmit}
  >
    Criar Conta
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
