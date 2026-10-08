import { useRef, useState } from 'react';
import { ImagePlus, Star, X } from 'lucide-react';
import { api } from '../api/client.js';
import { compressImage, imageUrl } from '../utils/image.js';
import { Spinner } from './ui/Feedback.jsx';

export const MAX_PHOTOS = 4;

// `images` is an array of image ids; `setImages` accepts an updater function.
export default function PhotoUploader({ images, setImages, onError }) {
  const input = useRef(null);
  const [pending, setPending] = useState([]); // [{ key, preview }]
  const [drag, setDrag] = useState(false);
  const slotsLeft = MAX_PHOTOS - images.length - pending.length;

  const addFiles = async (fileList) => {
    const files = [...fileList].slice(0, Math.max(0, slotsLeft));
    if (fileList.length > files.length) onError?.(`You can add up to ${MAX_PHOTOS} photos.`);
    await Promise.all(
      files.map(async (file) => {
        const key = Math.random().toString(36).slice(2);
        const preview = URL.createObjectURL(file);
        setPending((p) => [...p, { key, preview }]);
        try {
          const blob = await compressImage(file);
          const fd = new FormData();
          fd.append('image', blob, 'food.jpg');
          const { id } = await api('/images', { method: 'POST', body: fd });
          setImages((ids) => [...ids, id]);
        } catch (err) {
          onError?.(err.message);
        } finally {
          URL.revokeObjectURL(preview);
          setPending((p) => p.filter((x) => x.key !== key));
        }
      })
    );
  };

  const remove = (id) => setImages((ids) => ids.filter((x) => x !== id));
  const makeCover = (id) => setImages((ids) => [id, ...ids.filter((x) => x !== id)]);

  return (
    <div className="photos">
      {images.map((id, i) => (
        <div key={id} className="photo">
          <img src={imageUrl(id)} alt={`Food photo ${i + 1}`} />
          {i === 0 ? (
            <span className="photo-tag">Cover</span>
          ) : (
            <button type="button" className="photo-cover" onClick={() => makeCover(id)} title="Make cover photo"><Star /></button>
          )}
          <button type="button" className="photo-x" onClick={() => remove(id)} aria-label="Remove photo"><X /></button>
        </div>
      ))}
      {pending.map(({ key, preview }) => (
        <div key={key} className="photo uploading">
          <img src={preview} alt="" />
          <span className="photo-busy"><Spinner /></span>
        </div>
      ))}
      {slotsLeft > 0 && (
        <button
          type="button"
          className={`photo-add ${drag ? 'drag' : ''}`}
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        >
          <ImagePlus />
          <span>{images.length ? 'Add more' : 'Add photos'}</span>
          <span className="xs muted">{slotsLeft} left · drag & drop</span>
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        hidden
        onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}
