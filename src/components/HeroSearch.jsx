/** biome-ignore-all lint/correctness/useUniqueElementIds: <> */
/** biome-ignore-all lint/a11y/useButtonType: <> */
import React, { useState } from "react";

export default function HeroSearch({ onSearch }) {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [guests, setGuests] = useState(1);

  function submit(e) {
    e.preventDefault();
    onSearch?.({ q, from, to, guests: Number(guests) });
  }

  return (
    <section className="container section-pad">
      <div className="hero p-5 md:p-8">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto_auto] items-end">
          <div className="space-y-2">
            <label htmlFor="q" className="text-sm text-[var(--color-text-muted)]">
              Where
            </label>
            <input
              id="q"
              className="input"
              placeholder="City, region, landmark…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="from" className="text-sm text-[var(--color-text-muted)]">
              Check-in
            </label>
            <input
              id="from"
              type="date"
              className="input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="to" className="text-sm text-[var(--color-text-muted)]">
              Check-out
            </label>
            <input
              id="to"
              type="date"
              className="input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="guests" className="text-sm text-[var(--color-text-muted)]">
              Guests
            </label>
            <input
              id="guests"
              type="number"
              min="1"
              className="input"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            />
          </div>
          <button onClick={submit} className="btn-primary h-11 mt-6 md:mt-0">
            Search
          </button>
        </div>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          Tips: try “Oslo”, “Tromsø”, or “beachfront”.
        </p>
      </div>
    </section>
  );
}
