"use client";
import { api } from "@/lib/mockApi";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Leaderboard({ params }: { params: { id: string } }) {
  const [rows, setRows] = useState<any[]>([]);
  const sp = useSearchParams();

  useEffect(() => {
    (async () => {
      const score = sp.get("score");
      const time = sp.get("time");
      if (score && time) {
        await api.pushScore(params.id, {
          user: "Guest",
          score: +score,
          timeMs: +time,
          date: new Date().toISOString(),
        });
      }
      setRows(await api.leaderboard(params.id));
    })();
  }, [params.id, sp]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Leaderboard</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right">Tempo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="text-neutral-400">{i + 1}</TableCell>
              <TableCell>{r.user}</TableCell>
              <TableCell className="text-right">{r.score}</TableCell>
              <TableCell className="text-right">
                {(r.timeMs / 1000).toFixed(1)}s
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  );
}
