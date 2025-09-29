"use client";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { user, logout } = useApp();
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-semibold text-amber-300">
          QuizLab
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-neutral-300 hover:text-amber-300"
          >
            Explorar
          </Link>
          <Link
            href="/leaderboard/global"
            className="text-sm text-neutral-300 hover:text-amber-300"
          >
            Leaderboard
          </Link>
          {user?.role === "client" && (
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="border-amber-400/40 text-amber-200 hover:bg-amber-400/10"
              >
                Criar Quizzes
              </Button>
            </Link>
          )}
          {!user ? (
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-amber-400 text-black hover:bg-amber-300">
                  Cadastrar
                </Button>
              </Link>
            </div>
          ) : (
            <Button variant="outline" onClick={logout}>
              Sair
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
