"use client";

import { useEffect, useState } from "react";
import { PublicSiteData } from "../types/site-settings";

interface HookState {
  data: PublicSiteData | null;
  loading: boolean;
  error: string | null;
}

export function usePublicSiteData(initialData: PublicSiteData) {
  const [state, setState] = useState<HookState>({ data: initialData, loading: true, error: null });

  useEffect(() => {
    let active = true;

    fetch("/api/public/settings", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as PublicSiteData | { message?: string } | null;
        if (!response.ok) {
          const message = payload && typeof payload === "object" && "message" in payload ? payload.message : undefined;
          throw new Error(message || "Unable to load public settings.");
        }
        return payload as PublicSiteData;
      })
      .then((payload) => {
        if (!active) return;
        setState({ data: payload, loading: false, error: null });
      })
      .catch((error) => {
        if (!active) return;
        setState((prev) => ({ ...prev, loading: false, error: error instanceof Error ? error.message : "Unable to load settings." }));
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
