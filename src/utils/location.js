export function normalizeLocation(loc) {
if (!loc) return "";
if (typeof loc === "string") return loc;
const { address, city, region, state, zip, country } = loc || {};
return [address, city, region ?? state, zip, country]
.map((x) => (x ?? "").toString().trim())
.filter(Boolean)
.join(", ");
}
export function toSearch(v) { return String(v ?? "").toLowerCase().trim(); }