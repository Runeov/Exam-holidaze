// components/BrandedCalendar.jsx
import { useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { bookingsToDisabledRanges, hasBookingConflict, toUtcMidnight } from "../utils/dates"; // ✅ fixed path

export default function BrandedCalendar({
  bookings = [],
  selected,
  onSelect,
  minDate,
  onConflict, // Optional callback for conflict detection
}) {
  const today = useMemo(() => toUtcMidnight(new Date()), []);
  const disabled = useMemo(() => {
    const ranges = bookingsToDisabledRanges(bookings);
    ranges.push({ before: minDate ? toUtcMidnight(minDate) : today }); // Disable past
    return ranges;
  }, [bookings, minDate, today]);

  // 🔐 Optional conflict check (e.g., after date selection)
  const handleSelect = (range) => {
    if (range?.from && range?.to) {
      const conflict = hasBookingConflict(bookings, range.from, range.to);
      if (conflict && typeof onConflict === "function") {
        return onConflict(range);
      }
    }
    onSelect?.(range);
  };

  return (
    <div className="w-[min(100%,780px)] rounded-3xl bg-surface p-4 shadow-md border border-black/5">
      <div className="text-center text-sm font-medium text-text mb-4">Select your travel dates</div>

      <DayPicker
        mode="range"
        selected={selected}
        onSelect={handleSelect}
        disabled={disabled}
        numberOfMonths={2}
        pagedNavigation
        weekStartsOn={1}
        captionLayout="buttons"
        showOutsideDays
        classNames={{
          months: "grid gap-6 md:grid-cols-2",
          caption: "flex justify-between items-center px-2 mb-2 text-text",
          nav_button:
            "rounded-full p-2 text-text hover:bg-black/[.06] focus:outline-none focus-visible:ring-2 ring-brand-500",
          head_row: "grid grid-cols-7 text-xs text-center text-text-muted",
          head_cell: "py-1",
          row: "grid grid-cols-7 gap-1.5",
          cell: "relative w-10 h-10 sm:w-11 sm:h-11",
          day: "w-full h-full rounded-full grid place-items-center text-sm text-text hover:bg-black/[.06] focus:outline-none focus-visible:ring-2 ring-brand-500",
          day_selected: "bg-[--color-brand-500] text-white",
          day_range_middle: "bg-brand-50 text-text rounded-md",
          day_disabled: "text-text-muted/40 cursor-not-allowed",
        }}
      />

      <p className="text-xs text-text-muted mt-3 text-center">
        Select a start and end date. Booked dates are disabled.
      </p>
    </div>
  );
}
