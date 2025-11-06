"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { http } from "@/lib/http";
import { getUserToken } from "@/lib/auth.client";
import type { Me } from "./quiz";

export function useAuthMe() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const t = getUserToken();
    if (!t) {
      router.replace("/login?next=/client/dashboard");
    } else {
      if (!cancelled) setChecking(false);
    }
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (checking) return;

    (async () => {
      try {
        setLoadingMe(true);
        const token = getUserToken();
        if (!token) {
          router.replace("/login?next=/client/dashboard");
          return;
        }
        const r = await http<{ data: Me }>("/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMe(r?.data ?? null);
      } catch (err: any) {
        const status = err?.status || err?.response?.status;
        if (status === 401 || status === 403) {
          router.replace("/login?next=/client/dashboard");
          return;
        }
        console.error("GET /me falhou:", err);
        setMe(null);
      } finally {
        setLoadingMe(false);
      }
    })();
  }, [checking, router]);

  return { checking, me, loadingMe };
}
