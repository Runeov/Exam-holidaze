// src/api/profiles.js
import { httpGet, httpPut } from "./http.js";

const isHttpUrl = (u) => !!u && /^https?:\/\//i.test(u);

/**
 * GET /holidaze/profiles/:name
 * Optional expansions: _venues, _bookings, _owner (Noroff v2 defaults false)
 */
export function getProfile(
  name,
  { withVenues = false, withBookings = false, withOwner = false } = {},
) {
  const params = {
    _venues: withVenues || undefined,
    _bookings: withBookings || undefined,
    _owner: withOwner || undefined,
  };
  return httpGet(`/holidaze/profiles/${encodeURIComponent(name)}`, { params });
}

/**
 * PUT /holidaze/profiles/:name
 * Accepts any combo of: bio, venueManager, avatar {url,alt}, banner {url,alt}
 * NOTE: avatar.url and banner.url MUST be publicly accessible http(s) URLs.
 *
 * @param {string} name
 * @param {{
 *   bio?: string,
 *   venueManager?: boolean,
 *   avatarUrl?: string, avatarAlt?: string,
 *   bannerUrl?: string, bannerAlt?: string
 * }} changes
 * @returns {Promise<object>} The updated profile (Noroff returns {data, meta}; we return data)
 */
export async function updateProfile(name, changes = {}) {
  if (!name) throw new Error("updateProfile: 'name' is required");

  const payload = {};

  // bio
  if (typeof changes.bio === "string") {
    const b = changes.bio.trim();
    if (b) payload.bio = b;
  }

  // venueManager (only include if explicitly boolean)
  if (typeof changes.venueManager === "boolean") {
    payload.venueManager = changes.venueManager;
  }

  // avatar
  if (changes.avatarUrl) {
    if (!isHttpUrl(changes.avatarUrl))
      throw new Error("Avatar URL must start with http(s) and be publicly accessible.");
    payload.avatar = { url: changes.avatarUrl, alt: changes.avatarAlt || "" };
  }

  // banner
  if (changes.bannerUrl) {
    if (!isHttpUrl(changes.bannerUrl))
      throw new Error("Banner URL must start with http(s) and be publicly accessible.");
    payload.banner = { url: changes.bannerUrl, alt: changes.bannerAlt || "" };
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("Provide at least one field to update (bio, venueManager, avatar, banner).");
  }

  const res = await httpPut(`/holidaze/profiles/${encodeURIComponent(name)}`, payload);
  return res?.data?.data ?? res?.data; // return the profile object
}
