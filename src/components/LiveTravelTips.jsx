// components/LiveTravelTips.jsx
import { useEffect, useState } from "react";
import { fetchWikivoyageIntro } from "../utils/Wiki";
import WikivoyageAttribution from "./WikivoyageAttribution";

export default function LiveTravelTips({ location }) {
  const [state, setState] = useState({ text: "", title: "", oldid: null, loading: false });

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!location) {
        setState((s) => ({ ...s, text: "", title: "", oldid: null }));
        return;
      }
      setState((s) => ({ ...s, loading: true }));
      try {
        const { text, title, oldid } = await fetchWikivoyageIntro(location);
        if (!alive) return;
        setState({ text, title, oldid, loading: false });
      } catch {
        if (!alive) return;
        setState({ text: "", title: location, oldid: null, loading: false });
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [location]);

  if (state.loading) return <p className="text-text-muted mt-1">Loading tips…</p>;

  return (
    <>
      <p className="text-text-muted mt-1 whitespace-pre-line">
        {state.text || `No travel summary found for ${location}.`}
      </p>
      {state.title && <WikivoyageAttribution title={state.title} oldid={state.oldid} />}
    </>
  );
}
