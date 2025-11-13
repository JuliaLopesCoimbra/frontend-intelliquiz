"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import type { Role } from "@/lib/types";
import { http } from "@/lib/http";
import { setUserToken, setRefreshToken } from "../../../lib/auth.client";

// Tipos mínimos para o payload/response do /login
type LoginPayload = {
  username: string;
  password: string;
};

// Ajuste conforme seu backend; aqui uso o shape que você mostrou no signup.
type LoginResponse = {
  statusCode: number;
  success: boolean;
  data?: {
    token: string;
    refreshToken?: string;
    user?: { id: string; name: string; role?: Role };
  };
  // Em caso de erro o backend pode retornar {message: "..."}:
  message?: string;
};

function LoginInner() {
  const [emailOrUsername, setEmailOrUsername] = useState(""); // permite digitar email ou username
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const { login } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextUrl = useMemo(
    () => searchParams.get("next") || "/client/dashboard",
    [searchParams]
  );

  const canSubmit =
    emailOrUsername.trim().length > 0 && senha.trim().length > 0;

  // Deriva username quando o usuário digita email (caso ele informe email).
  function deriveUsername(input: string) {
    if (!input.includes("@")) return input.trim(); // já é username
    const left = input.split("@")[0] || "";
    return (
      left
        .replace(/[^a-zA-Z0-9_.-]/g, "")
        .replace(/\.+/g, ".")
        .slice(0, 24) || "user"
    );
  }

  async function submit() {
    if (!canSubmit || loading) return;
    setErrMsg(null);
    setLoading(true);

    const payload: LoginPayload = {
      username: deriveUsername(emailOrUsername),
      password: senha,
    };

    try {
      // 1) chama seu backend
      const res = await http<LoginResponse>("/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const token = res?.data?.token;
      const refreshToken = res?.data?.refreshToken;
      if (token) setUserToken(token);
      if (refreshToken) setRefreshToken(refreshToken);
      if (!token) {
        // tenta ler mensagem amigável
        const msg =
          res?.message || "Falha no login. Verifique suas credenciais.";
        throw new Error(msg);
      }

      // 3) atualiza sua store com info não sensível (id/nome/role)
      const name =
        res?.data?.user?.name ?? emailOrUsername.split("@")[0] ?? "Usuário";
      const role: Role = (res?.data?.user?.role as Role) ?? "user";

      login({
        id: res?.data?.user?.id ?? "me",
        name,
        role,
      });

      // 4) redireciona — se veio de proteção, honramos ?next=
      router.replace(nextUrl);
    } catch (err: any) {
      const map: Record<string, string> = {
        invalid_credentials: "Credenciais inválidas.",
        user_not_found: "Usuário não encontrado.",
        account_locked: "Conta bloqueada. Tente novamente mais tarde.",
      };
      const msg = String(err?.message || "Erro ao entrar.");
      setErrMsg(map[msg] || msg);
    } finally {
      setLoading(false);
    }
  }

  // submit com Enter
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && canSubmit && !loading) {
      e.preventDefault();
      submit();
    }
  }

  const goToRegister = () => router.push("/signup");

  return (
    <>
      <Header />
      <div className="relative min-h-[88vh]">
        <main className="mx-auto grid max-w-md place-items-center px-4 py-10 text-white">
          <Card className="w-full border-neutral-800/80 bg-neutral-950/10">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold tracking-tight text-amber-300">
                Entrar
              </CardTitle>
              <p className="mt-1 text-sm text-neutral-400">
                Acesse sua conta para continuar.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-base text-white">
                  E-mail ou usuário
                </Label>
                <Input
                  type="text"
                  placeholder="voce@exemplo.com ou johndoe"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  onKeyDown={onKeyDown}
                  className="h-12 text-white text-lg placeholder:text-neutral-500"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base text-white">Senha</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyDown={onKeyDown}
                  className="h-12 text-white text-lg placeholder:text-neutral-500"
                  autoComplete="current-password"
                />
              </div>

              {errMsg && <p className="text-sm text-red-400">{errMsg}</p>}

              <div className="space-y-3 pt-2">
                <Button
                  className="h-12 w-full rounded-xl text-lg font-semibold bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-50"
                  onClick={submit}
                  disabled={!canSubmit || loading}
                >
                  {loading ? "Entrando..." : "Continuar"}
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

export default function Login() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4">
          <div className="text-neutral-200 text-lg">
            Carregando tela de login...
          </div>
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
