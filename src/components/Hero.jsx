import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-gray-900 text-white rounded-3xl mx-4 md:mx-8 mt-6">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,transparent_20%,white_20%,white_21%,transparent_21%),radial-gradient(circle_at_bottom_right,transparent_20%,white_20%,white_21%,transparent_21%)]" />
      <div className="relative z-10 px-6 py-16 md:px-12 md:py-24">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Find your next stay — anywhere.
        </h1>
        <p className="mt-4 max-w-2xl text-lg opacity-90">
          Browse hand-picked venues and book with confidence using Holidaze.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            to="/venues"
            className="rounded-2xl bg-white text-gray-900 px-6 py-3 font-semibold shadow"
          >
            Explore Venues
          </Link>
          <a href="#search" className="rounded-2xl border border-white/40 px-6 py-3 font-semibold">
            Quick Search
          </a>
        </div>
      </div>
    </section>
  );
}
