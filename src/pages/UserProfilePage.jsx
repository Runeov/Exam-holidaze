// src/pages/UserProfilePage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProfile } from "../api/profiles";

// ——— Local helpers
function safeDate(dateLike) {
  const t = Date.parse(dateLike);
  return Number.isFinite(t) ? new Date(t) : null;
}
function fmtRange(from, to) {
  const f = safeDate(from);
  const t = safeDate(to);
  const fStr = f ? f.toLocaleDateString() : "—";
  const tStr = t ? t.toLocaleDateString() : "—";
  return `${fStr} → ${tStr}`;
}
function safeArr(a) {
  return Array.isArray(a) ? a : [];
}
function firstMedia(v) {
  const arr = safeArr(v?.media);
  return arr.length ? arr[0] : null;
}
function mediaUrl(v) {
  const m = firstMedia(v);
  return m?.url || "";
}
function mediaAlt(v) {
  const m = firstMedia(v);
  return m?.alt || v?.name || "Venue image";
}

export default function UserProfilePage() {
  const { name } = useParams();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | idle | error
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUser() {
      try {
        setStatus("loading");
        const res = await getProfile(name, { withBookings: true, withVenues: true });
        const profile = res?.data?.data ?? res?.data ?? res;
        setUser(profile);
        setStatus("idle");
        document.title = `Holidaze | ${profile?.name || "User"}`;
      } catch (err) {
        console.error("Failed to load user profile", err);
        setError("Could not load user profile.");
        setStatus("error");
        document.title = "Holidaze | Error";
      }
    }

    if (name) {
      document.title = "Holidaze | Profile";
      fetchUser();
    }
  }, [name]);

  if (status === "loading") {
    return <p className="p-6 text-white">Loading profile…</p>;
  }
  if (status === "error") {
    return <p className="p-6 text-red-100 bg-red-900/40 border border-red-600 rounded">{error}</p>;
  }
  if (!user) {
    return <p className="p-6 text-white">User not found.</p>;
  }

  // ——— Normalize & split bookings
  const rows = safeArr(user.bookings).slice();
  rows.sort((a, b) => (Date.parse(b?.dateFrom) || 0) - (Date.parse(a?.dateFrom) || 0));
  const now = new Date();
  const upcoming = rows.filter((b) => {
    const to = safeDate(b?.dateTo);
    return to ? to >= now : false;
  });
  const past = rows.filter((b) => {
    const to = safeDate(b?.dateTo);
    return to ? to < now : false;
  });

  const hasBanner = Boolean(user?.banner?.url);
  const hasAvatar = Boolean(user?.avatar?.url);
  const avatarInitial = user?.name?.[0]?.toUpperCase() || "U";

  return (
    <div className="p-0 md:p-6">
      {/* Header / Cover */}
      <header className="relative mb-6">
        <div className="relative w-full aspect-[16/5] overflow-hidden">
          {hasBanner ? (
            <img
              src={user.banner.url}
              alt={user.banner.alt || `${user.name}'s banner`}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-teal-700"
              aria-hidden="true"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" aria-hidden="true" />
        </div>

        {/* Avatar + name */}
        <div className="relative max-w-[var(--container-max)] mx-auto px-6 -mt-12 flex items-end gap-4">
          {hasAvatar ? (
            <img
              src={user.avatar.url}
              alt={user.avatar.alt || `${user.name} avatar`}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow"
              loading="lazy"
            />
          ) : (
            <div
              role="img"
              aria-label={(user?.name || "User") + " avatar"}
              className="w-24 h-24 rounded-full bg-white border-4 border-white flex items-center justify-center text-3xl font-semibold text-slate-700 shadow"
            >
              <span aria-hidden="true">{avatarInitial}</span>
            </div>
          )}

          <div className="pb-2 text-white drop-shadow">
            <h1 className="text-3xl md:text-4xl font-bold">{user.name}</h1>
            {user.email && <p className="text-sm md:text-base opacity-90">{user.email}</p>}
            {user.venueManager && (
              <span className="inline-block mt-2 text-xs font-medium bg-white/20 backdrop-blur px-2 py-1 rounded-full">
                Venue manager
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-[var(--container-max)] mx-auto px-6 space-y-8">
        {/* Venues */}
        {user.venueManager && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Venues</h2>
            {safeArr(user.venues).length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {user.venues.map((v) => {
                  const img = mediaUrl(v);
                  const alt = mediaAlt(v);
                  return (
                    <article
                      key={v?.id || v?._id || v?.name}
                      className="border rounded-xl overflow-hidden bg-white"
                    >
                      {/* Venue cover image */}
                      <div className="relative w-full aspect-[4/3] bg-gray-100">
                        {img ? (
                          <img
                            src={img}
                            alt={alt}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="absolute inset-0 flex items-center justify-center text-gray-400"
                            aria-hidden="true"
                            title="No image"
                          >
                            No image
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="text-lg font-semibold">{v?.name || "Untitled venue"}</h3>
                        {v?.description && (
                          <p className="text-sm text-gray-700 mt-0.5 line-clamp-3">
                            {v.description}
                          </p>
                        )}
                        {Number.isFinite(Number(v?.maxGuests)) && (
                          <p className="text-sm mt-1">Max Guests: {v.maxGuests}</p>
                        )}
                        {v?.id && (
                          <Link
                            to={`/venues/${v.id}`}
                            className="text-blue-700 underline text-sm mt-2 inline-block"
                          >
                            View venue
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/80">No venues found.</p>
            )}
          </section>
        )}

        {/* Upcoming Bookings */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Upcoming Bookings</h2>
          {upcoming.length > 0 ? (
            <ul className="space-y-2">
              {upcoming.map((b) => {
                const v = b?.venue || {};
                const img = mediaUrl(v);
                const alt = mediaAlt(v);
                return (
                  <li
                    key={b?.id || `${v?.id || "v"}-${b?.dateFrom || Math.random()}`}
                    className="border rounded p-3 bg-white"
                  >
                    <div className="flex items-start gap-3">
                      {/* Venue thumbnail */}
                      <div className="relative w-24 h-20 flex-none rounded-md overflow-hidden bg-gray-100">
                        {img ? (
                          <img
                            src={img}
                            alt={alt}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="absolute inset-0 flex items-center justify-center text-xs text-gray-400"
                            aria-hidden="true"
                          >
                            No image
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 text-sm">
                        <strong className="block">{v?.name || "Unknown venue"}</strong>
                        <span className="block">{fmtRange(b?.dateFrom, b?.dateTo)}</span>
                        {Number.isFinite(Number(b?.guests)) && (
                          <span className="block">Guests: {b.guests}</span>
                        )}
                        {v?.id && (
                          <Link
                            to={`/venues/${v.id}`}
                            className="text-blue-700 underline text-sm"
                          >
                            View venue
                          </Link>
                        )}
                      </div>

                      {/* User avatar (small chip) */}
                      <div className="flex-none">
                        {hasAvatar ? (
                          <img
                            src={user.avatar.url}
                            alt={user.avatar.alt || `${user.name} avatar`}
                            className="w-8 h-8 rounded-full object-cover border"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 border"
                            aria-hidden="true"
                            title="No avatar"
                          >
                            {avatarInitial}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-white/80">No upcoming bookings.</p>
          )}
        </section>

        {/* Past Bookings */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Past Bookings</h2>
          {past.length > 0 ? (
            <ul className="space-y-2">
              {past.map((b) => {
                const v = b?.venue || {};
                const img = mediaUrl(v);
                const alt = mediaAlt(v);
                return (
                  <li
                    key={b?.id || `${v?.id || "v"}-${b?.dateTo || Math.random()}`}
                    className="border rounded p-3 bg-white"
                  >
                    <div className="flex items-start gap-3">
                      {/* Venue thumbnail */}
                      <div className="relative w-24 h-20 flex-none rounded-md overflow-hidden bg-gray-100">
                        {img ? (
                          <img
                            src={img}
                            alt={alt}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="absolute inset-0 flex items-center justify-center text-xs text-gray-400"
                            aria-hidden="true"
                          >
                            No image
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 text-sm">
                        <strong className="block">{v?.name || "Unknown venue"}</strong>
                        <span className="block">{fmtRange(b?.dateFrom, b?.dateTo)}</span>
                        {Number.isFinite(Number(b?.guests)) && (
                          <span className="block">Guests: {b.guests}</span>
                        )}
                        {v?.id && (
                          <Link
                            to={`/venues/${v.id}`}
                            className="text-blue-700 underline text-sm"
                          >
                            View venue
                          </Link>
                        )}
                      </div>

                      {/* Completed tag */}
                      <span className="text-xs text-gray-500 flex-none">Completed</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-white/80">No past bookings.</p>
          )}
        </section>
      </div>
    </div>
  );
}
