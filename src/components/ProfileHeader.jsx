/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
import React from "react";

export default function ProfileHeader({
  variant = "full",
  name,
  subtitle = "",
  venueManager = false,
  bannerUrl = "",
  avatarUrl = "",
  rightSlot = null,
}) {
  const isFull = variant === "full";

  return (
    <header className="relative">
      {/* Visual preview (full variant only) */}
      {isFull && (bannerUrl || avatarUrl) && (
        <section aria-label="Profile visual preview" className="relative -mx-10 -mt-10 mb-12">
          {/* Banner */}
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt="Banner preview"
              className="h-32 w-full object-cover rounded-t-xl"
              loading="lazy"
            />
          ) : (
            // Subtle placeholder when no banner, keeps layout stable
            <div className="h-16 w-full rounded-t-xl bg-[var(--color-surface,#f9fafb)] border-b border-[var(--color-ring,#e5e7eb)]" />
          )}

          {/* Avatar overlapping the banner edge */}
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt="Avatar preview"
              className="absolute left-6 -bottom-8 w-24 h-24 rounded-full border-4 border-white shadow"
              loading="lazy"
            />
          )}
          {/* Spacer for overlap */}
          {avatarUrl && <div className="h-10" />}
        </section>
      )}

      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="min-w-0">
          <h2 className={isFull ? "font-semibold text-lg truncate" : "font-semibold text-base truncate"}>
            {name || "Profile"}
          </h2>

          {(subtitle || venueManager) && (
            <div className={isFull ? "mt-0.5 flex items-center gap-2 text-sm text-gray-600" : "mt-0.5 flex items-center gap-2 text-xs text-gray-600"}>
              {subtitle && <span className="truncate">{subtitle}</span>}
              {venueManager && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium
                             bg-[var(--color-brand-50)] text-[var(--color-brand-700)]
                             border border-[color:var(--color-brand-300)]"
                  title="Venue Manager"
                >
                  Venue Manager
                </span>
              )}
            </div>
          )}
        </div>

        {rightSlot && <div className="sm:ml-auto">{rightSlot}</div>}
      </div>
    </header>
  );
}
