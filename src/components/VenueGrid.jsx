import VenueCard from "./VenueCard";

/** Generic grid that renders a list of venues */
export default function VenueGrid({ venues = [], priorityCount = 6 }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {venues.map((v, i) => (
        <VenueCard key={`v-${v?.id || i}`} venue={v} priority={i < priorityCount} />
      ))}
    </ul>
  );
}
