"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Login() {
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "client">("user");
  const { login } = useApp();
  const router = useRouter();

  const submit = () => {
    login({ id: crypto.randomUUID(), name, role });
    router.push("/");
  };

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-sm place-items-center p-6">
      <Card className="w-full border-neutral-800">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-1 block">Nome</Label>
            <Input
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-2 block">Perfil</Label>
            <RadioGroup
              value={role}
              onValueChange={(v) => setRole(v as any)}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="user" id="user" />
                <Label htmlFor="user">User</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="client" id="client" />
                <Label htmlFor="client">Client</Label>
              </div>
            </RadioGroup>
          </div>
          <Button
            className="w-full bg-amber-400 text-black hover:bg-amber-300"
            onClick={submit}
          >
            Continuar
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
