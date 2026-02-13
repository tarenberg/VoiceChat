import React, { useState } from 'react';
import { Persona } from '../types';

interface Props {
  personas: Persona[];
  selectedId: string;
  onSelect: (persona: Persona) => void;
  onCreateCustom: (persona: Omit<Persona, 'id'>) => void;
  onClose: () => void;
}

const PersonaSelector: React.FC<Props> = ({ personas, selectedId, onSelect, onCreateCustom, onClose }) => {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '✨', description: '', systemPrompt: '', color: '#a78bfa' });

  const handleCreate = () => {
    if (!form.name.trim() || !form.systemPrompt.trim()) return;
    onCreateCustom(form);
    setCreating(false);
    setForm({ name: '', icon: '✨', description: '', systemPrompt: '', color: '#a78bfa' });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Choose Persona</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {!creating ? (
          <>
            <div style={styles.grid}>
              {personas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  style={{
                    ...styles.card,
                    ...(p.id === selectedId ? { borderColor: p.color, boxShadow: `0 0 20px ${p.color}33` } : {}),
                  }}
                >
                  <span style={styles.cardIcon}>{p.icon}</span>
                  <span style={styles.cardName}>{p.name}</span>
                  <span style={styles.cardDesc}>{p.description}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setCreating(true)} style={styles.createBtn}>+ Create Custom Persona</button>
          </>
        ) : (
          <div style={styles.form}>
            <div style={styles.formRow}>
              <input
                placeholder="Icon (emoji)"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                style={{ ...styles.input, width: 60, textAlign: 'center', fontSize: 24 }}
                maxLength={4}
              />
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ ...styles.input, flex: 1 }}
              />
            </div>
            <input
              placeholder="Short description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={styles.input}
            />
            <textarea
              placeholder="System prompt — define the persona's personality and behavior..."
              value={form.systemPrompt}
              onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
              style={{ ...styles.input, minHeight: 100, resize: 'vertical' }}
            />
            <div style={styles.formRow}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Color:</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                style={{ width: 40, height: 32, border: 'none', background: 'none', cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }} />
              <button onClick={() => setCreating(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleCreate} style={styles.saveBtn}>Create</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
    animation: 'fadeIn 0.2s ease',
  },
  panel: {
    width: '100%', maxWidth: 520, maxHeight: '80vh', overflow: 'auto',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
    borderRadius: '20px 20px 0 0', padding: '24px 20px',
    animation: 'slideUp 0.3s ease',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 },
  closeBtn: {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12,
  },
  card: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6,
    padding: '16px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s',
    textAlign: 'center' as const,
  },
  cardIcon: { fontSize: 32 },
  cardName: { fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' },
  cardDesc: { fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 },
  createBtn: {
    width: '100%', padding: '14px', marginTop: 16, background: 'rgba(255,255,255,0.06)',
    border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 14, color: 'rgba(255,255,255,0.6)',
    fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
  },
  form: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  formRow: { display: 'flex', gap: 10, alignItems: 'center' },
  input: {
    width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    color: 'white', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  },
  cancelBtn: {
    padding: '8px 16px', background: 'none', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13,
  },
  saveBtn: {
    padding: '8px 20px', background: '#7c3aed', border: 'none',
    borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
};

export default PersonaSelector;
