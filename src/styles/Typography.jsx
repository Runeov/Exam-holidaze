/** biome-ignore-all lint/a11y/useValidAnchor: <explanation> */
export function Typography() {
  return (
    <section className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-semibold tracking-tight text-[--color-text] mb-6">
        🔤 Typography
      </h2>

      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight text-[--color-text]">
          Heading 1
        </h1>

        <h2 className="text-3xl md:text-4xl font-semibold leading-snug text-[--color-text]">
          Heading 2
        </h2>

        <h3 className="text-2xl md:text-3xl font-medium leading-snug text-[--color-text]">
          Heading 3
        </h3>

        <p className="text-base md:text-lg text-[--color-text] leading-relaxed">
          Body text using base font size with enhanced readability.
        </p>

        <p className="text-sm text-[--color-text-muted] leading-snug">
          Muted small text for secondary content.
        </p>

        <a
          href="#"
          className="text-[--color-accent-500] underline underline-offset-2 hover:text-[--color-accent-600] focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent-500] rounded"
        >
          This is a link
        </a>
      </div>
    </section>
  );
}
