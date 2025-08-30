import React from "react";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { profile, apiKey, logout } = useAuth();

  return (
    <main className="container" style={{ maxWidth: 720, margin: "2rem auto" }}>
      <h1>Profile</h1>
      {!profile ? (
        <p>No profile loaded.</p>
      ) : (
        <div style={{ marginTop: 12 }}>
          <p>
            <b>Name:</b> {profile?.name}
          </p>
          <p>
            <b>Email:</b> {profile?.email}
          </p>
          {apiKey && (
            <p style={{ wordBreak: "break-all" }}>
              <b>API Key:</b> {apiKey}
            </p>
          )}
        </div>
      )}

      {/** biome-ignore lint/a11y/useButtonType: <explanation> */}
      <button style={{ marginTop: 20 }} onClick={logout}>
        Logout
      </button>
    </main>
  );
}
