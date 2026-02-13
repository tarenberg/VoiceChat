import React from 'react';
import { X } from 'lucide-react';

interface Props {
  images: string[]; // data URLs or base64
  onDismiss: () => void;
}

const ImageDisplay: React.FC<Props> = ({ images, onDismiss }) => {
  if (images.length === 0) return null;

  return (
    <div style={styles.overlay} onClick={onDismiss}>
      <div style={styles.panel} onClick={e => e.stopPropagation()}>
        <button onClick={onDismiss} style={styles.closeBtn}>
          <X size={20} />
        </button>
        <div style={styles.grid}>
          {images.map((src, i) => (
            <img
              key={i}
              src={src.startsWith('data:') ? src : `data:image/png;base64,${src}`}
              alt={`Generated ${i + 1}`}
              style={styles.image}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  panel: {
    position: 'relative',
    background: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'auto',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '60vh',
    borderRadius: 8,
    objectFit: 'contain',
  },
};

export default ImageDisplay;
