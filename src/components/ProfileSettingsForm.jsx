/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import { useRef, useState } from "react";

export default function ProfileSettingsForm({ profile, onSave, onProfileUpdated, saving, error }) {
  const [form, setForm] = useState({
    bio: profile?.bio || "",
    venueManager: profile?.venueManager || false,

    avatarFile: null,
    avatarUrl: profile?.avatar?.url || "",
    avatarPreview: profile?.avatar?.url || "",
    useAvatarUrl: !!profile?.avatar?.url,

    bannerFile: null,
    bannerUrl: profile?.banner?.url || "",
    bannerPreview: profile?.banner?.url || "",
    useBannerUrl: !!profile?.banner?.url,
  });

  // Refs for file pickers
  const avatarFileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function handleFileChange(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setForm((f) => ({
      ...f,
      [`${type}File`]: file,
      [`${type}Preview`]: previewUrl,
      [`use${capitalize(type)}Url`]: false,
    }));
  }

  function handleUrlChange(e, type) {
    const url = e.target.value;
    setForm((f) => ({
      ...f,
      [`${type}Url`]: url,
      [`${type}Preview`]: url,
      [`use${capitalize(type)}Url`]: true,
      [`${type}File`]: null,
    }));
  }

  function setPrimarySource(type, useUrl) {
    setForm((f) => ({
      ...f,
      [`use${capitalize(type)}Url`]: useUrl,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      bio: form.bio,
      venueManager: form.venueManager,
      avatar: form.useAvatarUrl ? form.avatarUrl : form.avatarFile,
      banner: form.useBannerUrl ? form.bannerUrl : form.bannerFile,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold">Update Profile Settings</h2>

      {/* Bio */}
      <div>
        <label className="block font-medium mb-1 text-sm">Bio</label>
        <textarea
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none"
          rows={3}
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          placeholder="Tell us a little about yourself..."
        />
      </div>

      {/* Venue Manager */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="venueManager"
          checked={form.venueManager}
          onChange={(e) => setForm((f) => ({ ...f, venueManager: e.target.checked }))}
          className="w-4 h-4"
        />
        <label htmlFor="venueManager" className="text-sm">
          I want to manage and host venues
        </label>
      </div>

      {/* Avatar Section */}
      <div>
        <label className="block font-semibold mb-2">Avatar</label>

        {form.avatarPreview && (
          <img
            src={form.avatarPreview}
            alt="Avatar preview"
            className="w-24 h-24 object-cover rounded-full border border-gray-300 shadow mb-2"
          />
        )}

        <input
          type="url"
          placeholder="Or paste avatar image URL"
          value={form.avatarUrl}
          onChange={(e) => handleUrlChange(e, "avatar")}
          className="w-full text-sm border border-gray-300 rounded px-3 py-1 mb-2"
        />

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={avatarFileInputRef}
          onChange={(e) => handleFileChange(e, "avatar")}
          className="hidden"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPrimarySource("avatar", false);
              avatarFileInputRef.current?.click();
            }}
            className={`px-3 py-1 rounded text-sm ${
              !form.useAvatarUrl ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700"
            }`}
          >
            Use Uploaded Image
          </button>
          <button
            type="button"
            onClick={() => setPrimarySource("avatar", true)}
            className={`px-3 py-1 rounded text-sm ${
              form.useAvatarUrl ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700"
            }`}
          >
            Use URL
          </button>
        </div>
      </div>

      {/* Banner Section */}
      <div>
        <label className="block font-semibold mb-2">Banner</label>

        {form.bannerPreview && (
          <img
            src={form.bannerPreview}
            alt="Banner preview"
            className="w-full max-w-md h-32 object-cover rounded border border-gray-300 shadow mb-2"
          />
        )}

        <input
          type="url"
          placeholder="Or paste banner image URL"
          value={form.bannerUrl}
          onChange={(e) => handleUrlChange(e, "banner")}
          className="w-full text-sm border border-gray-300 rounded px-3 py-1 mb-2"
        />

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={bannerFileInputRef}
          onChange={(e) => handleFileChange(e, "banner")}
          className="hidden"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPrimarySource("banner", false);
              bannerFileInputRef.current?.click();
            }}
            className={`px-3 py-1 rounded text-sm ${
              !form.useBannerUrl ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700"
            }`}
          >
            Use Uploaded Image
          </button>
          <button
            type="button"
            onClick={() => setPrimarySource("banner", true)}
            className={`px-3 py-1 rounded text-sm ${
              form.useBannerUrl ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700"
            }`}
          >
            Use URL
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
