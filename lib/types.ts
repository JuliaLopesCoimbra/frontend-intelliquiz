export type Role = "user";
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

  
  description?: string;
  imageUrl?: string;

  likes: number;
  games: number;

  
  difficulty?: "easy" | "medium" | "hard";
  cover?: string;
  questions?: Question[];
  status?: "draft" | "published";
  plays?: number;
  creatorId?: string;
  createdAt?: string;
  author?: string;
  play?: string;
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
