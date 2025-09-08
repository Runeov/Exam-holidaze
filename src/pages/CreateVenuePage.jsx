/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createVenue } from "../api/venues";
import VenueForm from "../components/VenueForm";
import MyVenuesPage from "./MyVenuesPage"; // ✅ import this

export default function CreateVenuePage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleCreate(venueData) {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await createVenue(venueData); // POST /venues
      const newVenue = res?.data?.data ?? res?.data;

      setSuccess("Venue created successfully!");
      // optional: delay before navigating
      setTimeout(() => {
        navigate(`/venues/${newVenue.id}`);
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.errors?.[0]?.message ||
          err.message ||
          "Create failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 🎯 Create Venue Form card */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold text-[--color-text]">
          Create a New Venue
        </h1>

        {/* ✅ Success / Error messages */}
        {success && (
          <p
            className="text-sm text-green-800 bg-green-50 border border-green-200 rounded px-3 py-2"
            role="status"
          >
            {success}
          </p>
        )}
        {error && (
          <p
            className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2"
            role="alert"
          >
            {error}
          </p>
        )}

        <VenueForm
          mode="create"
          onSubmit={handleCreate}
          submitting={submitting}
          error={error}
        />
      </div>

      {/* 🏨 My Venues Section card */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h2 className="text-2xl font-semibold">My Venues</h2>
        <MyVenuesPage embedded />
      </div>
    </div>
  );
}
