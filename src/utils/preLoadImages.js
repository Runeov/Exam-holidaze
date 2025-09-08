// src/utils/preloadImages.js
export function preloadImages(urls = []) {
  urls.forEach((url) => {
    const img = new Image();
    img.decoding = "async";
    img.loading = "lazy";
    img.src = url;
  });
}
