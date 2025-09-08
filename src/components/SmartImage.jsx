// src/components/SmartImage.jsx

import React, { forwardRef, useMemo, useState } from "react";

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const SmartImage = forwardRef(function SmartImage(
  {
    url,
    alt = "",
    className,
    style,
    width,
    height,
    decoding = "async",
    eager = false,
    fetchPriority,
    srcSet,
    sizes,
    transformImageUrl,
    breakpoints = [480, 640, 768, 1024, 1280, 1600],
    maxW = 1600,
    quality = 75,
    generateSrcSet = true,
    fallbackUrl,
    onLoad,
    onError,
    ...rest
  },
  ref,
) {
  const [broken, setBroken] = useState(false);
  const hasUrl = typeof url === "string" && url.trim().length > 0;

  const responsive = useMemo(() => {
    if (!hasUrl) {
      return {
        src: fallbackUrl || TRANSPARENT_PIXEL,
        srcSet: undefined,
        sizes: undefined,
      };
    }

    if (srcSet || sizes) {
      return { src: url, srcSet: srcSet || undefined, sizes: sizes || undefined };
    }

    if (typeof transformImageUrl === "function" && generateSrcSet) {
      try {
        const ws = (Array.isArray(breakpoints) ? breakpoints : [])
          .filter((w) => Number.isFinite(w) && w > 0 && w <= maxW)
          .sort((a, b) => a - b);

        if (ws.length > 0) {
          const largest = ws[ws.length - 1];
          const genSrc = transformImageUrl(url, { w: largest, q: quality });
          const genSet = ws
            .map((w) => `${transformImageUrl(url, { w, q: quality })} ${w}w`)
            .join(", ");
          const genSizes = sizes || "(max-width: 860px) 90vw, 860px";
          return { src: genSrc, srcSet: genSet, sizes: genSizes };
        }
      } catch {
        // fall through to original URL below
      }
    }

    return { src: url, srcSet: undefined, sizes: sizes };
  }, [
    hasUrl,
    url,
    srcSet,
    sizes,
    transformImageUrl,
    breakpoints,
    maxW,
    quality,
    generateSrcSet,
    fallbackUrl,
  ]);

  const srcToUse = broken ? fallbackUrl || TRANSPARENT_PIXEL : responsive.src;

  return (
    <img
      ref={ref}
      src={srcToUse}
      srcSet={broken ? undefined : responsive.srcSet}
      sizes={broken ? undefined : responsive.sizes}
      alt={alt}
      className={className}
      style={style}
      width={width}
      height={height}
      decoding={decoding}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={fetchPriority}
      onLoad={onLoad}
      onError={(e) => {
        setBroken(true);
        if (onError) onError(e);
      }}
      {...rest}
    />
  );
});

export default SmartImage;