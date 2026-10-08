import { Router } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import Image, { MAX_IMAGE_BYTES, sniffImageType } from '../models/Image.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

// Keep uploads in memory (never touch disk); one file per request, hard size cap
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 0 },
});

function single(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'Photo is too large (max 3 MB)' });
    return res.status(400).json({ message: 'Upload one photo in the "image" field' });
  });
}

// UPLOAD a food photo (donors only). Returns { id, url } to attach to a listing.
router.post('/', protect, requireRole('donor'), single, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No photo received' });
    const type = sniffImageType(req.file.buffer);
    if (!type) return res.status(415).json({ message: 'Only JPEG, PNG or WebP photos are allowed' });

    const img = await Image.create({ data: req.file.buffer, contentType: type, size: req.file.size, owner: req.user._id });
    res.status(201).json({ id: img._id, url: `/api/images/${img._id}` });
  } catch (err) {
    next(err);
  }
});

// SERVE a photo. Public so <img> tags work (food photos are not sensitive); ids are unguessable ObjectIds.
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid image id' });
    const img = await Image.findById(req.params.id).select('+data');
    if (!img) return res.status(404).json({ message: 'Image not found' });
    res.set({
      'Content-Type': img.contentType,
      'Content-Length': img.data.length,
      'Cache-Control': 'public, max-age=31536000, immutable', // images never change once uploaded
      'Content-Disposition': 'inline',
    });
    res.send(img.data);
  } catch (err) {
    next(err);
  }
});

export default router;
