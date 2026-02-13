import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ambients, AmbientDef } from '../data/ambients';

interface Props {
  open: boolean;
  onClose: () => void;
}

const AmbientSound: React.FC<Props> = ({ open, onClose }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.4);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const teardownRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    teardownRef.current?.();
    teardownRef.current = null;
    try { ctxRef.current?.close(); } catch {}
    ctxRef.current = null;
    gainRef.current = null;
    setActiveId(null);
  }, []);

  const play = useCallback((def: AmbientDef) => {
    stop();
    if (!def.create) return;
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.connect(ctx.destination);
    ctxRef.current = ctx;
    gainRef.current = gain;
    teardownRef.current = def.create(ctx, gain);
    setActiveId(def.id);
  }, [volume, stop]);

  // Update volume in real-time
  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => () => { teardownRef.current?.(); try { ctxRef.current?.close(); } catch {} }, []);

  const toggle = (def: AmbientDef) => {
    if (activeId === def.id) stop();
    else play(def);
  };

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>🎵 Ambient Sounds</span>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.grid}>
          {ambients.map((a) => (
            <button
              key={a.id}
              disabled={!a.available}
              onClick={() => toggle(a)}
              style={{
                ...styles.tile,
                ...(activeId === a.id ? styles.tileActive : {}),
                ...(!a.available ? styles.tileDisabled : {}),
              }}
            >
              <span style={{ fontSize: 28 }}>{a.icon}</span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>{a.name}</span>
              {!a.available && <span style={styles.soon}>Soon</span>}
            </button>
          ))}
        </div>

        <div style={styles.volRow}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={styles.slider}
          />
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 90,
  },
  panel: {
    width: '100%', maxWidth: 420, background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
    borderRadius: '20px 20px 0 0', padding: 20, paddingBottom: 32,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.9)' },
  closeBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 },
  tile: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4,
    padding: '12px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, color: 'white', cursor: 'pointer', transition: 'all 0.2s',
  },
  tileActive: {
    background: 'rgba(124,58,237,0.25)', borderColor: 'rgba(124,58,237,0.5)',
    boxShadow: '0 0 20px rgba(124,58,237,0.2)',
  },
  tileDisabled: { opacity: 0.4, cursor: 'default' },
  soon: { fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const },
  volRow: { display: 'flex', alignItems: 'center', gap: 10 },
  slider: { flex: 1, accentColor: '#7c3aed' },
};

export default AmbientSound;
