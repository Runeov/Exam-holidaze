// Minimal storage helpers
export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[storage] save ${key} failed`, err);
  }
}

export function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (err) {
    console.error(`[storage] get ${key} failed`, err);
    return fallback;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`[storage] remove ${key} failed`, err);
  }
}
