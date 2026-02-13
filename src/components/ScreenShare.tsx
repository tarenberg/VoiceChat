import React, { useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface Props {
  active: boolean;
  onFrame: (base64: string) => void;
  onClose: () => void;
}

const ScreenShare: React.FC<Props> = ({ active, onFrame, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, 640, 360);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    onFrame(dataUrl.split(',')[1]);
  }, [onFrame]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Auto-close if user stops sharing via browser UI
        stream.getVideoTracks()[0]?.addEventListener('ended', onClose);

        intervalRef.current = window.setInterval(captureFrame, 4000);
      } catch {
        onClose();
      }
    })();

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [active, captureFrame, onClose]);

  if (!active) return null;

  return (
    <div style={styles.container}>
      <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button onClick={onClose} style={styles.closeBtn} title="Stop sharing">
        <X size={16} />
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: 200,
    height: 113,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  closeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
};

export default ScreenShare;
