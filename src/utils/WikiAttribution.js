// utils/wikiAttribution.js
export function buildPermalink(title, oldid) {
  if (!title || !oldid) return `https://en.wikivoyage.org/wiki/${encodeURIComponent(title)}`;
  return `https://en.wikivoyage.org/w/index.php?title=${encodeURIComponent(title)}&oldid=${oldid}`;
}
