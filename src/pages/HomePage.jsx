import { useQuery } from "@tanstack/react-query";
import { listVenues } from "../api/venues";
import FeaturedVenues from "../components/FeaturedVenues";
import PageSection from "../components/PageSection";
import SearchBar from "../components/SearchBar";

export default function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["featured-venues"],
    queryFn: async ({ signal }) => {
      const res = await listVenues({
        page: 1,
        limit: 6,
        withOwner: true,
        signal,
      });
      const payload =
        res?.data && (Array.isArray(res.data?.data) || res.data?.meta) ? res.data : res;
      return (payload?.data || []).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 6);
    },
  });

  return (
    <PageSection>
      {/* Hero */}
      <section className="relative bg-brand-50 rounded-xl shadow-sm mb-12 min-h-screen flex items-center">
        <div className="px-[var(--page-gutter-wide)] space-y-8 text-center w-full">
          <h1 className="text-4xl font-bold text-brand-700">Find your perfect stay</h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Browse unique places to stay, discover hidden gems, and book your next adventure with
            Holidaze.
          </p>
          <div className="max-w-2xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Featured section */}
      <section className="bg-surface rounded-xl shadow-sm p-6 sm:p-10">
        {isLoading && <p className="text-center text-text-muted">Loading top venues…</p>}
        {error && <p className="text-center text-accent-700">Could not load featured venues.</p>}
        {data?.length === 0 && !isLoading && !error && (
          <p className="text-center">No featured venues available.</p>
        )}
        {data?.length > 0 && <FeaturedVenues venues={data} />}
      </section>
    </PageSection>
  );
}
