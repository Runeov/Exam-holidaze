// src/utils/flash.js
import { get, remove, save } from "./storage";

const FLASH_KEY = "flash";

/** Store a one-time message for the next page render. */
export function pushFlash(message, type = "success") {
  // keep payload small and serializable
  save(FLASH_KEY, { message, type, ts: Date.now() });
}

/** Read & clear the stored message. Returns: { message, type } | undefined */
export function popFlash() {
  const f = get(FLASH_KEY);
  if (f) remove(FLASH_KEY);
  return f;
}
