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
      "bg-[--color-accent-500] text-[--color-text] hover:bg-[--color-accent-700] active:scale-[0.98]",
    secondary:
      "bg-[--color-brand-500] text-[--color-text] hover:bg-[--color-brand-700] active:scale-[0.98]",
    outline:
      "border border-[--color-accent-500] text-[--color-accent-500] hover:bg-[--color-accent-50] active:scale-[0.98]",
    danger: "bg-[--color-error-500] text-[--color-text] hover:bg-red-700 active:scale-[0.98]",
  };

  return (
    <section
      className="p-6 rounded-[var(--radius-md)] bg-[--color-muted] shadow-md space-y-6"
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
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-[--color-text]
             bg-[--color-accent-500] hover:bg-[--color-accent-700]
             rounded-[var(--radius-md)] transition
             focus:outline-none focus-visible:ring-2 ring-[--color-accent-500] ring-offset-2"
          >
            Hover me
          </button>
        </div>
      </div>
    </section>
  );
}
