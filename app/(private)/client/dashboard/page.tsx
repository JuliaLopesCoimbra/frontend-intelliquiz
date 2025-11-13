// app/(public)/client/dashboard/page.tsx (ou onde está seu DashboardPage)
"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { logout } from "@/lib/auth.client";

import { useAuthMe } from "@/app/hooks/useAuthMe";
import { useMyQuizzes } from "@/app/hooks/useMyQuizzes";
import { useQuizzes } from "@/app/hooks/useQuizzes";
import { useMyGames } from "@/app/hooks/useMyGames";
import { useHomepage } from "@/app/hooks/useHomepage";

import { TabsNav } from "@/components/dashboard/TabsNav";
import { UserChip } from "@/components/dashboard/UserChip";
import { MyQuizzesCard } from "@/components/dashboard/MyQuizzesCard";
import { AvailableQuizzesCard } from "@/components/dashboard/AvailableQuizzesCard";
import { GameHistoryCard } from "@/components/dashboard/MyGamesCard";
import { HomepageMiniDashboard } from "@/components/dashboard/HomepageMiniDashboard";
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

  // paginação da lista geral
  const [page, setPage] = useState(0);
  const limit = 9;
  // paginação dos MEUS quizzes
  const [myPage, setMyPage] = useState(0);
  const myLimit = 6;
  const { checking, me, loadingMe } = useAuthMe();
  const canFetchLists = !checking && !loadingMe && !!me;
const {
    loading: loadingHomepage,
    error: homepageError,
    data: homepageData,
  } = useHomepage(canFetchLists && active === "meus");
  const {
  loadingMy,
  myError,
  myQuizzes,
  maxPage: myMaxPage, // zero-based também
} = useMyQuizzes(search, {
  enabled: canFetchLists && active === "meus",
  page: myPage,
  limit: myLimit,
});


  const {
    loadingQuizzes,
    fetchError,
    quizzes,
    maxPage, // zero-based
  } = useQuizzes(search, { enabled: canFetchLists, page, limit });
const [pageGames, setPageGames] = useState(0);
const gamesLimit = 9;
 const {
  loadingGames,
  gamesError,
  games,
  summary,
  maxPage: gamesMaxPage,
} = useMyGames({ enabled: canFetchLists && active === "historico", page: pageGames, limit: gamesLimit });

  const refreshHistory = useCallback(() => {
    setActive((a) => (a === "historico" ? "meus" : "historico"));
    setTimeout(() => setActive("historico"), 0);
  }, []);

  if (checking) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="flex h-[40vh] items-center justify-center text-neutral-400">
          Verificando sessão...
        </div>
      </main>
    );
  }

  const hasPrev = page > 0;
  const hasNext = page < (maxPage ?? 0);

  return (
    <main className="mx-auto max-w-6xl p-6">
      {/* BG */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          style={{
            background: `
              repeating-conic-gradient(
                from 45deg,
                rgba(251,191,36,0.10) 0deg 12deg,
                rgba(0,0,0,1) 12deg 24deg
              )
            `,
            filter: "blur(4px)",
            opacity: 0.15,
          }}
          className="absolute inset-0"
        />
      </div>

      {/* Top bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <UserChip me={me} loading={loadingMe} />

        <div className="flex w-full items-center gap-3 sm:w-auto sm:flex-1 sm:justify-end">
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }} // reset page ao pesquisar
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

            
      {active === "meus" && (
        <>
        
          <HomepageMiniDashboard
            loading={loadingHomepage}
            error={homepageError}
            data={homepageData}
          />

          <MyQuizzesCard
            loading={loadingMy}
            error={myError}
            quizzes={myQuizzes}
          />
              {/* Paginação dos MEUS quizzes */}
    <div className="mt-4 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => setMyPage((p) => Math.max(p - 1, 0))}
        disabled={myPage <= 0}
        className={`rounded-md border px-3 py-2 text-sm ${
          myPage > 0
            ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
            : "pointer-events-none border-neutral-800 text-neutral-600"
        }`}
      >
        ← Anterior
      </button>

      <span className="text-xs text-neutral-400">
        Página {myPage + 1} de {Number(myMaxPage ?? 0) + 1}
      </span>

      <button
        type="button"
        onClick={() =>
          setMyPage((p) => (myPage < (myMaxPage ?? 0) ? p + 1 : p))
        }
        disabled={myPage >= (myMaxPage ?? 0)}
        className={`rounded-md border px-3 py-2 text-sm ${
          myPage < (myMaxPage ?? 0)
            ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
            : "pointer-events-none border-neutral-800 text-neutral-600"
        }`}
      >
        Próxima →
      </button>
    </div>
        </>
      )}


    {active === "historico" && (
  <GameHistoryCard
    loading={loadingGames}
    error={gamesError}
    games={games}
    onRefresh={refreshHistory}
    page={pageGames}
    maxPage={gamesMaxPage}
    onPageChange={setPageGames}
  />
)}

      <SectionDivider label="Explorar novos quizzes" />

      {/* Lista geral (API real) */}
      <AvailableQuizzesCard
        loading={loadingQuizzes}
        error={fetchError}
        quizzes={quizzes}
      />

      {/* Paginação da lista geral */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={!hasPrev}
          className={`rounded-md border px-3 py-2 text-sm ${
            hasPrev
              ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
              : "pointer-events-none border-neutral-800 text-neutral-600"
          }`}
        >
          ← Anterior
        </button>

        <span className="text-xs text-neutral-400">
          Página {page + 1} de {Number(maxPage ?? 0) + 1}
        </span>

        <button
          type="button"
          onClick={() => setPage((p) => (hasNext ? p + 1 : p))}
          disabled={!hasNext}
          className={`rounded-md border px-3 py-2 text-sm ${
            hasNext
              ? "border-neutral-700 text-neutral-200 hover:bg-neutral-800"
              : "pointer-events-none border-neutral-800 text-neutral-600"
          }`}
        >
          Próxima →
        </button>
      </div>
    </main>
  );
}
