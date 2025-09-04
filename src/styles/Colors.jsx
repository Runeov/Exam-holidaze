export function Colors() {
  const colors = [
    ["--color-brand-50", "Brand 50"],
    ["--color-brand-100", "Brand 100"],
    ["--color-brand-300", "Brand 300"],
    ["--color-brand-500", "Brand 500"],
    ["--color-brand-700", "Brand 700"],
    ["--color-accent-50", "Accent 50"],
    ["--color-accent-100", "Accent 100"],
    ["--color-accent-300", "Accent 300"],
    ["--color-accent-500", "Accent 500"],
    ["--color-accent-700", "Accent 700"],
    ["--color-success-500", "Success 500"],
    ["--color-error-500", "Error 500"],
    ["--color-muted", "Muted"],
    ["--color-text", "Text"],
    ["--color-text-muted", "Text Muted"],
  ];

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6">🎨 Colors</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
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
