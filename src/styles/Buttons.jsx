export function Buttons() {
  const base =
    "inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 ring-[--color-accent-500] ring-offset-2";

  const sizeMap = {
    sm: "text-sm px-3 py-1.5",
    md: "text-base px-4 py-2",
    lg: "text-lg px-5 py-3",
  };

  const variantMap = {
    primary:
      "ring-[color:var(--color-accent-500)] bg-[color:var(--color-brand-500)] text-[color:var(--color-muted)] hover:bg-[color:var(--color-accent-700)] active:scale-[0.98]",

    secondary:
      "ring-[color:var(--color-brand-500)] bg-[color:var(--color-brand-300)] text-[color:var(--color-muted)] hover:bg-[color:var(--color-brand-700)] active:scale-[0.98]",

    outline:
      "ring-[color:var(--color-accent-500)] border border-[color:var(--color-accent-500)] text-[color:var(--color-accent-500)] hover:bg-[color:var(--color-accent-50)] active:scale-[0.98]",

    danger:
      "ring-[color:var(--color-error-500)] bg-[color:var(--color-error-500)] text-[color:var(--color-text)] hover:bg-[color:var(--color-error-700)] active:scale-[0.98]",

    brand300:
      "ring-[color:var(--color-brand-500)] bg-[color:var(--color-brand-300)] text-[color:var(--color-text)] hover:bg-[color:var(--color-brand-500)] active:scale-[0.98]",

    brand500:
      "ring-[color:var(--color-brand-700)] bg-[color:var(--color-brand-500)] text-[color:var(--color-text)] hover:bg-[color:var(--color-brand-700)] active:scale-[0.98]",

    accent500:
      "ring-[color:var(--color-accent-700)] bg-[color:var(--color-accent-500)] text-[color:var(--color-text)] hover:bg-[color:var(--color-accent-700)] active:scale-[0.98]",
  };

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
          <button type="button" className={`${base} ${sizeMap.md} ${variantMap.outline}`}>
            Outline
          </button>
          <button type="button" className={`${base} ${sizeMap.md} ${variantMap.danger}`}>
            Danger
          </button>
          <button type="button" className={`${variantMap.brand300}`}>
            Brand 300
          </button>
          <button type="button" className={`${variantMap.brand500}`}>
            Brand 500
          </button>
          <button type="button" className={`${variantMap.accent500}`}>
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
