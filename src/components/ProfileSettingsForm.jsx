ProfileSettingsForm; // src/components/ProfileSettingsForm.jsx

import { useEffect, useState } from "react";
import { updateProfile } from "../api/profiles";

function isHttpUrl(u) {
  return !u || /^https?:\/\//i.test(u);
}

export default function ProfileSettingsForm({ profile, onProfileUpdated }) {
  const [pf, setPf] = useState({
    bio: "",
    avatarUrl: "",
    avatarAlt: "",
    bannerUrl: "",
    bannerAlt: "",
    venueManager: false,
  });
  const [msg, setMsg] = useState({ saving: false, error: "", ok: "" });

  useEffect(() => {
    if (!profile) return;
    setPf({
      bio: profile.bio || "",
      avatarUrl: profile.avatar?.url || "",
      avatarAlt: profile.avatar?.alt || "",
      bannerUrl: profile.banner?.url || "",
      bannerAlt: profile.banner?.alt || "",
      venueManager: Boolean(profile.venueManager),
    });
  }, [profile]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setPf((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
    setMsg({ saving: false, error: "", ok: "" });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!profile?.name) return;

    setMsg({ saving: true, error: "", ok: "" });

    if (!isHttpUrl(pf.avatarUrl) || !isHttpUrl(pf.bannerUrl)) {
      setMsg({ saving: false, error: "Avatar/Banner URL must start with http(s)://", ok: "" });
      return;
    }

    const payload = {};
    if (pf.bio !== (profile.bio || "")) payload.bio = pf.bio.trim();
    if (pf.avatarUrl !== (profile.avatar?.url || "")) {
      payload.avatarUrl = pf.avatarUrl.trim();
      payload.avatarAlt = pf.avatarAlt || "";
    }
    if (pf.bannerUrl !== (profile.banner?.url || "")) {
      payload.bannerUrl = pf.bannerUrl.trim();
      payload.bannerAlt = pf.bannerAlt || "";
    }
    if (pf.venueManager !== Boolean(profile.venueManager)) {
      payload.venueManager = pf.venueManager;
    }

    if (Object.keys(payload).length === 0) {
      setMsg({ saving: false, error: "", ok: "No changes to save." });
      return;
    }

    try {
      const updated = await updateProfile(profile.name, payload);
      onProfileUpdated?.(updated);
      setPf({
        bio: updated.bio || "",
        avatarUrl: updated.avatar?.url || "",
        avatarAlt: updated.avatar?.alt || "",
        bannerUrl: updated.banner?.url || "",
        bannerAlt: updated.banner?.alt || "",
        venueManager: Boolean(updated.venueManager),
      });
      setMsg({ saving: false, error: "", ok: "Profile updated ✅" });
    } catch (err) {
      setMsg({ saving: false, error: err?.message || "Failed to update profile", ok: "" });
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Profile settings</h2>
      <form
        onSubmit={onSubmit}
        className="grid gap-4 md:grid-cols-2 bg-white border rounded-2xl p-4"
      >
        <div className="space-y-2">
          <label className="block text-sm">
            <span className="block mb-1">Bio</span>
            <textarea
              name="bio"
              value={pf.bio}
              onChange={onChange}
              rows={4}
              className="w-full rounded border px-2 py-1"
              placeholder="Tell guests a bit about you…"
            />
          </label>

          <label className="block text-sm">
            <span className="block mb-1">Venue manager</span>
            <input
              type="checkbox"
              name="venueManager"
              checked={pf.venueManager}
              onChange={onChange}
              className="mr-2 align-middle"
            />
            <span className="text-gray-700">I manage venues</span>
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-sm">
            <span className="block mb-1">Avatar URL</span>
            <input
              type="url"
              name="avatarUrl"
              value={pf.avatarUrl}
              onChange={onChange}
              className="w-full rounded border px-2 py-1"
              placeholder="https://…/avatar.jpg"
            />
          </label>
          <label className="block text-sm">
            <span className="block mb-1">Avatar alt</span>
            <input
              type="text"
              name="avatarAlt"
              value={pf.avatarAlt}
              onChange={onChange}
              className="w-full rounded border px-2 py-1"
              placeholder="Profile picture alt text"
            />
          </label>

          <label className="block text-sm">
            <span className="block mb-1">Banner URL</span>
            <input
              type="url"
              name="bannerUrl"
              value={pf.bannerUrl}
              onChange={onChange}
              className="w-full rounded border px-2 py-1"
              placeholder="https://…/banner.jpg"
            />
          </label>
          <label className="block text-sm">
            <span className="block mb-1">Banner alt</span>
            <input
              type="text"
              name="bannerAlt"
              value={pf.bannerAlt}
              onChange={onChange}
              className="w-full rounded border px-2 py-1"
              placeholder="Banner image alt text"
            />
          </label>
        </div>

        {/* Previews */}
        <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
          <div className="border rounded-xl p-3">
            <p className="text-sm font-medium mb-2">Avatar preview</p>
            {pf.avatarUrl ? (
              <img
                src={pf.avatarUrl}
                alt={pf.avatarAlt || "Avatar"}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <p className="text-sm text-gray-500">No avatar URL</p>
            )}
          </div>
          <div className="border rounded-xl p-3">
            <p className="text-sm font-medium mb-2">Banner preview</p>
            {pf.bannerUrl ? (
              <img
                src={pf.bannerUrl}
                alt={pf.bannerAlt || "Banner"}
                className="w-full h-24 object-cover rounded-lg"
              />
            ) : (
              <p className="text-sm text-gray-500">No banner URL</p>
            )}
          </div>
        </div>

        <div className="md:col-span-2 flex items-center justify-end gap-2">
          {msg.error && <p className="text-sm text-red-600 mr-auto">{msg.error}</p>}
          {msg.ok && <p className="text-sm text-green-700 mr-auto">{msg.ok}</p>}
          <button
            type="submit"
            disabled={msg.saving}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold disabled:opacity-60"
          >
            {msg.saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </section>
  );
}
