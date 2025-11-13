"use client";

import { initials } from "@/app/hooks/format";
import type { Me } from "@/app/hooks/quiz";

export function UserChip({ me, loading }: { me: Me | null; loading: boolean }) {
  return (
    <div className="hidden sm:flex items-center gap-3 rounded-lg  px-3 py-2 ">
      <div className="h-8 w-8 rounded-full bg-amber-400/20 border border-amber-400/40 grid place-items-center text-xs font-semibold text-amber-200">
        {loading ? "…" : initials(me?.name, me?.username)}
      </div>
      <div className="leading-tight">
        <p className="text-sm text-neutral-200">
          {loading ? "Carregando..." : me?.username || "—"}
        </p>
        <p className="text-[11px] text-neutral-500">{loading ? "" : me?.email || "—"}</p>
      </div>
    </div>
  );
}
