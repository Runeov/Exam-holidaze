// src/logic/profileSync.js
import { updateProfile } from "../api/profiles";
import { getMyVenues } from "../api/venues";
import { readSession, writeSession } from "../utils/session";

/**
 * Save profile → persist locally → refresh my venues.
 *
 * @param {{
 *   name: string,
 *   changes: {
 *     bio?: string,
 *     venueManager?: boolean,
 *     avatarUrl?: string, avatarAlt?: string,
 *     bannerUrl?: string, bannerAlt?: string
 *   },
 *   withBookings?: boolean,       // include bookings in refreshed venues
 *   applyProfile?: (p: object) => void  // optional; from AuthContext
 * }} args
 * @returns {Promise<{ profile: object, venues: object[] }>}
 */
export async function saveProfileAndRefresh({
  name,
  changes,
  withBookings = true,
  applyProfile, // optional: from AuthContext to update React state
}) {
  if (!name) throw new Error("saveProfileAndRefresh: 'name' is required");

  // 1) Update on server (returns the updated profile)
  const updated = await updateProfile(name, changes);

  // 2) Persist locally so a page refresh keeps changes
  //    (Support both keys 'profile' and 'user' to match older code paths.)
  const cur = readSession() || {};
  writeSession({
    ...cur,
    profile: { ...(cur.profile || {}), ...updated },
    user: { ...(cur.user || {}), ...updated },
  });

  // Also push into AuthContext if provided
  if (typeof applyProfile === "function") {
    try {
      applyProfile(updated);
    } catch {
      /* ignore if consumer didn't wire it yet */
    }
  }

  // 3) Refresh my venues (optionally with _bookings)
  const res = await getMyVenues(name, { withBookings });
  const venues = res?.data?.data ?? res?.data ?? [];

  return { profile: updated, venues };
}
