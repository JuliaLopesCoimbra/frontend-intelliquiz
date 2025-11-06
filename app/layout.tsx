import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IntelliQuiz - Plataforma de Criação de Quizzes com IA",
   icons: {
    icon: "/logo.png", // ou pode ser .png, .svg etc.
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" >
      <body style={{
 background: "linear-gradient(145deg, #0a0a0a 0%, #111111 50%, #0e0e0e 100%)"

  }} className="min-h-screen text-white ">{children}</body>
    </html>
  );
}
