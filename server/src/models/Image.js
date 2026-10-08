import mongoose from 'mongoose';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB (client compresses well below this)

// Food photos are stored in MongoDB itself (well under the 16 MB document limit),
// so the app needs no file system or third-party storage and survives redeploys.
const imageSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true, select: false },
    contentType: { type: String, enum: IMAGE_TYPES, required: true },
    size: { type: Number, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

// Check the real file signature ("magic bytes"), not the client-supplied mimetype
export function sniffImageType(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export default mongoose.model('Image', imageSchema);
