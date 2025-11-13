/** Tabs existentes */
export type Tab = "meus" | "historico";

/** Tipos vindos da API real */
export type ApiQuiz = {
  id: string;
  name: string;
  category_id: string;
  created_by: string;
};

export type MyQuizApi = {
  id: string;
  name: string;
  category_id: string;
  category: { id: string; name: string };
  created_by: string;
  user: { id: string; username: string; name?: string };
  likes: number;
  curator_pick: boolean;
  games_played: number;
  created_at: string;
  updated_at: string;
};

export type EnrichedQuiz = MyQuizApi & {
  categoryName: string;
  authorName: string;
};

export type Me = {
  id: string;
  username: string;
  email: string;
  name?: string;
};
