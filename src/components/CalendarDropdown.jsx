import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";

export default function CalendarDropdown({ selected, onChange, onApply, minDate }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2 relative">
      <span className="block text-sm font-medium">Choose dates</span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black/[.03]"
        >
          Dates
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-black/10 bg-white p-3 shadow-md">
          <div className="rounded-2xl border p-3 bg-white">
            <DayPicker
              mode="range"
              selected={selected}
              onSelect={(range) => {
                console.log("📅 Temp range changed:", range);
                onChange?.(range);
              }}
              fromDate={minDate}
              numberOfMonths={2}
              showOutsideDays
            />
            <p className="text-xs text-gray-500 mt-2">
              Select a start and end date. Booked dates are disabled.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-black/10 px-3 py-2 hover:bg-black/[.03]"
                onClick={() => {
                  onApply?.(selected);
                  setIsOpen(false);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
