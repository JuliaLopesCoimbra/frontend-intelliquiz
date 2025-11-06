"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { logout } from "@/lib/auth.client";

import { useAuthMe } from "@/app/hooks/useAuthMe";
import { useMyQuizzes } from "@/app/hooks/useMyQuizzes";
import { useQuizzes } from "@/app/hooks/useQuizzes";

import { TabsNav } from "@/components/dashboard/TabsNav";
import { UserChip } from "@/components/dashboard/UserChip";
import { MyQuizzesCard } from "@/components/dashboard/MyQuizzesCard";
import { AvailableQuizzesCard } from "@/components/dashboard/AvailableQuizzesCard";

import type { Tab } from "@/app/hooks/quiz";

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="my-8 flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
      <span className="select-none rounded-full border border-neutral-800 bg-neutral-900/70 px-3 py-1 text-xs text-neutral-300">
        {label}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [active, setActive] = useState<Tab>("meus");
  const [search, setSearch] = useState("");

  const { checking, me, loadingMe } = useAuthMe();
  // Evita montar os outros hooks enquanto valida sessão e /me
const canFetchLists = !checking && !loadingMe && !!me;
const { loadingMy, myError, myQuizzes } = useMyQuizzes(search, { enabled: canFetchLists });
const { loadingQuizzes, fetchError, quizzes } = useQuizzes(search, { enabled: canFetchLists });
  
  if (checking) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="flex h-[40vh] items-center justify-center text-neutral-400">
          Verificando sessão...
        </div>
      </main>
    );
    }

  return (
    <main className="mx-auto max-w-6xl p-6"
  >
      {/* Top bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <UserChip me={me} loading={loadingMe} />

        <div className="flex w-full items-center gap-3 sm:w-auto sm:flex-1 sm:justify-end">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar quizzes (nome, categoria, autor)"
            className="h-11 sm:max-w-md"
          />
          <Link href="/client/create">
            <Button className="h-11 bg-amber-400 text-black hover:bg-amber-300">
              Novo Quiz
            </Button>
          </Link>
          <Button
            variant="outline"
            className="h-11 border-neutral-700 text-black"
            onClick={() => logout(router)}
            title="Sair"
          >
            Sair
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <TabsNav active={active} onChange={setActive} />

      {/* Conteúdo de cada aba */}
      {active === "meus" && (
        <MyQuizzesCard loading={loadingMy} error={myError} quizzes={myQuizzes} />
      )}

      {active === "favoritos" && (
        <Card className="border-neutral-800 mt-6">
          <CardHeader>
            <CardTitle>Favoritos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-400">Ainda não há quizzes favoritados.</p>
          </CardContent>
        </Card>
      )}

      {active === "historico" && (
        <Card className="border-neutral-800 mt-6">
          <CardHeader>
            <CardTitle>Histórico de Quizzes Respondidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-400">Você ainda não respondeu a nenhum quiz.</p>
          </CardContent>
        </Card>
      )}
      <SectionDivider label="Explorar novos quizzes" />

      {/* Lista geral (API real) */}
      <AvailableQuizzesCard
        loading={loadingQuizzes}
        error={fetchError}
        quizzes={quizzes}
      />
    </main>
  );
}
