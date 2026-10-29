"use client";

import { useEffect } from "react";

export function Reveal() {
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observed = new Set<HTMLElement>();
    let observer: IntersectionObserver | undefined;
    const observe = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
        if (observed.has(element) || !observer) return;
        observed.add(element); observer.observe(element);
      });
      observed.forEach((element) => { if (!element.isConnected) { observer?.unobserve(element); observed.delete(element); } });
    };
    const setup = () => {
      observer?.disconnect(); observed.clear();
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => element.classList.remove("is-revealing"));
      if (motion.matches) { observer = undefined; return; }
      observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        if (!entry.isIntersecting) { element.classList.remove("is-revealing"); return; }
        element.style.setProperty("--reveal-y", entry.boundingClientRect.top < 0 ? "-18px" : "18px");
        element.classList.add("is-revealing", `reveal-${element.dataset.reveal || "rise"}`);
      }), { threshold: 0.12 });
      observe();
    };
    setup();
    const changes = new MutationObserver(observe);
    changes.observe(document.getElementById("main") ?? document.body, { childList: true, subtree: true });
    motion.addEventListener("change", setup);
    return () => { observer?.disconnect(); changes.disconnect(); motion.removeEventListener("change", setup); };
  }, []);
  return null;
}
