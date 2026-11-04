"use client";

import { ArrowDown, ArrowUpLeft, Leaf, PackageCheck, ShoppingCart, Sprout, Wheat } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function ReferenceHero() {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    let visible = !!root.current && root.current.getBoundingClientRect().bottom > 0 && root.current.getBoundingClientRect().top < innerHeight;
    let disposed = false;
    const sync = () => {
      if (motion.matches || connection?.saveData) {
        video.pause(); video.removeAttribute("src"); video.load(); setVideoReady(false); return;
      }
      if (!visible || document.hidden) { video.pause(); return; }
      video.muted = true;
      if (!video.getAttribute("src")) video.src = "/media/palms.mp4";
      video.play().catch(() => { if (!disposed) setVideoReady(false); });
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.05 });
    if (root.current) observer.observe(root.current);
    motion.addEventListener("change", sync);
    connection?.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => { disposed = true; observer.disconnect(); motion.removeEventListener("change", sync); connection?.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); video.pause(); };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add({ motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 900px)" }, (context) => {
      if (!context.conditions?.motion) return;
      const q = gsap.utils.selector(root);
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline.fromTo(q(".reference-landscape"), { scale: 1.08, opacity: .6 }, { scale: 1, opacity: 1, duration: 1.6 }, 0)
        .fromTo(q("[data-hero-reveal]"), { y: 28, opacity: .2 }, { y: 0, opacity: 1, duration: .85, stagger: .12 }, .12)
        .fromTo(q(".reference-tagline svg"), { scaleX: .2, transformOrigin: "right center" }, { scaleX: 1, duration: .9, ease: "power4.out" }, .25)
        .fromTo(q(".reference-values p"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .65, stagger: .1 }, .6);
      const scroll = { trigger: root.current, start: "top top", end: "bottom top", scrub: .6 };
      gsap.to(q(".reference-landscape"), { yPercent: context.conditions.desktop ? 8 : 4, ease: "none", scrollTrigger: scroll });
      gsap.to(q(".reference-hero-copy"), { y: context.conditions.desktop ? -42 : -22, opacity: .8, ease: "none", scrollTrigger: scroll });
    }, root);
    const header = document.querySelector(".reference-header");
    const compact = ScrollTrigger.create({ start: 60, end: "max", onUpdate: () => header?.classList.toggle("is-compact", window.scrollY > 60) });
    return () => { media.revert(); compact.kill(); header?.classList.remove("is-compact"); };
  }, []);

  return <section ref={root} className="reference-hero" id="home" aria-labelledby="hero-title">
    <div className="reference-landscape"><Image src="/media/hero.jpg" alt="مشهد نخيل تمثيلي مرخص، وليس تصويرًا لمزارع آل ياسر" fill priority sizes="100vw" quality={85} /><video ref={videoRef} className={videoReady ? "is-ready" : ""} autoPlay muted loop playsInline controls={false} disablePictureInPicture preload="metadata" poster="/media/hero.jpg" aria-hidden="true" onPlaying={() => setVideoReady(true)} onError={() => setVideoReady(false)} /></div>
    <div className="reference-light" />
    <div className="reference-hero-inner frame">
      <div className="reference-hero-copy">
        <h1 id="hero-title" data-hero-reveal>مزارع آل ياسر</h1>
        <p className="reference-tagline" data-hero-reveal><svg viewBox="0 0 430 85" preserveAspectRatio="none" aria-hidden="true"><path d="M12 13 417 4 401 18 428 27 413 40 426 58 405 64 412 78 5 82 22 67 2 53 20 39 6 26Z" fill="currentColor" /></svg><span>الخير له أصل</span></p>
        <p className="reference-description" data-hero-reveal>من خيرات أرضنا المصرية، نختار لكم أجود المنتجات الزراعية والحيوانية، لتصلكم طازجة بكل عناية.</p>
        <div className="reference-hero-actions" data-hero-reveal><Link href="/shop" className="reference-cta"><ShoppingCart size={22} aria-hidden="true" />تسوق الآن<ArrowUpLeft size={19} aria-hidden="true" /></Link><Link href="#about" className="reference-cta reference-cta-secondary">اكتشف مزارعنا<ArrowUpLeft size={19} aria-hidden="true" /></Link></div>
      </div>
    </div>
    <a className="reference-scroll" href="#categories"><ArrowDown size={20} aria-hidden="true" /><span>اكتشف المزيد</span></a>
    <div className="reference-ribbon"><svg className="reference-wave" viewBox="0 0 1440 190" preserveAspectRatio="none" aria-hidden="true"><path d="M0 80C240-35 400 135 720 65S1180-10 1440 45V190H0Z" fill="var(--sun)"/><path d="M0 90C240-25 400 145 720 75S1180 0 1440 55V190H0Z" fill="var(--forest)"/></svg><div className="reference-values frame"><p><Leaf aria-hidden="true" /><span>خيرات زراعية وحيوانية</span></p><p><Wheat aria-hidden="true" /><span>تنوع يليق بمائدتك</span></p><p><PackageCheck aria-hidden="true" /><span>تجربة طلب واضحة</span></p><p><Sprout aria-hidden="true" /><span>الخير له أصل</span></p></div></div>
  </section>;
}

