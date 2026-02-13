import React from 'react';
import { Mode, MODES } from '../data/modes';

interface Props {
  selectedMode: Mode | null;
  onSelect: (mode: Mode | null) => void;
  disabled?: boolean;
}

const ModeSelector: React.FC<Props> = ({ selectedMode, onSelect, disabled }) => {
  return (
    <div style={styles.wrapper}>
      <div style={styles.scroll}>
        {/* Free Talk default */}
        <button
          style={{
            ...styles.card,
            borderColor: !selectedMode ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)',
            background: !selectedMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
            opacity: disabled ? 0.5 : 1,
          }}
          onClick={() => !disabled && onSelect(null)}
        >
          <span style={styles.icon}>💬</span>
          <span style={styles.name}>Free Talk</span>
          <span style={styles.desc}>Just chat</span>
        </button>

        {MODES.map((mode) => {
          const active = selectedMode?.id === mode.id;
          return (
            <button
              key={mode.id}
              style={{
                ...styles.card,
                borderColor: active ? mode.color : 'rgba(255,255,255,0.08)',
                background: active ? `${mode.color}15` : 'rgba(255,255,255,0.03)',
                opacity: disabled ? 0.5 : 1,
              }}
              onClick={() => !disabled && onSelect(mode)}
            >
              <span style={styles.icon}>{mode.icon}</span>
              <span style={{ ...styles.name, color: active ? mode.color : 'rgba(255,255,255,0.85)' }}>
                {mode.name}
              </span>
              <span style={styles.desc}>{mode.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: '100%',
    maxWidth: 600,
    overflow: 'hidden',
    pointerEvents: 'auto',
  },
  scroll: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    padding: '4px 12px 8px',
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
  },
  card: {
    flex: '0 0 auto',
    width: 100,
    padding: '10px 8px',
    borderRadius: 16,
    border: '1.5px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    WebkitTapHighlightColor: 'transparent',
  },
  icon: {
    fontSize: 28,
  },
  name: {
    fontSize: 12,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: '1.2',
  },
  desc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: '1.3',
  },
};

export default ModeSelector;
