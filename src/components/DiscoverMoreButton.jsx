/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import { useEffect, useState } from "react";
import DiscoverMoreModal from "./DiscoverMoreModal";

export default function DiscoverMoreButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-black/10 bg-muted px-5 py-2 text-sm font-medium text-text shadow hover:bg-black/5 focus:outline-none focus:ring-2 ring-brand-500"
      >
        Discover more
      </button>
      {open && <DiscoverMoreModal onClose={() => setOpen(false)} />}
    </>
  );
}
