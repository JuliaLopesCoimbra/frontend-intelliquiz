"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-black/60 backdrop-blur mt-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
        <p className="text-sm text-neutral-400">
          © {new Date().getFullYear()} IntelliQuiz. Todos os direitos reservados.
        </p>
        <nav className="flex gap-4">
          <Link
            href="/about"
            className="text-sm text-neutral-300 hover:text-amber-300"
          >
            Sobre
          </Link>
          <Link
            href="/terms"
            className="text-sm text-neutral-300 hover:text-amber-300"
          >
            Termos
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-neutral-300 hover:text-amber-300"
          >
            Privacidade
          </Link>
          <Link
            href="/contact"
            className="text-sm text-neutral-300 hover:text-amber-300"
          >
            Contato
          </Link>
        </nav>
      </div>
    </footer>
  );
}
