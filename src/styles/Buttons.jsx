// ⬆️ Top of Buttons.js or Buttons.jsx
export const base =
  "inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 ring-[--color-accent-500] ring-offset-2";

export const sizeMap = {
  sm: "text-sm px-3 py-1.5",
  md: "text-base px-4 py-2",
  lg: "text-lg px-5 py-3",
};

export const variantMap = {
  primary:
    "ring-[color:var(--color-star)] bg-[color:var(--color-brand-500)] text-[color:var(--color-white-true)] hover:bg-[color:var(--color-brand-700)] active:scale-[0.98]",

  secondary:
    "ring-[color:var(--color-growth-700)] bg-[color:var(--color-growth-500)] text-[color:var(--color-white-true)] hover:bg-[color:var(--color-growth-700)] active:scale-[0.98]",

  growth:
    "ring-[color:var(--color-growth-500)] bg-[color:var(--color-growth-300)] text-[color:var(--color-text)] hover:bg-[color:var(--color-growth-500)] active:scale-[0.98]",

  star: "ring-[color:var(--color-star)] bg-[color:var(--color-star)] text-[color:var(--color-text)] hover:bg-[color:var(--color-star-300)] active:scale-[0.98]",

  create:
    "ring-[color:var(--color-energy)] bg-[color:var(--color-accent-300)] text-[color:var(--color-text)] hover:bg-[color:var(--color-energy)] active:scale-[0.98]",

  outline:
    "ring-[color:var(--color-accent-500)] border border-[color:var(--color-accent-500)] text-[color:var(--color-accent-500)] hover:bg-[color:var(--color-accent-50)] active:scale-[0.98]",

  danger:
    "ring-[color:var(--color-error-500)] bg-[color:var(--color-error-500)] text-[color:var(--color-white-true)] hover:bg-[color:var(--color-error-700)] active:scale-[0.98]",

  brand300:
    "ring-[color:var(--color-brand-500)] bg-[color:var(--color-brand-300)] text-[color:var(--color-text)] hover:bg-[color:var(--color-brand-500)] active:scale-[0.98]",

  brand500:
    "ring-[color:var(--color-brand-700)] bg-[color:var(--color-brand-500)] text-[color:var(--color-white-true)] hover:bg-[color:var(--color-brand-700)] active:scale-[0.98]",

  accent500:
    "ring-[color:var(--color-accent-700)] bg-[color:var(--color-accent-500)] text-[color:var(--color-white-true)] hover:bg-[color:var(--color-accent-700)] active:scale-[0.98]",
};

export function Buttons() {
  return (
    <section
      className="p-6 rounded-[var(--radius-md)] bg-[--color-surface] shadow-md space-y-6"
      data-theme="light"
    >
      <h2 className="text-2xl font-semibold text-[--color-text]">🔘 Buttons</h2>

      {/* Variants */}
      <div className="space-y-4">
        <div className="text-[--color-text-muted] text-sm font-semibold">Variants (md):</div>
        <div className="flex flex-wrap gap-4">
          <button type="button" className={`${base} ${sizeMap.md} ${variantMap.primary}`}>
            Primary
          </button>
          <button type="button" className={`${base} ${sizeMap.md} ${variantMap.secondary}`}>
            Secondary
          </button>
          <button type="button" className={`${base} ${sizeMap.md} ${variantMap.growth}`}>
            Growth
          </button>
          <button type="button" className={`${base} ${sizeMap.md} ${variantMap.star}`}>
            Star
          </button>
          <button type="button" className={`${base} ${sizeMap.md} ${variantMap.create}`}>
            Create
          </button>
          <button type="button" className={`${base} ${sizeMap.md} ${variantMap.outline}`}>
            Outline
          </button>
          <button type="button" className={`${base} ${sizeMap.md} ${variantMap.danger}`}>
            Danger
          </button>
          <button type="button" className={`${base} ${sizeMap.md} ${variantMap.brand300}`}>
            Brand 300
          </button>
          <button type="button" className={`${base} ${sizeMap.md} ${variantMap.brand500}`}>
            Brand 500
          </button>
          <button type="button" className={`${base} ${sizeMap.md} ${variantMap.accent500}`}>
            Accent 500
          </button>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-4">
        <div className="text-[--color-text-muted] text-sm font-semibold">
          Sizes (Primary variant):
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <button type="button" className={`${base} ${sizeMap.sm} ${variantMap.primary}`}>
            Small
          </button>
          <button type="button" className={`${base} ${sizeMap.md} ${variantMap.primary}`}>
            Medium
          </button>
          <button type="button" className={`${base} ${sizeMap.lg} ${variantMap.primary}`}>
            Large
          </button>
        </div>
      </div>
    </section>
  );
}
