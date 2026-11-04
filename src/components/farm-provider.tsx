"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { PublicFarm } from "@/data/farm-types";
const Context = createContext<PublicFarm | null>(null);
export function FarmProvider({ initial, children }: { initial: PublicFarm; children: React.ReactNode }) {
  const [farm, setFarm] = useState(initial);
  const [previous, setPrevious] = useState(initial);
  if (previous !== initial) { setPrevious(initial); setFarm(initial); }
  useEffect(() => {
    let active = true;
    const refresh = () => { if (!document.hidden) fetch("/api/catalogue", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(value => { if (active && value) setFarm(value); }).catch(() => {}); };
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    const interval = setInterval(refresh, 30000);
    return () => { active = false; clearInterval(interval); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  return <Context.Provider value={farm}>{children}</Context.Provider>;
}
export function useFarm() { const farm = useContext(Context); if (!farm) throw new Error("FarmProvider is required"); return farm; }
