import React, { useEffect, useState } from "react";

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setPrefers(mql.matches);
    setPrefers(mql.matches);
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);
  return prefers;
}

export default function Defer({ delay = 0, children }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [ready, setReady] = useState(delay === 0 || prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion || delay === 0) {
      setReady(true);
      return;
    }
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay, prefersReducedMotion]);

  return ready ? children : null;
}