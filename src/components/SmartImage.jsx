import React from "react";

export default function SmartImage({
  src,
  url,
  alt = "",
  className = "",
  eager = false,
  width,
  height,
  srcSet,
  sizes,
  fetchPriority, // "high" only for the one LCP image
  placeholderSrc, // optional tiny blur img
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
      fetchpriority={fetchPriority}
      width={width ?? 1600}
      height={height ?? 1000}
      srcSet={srcSet}
      sizes={sizes}
      {...rest}
    />
  );
}