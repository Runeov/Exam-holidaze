export default function FilterBadge({ label, onClear }) {
  return (
    <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-gray-700 text-xs">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="text-gray-500 hover:text-red-500 focus:outline-none"
        aria-label={`Remove filter ${label}`}
      >
        ×
      </button>
    </span>
  );
}
