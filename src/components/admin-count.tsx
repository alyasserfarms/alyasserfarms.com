"use client";

import { useEffect, useRef, useState } from "react";

export function AdminCount({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const target = Math.max(0, Math.round(value));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || target === 0) {
      const frame = requestAnimationFrame(() => { setShown(target); previous.current = target; });
      return () => cancelAnimationFrame(frame);
    }
    const startValue = previous.current === target ? 0 : previous.current;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / 540);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(startValue + (target - startValue) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else previous.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className="admin-count"><span className="admin-count-sr">{value.toLocaleString("ar-EG")}</span><span aria-hidden="true">{shown.toLocaleString("ar-EG")}</span></span>;
}
