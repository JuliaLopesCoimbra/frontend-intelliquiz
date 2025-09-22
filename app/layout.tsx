import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QuizLab",
  description: "Quizzes grátis e criação",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body className="min-h-screen bg-black text-white">{children}</body>
    </html>
  );
}
