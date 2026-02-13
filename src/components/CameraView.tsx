import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, SwitchCamera, X } from 'lucide-react';

interface Props {
  active: boolean;
  onFrame: (base64: string) => void;
  onClose: () => void;
}

const CameraView: React.FC<Props> = ({ active, onFrame, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    // Stop existing
    streamRef.current?.getTracks().forEach(t => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, 640, 480);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    const base64 = dataUrl.split(',')[1];
    onFrame(base64);
  }, [onFrame]);

  useEffect(() => {
    if (active) {
      startCamera(facingMode);
      intervalRef.current = window.setInterval(captureFrame, 4000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [active, facingMode, startCamera, captureFrame]);

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (!active) return null;

  return (
    <div style={styles.container}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={styles.video}
        onClick={captureFrame}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={styles.controls}>
        <button onClick={switchCamera} style={styles.smallBtn} title="Switch camera">
          <SwitchCamera size={16} />
        </button>
        <button onClick={onClose} style={styles.smallBtn} title="Close camera">
          <X size={16} />
        </button>
      </div>
      <div style={styles.hint}>Tap preview to capture now</div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: 180,
    height: 135,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    cursor: 'pointer',
  },
  controls: {
    position: 'absolute',
    top: 4,
    right: 4,
    display: 'flex',
    gap: 4,
  },
  smallBtn: {
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
  hint: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
};

export default CameraView;
