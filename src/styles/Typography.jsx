/** biome-ignore-all lint/a11y/useValidAnchor: <explanation> */
export function Typography() {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">🔤 Typography</h2>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-[--color-text]">Heading 1</h1>
        <h2 className="text-3xl font-semibold text-[--color-text]">Heading 2</h2>
        <h3 className="text-2xl font-medium text-[--color-text]">Heading 3</h3>
        <p className="text-base text-[--color-text]">Body text using base font size</p>
        <p className="text-sm text-[--color-text-muted]">Muted small text</p>
        <a href="#" className="text-[--color-accent-500] underline">
          This is a link
        </a>
      </div>
    </section>
  );
}
