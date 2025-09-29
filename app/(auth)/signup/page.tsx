"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import clsx from "clsx";

type Role = "user" | "client";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<Role>("user");
  const { login } = useApp();
  const router = useRouter();

  const canSubmit = email.trim().length > 0 && senha.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;

    // Você pode validar senha no servidor. Aqui seguimos seu fluxo atual:
    const nameFromEmail = email.split("@")[0] || "Usuário";
    login({ id: crypto.randomUUID(), name: nameFromEmail, role });
    router.push("/");
  };

  const goToRegister = () => router.push("/register");

  return (
    <>
      <Header />
      {/* Fundo com leve gradiente e padrão */}
      <div className="relative min-h-[88vh] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
        <main className="mx-auto grid max-w-md place-items-center px-4 py-10">
          <Card className="w-full border-neutral-800/80 bg-neutral-950/70 backdrop-blur-md shadow-2xl shadow-black/40">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold tracking-tight text-amber-300">
                Entrar
              </CardTitle>
              <p className="mt-1 text-sm text-neutral-400">
                Acesse sua conta para continuar.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Toggle Bonito de Perfil */}
              <div className="space-y-2">
                <Label className="text-base">Perfil</Label>
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-1">
                  <div className="grid grid-cols-2 gap-1">
                    {(["user", "client"] as Role[]).map((opt) => {
                      const active = role === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setRole(opt)}
                          className={clsx(
                            "h-11 rounded-xl text-base font-medium transition-all",
                            active
                              ? "bg-amber-400 text-black shadow"
                              : "bg-transparent text-neutral-300 hover:bg-neutral-800"
                          )}
                          aria-pressed={active}
                        >
                          {opt === "user" ? "Usuário" : "Cliente"}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="text-xs text-neutral-500">
                  Troque o tipo de sessão conforme necessário.
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-base">E-mail</Label>
                <Input
                  type="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-lg placeholder:text-neutral-500"
                />
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label className="text-base">Senha</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="h-12 text-lg placeholder:text-neutral-500"
                />
              </div>

              {/* Ações */}
              <div className="space-y-3 pt-2">
                <Button
                  className="h-12 w-full rounded-xl text-lg font-semibold bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-50"
                  onClick={submit}
                  disabled={!canSubmit}
                >
                  Continuar
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-neutral-800" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-neutral-950/70 px-3 text-xs text-neutral-500">
                      ou
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="h-12 w-full rounded-xl bg-amber-300 border-neutral-700 text-lg text-black hover:bg-amber-400"
                  onClick={goToRegister}
                >
                  Cadastre-se
                </Button>
              </div>

              {/* Ajuda / lembretes */}
              <div className="pt-1 text-center text-sm text-neutral-500">
                Esqueceu a senha?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-amber-300 underline-offset-4 hover:underline"
                >
                  Recuperar acesso
                </button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
