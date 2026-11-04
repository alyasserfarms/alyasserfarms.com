"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function VisitRecorder() {
  const path = usePathname();
  useEffect(() => {
    if (!path || path.startsWith("/admin")) return;
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const key = `alyasser-visit-${day}`;
    try {
      let token = localStorage.getItem(key);
      if (!token) { token = crypto.randomUUID(); localStorage.setItem(key, token); }
      const body = JSON.stringify({ token, path });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/visit", new Blob([body], { type: "application/json" }));
      else void fetch("/api/visit", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
    } catch { /* Storage or analytics failure must not block the site. */ }
  }, [path]);
  return null;
}
