"use client";

import clsx from "clsx";
import type { Tab } from "@/app/hooks/quiz";

export function TabsNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  const tabs: { key: Tab; label: string }[] = [
    { key: "meus", label: "Meus Quizzes" },
 
    { key: "historico", label: "Histórico" },
  ];

  return (
    <div className="mb-5 flex gap-2 border-b border-neutral-800">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={clsx(
            "px-4 py-2 text-sm transition-colors",
            active === t.key
              ? "border-b-2 border-amber-400 text-amber-300"
              : "text-neutral-400 hover:text-neutral-200"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
