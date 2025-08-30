/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import React from "react";
import { useAuth } from "./context/AuthContext";

export default function ProfilePage() {
  const { profile, apiKey, logout } = useAuth();

  return (
    <main style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <h1>Profile</h1>
      {!profile ? (
        <p>No profile loaded.</p>
      ) : (
        <>
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
        </>
      )}
      <button onClick={logout} style={{ marginTop: 16 }}>
        Logout
      </button>
    </main>
  );
}
