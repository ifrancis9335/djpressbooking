"use client";

import { useEffect, useRef, useState } from "react";

export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const node = ref.current;
    const fallbackId = window.setTimeout(() => setVisible(true), 250);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting || (entries[0]?.intersectionRatio ?? 0) > 0) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(node);
    return () => {
      window.clearTimeout(fallbackId);
      observer.disconnect();
    };
  }, []);

  return <div ref={ref} className={`reveal-up ${visible ? "is-visible" : ""} ${className}`}>{children}</div>;
}
