/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className={`rounded-full p-2 hover:bg-black/[.06] focus:outline-none focus:ring-2 ring-brand-500 transition text-text ${className}`}
      aria-label="Toggle theme"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            stroke="currentColor"
            strokeWidth="2"
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
          />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            stroke="currentColor"
            strokeWidth="2"
            d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07 6.93-1.41-1.41M6.34 6.34 4.93 4.93m12.73 0 1.41 1.41M6.34 17.66 4.93 19.07"
          />
        </svg>
      )}
    </button>
  );
}
