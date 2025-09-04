/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { useState } from "react";
import DiscoverMoreModal from "./DiscoverMoreModal";

export default function DiscoverMoreButton({ className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`rounded-full border border-black/10 bg-[color:var(--color-accent-300)] px-5 py-2 text-sm font-medium text-[color:var(--color-text)] shadow hover:bg-[color:var(--color-brand-700)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-brand-700)] ${className}`}
      >
        Discover more
      </button>
      {open && <DiscoverMoreModal onClose={() => setOpen(false)} />}
    </>
  );
}
