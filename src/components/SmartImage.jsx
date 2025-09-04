/** biome-ignore-all lint/a11y/useAltText: <explanation> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import React, { useEffect, useMemo, useRef, useState } from "react";

// Must start with this prefix (the tests check for it)
const FALLBACK_SVG =
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="100%" height="100%" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="12" fill="%23999">No image</text></svg>';

export function SmartImage({
  url,
  alt = "",
  sizes,
  srcSet,
  eager = false,
  className = "",
  ...rest
}) {
  // Broken if no URL initially, or after an error
  const [broken, setBroken] = useState(!url);
  const imgRef = useRef(null);

  // Build props for <img>
  const imgProps = useMemo(() => {
    const base = {
      alt,
      className,
      // React's proper prop name (renders DOM attr as lowercase "fetchpriority")
      fetchPriority: eager ? "high" : "low",
      loading: eager ? "eager" : "lazy",
      ...rest,
    };

    if (broken) {
      // Fallback mode: force data URI and omit responsive attrs
      base.src = FALLBACK_SVG;
    } else {
      base.src = url;
      if (sizes) base.sizes = sizes;
      if (srcSet) base.srcSet = srcSet;
    }

    return base;
  }, [alt, className, eager, rest, sizes, srcSet, url, broken]);

  // Error handler: flip to broken AND patch DOM immediately so tests that
  // read attributes right after the event still see the fallback src.
  function handleError() {
    setBroken(true);
    const el = imgRef.current;
    if (!el) return;
    el.removeAttribute("srcset");
    el.setAttribute("src", FALLBACK_SVG);
    el.setAttribute("fetchpriority", eager ? "high" : "low");
  }

  // Ensure lowercase attribute exists even if React changes behavior
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    el.setAttribute("fetchpriority", eager ? "high" : "low");
  }, [eager, broken]);

  return <img ref={imgRef} {...imgProps} onError={handleError} />;
}
export default SmartImage;
