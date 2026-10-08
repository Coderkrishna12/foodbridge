import { useState } from 'react';
import { imageUrl } from '../utils/image.js';

export default function Gallery({ images, alt }) {
  const [active, setActive] = useState(0);
  if (!images?.length) return null;
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div className="gallery">
      <a href={imageUrl(current)} target="_blank" rel="noopener noreferrer" className="gallery-main" title="Open full size">
        <img src={imageUrl(current)} alt={alt} />
      </a>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((id, i) => (
            <button key={id} type="button" className={i === active ? 'on' : ''} onClick={() => setActive(i)} aria-label={`Photo ${i + 1}`}>
              <img src={imageUrl(id)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
