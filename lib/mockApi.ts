// /lib/mockApi.ts
import { Quiz, LeaderboardEntry } from "./types";
import { MOCK_QUIZZES } from "./mockQuizzes";

const KEY_Q = "quiz.mocks";
const KEY_L = "quiz.leader";

const read = <T>(k: string, d: T) =>
  JSON.parse(globalThis.localStorage?.getItem(k) || "null") ?? d;

const write = (k: string, v: any) =>
  globalThis.localStorage?.setItem(k, JSON.stringify(v));

export const api = {
  // Usa mocks como fallback (funciona no SSR)
  listQuizzes: async (): Promise<Quiz[]> => read<Quiz[]>(KEY_Q, MOCK_QUIZZES),

  trending: async (): Promise<Quiz[]> =>
    (await api.listQuizzes())
      .filter((q) => q.status === "published")
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 12),

  createQuiz: async (q: Quiz) => {
    const all = await api.listQuizzes();
    write(KEY_Q, [q, ...all]);
    return q;
  },

  saveQuiz: async (q: Quiz) => {
    const all = await api.listQuizzes();
    write(
      KEY_Q,
      all.map((x) => (x.id === q.id ? q : x))
    );
    return q;
  },

  bySlug: async (slug: string) =>
    (await api.listQuizzes()).find((q) => q.slug === slug),

  addPlay: async (id: string) => {
    const all = await api.listQuizzes();
    write(
      KEY_Q,
      all.map((q) => (q.id === id ? { ...q, plays: q.plays + 1 } : q))
    );
  },

  leaderboard: async (id: string) =>
    read<Record<string, LeaderboardEntry[]>>(KEY_L, {})[id] || [],

  pushScore: async (id: string, e: LeaderboardEntry) => {
    const L = read<Record<string, LeaderboardEntry[]>>(KEY_L, {});
    const arr = [...(L[id] || []), e]
      .sort((a, b) => b.score - a.score || a.timeMs - b.timeMs)
      .slice(0, 100);
    write(KEY_L, { ...L, [id]: arr });
    return arr;
  },

  // opcional: popular o localStorage no cliente
  seedIfEmpty: () => {
    if (typeof window === "undefined") return;
    const exists = window.localStorage.getItem(KEY_Q);
    if (!exists) {
      window.localStorage.setItem(KEY_Q, JSON.stringify(MOCK_QUIZZES));
    }
  },
};
