"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { http } from "@/lib/http";
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
type Category = { id: string; name: string };

export default function CreateQuiz() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { me, loadingMe } = useAuthMe();
  const [checking, setChecking] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingCatOpen, setCreatingCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

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
        // 👈 inclua 403
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

    // (opcional) evitar duplicados pelo nome
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

      // Faz o POST
      const res = await http<{ data: Category }>("/categories", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      // Se a API retornar o objeto criado, usamos; caso não, recarrega a lista
      const created = res?.data;
      if (created?.id) {
        setCategories((prev) => [...prev, created]);
        setCategoryId(created.id);
      } else {
        await loadCategories();
        // tenta selecionar a recém-criada pelo nome
        const found = categories.find(
          (c) => c.name.toLowerCase() === name.toLowerCase()
        );
        if (found) setCategoryId(found.id);
      }

      // limpa UI
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

  // Carrega categorias (e redireciona em caso de 401)
  useEffect(() => {
    if (checking) return;
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);

  function handleNext() {
    if (!categoryId) return alert("Selecione uma categoria!");

    const categoryName =
      categories.find((c) => c.id === categoryId)?.name ?? "";

    router.push(
      `/client/create/step2?category=${categoryId}&title=${encodeURIComponent(
        quizTitle
      )}&categoryName=${encodeURIComponent(categoryName)}`
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
      <header className="w-full p-4 flex items-center justify-between bg-neutral-950 border-b border-neutral-800">
        {/* Botão voltar */}
        <button
          onClick={() => router.back()}
          className="text-neutral-300 hover:text-amber-400 transition-colors text-sm"
        >
          ⭠ Voltar
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3">
          {/* Nome do usuário */}
          <span className="text-sm text-neutral-300">
            {loadingMe
              ? "Carregando..."
              : me?.username || "Usuário"}
          </span>

          {/* Avatar */}
          <div className="h-9 w-9 rounded-full bg-neutral-700 overflow-hidden">
            <img
              src={
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  me?.name || me?.username || "User"
                )}`
              }
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>
      {/* MAIN */}
      <main className="mt-10  flex justify-center items-center px-4">
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
            {/* Campo Categoria */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base">Categoria</Label>

                {/* Botão abrir/fechar criação */}
                <button
                  type="button"
                  onClick={() => {
                    setCatError(null);
                    setCreatingCatOpen((v) => !v);
                  }}
                  className="text-sm text-amber-400 hover:text-amber-300"
                >
                  {creatingCatOpen ? "Cancelar" : "Criar categoria"}
                </button>
              </div>

              {/* Select de categorias */}
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

              {/* Área inline para criar categoria */}
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

            {/* Campo Título */}
            <div className="space-y-2">
              <Label className="text-base">Título do Quiz</Label>
              <Input
                placeholder="Ex: Quiz sobre História do Brasil"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="h-11 text-neutral-100 placeholder:text-neutral-500"
              />
            </div>

            {/* Botão */}
            <Button
              onClick={handleNext}
              disabled={!categoryId || !quizTitle}
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
