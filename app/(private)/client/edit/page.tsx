"use client";

import {
  useRef,
  useEffect,
  useMemo,
  useState,
  Suspense,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { httpRetry as http } from "@/lib/http-retry";
import { getUserToken } from "@/lib/auth.client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAuthMe } from "@/app/hooks/useAuthMe";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Category = { id: string; name: string };
type ApiChoice = { id: string; content: string; is_correct: boolean };
type ApiQuestion = { id: string; content: string; choices: ApiChoice[] };
type ApiQuiz = {
  id: string;
  name: string;
  category_id: string;
  category?: { id: string; name: string };
  questions: ApiQuestion[];
  image_url?: string;
};

function EditQuizInner() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const quizId = params.get("id") || "";

  const { me, loadingMe } = useAuthMe();

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [quizTitle, setQuizTitle] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imgTouched, setImgTouched] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const didFetchRef = useRef(false);

  // guarda next e checa sessão
  useEffect(() => {
    const t = getUserToken();
    if (!t) {
      const next = `${pathname}?${params.toString()}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setChecking(false);
  }, [pathname, params, router]);

  // carrega categorias + quiz
  useEffect(() => {
    if (checking) return;
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    (async () => {
      try {
        await Promise.all([loadCategories(), loadQuiz()]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);

  useEffect(() => {
    const found = categories.find((c) => c.id === categoryId);
    setCategoryName(found?.name ?? "");
  }, [categoryId, categories]);

  function isValidImageUrlStrict(str: string) {
    if (!str) return false;
    try {
      const u = new URL(str);
      if (!/^https?:$/.test(u.protocol)) return false;
      const path = u.pathname.toLowerCase();
      return /\.(jpg|jpeg|png|webp|gif)$/.test(path);
    } catch {
      return false;
    }
  }

  const isImageOk = !imageUrl ? true : isValidImageUrlStrict(imageUrl);

  async function loadCategories() {
    try {
      const token = getUserToken();
      const res = await http<{ data: Category[] }>("/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (err: any) {
      console.error("Erro ao carregar categorias:", err?.message || err);
    }
  }

  async function loadQuiz() {
    if (!quizId) return;
    try {
      const token = getUserToken();
      const res = await http<{ data: ApiQuiz }>(`/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const q = res.data;
      setQuizTitle(q.name || "");
      setCategoryId(q.category_id || q.category?.id || "");
      setImageUrl(q.image_url || "");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao carregar quiz.";
      setError(msg);
      console.error("GET /quizzes/{id} falhou:", err);
    } finally {
      setLoading(false);
    }
  }

  const validationError = useMemo(() => {
    if (!quizId) return "ID do quiz inválido.";
    if (!quizTitle.trim()) return "Título do quiz é obrigatório.";
    if (!categoryId) return "Categoria é obrigatória.";
    return null;
  }, [quizId, quizTitle, categoryId]);

  async function handleSaveAndContinue() {
    setError(null);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (imageUrl && !isValidImageUrlStrict(imageUrl)) {
      return setError(
        "Invalid image URL format. Image URL must end with .jpg, .jpeg, .png, .webp or .gif and be a valid URL."
      );
    }

    try {
      setSaving(true);
      const token = getUserToken();

      const payload: any = {
        name: quizTitle.trim(),
        category_id: categoryId,
      };
      if (imageUrl) payload.image_url = imageUrl;

      await http(`/quizzes/${quizId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      router.replace(
        `/client/edit/step2?quizId=${quizId}` +
          `&title=${encodeURIComponent(quizTitle)}` +
          `&category=${encodeURIComponent(categoryId)}` +
          `&categoryName=${encodeURIComponent(categoryName)}` +
          `&imageUrl=${encodeURIComponent(imageUrl || "")}`
      );
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      if (status === 401 || status === 403) {
        const next = `${pathname}?${params.toString()}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      setError(err?.message || "Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    setDeleteError(null);
    try {
      setDeleting(true);
      const token = getUserToken();
      await http(`/quizzes/${quizId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      router.replace("/client/dashboard");
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      if (status === 401 || status === 403) {
        const next = `${pathname}?${params.toString()}`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      setDeleteError(
        err?.response?.data?.message ||
          err?.message ||
          "Não foi possível excluir o quiz."
      );
      console.error("DELETE /quizzes/{id} falhou:", err);
    } finally {
      setDeleting(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-400">Verificando sessão...</p>
      </main>
    );
  }

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `
            repeating-conic-gradient(
              from 45deg,
              rgba(251,191,36,0.10) 0deg 12deg,
              rgba(0,0,0,1) 12deg 24deg
            )
          `,
          filter: "blur(4px)",
          opacity: 0.15,
        }}
      />

      {/* HEADER */}
      <header className="w-full p-4 flex items-center justify-between bg-neutral-950 border-b border-neutral-800">
        <button
          onClick={() => router.back()}
          className="text-neutral-300 hover:text-amber-400 transition-colors text-sm"
        >
          ⭠ Voltar
        </button>

        <div className="flex items-center gap-3">
          {/* Botão Excluir com modal */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="h-9"
                disabled={!quizId}
                title="Excluir quiz"
              >
                Excluir quiz
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-neutral-950 border border-neutral-800 text-neutral-200">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Tem certeza que deseja excluir?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-neutral-400">
                  Esta ação é irreversível. O quiz{" "}
                  <span className="text-neutral-100 font-medium">
                    {quizTitle || "sem título"}
                  </span>{" "}
                  e seus dados serão removidos permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {deleteError && (
                <p className="text-sm text-red-400 mb-2">{deleteError}</p>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel className="bg-neutral-900 border border-neutral-700 text-neutral-200 hover:bg-neutral-800">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-500 text-white"
                >
                  {deleting ? "Excluindo..." : "Sim, excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* usuário */}
          <span className="text-sm text-neutral-300">
            {loadingMe ? "Carregando..." : me?.username || "Usuário"}
          </span>
          <div className="h-9 w-9 rounded-full bg-neutral-700 overflow-hidden">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                me?.name || me?.username || "User"
              )}`}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mt-10 flex justify-center items-center px-4">
        <Card className="w-full max-w-lg bg-black border-neutral-800 text-neutral-100">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-400 font-semibold">
              Editar Quiz
            </CardTitle>
            <p className="text-sm text-neutral-400">
              Etapa 1 — Título & Categoria
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && <p className="text-sm text-red-400">{error}</p>}

            {/* Categoria */}
            <div className="space-y-2">
              <Label className="text-base">Categoria</Label>
              {loading ? (
                <p className="text-neutral-500 text-sm">
                  Carregando categorias…
                </p>
              ) : (
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full h-11 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-200 focus:ring-amber-400">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border border-neutral-700">
                    {categories.map((cat) => (
                      <SelectItem
                        key={cat.id}
                        value={cat.id}
                        className="text-neutral-200 focus:bg-amber-400/20 focus:text-amber-300"
                      >
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label className="text-base">Título do Quiz</Label>
              <Input
                placeholder="Ex: Quiz sobre História do Brasil"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="h-11 text-neutral-100 placeholder:text-neutral-500"
              />
            </div>

            {/* Link da imagem */}
            <div className="space-y-2">
              <Label className="text-base">Link da imagem (image_url)</Label>
              <Input
                type="url"
                placeholder="https://exemplo.com/banner.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onBlur={() => setImgTouched(true)}
                className="h-11 text-neutral-100 placeholder:text-neutral-500"
              />
              {imageUrl && imgTouched && !isImageOk && (
                <p className="text-sm text-red-400">
                  Invalid image URL format. Image URL must end with .jpg, .jpeg,
                  .png, .webp or .gif and be a valid URL.
                </p>
              )}

              {imageUrl && isImageOk && (
                <div className="mt-2 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900">
                  <img
                    src={imageUrl}
                    alt="Pré-visualização do quiz"
                    className="w-full h-40 object-cover"
                    onError={() => setImgTouched(true)}
                  />
                </div>
              )}
            </div>

            {/* Botão */}
            <Button
              onClick={handleSaveAndContinue}
              disabled={
                saving ||
                !!validationError ||
                (!!imageUrl && !isImageOk)
              }
              className="w-full h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-lg font-semibold disabled:opacity-40"
            >
              {saving ? "Salvando..." : "Salvar e continuar"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

export default function EditQuiz() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4">
          <p className="text-neutral-200 text-lg">
            Carregando editor de quiz...
          </p>
        </main>
      }
    >
      <EditQuizInner />
    </Suspense>
  );
}
