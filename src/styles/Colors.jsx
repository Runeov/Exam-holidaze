export function Colors() {
  const colors = [
    ["--color-brand-50", "Brand 50"],
    ["--color-brand-100", "Brand 100"],
    ["--color-brand-300", "Brand 300"],
    ["--color-brand-500", "Brand 500"],
    ["--color-brand-700", "Brand 700"],
    ["--color-brand-900", "Brand 900"], // NEW: #792fe1

    ["--color-accent-50", "Accent 50"],
    ["--color-accent-100", "Accent 100"],
    ["--color-accent-300", "Accent 300"],
    ["--color-accent-500", "Accent 500"],
    ["--color-accent-700", "Accent 700"],
    ["--color-accent-900", "Accent 900"], // NEW: #fe5f8e

    ["--color-star", "Star Yellow"], // NEW: #ffca4c
    ["--color-glow-blue", "Glow Blue"], // NEW: #14b2c4
    ["--color-energy", "Energy Magenta"], // NEW: #d745e3
    ["--color-midnight", "Midnight"], // NEW: #1e4179

    ["--color-success-500", "Success 500"],
    ["--color-error-500", "Error 500"],
    ["--color-muted", "Muted"],
    ["--color-text", "Text"],
    ["--color-text-muted", "Text Muted"],

    // 🌊 Holidaze Brand Colors
    ["--color-holidaze-navbar-500", "Holidaze Navbar"], // #0a1b4f
    ["--color-holidaze-card-500", "Holidaze Card"], // #097e8e
    ["--color-holidaze-background-500", "Holidaze Background"], // #027b6e
  ];

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6text-[color:var(--color-brand-50)]">🎨 Colors</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 text-[color:var(--color-brand-50)]">
        {colors.map(([variable, label]) => (
          <div key={variable} className="space-y-2">
            <div
              className="w-full h-16 rounded-lg shadow-sm border border-gray-200"
              style={{ backgroundColor: `var(${variable})` }}
            />
            <div className="text-sm text-[--color-text] font-medium">{label}</div>
            <code className="block text-xs text-[--color-text-muted]">{variable}</code>
          </div>
        ))}
      </div>
    </section>
  );
}
