// src/components/BookingCalendar.jsx
import { useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// helpers
function atLocalMidnight(d) {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function bookingsToDisabledRanges(bookings = []) {
  return bookings.map((b) => {
    const from = atLocalMidnight(new Date(b.dateFrom));
    const to = addDays(atLocalMidnight(new Date(b.dateTo)), -1); // inclusive block
    return { from, to };
  });
}

/**
 * BookingCalendar
 * Thin wrapper around DayPicker to enforce our defaults & disabled ranges.
 */
export default function BookingCalendar({ bookings = [], disabled = [], selected, onSelect, minDate, numberOfMonths = 2 }) {
  const today = useMemo(() => atLocalMidnight(new Date()), []);
  const computedDisabled = useMemo(() => {
    const ranges = Array.isArray(bookings) && bookings.length > 0
      ? bookingsToDisabledRanges(bookings)
      : [];
    if (minDate) ranges.push({ before: atLocalMidnight(minDate) });
    else ranges.push({ before: today });
    if (Array.isArray(disabled)) ranges.push(...disabled);
    return ranges;
  }, [bookings, minDate, today, disabled]);

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-3">
      <DayPicker
        mode="range"
        selected={selected}
        onSelect={onSelect}
        disabled={computedDisabled}
        numberOfMonths={numberOfMonths}
        pagedNavigation
        weekStartsOn={1}
        captionLayout="buttons"
        showOutsideDays
      />
      <p className="mt-2 text-xs text-gray-500">Select a start and end date. Booked dates are disabled.</p>
    </div>
  );
}