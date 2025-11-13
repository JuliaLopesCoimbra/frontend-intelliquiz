"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { http } from "@/lib/http";
import { getUserToken } from "@/lib/auth.client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAuthMe } from "@/app/hooks/useAuthMe";

type Category = { id: string; name: string };

function CreateQuizInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { me, loadingMe } = useAuthMe();

  const [checking, setChecking] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");

  const [quizTitle, setQuizTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imgTouched, setImgTouched] = useState(false);

  const [loading, setLoading] = useState(true);
  const [creatingCatOpen, setCreatingCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const [fullAiLoading, setFullAiLoading] = useState(false);
  const [fullAiError, setFullAiError] = useState<string | null>(null);

  useEffect(() => {
    const t = getUserToken();
    if (!t) {
      const next = `${pathname}${
        searchParams?.toString() ? `?${searchParams.toString()}` : ""
      }`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    setChecking(false);
  }, [router, pathname, searchParams]);

  const isValidHttpUrl = useMemo(() => {
    if (!imgTouched && !imageUrl) return true;
    try {
      const u = new URL(imageUrl);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, [imageUrl, imgTouched]);

  // função get categories
  async function loadCategories() {
    try {
      const token = getUserToken();
      const res = await http<{ data: Category[] }>("/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      if (status === 401 || status === 403) {
        const next = `${pathname}${
          searchParams?.toString() ? `?${searchParams.toString()}` : ""
        }`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      console.error("Erro ao carregar categorias:", err?.message || err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCategory() {
    setCatError(null);

    const name = newCatName.trim();
    if (!name) {
      setCatError("Digite um nome para a categoria.");
      return;
    }

    const exists = categories.some(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      setCatError("Já existe uma categoria com esse nome.");
      return;
    }

    try {
      setCreatingCat(true);
      const token = getUserToken();

      const res = await http<{ data: Category }>("/categories", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const created = res?.data;
      if (created?.id) {
        setCategories((prev) => [...prev, created]);
        setCategoryId(created.id);
      } else {
        await loadCategories();
        const found = categories.find(
          (c) => c.name.toLowerCase() === name.toLowerCase()
        );
        if (found) setCategoryId(found.id);
      }

      setNewCatName("");
      setCreatingCatOpen(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao criar categoria.";
      setCatError(msg);
      console.error("Erro ao criar categoria:", err);
    } finally {
      setCreatingCat(false);
    }
  }

  // 🔮 IA – completar título
  async function handleGenerateAI() {
    if (!categoryId || !quizTitle.trim()) return;

    try {
      setAiError(null);
      setAiLoading(true);
      const token = getUserToken();

      const res = await http<any>("/ai/autocomplete-quiz", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_id: categoryId,
          content: quizTitle.trim(),
        }),
      });

      console.log("IA autocomplete response:", res);

      let suggestions: string[] = [];

      if (Array.isArray(res?.data)) {
        suggestions = res.data;
      } else if (typeof res?.data === "string") {
        suggestions = [res.data];
      } else if (Array.isArray(res?.data?.suggestions)) {
        suggestions = res.data.suggestions;
      } else if (Array.isArray(res?.data?.titles)) {
        suggestions = res.data.titles;
      } else if (Array.isArray(res?.suggestions)) {
        suggestions = res.suggestions;
      }

      setAiSuggestions(suggestions);
    } catch (err: any) {
      console.error("Erro ao gerar títulos com IA:", err);
      setAiError("Não foi possível gerar sugestões agora. Tente novamente.");
    } finally {
      setAiLoading(false);
    }
  }

  // 🔮 IA – gerar quiz completo
  async function handleGenerateQuizAI() {
    if (!categoryId) {
      alert("Selecione uma categoria para gerar o quiz com IA.");
      return;
    }

    try {
      setFullAiError(null);
      setFullAiLoading(true);
      const token = getUserToken();
      if (!token) {
        const next = `${pathname}${
          searchParams?.toString() ? `?${searchParams.toString()}` : ""
        }`;
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }

      const res = await http<any>("/ai/generate-quiz", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_id: categoryId,
        }),
      });

      const payload = res?.data?.data ?? res?.data ?? res;
      const quizTitleFromIa: string = payload?.quiz_title ?? "";
      const questionsFromIa: any[] = Array.isArray(payload?.questions)
        ? payload.questions
        : [];

      if (!quizTitleFromIa || !questionsFromIa.length) {
        setFullAiError(
          "IA não retornou título e perguntas suficientes para gerar o quiz."
        );
        return;
      }

      setQuizTitle(quizTitleFromIa);

      try {
        sessionStorage.setItem(
          "iq:generatedQuiz",
          JSON.stringify(questionsFromIa)
        );
      } catch (e) {
        console.error("Erro ao salvar quiz gerado no sessionStorage:", e);
      }
    } catch (err: any) {
      console.error("Erro ao gerar quiz completo com IA:", err);
      setFullAiError(
        "Não foi possível gerar o quiz completo agora. Tente novamente."
      );
    } finally {
      setFullAiLoading(false);
    }
  }

  useEffect(() => {
    if (checking) return;
    loadCategories();
  }, [checking]);

  function handleNext() {
    if (!categoryId) return alert("Selecione uma categoria!");
    if (!quizTitle.trim()) return alert("Digite o título do quiz!");
    if (!imageUrl.trim())
      return alert("Informe o link da imagem (image_url)!");
    if (!isValidHttpUrl)
      return alert("Informe um link de imagem válido (http/https).");

    const categoryName =
      categories.find((c) => c.id === categoryId)?.name ?? "";

    router.push(
      `/client/create/step2?category=${categoryId}` +
        `&title=${encodeURIComponent(quizTitle)}` +
        `&categoryName=${encodeURIComponent(categoryName)}` +
        `&imageUrl=${encodeURIComponent(imageUrl)}`
    );
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
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
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
          className="absolute inset-0"
        />
      </div>

      <header className="w-full p-4 flex items-center justify-between bg-neutral-950 border-b border-neutral-800">
        <button
          onClick={() => router.back()}
          className="text-neutral-300 hover:text-amber-400 transition-colors text-sm"
        >
          ⭠ Voltar
        </button>

        <div className="flex items-center gap-3">
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

      <main className="mt-10 flex justify-center items-center px-4">
        <Card className="w-full max-w-lg bg-neutral-950 border-neutral-800 text-neutral-100">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-400 font-semibold">
              Criar Quiz
            </CardTitle>
            <p className="text-sm text-neutral-400">
              Etapa 1 — Defina a categoria
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campo Categoria */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base">Categoria</Label>
              </div>

              {loading ? (
                <p className="text-neutral-500 text-sm">
                  Carregando categorias...
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

              <Button
                type="button"
                onClick={handleGenerateQuizAI}
                disabled={!categoryId || fullAiLoading}
                className="
                  mt-2 w-full h-10 text-xs font-semibold
                  flex items-center justify-center gap-1
                  bg-black border border-amber-400
                  text-amber-400 
                  hover:bg-amber-400/20 hover:text-amber-300
                  rounded-md transition-all
                  disabled:opacity-40 disabled:hover:bg-black disabled:hover:text-amber-400
                "
              >
                <Sparkles size={14} className="text-amber-400" />
                {fullAiLoading
                  ? "Gerando quiz completo..."
                  : "Gerar quiz completo com IA"}
              </Button>
              {fullAiError && (
                <p className="text-xs text-red-400 mt-1">{fullAiError}</p>
              )}

              {creatingCatOpen && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                  <Input
                    placeholder="Nome da nova categoria (ex.: Science)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-11 text-neutral-100 placeholder:text-neutral-500"
                  />
                  <Button
                    onClick={handleCreateCategory}
                    disabled={creatingCat || !newCatName.trim()}
                    className="h-11 bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-50"
                  >
                    {creatingCat ? "Criando..." : "Criar"}
                  </Button>

                  {catError && (
                    <p className="sm:col-span-2 text-sm text-red-400">
                      {catError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Campo Título + IA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-base">Título do Quiz</Label>

                <Button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={!categoryId || !quizTitle.trim() || aiLoading}
                  className="
                    h-9 px-3 text-xs font-semibold
                    flex items-center gap-1
                    border border-amber-400
                    text-amber-400 
                    hover:bg-amber-400/20 hover:text-amber-300
                    rounded-md transition-all
                    disabled:opacity-40 disabled:hover:bg-black disabled:hover:text-amber-400
                  "
                >
                  <Sparkles size={14} className="text-amber-400" />
                  {aiLoading ? "Gerando..." : "Completar título com IA"}
                </Button>
              </div>

              {aiSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs mb-1">
                  {aiSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuizTitle(s)}
                      className="rounded-full border border-amber-400/60 px-3 py-1 bg-neutral-900 hover:bg-amber-400/10 text-amber-300 text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {aiError && (
                <p className="text-xs text-red-400">{aiError}</p>
              )}

              <Input
                placeholder="Ex: Quiz sobre História do Brasil"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="h-11 text-neutral-100 placeholder:text-neutral-500"
              />
            </div>

            {/* Campo imagem */}
            <div className="space-y-2">
              <Label className="text-base">Link da imagem (image_url)</Label>
              <Input
                type="url"
                placeholder="https://exemplo.com/imagem.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onBlur={() => setImgTouched(true)}
                className="h-11 text-neutral-100 placeholder:text-neutral-500"
              />
              {!isValidHttpUrl && (
                <p className="text-sm text-red-400">
                  Informe uma URL válida começando com http(s)://
                </p>
              )}

              {isValidHttpUrl && imageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Pré-visualização do quiz"
                    className="w-full h-40 object-cover"
                    onError={() => setImgTouched(true)}
                  />
                </div>
              )}
            </div>

            <Button
              onClick={handleNext}
              disabled={
                !categoryId ||
                !quizTitle.trim() ||
                !imageUrl.trim() ||
                !isValidHttpUrl
              }
              className="w-full h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-lg font-semibold disabled:opacity-40"
            >
              Continuar
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

export default function CreateQuiz() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4">
          <p className="text-neutral-200 text-lg">
            Carregando criador de quiz...
          </p>
        </main>
      }
    >
      <CreateQuizInner />
    </Suspense>
  );
}
