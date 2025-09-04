const KEY = "holidaze:session";

export function readSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
export function writeSession(next) {
  const cur = readSession();
  const merged = { ...cur, ...next };
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}
export function clearSession() {
  localStorage.removeItem(KEY);
}
