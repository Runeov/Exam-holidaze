import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css"; // If still needed for base DayPicker styling

export function Calendar() {
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(today.getMonth() + 1);

  return (
    <section
      style={{
        padding: "1.5rem",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-ring)",
        boxShadow: "var(--shadow-md)",
      }}
      data-theme="light"
    >
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "var(--color-text)",
          marginBottom: "1rem",
        }}
      >
        📅 Calendar
      </h2>

      <p
        style={{
          color: "var(--color-text-muted)",
          fontSize: "0.875rem",
          marginBottom: "1rem",
        }}
      >
        This is the tokenized calendar component used across booking flows. It uses{" "}
        <code
          style={{
            padding: "0.125rem 0.25rem",
            marginLeft: "0.25rem",
            borderRadius: "0.25rem",
            backgroundColor: "var(--color-muted)",
            fontSize: "0.75rem",
          }}
        >
          DayPicker
        </code>{" "}
        and is styled with your design tokens.
      </p>

      <div
        style={{
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-ring)",
          padding: "1rem",
          backgroundColor: "var(--color-white-true)",
          maxWidth: "fit-content",
        }}
      >
        <DayPicker
          mode="range"
          selected={{ from: today, to: nextMonth }}
          defaultMonth={today}
          numberOfMonths={2}
          showOutsideDays
          disabled={{ before: today }}
        />
      </div>
    </section>
  );
}
