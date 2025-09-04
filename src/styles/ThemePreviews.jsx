export function ThemePreviews() {
  const baseButton =
    "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-[--color-text]">🌗 Theme Previews</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Light Theme Preview */}
        <div data-theme="light">
          <div className="p-6 rounded-[var(--radius-md)] bg-[--color-muted] shadow-md space-y-4">
            <h3 className="text-lg font-semibold text-[--color-text]">Light Theme</h3>
            <p className="text-sm text-[--color-text-muted]">
              This preview shows how tokens render in light mode.
            </p>
            <button
              className={`${baseButton} bg-[--color-accent-500] text-[--color-text] hover:bg-[--color-accent-700]`}
            >
              CTA Button
            </button>
          </div>
        </div>

        {/* Dark Theme Preview */}
        <div data-theme="dark">
          <div className="p-6 rounded-[var(--radius-md)] bg-[--color-muted] shadow-md space-y-4">
            <h3 className="text-lg font-semibold text-[--color-text]">Dark Theme</h3>
            <p className="text-sm text-[--color-text-muted]">
              This preview shows how tokens render in dark mode.
            </p>
            <button
              className={`${baseButton} bg-[--color-accent-500] text-[--color-text] hover:bg-[--color-accent-700]`}
            >
              CTA Button
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
