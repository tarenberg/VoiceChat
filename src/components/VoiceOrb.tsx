import React from 'react';

export type OrbState = 'idle' | 'connecting' | 'listening' | 'speaking';

interface Props {
  state: OrbState;
  audioLevel?: number; // 0-1
}

const VoiceOrb: React.FC<Props> = ({ state, audioLevel = 0 }) => {
  const scale = state === 'speaking' ? 1 + audioLevel * 0.3 : 1;

  return (
    <div style={styles.container}>
      {/* Outer glow rings */}
      {state === 'listening' && (
        <>
          <div style={{ ...styles.ring, ...styles.ringListening1 }} />
          <div style={{ ...styles.ring, ...styles.ringListening2 }} />
        </>
      )}
      {state === 'speaking' && (
        <>
          <div style={{ ...styles.ring, ...styles.ringSpeaking1, transform: `scale(${1 + audioLevel * 0.5})` }} />
          <div style={{ ...styles.ring, ...styles.ringSpeaking2, transform: `scale(${1 + audioLevel * 0.3})` }} />
          <div style={{ ...styles.ring, ...styles.ringSpeaking3, transform: `scale(${1 + audioLevel * 0.7})` }} />
        </>
      )}
      {state === 'connecting' && (
        <div style={{ ...styles.ring, ...styles.ringConnecting }} />
      )}

      {/* Main orb */}
      <div
        style={{
          ...styles.orb,
          ...(state === 'idle' ? styles.orbIdle : {}),
          ...(state === 'connecting' ? styles.orbConnecting : {}),
          ...(state === 'listening' ? styles.orbListening : {}),
          ...(state === 'speaking' ? styles.orbSpeaking : {}),
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
      `}</style>
    </div>
  );
};

const SIZE = 240;

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: SIZE,
    height: SIZE,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: SIZE,
    height: SIZE,
    borderRadius: '50%',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    zIndex: 2,
  },
  orbIdle: {
    background: 'radial-gradient(circle at 40% 40%, #3a3a4a, #1a1a2e)',
    boxShadow: '0 0 40px rgba(100, 100, 140, 0.2)',
    animation: 'slowPulse 4s ease-in-out infinite',
  },
  orbConnecting: {
    background: 'conic-gradient(from 0deg, #667eea, #764ba2, #667eea)',
    boxShadow: '0 0 60px rgba(102, 126, 234, 0.4)',
    animation: 'spin 2s linear infinite',
  },
  orbListening: {
    background: 'radial-gradient(circle at 40% 40%, #60a5fa, #1e40af)',
    boxShadow: '0 0 80px rgba(59, 130, 246, 0.5), 0 0 120px rgba(59, 130, 246, 0.2)',
    animation: 'breathe 3s ease-in-out infinite',
  },
  orbSpeaking: {
    background: 'radial-gradient(circle at 40% 40%, #c084fc, #7c3aed, #4c1d95)',
    boxShadow: '0 0 80px rgba(139, 92, 246, 0.6), 0 0 140px rgba(139, 92, 246, 0.3)',
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIZE,
    height: SIZE,
    borderRadius: '50%',
    zIndex: 1,
  },
  ringListening1: {
    border: '2px solid rgba(59, 130, 246, 0.3)',
    animation: 'ringPulse1 3s ease-in-out infinite',
  },
  ringListening2: {
    border: '1px solid rgba(59, 130, 246, 0.15)',
    animation: 'ringPulse2 3s ease-in-out infinite 0.5s',
  },
  ringSpeaking1: {
    border: '2px solid rgba(139, 92, 246, 0.4)',
    animation: 'ripple 1.5s ease-out infinite',
  },
  ringSpeaking2: {
    border: '2px solid rgba(139, 92, 246, 0.3)',
    animation: 'rippleSlow 2s ease-out infinite 0.3s',
  },
  ringSpeaking3: {
    border: '1px solid rgba(168, 85, 247, 0.2)',
    animation: 'rippleFast 2.5s ease-out infinite 0.6s',
  },
  ringConnecting: {
    border: '2px dashed rgba(102, 126, 234, 0.4)',
    animation: 'spin 3s linear infinite reverse',
  },
};

export default VoiceOrb;
