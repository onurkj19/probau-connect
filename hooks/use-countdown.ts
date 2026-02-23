"use client";

import { useEffect, useMemo, useState } from "react";

interface CountdownState {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const toCountdownState = (deadlineIso: string): CountdownState => {
  const totalMs = Math.max(0, new Date(deadlineIso).getTime() - Date.now());
  const isExpired = totalMs <= 0;
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const seconds = Math.floor((totalMs / 1000) % 60);

  return { totalMs, days, hours, minutes, seconds, isExpired };
};

export const useCountdown = (deadlineIso: string): CountdownState => {
  const [state, setState] = useState<CountdownState>(() => toCountdownState(deadlineIso));

  useEffect(() => {
    setState(toCountdownState(deadlineIso));

    const interval = window.setInterval(() => {
      setState(toCountdownState(deadlineIso));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [deadlineIso]);

  return useMemo(() => state, [state]);
};
