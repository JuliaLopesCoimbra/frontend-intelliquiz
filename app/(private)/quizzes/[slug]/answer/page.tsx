// app/quizzes/[slug]/answer/page.tsx
"use client";

import { useParams } from "next/navigation";
import QuizResponderClient from "./QuizResponderClient";

export default function Page() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return null;
  return <QuizResponderClient quizId={slug} />;
}
