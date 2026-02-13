import React, { useState } from 'react';
import { Mode } from '../data/modes';

interface Props {
  mode: Mode;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const ModeSetup: React.FC<Props> = ({ mode, onConfirm, onCancel }) => {
  const [value, setValue] = useState('');
  const isLanguage = mode.settings?.requiresLanguage;
  const languages = mode.settings?.languages || [];

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={{ ...styles.modal, borderColor: mode.color + '40' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 40 }}>{mode.icon}</div>
        <h2 style={{ ...styles.title, color: mode.color }}>{mode.name}</h2>

        {isLanguage ? (
          <>
            <p style={styles.label}>Which language do you want to practice?</p>
            <div style={styles.chips}>
              {languages.map((lang) => (
                <button
                  key={lang}
                  style={{
                    ...styles.chip,
                    borderColor: value === lang ? mode.color : 'rgba(255,255,255,0.15)',
                    background: value === lang ? mode.color + '20' : 'transparent',
                    color: value === lang ? mode.color : 'rgba(255,255,255,0.7)',
                  }}
                  onClick={() => setValue(lang)}
                >
                  {lang}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p style={styles.label}>What role are you preparing for?</p>
            <input
              style={{ ...styles.input, borderColor: mode.color + '60' }}
              placeholder="e.g. Software Engineer"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && value.trim() && onConfirm(value.trim())}
            />
          </>
        )}

        <div style={styles.buttons}>
          <button style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button
            style={{
              ...styles.startBtn,
              background: value.trim() ? mode.color : 'rgba(255,255,255,0.1)',
              opacity: value.trim() ? 1 : 0.4,
            }}
            disabled={!value.trim()}
            onClick={() => onConfirm(value.trim())}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 24,
  },
  modal: {
    background: '#1a1a2e',
    borderRadius: 24,
    border: '1px solid',
    padding: '32px 28px',
    maxWidth: 380,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    margin: 0,
  },
  label: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    margin: 0,
    textAlign: 'center',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    padding: '8px 16px',
    borderRadius: 20,
    border: '1px solid',
    background: 'transparent',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
  },
  buttons: {
    display: 'flex',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    cursor: 'pointer',
  },
  startBtn: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 12,
    border: 'none',
    color: '#000',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default ModeSetup;
