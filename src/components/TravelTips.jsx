import React, { useEffect, useState } from "react";

function TravelTips({ location }) {
  const [summary, setSummary] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!location) return;
    const title = encodeURIComponent(location.charAt(0).toUpperCase() + location.slice(1));
    const url = `https://en.wikivoyage.org/api.php?action=query&prop=extracts&exintro&explaintext&titles=${title}&format=json&origin=*`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const pages = data.query?.pages;
        const page = pages && Object.values(pages)[0];
        if (page?.extract) {
          setSummary(page.extract);
        } else {
          setSummary("No travel tips found for this location.");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch travel tips.");
      });
  }, [location]);

  if (error) return <p className="text-red-600">{error}</p>;
  return <p className="text-text-muted mt-1 whitespace-pre-line">{summary || "Loading tips..."}</p>;
}

export default TravelTips;
