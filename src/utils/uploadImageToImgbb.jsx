export async function uploadImageToImgbb(file) {
  const API_KEY = "e74afd2c6d1a02567606d8d67c02d274";

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Image upload failed");
  }

  const data = await res.json();

  return {
    url: data.data.url,
    alt: file.name,
  };
}
