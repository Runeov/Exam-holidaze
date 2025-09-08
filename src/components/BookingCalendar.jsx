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

export default function BookingCalendar({ bookings = [], selected, onSelect, minDate }) {
  const today = useMemo(() => atLocalMidnight(new Date()), []);
  const disabled = useMemo(() => {
    const ranges = bookingsToDisabledRanges(bookings);
    ranges.push({ before: minDate ? atLocalMidnight(minDate) : today }); // block past
    return ranges;
  }, [bookings, minDate, today]);

  return (
    <div className="rounded-2xl border p-3 bg-white">
      <DayPicker
        mode="range"
        selected={selected}
        onSelect={onSelect}
        disabled={disabled}
        numberOfMonths={2}
        pagedNavigation
        weekStartsOn={1}
        captionLayout="buttons"
        showOutsideDays
      />
      <p className="text-xs text-gray-500 mt-2">
        Select a start and end date. Booked dates are disabled.
      </p>
    </div>
  );
}
