// components/WikivoyageAttribution.jsx
export default function WikivoyageAttribution({ title, oldid }) {
  const href = oldid
    ? `https://en.wikivoyage.org/w/index.php?title=${encodeURIComponent(title)}&oldid=${oldid}`
    : `https://en.wikivoyage.org/wiki/${encodeURIComponent(title)}`;

  return (
    <p className="mt-3 text-xs text-text-muted">
      Text from{" "}
      <a className="underline" href={href} target="_blank" rel="noopener noreferrer">
        “{title}” on Wikivoyage
      </a>
      , licensed under{" "}
      <a
        className="underline"
        href="https://creativecommons.org/licenses/by-sa/4.0/"
        target="_blank"
        rel="noopener noreferrer"
      >
        CC BY-SA 4.0
      </a>
      . Changes may have been made.
    </p>
  );
}
