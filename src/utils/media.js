// src/utils/media.js

// ---- Image/Media helpers ----
export const IMAGE_EXT_RE = /\.(avif|webp|png|jpe?g|gif|svg)$/i;

export function isValidImageUrl(s) {
  if (typeof s !== "string") return false;
  const u = s.trim();
  if (!/^https?:\/\//i.test(u)) return false;
  const path = u.split("?")[0].toLowerCase();
  return IMAGE_EXT_RE.test(path);
}

export function hasGoodMedia(v) {
  return Array.isArray(v?.media) && v.media.some((m) => m?.url && isValidImageUrl(m.url));
}

export function firstGoodMedia(v) {
  if (!Array.isArray(v?.media)) return undefined;
  return v.media.find((m) => m?.url && isValidImageUrl(m.url));
}

export function labelForLocation(v) {
  const city = v?.location?.city;
  const country = v?.location?.country;
  return [city, country].filter(Boolean).join(", ") || v?.location?.address || "";
}

// ---- Synthetic place info helpers (for your small info cards) ----
export function hashInt(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function currencyFor(country = "") {
  const map = {
    Norway: "NOK",
    Sweden: "SEK",
    Finland: "EUR",
    Denmark: "DKK",
    Iceland: "ISK",
    "United Kingdom": "GBP",
    UK: "GBP",
    Ireland: "EUR",
    Germany: "EUR",
    France: "EUR",
    Spain: "EUR",
    Italy: "EUR",
    Portugal: "EUR",
    Netherlands: "EUR",
    Belgium: "EUR",
    Greece: "EUR",
    Romania: "RON",
    Poland: "PLN",
    USA: "USD",
    "United States": "USD",
  };
  return map[country] || "local currency";
}

export function parseCityCountry(label = "") {
  const [c, k] = label.split(",").map((s) => s.trim());
  return { city: k ? c : c, country: k || "" };
}

export function generatePlaceInfo(label) {
  const { city, country } = parseCityCountry(label);
  const h = hashInt(label);
  const inhabitants = Math.round(80_000 + (h % 2_420_000)); // synthetic
  const tMin = (h % 12) - 2;
  const tMax = tMin + 12 + ((h >> 3) % 8);
  const curr = currencyFor(country);
  const blurb =
    city || country
      ? `Auto-generated overview for ${city ? city : country}. A great base for food, culture, and outdoor experiences.`
      : "Auto-generated overview. Explore local highlights, cuisine, and nature spots.";
  return {
    inhabitants,
    country: country || "—",
    currency: curr,
    temperature: `${tMin}–${tMax}°C`,
    blurb,
  };
}
