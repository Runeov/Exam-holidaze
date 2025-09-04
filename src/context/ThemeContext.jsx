import { createContext, useContext, useEffect, useState } from "react";

/**
 * ThemeProvider controls [data-theme="dark"] on <html> according to:
 * mode: "system" | "light" | "dark"
 * theme: resolved theme ("light"/"dark")
 *
 * - default mode is "system"
 * - persists in localStorage ("theme-mode")
 * - responds to OS changes when in "system" mode
 */
const ThemeContext = createContext({
  mode: "system", // "system" | "light" | "dark"
  theme: "light", // resolved theme
  setMode: (_m) => {},
  toggle: () => {},
});

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem("theme-mode") || "system";
    } catch {
      return "system";
    }
  });
  const [theme, setTheme] = useState("light"); // resolved light/dark

  // Resolve theme when mode or OS preference changes
  useEffect(() => {
    const getSystem = () =>
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    const apply = () => setTheme(mode === "system" ? getSystem() : mode);
    apply();

    // listen to OS changes when in "system"
    const mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    if (!mql) return;
    const handler = () => {
      if (mode === "system") apply();
    };
    mql.addEventListener ? mql.addEventListener("change", handler) : mql.addListener(handler);
    return () => {
      mql?.removeEventListener
        ? mql.removeEventListener("change", handler)
        : mql?.removeListener(handler);
    };
  }, [mode]);

  // persist mode
  useEffect(() => {
    try {
      localStorage.setItem("theme-mode", mode);
    } catch {}
  }, [mode]);

  // apply [data-theme] attribute
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
  }, [theme]);

  const toggle = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
