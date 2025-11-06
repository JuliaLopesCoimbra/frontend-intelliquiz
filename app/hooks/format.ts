export function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(d);
  } catch {
    return iso || "—";
  }
}

export function displayUser(u?: { name?: string; username?: string }) {
  if (!u) return "—";
  return u.name?.trim() || u.username || "—";
}

export function initials(name?: string, username?: string) {
  const src = (name && name.trim()) || (username && username.trim()) || "";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
