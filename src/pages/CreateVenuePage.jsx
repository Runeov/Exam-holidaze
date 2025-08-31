// src/pages/CreateVenuePage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createVenue } from "../api/venues";
import VenueForm from "../components/VenueForm";

export default function CreateVenuePage() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleCreate(venueData) {
    setSubmitting(true);
    setError("");

    try {
      const res = await createVenue(venueData); // POST /venues
      const newVenue = res?.data?.data ?? res?.data;
      navigate(`/venues/${newVenue.id}`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.errors?.[0]?.message || err.message || "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 md:p-10">
      <h1 className="text-3xl font-bold mb-6">Create a New Venue</h1>
      <VenueForm mode="create" onSubmit={handleCreate} submitting={submitting} error={error} />
    </div>
  );
}
