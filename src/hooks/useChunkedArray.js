// src/hooks/useChunkedArray.js
import { useMemo, useState, useEffect } from "react";

/**
 * Keeps only the first N*k items "loaded" where N is chunkSize and k is the number of chunks fetched so far.
 * Call loadNext() to reveal the next chunk.
 */
export function useChunkedArray(items = [], chunkSize = 6) {
  const list = useMemo(() => items ?? [], [items]);
  const [loadedCount, setLoadedCount] = useState(
    Math.min(chunkSize, list.length)
  );

  useEffect(() => {
    // Reset whenever the list length or chunk size changes.
    setLoadedCount(Math.min(chunkSize, list.length));
  }, [list.length, chunkSize]);

  const canLoadMore = loadedCount < list.length;
  const loadNext = () => {
    setLoadedCount((c) => Math.min(c + chunkSize, list.length));
  };

  return {
    visible: list.slice(0, loadedCount),
    total: list.length,
    loadedCount,
    canLoadMore,
    loadNext,
  };
}