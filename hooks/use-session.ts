"use client";

import { useEffect, useState } from "react";

import type { SessionUser } from "@/types/auth";

interface SessionResponse {
  ok: boolean;
  session: SessionUser | null;
}

export const useSession = () => {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const payload = (await response.json()) as SessionResponse;
        setSession(payload.session);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return {
    session,
    loading,
  };
};
