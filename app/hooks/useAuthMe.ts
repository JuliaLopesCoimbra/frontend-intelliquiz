"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { httpRetry } from "@/lib/http-retry";
import { getUserToken } from "@/lib/auth.client";
import type { Me } from "./quiz";

export function useAuthMe() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // Lê o token uma única vez por montagem
  const token = useMemo(() => getUserToken(), []);

  // Redireciona se não houver token
  useEffect(() => {
    if (!token) {
      router.replace("/login?next=/client/dashboard");
    }
    setChecking(false);
  }, [router, token]);

  // SWR dedupa chamadas entre múltiplos componentes (header + página)
  const { data, error, isLoading } = useSWR(
    token ? ["/me", token] : null,
    ([url, t]) => httpRetry<{ data?: Me }>(url, { headers: { Authorization: `Bearer ${t}` } }),
    {
      dedupingInterval: 3000,       // 3s sem repetir a mesma GET
      revalidateOnFocus: false,     // não refaz ao focar janela
      shouldRetryOnError: false,    // sem loop de retry aqui (httpRetry já trata 429)
    }
  );

  // Unwrap compatível com { data: ... } ou payload plano
  const me: Me | null = (data as any)?.data ?? (data as any) ?? null;

  // Se o backend devolver 401/403, envia pro login
  useEffect(() => {
    const status = (error as any)?.status || (error as any)?.response?.status;
    if (status === 401 || status === 403) {
      router.replace("/login?next=/client/dashboard");
    }
  }, [error, router]);

  return {
    checking,          // só controla o primeiro check do token
    me,
    loadingMe: isLoading,
  };
}
