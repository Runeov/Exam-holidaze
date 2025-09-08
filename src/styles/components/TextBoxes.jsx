/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
import React, { useId, useState } from "react";

export function TextBoxes() {
  const uid = useId();
  const idText = `${uid}-text`;
  const idNumber = `${uid}-number`;
  const idTextarea = `${uid}-textarea`;
  const idSelect = `${uid}-select`;
  const idHelp = `${uid}-help`;
  const idError = `${uid}-error`;

  const inputBase =
    "w-full rounded-[var(--radius-md)] border border-[--color-ring] bg-[--color-surface] " +
    "px-4 py-2 text-[--color-text] placeholder:text-[--color-text-muted] " +
    "focus:outline-none focus:ring-2 ring-[--color-brand-500] transition shadow-sm";
  const labelBase = "block text-sm font-medium text-[--color-text] mb-1";
  const helpText = "text-xs text-[--color-text-muted] mt-1";
  const errorText = "text-xs text-[--color-error-500] mt-1";
  const invalid =
    "aria-[invalid=true]:border-[--color-error-500] aria-[invalid=true]:ring-[--color-error-500]";

  const [demoValue, setDemoValue] = useState("");
  const [error, setError] = useState("");

  return (
    <section className="p-6 rounded-[var(--radius-md)] bg-[--color-surface] border border-[--color-ring] shadow-sm space-y-6">
      <h2 className="text-2xl font-semibold text-[--color-text]">🧩 TextBoxes</h2>
      <p className="text-[--color-text-muted]">
        Standardized inputs for all forms. Copy these classes into your forms to ensure consistency.
      </p>

      {/* Text input */}
      <div>
        <label htmlFor={idText} className={labelBase}>
          Text
        </label>
        <input
          id={idText}
          type="text"
          className={`${inputBase} ${invalid}`}
          placeholder="Where to?"
          aria-describedby={idHelp}
          aria-invalid={error ? "true" : "false"}
          value={demoValue}
          onChange={(e) => {
            setDemoValue(e.target.value);
            setError(e.target.value.length > 40 ? "Max 40 characters." : "");
          }}
        />
        <p id={idHelp} className={helpText}>
          Helpful hint goes here.
        </p>
        {error ? (
          <p id={idError} className={errorText}>
            {error}
          </p>
        ) : null}
      </div>

      {/* Number input */}
      <div>
        <label htmlFor={idNumber} className={labelBase}>
          Number
        </label>
        <input
          id={idNumber}
          type="number"
          min="0"
          step="1"
          placeholder="120"
          className={inputBase}
        />
      </div>

      {/* Textarea */}
      <div>
        <label htmlFor={idTextarea} className={labelBase}>
          Textarea
        </label>
        <textarea id={idTextarea} rows={4} placeholder="Tell us more..." className={inputBase} />
      </div>

      {/* Select */}
      <div>
        <label htmlFor={idSelect} className={labelBase}>
          Select
        </label>
        <select id={idSelect} className={inputBase} defaultValue="">
          <option value="" disabled>
            Choose one…
          </option>
          <option>Option A</option>
          <option>Option B</option>
        </select>
      </div>

      {/* Disabled input */}
      <div>
        <label className={labelBase}>Disabled</label>
        <input
          disabled
          placeholder="Disabled"
          className={`${inputBase} opacity-60 cursor-not-allowed`}
        />
      </div>

      {/* Reusable class snippet */}
      <div className="mt-4 p-3 rounded-[var(--radius-md)] bg-[--color-muted]">
        <p className="text-sm text-[--color-text] font-semibold mb-1">Reusable classes</p>
        <pre className="text-xs text-[--color-text] whitespace-pre-wrap">
          {`const inputBase =
  "w-full rounded-[var(--radius-md)] border border-[--color-ring] bg-[--color-surface] " +
  "px-4 py-2 text-[--color-text] placeholder:text-[--color-text-muted] " +
  "focus:outline-none focus:ring-2 ring-[--color-brand-500] transition shadow-sm";

const labelBase = "block text-sm font-medium text-[--color-text] mb-1";
const helpText = "text-xs text-[--color-text-muted] mt-1";
const errorText = "text-xs text-[--color-error-500] mt-1";
const invalid =
  "aria-[invalid=true]:border-[--color-error-500] aria-[invalid=true]:ring-[--color-error-500]";`}
        </pre>
      </div>
    </section>
  );
}
