import React, { useMemo } from 'react';

export type OrbState = 'idle' | 'connecting' | 'listening' | 'speaking';

interface Props {
  state: OrbState;
  audioLevel?: number;
  color?: string;
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function darken(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, parseInt(h.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(h.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(h.substring(4, 6), 16) - amount);
  return `rgb(${r}, ${g}, ${b})`;
}

const VoiceOrb: React.FC<Props> = ({ state, audioLevel = 0, color = '#a78bfa' }) => {
  const scale = state === 'speaking' ? 1 + audioLevel * 0.3 : 1;
  const rgb = useMemo(() => hexToRgb(color), [color]);
  const dark = useMemo(() => darken(color, 100), [color]);
  const darker = useMemo(() => darken(color, 160), [color]);

  const dynamicStyles = useMemo(() => ({
    orbConnecting: {
      background: `conic-gradient(from 0deg, ${color}, ${dark}, ${color})`,
      boxShadow: `0 0 60px rgba(${rgb}, 0.4)`,
      animation: 'spin 2s linear infinite',
    },
    orbListening: {
      background: `radial-gradient(circle at 40% 40%, ${color}, ${dark})`,
      boxShadow: `0 0 80px rgba(${rgb}, 0.5), 0 0 120px rgba(${rgb}, 0.2)`,
      animation: 'breathe 3s ease-in-out infinite',
    },
    orbSpeaking: {
      background: `radial-gradient(circle at 40% 40%, ${color}, ${dark}, ${darker})`,
      boxShadow: `0 0 80px rgba(${rgb}, 0.6), 0 0 140px rgba(${rgb}, 0.3)`,
    },
    ringListening1: {
      border: `2px solid rgba(${rgb}, 0.3)`,
      animation: 'ringPulse1 3s ease-in-out infinite',
    },
    ringListening2: {
      border: `1px solid rgba(${rgb}, 0.15)`,
      animation: 'ringPulse2 3s ease-in-out infinite 0.5s',
    },
    ringSpeaking1: {
      border: `2px solid rgba(${rgb}, 0.4)`,
      animation: 'ripple 1.5s ease-out infinite',
    },
    ringSpeaking2: {
      border: `2px solid rgba(${rgb}, 0.3)`,
      animation: 'rippleSlow 2s ease-out infinite 0.3s',
    },
    ringSpeaking3: {
      border: `1px solid rgba(${rgb}, 0.2)`,
      animation: 'rippleFast 2.5s ease-out infinite 0.6s',
    },
    ringConnecting: {
      border: `2px dashed rgba(${rgb}, 0.4)`,
      animation: 'spin 3s linear infinite reverse',
    },
  }), [color, rgb, dark, darker]);

  return (
    <div style={styles.container}>
      {state === 'listening' && (
        <>
          <div style={{ ...styles.ring, ...dynamicStyles.ringListening1 }} />
          <div style={{ ...styles.ring, ...dynamicStyles.ringListening2 }} />
        </>
      )}
      {state === 'speaking' && (
        <>
          <div style={{ ...styles.ring, ...dynamicStyles.ringSpeaking1, transform: `scale(${1 + audioLevel * 0.5})` }} />
          <div style={{ ...styles.ring, ...dynamicStyles.ringSpeaking2, transform: `scale(${1 + audioLevel * 0.3})` }} />
          <div style={{ ...styles.ring, ...dynamicStyles.ringSpeaking3, transform: `scale(${1 + audioLevel * 0.7})` }} />
        </>
      )}
      {state === 'connecting' && (
        <div style={{ ...styles.ring, ...dynamicStyles.ringConnecting }} />
      )}

      <div
        style={{
          ...styles.orb,
          ...(state === 'idle' ? styles.orbIdle : {}),
          ...(state === 'connecting' ? dynamicStyles.orbConnecting : {}),
          ...(state === 'listening' ? dynamicStyles.orbListening : {}),
          ...(state === 'speaking' ? dynamicStyles.orbSpeaking : {}),
          transform: `scale(${scale})`,
        }}
      />

      <style>{`
        @keyframes slowPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes ripple {
          0% { transform: scale(0.95); opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes rippleSlow {
          0% { transform: scale(0.95); opacity: 0.5; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes rippleFast {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ringPulse1 {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.15; }
        }
        @keyframes ringPulse2 {
          0%, 100% { transform: scale(1.1); opacity: 0.2; }
          50% { transform: scale(1.25); opacity: 0.1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const SIZE = 240;

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative', width: SIZE, height: SIZE,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  orb: {
    width: SIZE, height: SIZE, borderRadius: '50%',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative', zIndex: 2,
  },
  orbIdle: {
    background: 'radial-gradient(circle at 40% 40%, #3a3a4a, #1a1a2e)',
    boxShadow: '0 0 40px rgba(100, 100, 140, 0.2)',
    animation: 'slowPulse 4s ease-in-out infinite',
  },
  ring: {
    position: 'absolute', top: 0, left: 0, width: SIZE, height: SIZE,
    borderRadius: '50%', zIndex: 1,
  },
};

export default VoiceOrb;
