import { useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { bookingsToDisabledRanges, hasBookingConflict, toUtcMidnight } from "../utils/dates";

/**
 * BrandedCalendar — flexible, responsive calendar with booking constraints.
 */
export default function BrandedCalendar({
  mode = "range", // 'single' or 'range'
  selected,
  onSelect,
  bookings = [],
  numberOfMonths = 2,
  minDate,
  maxDate,
  weekStartsOn = 1,
  captionLayout = "buttons",
  showOutsideDays = true,
  onConflict, // Optional callback
  label = "Select your travel dates",
  showHelperText = true,
}) {
  const today = useMemo(() => toUtcMidnight(new Date()), []);

  const disabled = useMemo(() => {
    const ranges = bookingsToDisabledRanges(bookings);

    if (minDate) ranges.push({ before: toUtcMidnight(minDate) });
    else ranges.push({ before: today });

    if (maxDate) ranges.push({ after: toUtcMidnight(maxDate) });

    return ranges;
  }, [bookings, minDate, maxDate, today]);

  const handleSelect = (value) => {
    if (mode === "range" && value?.from && value?.to) {
      const conflict = hasBookingConflict(bookings, value.from, value.to);
      if (conflict && typeof onConflict === "function") {
        return onConflict(value);
      }
    }
    onSelect?.(value);
  };

  return (
    <div className="w-full max-w-4xl rounded-3xl bg-surface p-4 shadow-md border border-black/5">
      {label && <div className="text-center text-sm font-medium text-text mb-4">{label}</div>}

      {/* 🔽 Scrollable container to keep calendar inside viewport */}
      <div className="overflow-y-auto max-h-[75vh]">
        <DayPicker
          mode={mode}
          selected={selected}
          onSelect={handleSelect}
          disabled={disabled}
          numberOfMonths={numberOfMonths}
          pagedNavigation
          weekStartsOn={weekStartsOn}
          captionLayout={captionLayout}
          showOutsideDays={showOutsideDays}
          classNames={{
            months: "grid gap-6 md:grid-cols-2",
            caption: "flex justify-between items-center px-2 mb-2 text-text font-medium",
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
      </div>

      {showHelperText && (
        <p className="text-xs text-text-muted mt-3 text-center">
          Select {mode === "range" ? "a start and end date" : "a date"}. Booked dates are disabled.
        </p>
      )}
    </div>
  );
}
