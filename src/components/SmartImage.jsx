import React from "react";

export default function SmartImage({
  src,
  url,
  alt = "",
  className = "",
  eager = false,                 // only true for the hero
  fetchPriority,                 // "high" for hero, "low" for cards
  width = 1600,                  // intrinsic size -> no CLS
  height = 1000,
  srcSet,
  sizes,
  ...rest
}) {
  const finalSrc = src || url;
  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchpriority={fetchPriority ?? (eager ? "high" : "low")}
      width={width}
      height={height}
      srcSet={srcSet}
      sizes={sizes}
      {...rest}
    />
  );
}