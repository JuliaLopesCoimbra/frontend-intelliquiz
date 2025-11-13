"use client";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { user, logout } = useApp();

  // ✅ Corrige o erro de tipo: garante comparação segura
  const isClient = !!user && String(user.role) === "client";

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        
        {/* LOGO + TEXTO */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"     // <-- coloque o caminho da sua logo aqui
            alt="Logo"
            width={50}
            height={50}
            className="rounded-md" // tire se não quiser bordas arredondadas
            priority
          />
          <span className="text-xl font-semibold text-amber-300">
            IntelliQuiz
          </span>
        </Link>

        {/* NAV */}
        <nav className="flex items-center gap-3">
         
          {isClient && (
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
            <Button variant="outline" className="text-black" onClick={logout}>
              Sair
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
