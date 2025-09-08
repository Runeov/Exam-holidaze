// utils/wiki.js
const UA = "Holidaze/1.0 (contact: you@example.com)";
const cache = new Map();

function titleCase(s = "") {
  return s
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function fetchWikivoyageIntro(titleRaw) {
  const title = titleCase(titleRaw || "");
  if (!title) return { text: "", title, oldid: null };

  if (cache.has(title)) return cache.get(title);

  const url = `https://en.wikivoyage.org/w/api.php?action=query&prop=extracts|info&exintro=1&explaintext=1&redirects=1&format=json&origin=*&inprop=url&titles=${encodeURIComponent(title)}`;

  const res = await fetch(url, { headers: { "Api-User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  const page = Object.values(data?.query?.pages || {})[0];
  const text = (page?.extract || "").trim();
  const oldid = page?.lastrevid || null;

  const out = { text, title: page?.title || title, oldid };
  cache.set(title, out);
  return out;
}
