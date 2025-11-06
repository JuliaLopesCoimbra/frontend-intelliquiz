import { create } from "zustand";
import { Quiz, User, LeaderboardEntry } from "./types";
export type Role = "user" | "client" | "admin"; 

export interface AppUser {
  id: string;
  name: string;
  role: Role; 
  
}
type State = {
  user: User | null;
  quizzes: Quiz[];
  leaderboard: Record<string, LeaderboardEntry[]>;
};

type Actions = {
  login: (u: User) => void;
  logout: () => void;
  setQuizzes: (q: Quiz[]) => void;
  upsertQuiz: (q: Quiz) => void;
  pushScore: (quizId: string, entry: LeaderboardEntry) => void;
};

export const useApp = create<State & Actions>((set) => ({
  user: null,
  quizzes: [],
  leaderboard: {},
  login: (u) => set({ user: u }),
  logout: () => set({ user: null }),
  setQuizzes: (q) => set({ quizzes: q }),
  upsertQuiz: (q) =>
    set((s) => ({
      quizzes: s.quizzes.some((x) => x.id === q.id)
        ? s.quizzes.map((x) => (x.id === q.id ? q : x))
        : [q, ...s.quizzes],
    })),
  pushScore: (id, e) =>
    set((s) => ({
      leaderboard: {
        ...s.leaderboard,
        [id]: [...(s.leaderboard[id] || []), e]
          .sort((a, b) => b.score - a.score || a.timeMs - b.timeMs)
          .slice(0, 100),
      },
    })),
}));
