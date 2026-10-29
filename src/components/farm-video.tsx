"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ConnectionNavigator = Navigator & { connection?: EventTarget & { saveData?: boolean; effectiveType?: string } };

export function FarmVideo({ hero = false }: { hero?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const pausedByUser = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hero) return;
    const video = ref.current;
    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as ConnectionNavigator).connection;
    let observer: IntersectionObserver | undefined;
    let active = true;
    const start = () => {
      if (!active || motion.matches || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "")) return;
      if (!video.getAttribute("src")) { video.src = "/media/palms.mp4"; video.load(); }
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !document.hidden && !pausedByUser.current) video.play().catch(() => {});
        else video.pause();
      }, { threshold: 0.1 });
      observer.observe(video);
    };
    const timeout = window.setTimeout(start, 1600);
    const stopForPreference = () => {
      if (motion.matches || connection?.saveData) {
        video.pause(); video.removeAttribute("src"); video.load(); observer?.disconnect();
      }
    };
    const onVisibility = () => { if (document.hidden) video.pause(); };
    motion.addEventListener("change", stopForPreference);
    connection?.addEventListener("change", stopForPreference);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { active = false; window.clearTimeout(timeout); observer?.disconnect(); motion.removeEventListener("change", stopForPreference); connection?.removeEventListener("change", stopForPreference); document.removeEventListener("visibilitychange", onVisibility); };
  }, [hero]);

  function toggle() {
    const video = ref.current;
    if (!video) return;
    if (!video.paused) { pausedByUser.current = true; video.pause(); return; }
    pausedByUser.current = false;
    if (!video.getAttribute("src")) { video.src = "/media/palms.mp4"; video.load(); }
    setFailed(false);
    video.play().catch(() => setFailed(true));
  }

  return <div className={`farm-video ${hero ? "hero-video" : "film-video"} ${ready ? "is-ready" : ""}`}>
    <video ref={ref} muted={hero} loop={hero} playsInline preload="none" poster="/media/hero.jpg" controls={!hero && ready} onPlaying={() => { setPlaying(true); setReady(true); }} onPause={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false); }} aria-label={hero ? "مشهد جوي تمثيلي لنخيل، فيديو مرخص" : "مشاهد طبيعية تجريبية، تصوير Rulo Davila"} />
    {(hero || !ready) && <button type="button" className={hero ? "video-toggle" : "film-play"} onClick={toggle} aria-label={playing ? "إيقاف الفيديو مؤقتًا" : "تشغيل الفيديو"}>{playing ? <Pause size={18} aria-hidden="true" /> : <Play size={hero ? 18 : 28} aria-hidden="true" />}{hero ? <span>{playing ? "إيقاف المشهد" : "تشغيل المشهد"}</span> : <span>شاهد المقطع</span>}</button>}
    {failed && <p className="video-error" role="status">تعذّر تشغيل المقطع. يمكنك المحاولة مجددًا.</p>}
  </div>;
}
