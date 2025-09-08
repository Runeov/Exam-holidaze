// src/components/ProfileSettingsForm.jsx
/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getProfile, updateProfile } from "../api/profiles";
import { uploadImageToImgbb } from "../utils/uploadImageToImgbb";
import ProfileHeader from "../components/ProfileHeader";

export default function ProfileSettingsForm({
  profile,
  onSave: onSaveProp,
  onProfileUpdated,
  saving = false,
  error = "",
}) {
  const { isAuthed, profile: authProfile } = useAuth();

  // Local fallback states (when rendered directly without a parent page)
  const [localSaving, setLocalSaving] = useState(false);
  const [localError, setLocalError] = useState("");
  const [justSaved, setJustSaved] = useState(false); // ✅ success flag

  const [form, setForm] = useState({
    bio: profile?.bio ?? "",
    venueManager: Boolean(profile?.venueManager),

    avatarFile: null,
    avatarUrl: profile?.avatar?.url ?? "",
    avatarPreview: profile?.avatar?.url ?? "",
    useAvatarUrl: Boolean(profile?.avatar?.url),

    bannerFile: null,
    bannerUrl: profile?.banner?.url ?? "",
    bannerPreview: profile?.banner?.url ?? "",
    useBannerUrl: Boolean(profile?.banner?.url),
  });

  // If no profile prop is provided, hydrate from API for the signed-in user
  useEffect(() => {
    let ignore = false;
    async function hydrate() {
      if (profile || !isAuthed || !authProfile?.name) return;
      try {
        setLocalError("");
        const res = await getProfile(authProfile.name, {
          withVenues: false,
          withBookings: false,
        });
        const data = res?.data?.data ?? res?.data ?? res;
        if (ignore) return;
        setForm((f) => ({
          ...f,
          bio: data?.bio ?? "",
          venueManager: Boolean(data?.venueManager),
          avatarUrl: data?.avatar?.url ?? "",
          avatarPreview: data?.avatar?.url ?? "",
          useAvatarUrl: Boolean(data?.avatar?.url),
          bannerUrl: data?.banner?.url ?? "",
          bannerPreview: data?.banner?.url ?? "",
          useBannerUrl: Boolean(data?.banner?.url),
        }));
      } catch (err) {
        if (!ignore) setLocalError(err?.message || "Failed to load profile");
      }
    }
    hydrate();
    return () => {
      ignore = true;
    };
  }, [profile, isAuthed, authProfile?.name]);

  // Stable unique ids for a11y
  const uid = useId();
  const bioId = `${uid}-bio`;
  const vmId = `${uid}-venueManager`;
  const avatarUrlId = `${uid}-avatar-url`;
  const avatarHelpId = `${uid}-avatar-help`;
  const avatarFileId = `${uid}-avatar-file`;
  const bannerUrlId = `${uid}-banner-url`;
  const bannerHelpId = `${uid}-banner-help`;
  const bannerFileId = `${uid}-banner-file`;

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

  // Built-in save if no parent handler is passed
  async function defaultOnSave({ bio, venueManager, avatar, banner }) {
    if (!isAuthed || !authProfile?.name) {
      setLocalError("You must be signed in to save changes.");
      return;
    }
    try {
      setLocalSaving(true);
      setLocalError("");

      let avatarUrl = typeof avatar === "string" ? avatar : undefined;
      let bannerUrl = typeof banner === "string" ? banner : undefined;

      if (avatar && avatar instanceof File) {
        const { url } = await uploadImageToImgbb(avatar);
        avatarUrl = url;
      }
      if (banner && banner instanceof File) {
        const { url } = await uploadImageToImgbb(banner);
        bannerUrl = url;
      }

      const updated = await updateProfile(authProfile.name, {
        bio,
        venueManager: !!venueManager,
        avatarUrl: avatarUrl || undefined,
        bannerUrl: bannerUrl || undefined,
      });

      onProfileUpdated?.(updated);

      // ✅ show success confirmation
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (err) {
      setLocalError(err?.message || "Failed to update profile");
    } finally {
      setLocalSaving(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const onSave = typeof onSaveProp === "function" ? onSaveProp : defaultOnSave;
    onSave({
      bio: form.bio,
      venueManager: form.venueManager,
      avatar: form.useAvatarUrl ? form.avatarUrl : form.avatarFile,
      banner: form.useBannerUrl ? form.bannerUrl : form.bannerFile,
    });
  }

  const isSaving = saving ?? localSaving;
  const shownError = error ?? localError;

  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      bio: profile.bio ?? "",
      venueManager: Boolean(profile.venueManager),

      avatarFile: null,
      avatarUrl: profile.avatar?.url ?? "",
      avatarPreview: profile.avatar?.url ?? "",
      useAvatarUrl: Boolean(profile.avatar?.url),

      bannerFile: null,
      bannerUrl: profile.banner?.url ?? "",
      bannerPreview: profile.banner?.url ?? "",
      useBannerUrl: Boolean(profile.banner?.url),
    }));
  }, [
    profile?.bio,
    profile?.venueManager,
    profile?.avatar?.url,
    profile?.banner?.url,
  ]);

  return (
    // Standard page container (no forced centering)
    <div className="bg-center py-6 px-4 sm:px-6 lg:px-8">
      {/* Card: full width on mobile, wider overall; not centered by flex, but still constrained on large screens */}
      <div className="relative z-10 w-full max-w-2xl mx-auto space-y-8 p-6 md:p-10 bg-white rounded-xl shadow-lg">
        {/* Profile header with visual preview and title */}
        <ProfileHeader
          variant="full"
          name={profile?.name || authProfile?.name || "Profile"}
          subtitle={profile?.email || authProfile?.email || ""}
          venueManager={Boolean(profile?.venueManager ?? authProfile?.venueManager)}
          bannerUrl={form.bannerPreview || ""}
          avatarUrl={form.avatarPreview || ""}
        />

        <div className="grid gap-8 grid-cols-1">
          <div className="flex flex-col">
            <div className="mt-5">
              {/* ===== Form (logic unchanged) ===== */}
              <form
                onSubmit={handleSubmit}
                className="space-y-6 text-[var(--color-text)] form-card"
                aria-busy={isSaving ? "true" : "false"}
              >
                <h2 className="text-xl font-semibold">Update Profile Settings</h2>

                {/* Success */}
                {justSaved && !shownError && (
                  <p
                    className="text-sm text-green-800 bg-green-50 border border-green-200 rounded px-3 py-2"
                    role="status"
                  >
                    Profile updated
                  </p>
                )}

                {/* Error */}
                {shownError && (
                  <p
                    className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2"
                    role="alert"
                  >
                    {shownError}
                  </p>
                )}

                {/* Bio */}
                <div>
                  <label className="block font-medium mb-1 text-sm" htmlFor={bioId}>
                    Bio
                  </label>
                  <textarea
                    id={bioId}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-slate-500 bg-white text-gray-900 resize-none
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-600)]"
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
                    id={vmId}
                    checked={form.venueManager}
                    onChange={(e) => setForm((f) => ({ ...f, venueManager: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-600)]"
                  />
                  <label htmlFor={vmId} className="text-sm">
                    I want to manage and host venues
                  </label>
                </div>

                {/* Avatar */}
                <fieldset className="space-y-2">
                  <legend className="block font-semibold mb-1">Avatar</legend>

                  {form.avatarPreview && (
                    <figure>
                      <img
                        src={form.avatarPreview}
                        alt="Current avatar preview"
                        loading="lazy"
                        className="w-24 h-24 object-cover rounded-full border border-gray-300 shadow mb-2"
                      />
                      <figcaption className="sr-only">Preview of your avatar image.</figcaption>
                    </figure>
                  )}

                  <label htmlFor={avatarUrlId} className="block text-sm font-medium">
                    Avatar image URL
                  </label>
                  <p id={avatarHelpId} className="text-xs text-gray-500 mb-1">
                    Paste a public http(s) image link. If you choose a file, we’ll upload it and store the URL.
                  </p>
                  <input
                    id={avatarUrlId}
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={form.avatarUrl}
                    onChange={(e) => handleUrlChange(e, "avatar")}
                    aria-describedby={avatarHelpId}
                    className="w-full text-sm placeholder:text-slate-500 bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 mb-2
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-600)]"
                  />

                  {/* Hidden file input + accessible hook */}
                  <label htmlFor={avatarFileId} className="sr-only">
                    Choose avatar image file
                  </label>
                  <input
                    id={avatarFileId}
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
                      aria-pressed={!form.useAvatarUrl}
                      aria-controls={avatarFileId}
                      className={`px-4 py-2 rounded-full text-sm
                                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-600)] ${
                                    !form.useAvatarUrl
                                      ? "bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-700)] hover:shadow"
                                      : "border border-gray-300 text-gray-700 bg-white"
                                  }`}
                    >
                      Browse
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrimarySource("avatar", true)}
                      aria-pressed={form.useAvatarUrl}
                      className={`px-4 py-2 rounded-full text-sm
                                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-600)] ${
                                    form.useAvatarUrl
                                      ? "bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-700)] hover:shadow"
                                      : "border border-gray-300 text-gray-700 bg-white"
                                  }`}
                    >
                      Use URL
                    </button>
                  </div>
                </fieldset>

                {/* Banner */}
                <fieldset className="space-y-2">
                  <legend className="block font-semibold mb-1">Banner</legend>

                  {form.bannerPreview && (
                    <figure>
                      <img
                        src={form.bannerPreview}
                        alt="Current banner preview"
                        loading="lazy"
                        className="w-full max-w-md h-32 object-cover rounded border border-gray-300 shadow mb-2"
                      />
                      <figcaption className="sr-only">Preview of your banner image.</figcaption>
                    </figure>
                  )}

                  <label htmlFor={bannerUrlId} className="block text-sm font-medium">
                    Banner image URL
                  </label>
                  <p id={bannerHelpId} className="text-xs text-gray-500 mb-1">
                    Paste a public http(s) image link. If you choose a file, we’ll upload it and store the URL.
                  </p>
                  <input
                    id={bannerUrlId}
                    type="url"
                    placeholder="https://example.com/banner.jpg"
                    value={form.bannerUrl}
                    onChange={(e) => handleUrlChange(e, "banner")}
                    aria-describedby={bannerHelpId}
                    className="w-full text-sm placeholder:text-slate-500 bg-white text-gray-900 border border-gray-300 rounded px-3 py-2 mb-2
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-600)]"
                  />

                  {/* Hidden file input + accessible hook */}
                  <label htmlFor={bannerFileId} className="sr-only">
                    Choose banner image file
                  </label>
                  <input
                    id={bannerFileId}
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
                      aria-pressed={!form.useBannerUrl}
                      aria-controls={bannerFileId}
                      className={`px-4 py-2 rounded-full text-sm
                                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-600)] ${
                                    !form.useBannerUrl
                                      ? "bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-700)] hover:shadow"
                                      : "border border-gray-300 text-gray-700 bg-white"
                                  }`}
                    >
                      Browse
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrimarySource("banner", true)}
                      aria-pressed={form.useBannerUrl}
                      className={`px-4 py-2 rounded-full text-sm
                                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-600)] ${
                                    form.useBannerUrl
                                      ? "bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-700)] hover:shadow"
                                      : "border border-gray-300 text-gray-700 bg-white"
                                  }`}
                    >
                      Use URL
                    </button>
                  </div>
                </fieldset>

                {/* Submit */}
                <div className="pt-2 text-right">
                  <button
                    type="button"
                    className="mb-2 md:mb-0 bg-white px-5 py-2 text-sm shadow-sm font-medium tracking-wider border text-gray-700 rounded-full hover:shadow hover:bg-gray-100 mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="mb-2 md:mb-0 px-5 py-2 text-sm shadow-sm font-medium tracking-wider rounded-full disabled:opacity-60
                               bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-700)]
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand-600)]"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
              {/* ===== /form ===== */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
