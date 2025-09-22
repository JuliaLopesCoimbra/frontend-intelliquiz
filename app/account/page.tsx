"use client";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Account() {
  const { user } = useApp();
  return (
    <main className="mx-auto max-w-xl p-6">
      <Card className="border-neutral-800">
        <CardHeader>
          <CardTitle>Minha Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-1 block">Nome</Label>
            <Input defaultValue={user?.name} />
          </div>
          <div>
            <Label className="mb-1 block">Avatar (URL)</Label>
            <Input placeholder="https://…" />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
