// Resize + re-encode a photo in the browser before upload.
// - Phone photos (5-10 MB) become ~150-400 KB JPEGs
// - Re-drawing through a canvas strips EXIF metadata, including GPS location
export async function compressImage(file, { maxSize = 1600, quality = 0.82 } = {}) {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error('Please choose a JPEG, PNG or WebP photo');
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error("This photo format isn't supported by your browser. Try a JPEG or PNG.");
  }
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // flatten transparent PNGs onto white
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new Error('Could not process this photo');
  return blob;
}

export const imageUrl = (id) => `/api/images/${id}`;
