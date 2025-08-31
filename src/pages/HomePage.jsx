import { useEffect } from "react";
import FeaturedVenues from "../components/FeaturedVenues";
import SearchBar from "../components/SearchBar";

export default function HomePage() {
  useEffect(() => {}, []);

  return (
    <div className="p-6 md:p-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">Welcome to Holidaze</h1>
        <p className="text-gray-600">
          Find your next stay — quick search below or browse featured venues.
        </p>
      </header>

      <section>
        <SearchBar />
      </section>

      <section>
        <FeaturedVenues />
      </section>
    </div>
  );
}
