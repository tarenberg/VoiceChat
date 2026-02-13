import React, { useState } from 'react';
import { UserProfile, Persona } from '../types';
import { isPremium, setPremium } from '../services/usageTracker';

interface Props {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
  onDeletePersona: (id: string) => void;
}

const Settings: React.FC<Props> = ({ profile, onSave, onClose, onDeletePersona }) => {
  const [name, setName] = useState(profile.name);
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [premium, setPremiumState] = useState(isPremium());

  const addInterest = () => {
    const tag = interestInput.trim();
    if (tag && !interests.includes(tag)) {
      setInterests([...interests, tag]);
    }
    setInterestInput('');
  };

  const removeInterest = (t: string) => setInterests(interests.filter((i) => i !== t));

  const handleSave = () => {
    onSave({ ...profile, name: name.trim(), interests });
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Settings</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <label style={styles.label}>Your Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What should the AI call you?"
          style={styles.input}
        />

        <label style={{ ...styles.label, marginTop: 16 }}>Interests</label>
        <div style={styles.tagRow}>
          <input
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addInterest()}
            placeholder="Add interest..."
            style={{ ...styles.input, flex: 1 }}
          />
          <button onClick={addInterest} style={styles.addBtn}>+</button>
        </div>
        <div style={styles.tags}>
          {interests.map((t) => (
            <span key={t} style={styles.tag}>
              {t}
              <button onClick={() => removeInterest(t)} style={styles.tagX}>×</button>
            </span>
          ))}
        </div>

        <label style={{ ...styles.label, marginTop: 20 }}>Subscription</label>
        <div style={styles.personaRow}>
          <span style={{ color: 'rgba(255,255,255,0.8)' }}>👑 Premium Mode</span>
          <button
            onClick={() => { const v = !premium; setPremiumState(v); setPremium(v); }}
            style={{
              ...styles.delBtn,
              background: premium ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)',
              borderColor: premium ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)',
              color: premium ? '#34d399' : 'rgba(255,255,255,0.5)',
            }}
          >
            {premium ? 'ON' : 'OFF'}
          </button>
        </div>

        {profile.customPersonas.length > 0 && (
          <>
            <label style={{ ...styles.label, marginTop: 20 }}>Custom Personas</label>
            {profile.customPersonas.map((p) => (
              <div key={p.id} style={styles.personaRow}>
                <span>{p.icon} {p.name}</span>
                <button onClick={() => onDeletePersona(p.id)} style={styles.delBtn}>Delete</button>
              </div>
            ))}
          </>
        )}

        <button onClick={handleSave} style={styles.saveBtn}>Save</button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  panel: {
    width: '90%', maxWidth: 420, background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
    borderRadius: 20, padding: 24,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer' },
  label: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' },
  input: {
    width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    color: 'white', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const,
  },
  tagRow: { display: 'flex', gap: 8, marginBottom: 8 },
  addBtn: {
    width: 38, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10, color: 'white', fontSize: 18, cursor: 'pointer',
  },
  tags: { display: 'flex', flexWrap: 'wrap' as const, gap: 6 },
  tag: {
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
    background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)',
    borderRadius: 20, color: 'rgba(255,255,255,0.8)', fontSize: 12,
  },
  tagX: {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
    fontSize: 14, padding: 0, marginLeft: 2,
  },
  personaRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10,
    color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 6,
  },
  delBtn: {
    background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)',
    borderRadius: 6, color: '#f87171', fontSize: 12, padding: '4px 10px', cursor: 'pointer',
  },
  saveBtn: {
    width: '100%', padding: 14, marginTop: 20, background: '#7c3aed', border: 'none',
    borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
};

export default Settings;
