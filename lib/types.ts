export type Role = "user" | "client";
export type Question = {
  id: string;
  text: string;
  choices: { id: string; text: string; correct?: boolean }[];
  explanation?: string;
  timeLimitSec?: number;
};
export type Quiz = {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty?: "easy" | "medium" | "hard";
  cover?: string;
  questions: Question[];
  status: "draft" | "published";
  plays: number;
  creatorId: string;
  createdAt: string;
};
export type LeaderboardEntry = {
  user: string;
  score: number;
  timeMs: number;
  date: string;
};
export type User = {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
  token?: string;
};
