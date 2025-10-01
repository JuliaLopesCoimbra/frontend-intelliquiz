import type { Quiz } from "./types";

export const MOCK_QUIZZES: Quiz[] = [
  {
    id: "mock-1",
    slug: "musica-brasileira-anos-2000",
    title: "Música Brasileira – Anos 2000",
    category: "Música",
    cover:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop",
    plays: 1243,
    status: "published",
    questions: [],
    creatorId: "user-1",
    createdAt: "2023-01-01T10:00:00Z",
  },
  {
    id: "mock-2",
    slug: "classicos-do-cinema",
    title: "Clássicos do Cinema",
    category: "Filmes",
    cover:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop",
    plays: 987,
    status: "published",
    questions: [],
    creatorId: "user-2",
    createdAt:"2023-02-01T10:00:00Z",
  },
  {
    id: "mock-3",
    slug: "futebol-brasileiro",
    title: "Futebol Brasileiro",
    category: "Esportes",
    cover:
      "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=1200&auto=format&fit=crop",
    plays: 1580,
    status: "published",
    questions: [],
    creatorId: "user-3",
    createdAt: "2023-03-01T10:00:00Z",
  },
];