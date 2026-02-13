import React, { useState, useRef } from 'react';
import { Persona } from '../types';

interface Props {
  onImport: (persona: Omit<Persona, 'id'>) => void;
  exportPersona?: Persona | null;
  onClose: () => void;
}

const TemplateShare: React.FC<Props> = ({ onImport, exportPersona, onClose }) => {
  const [tab, setTab] = useState<'export' | 'import'>(exportPersona ? 'export' : 'import');
  const [jsonInput, setJsonInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJson = exportPersona
    ? JSON.stringify({ name: exportPersona.name, icon: exportPersona.icon, description: exportPersona.description, systemPrompt: exportPersona.systemPrompt, color: exportPersona.color }, null, 2)
    : '';

  const copyExport = async () => {
    await navigator.clipboard.writeText(exportJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    setError('');
    try {
      const data = JSON.parse(jsonInput);
      if (!data.name || !data.systemPrompt) { setError('JSON must have "name" and "systemPrompt"'); return; }
      onImport({ name: data.name, icon: data.icon || '✨', description: data.description || '', systemPrompt: data.systemPrompt, color: data.color || '#a78bfa' });
      onClose();
    } catch { setError('Invalid JSON'); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJsonInput(reader.result as string);
    reader.readAsText(file);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Persona Templates</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.tabs}>
          {exportPersona && (
            <button onClick={() => setTab('export')} style={{ ...styles.tab, ...(tab === 'export' ? styles.tabActive : {}) }}>
              Export
            </button>
          )}
          <button onClick={() => setTab('import')} style={{ ...styles.tab, ...(tab === 'import' ? styles.tabActive : {}) }}>
            Import
          </button>
        </div>

        {tab === 'export' && exportPersona && (
          <>
            <div style={styles.personaPreview}>
              <span style={{ fontSize: 24 }}>{exportPersona.icon}</span>
              <span style={{ color: 'white', fontWeight: 600 }}>{exportPersona.name}</span>
            </div>
            <pre style={styles.jsonBlock}>{exportJson}</pre>
            <button onClick={copyExport} style={styles.actionBtn}>
              {copied ? '✅ Copied!' : '📋 Copy JSON'}
            </button>
          </>
        )}

        {tab === 'import' && (
          <>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Paste persona JSON here...'
              style={styles.textarea}
            />
            <div style={styles.row}>
              <button onClick={() => fileRef.current?.click()} style={styles.fileBtn}>📁 Load File</button>
              <input ref={fileRef} type="file" accept=".json,.txt" onChange={handleFile} style={{ display: 'none' }} />
              <button onClick={handleImport} style={styles.importBtn} disabled={!jsonInput.trim()}>
                Import Persona
              </button>
            </div>
            {error && <p style={styles.error}>{error}</p>}
          </>
        )}
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer' },
  tabs: { display: 'flex', gap: 4, marginBottom: 16 },
  tab: {
    flex: 1, padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', fontWeight: 600,
  },
  tabActive: { background: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)', color: '#c084fc' },
  personaPreview: {
    display: 'flex', alignItems: 'center', gap: 10, padding: 12,
    background: 'rgba(255,255,255,0.04)', borderRadius: 12, marginBottom: 12,
  },
  jsonBlock: {
    background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 14, color: 'rgba(255,255,255,0.6)',
    fontSize: 12, fontFamily: 'monospace', overflow: 'auto', maxHeight: 180, marginBottom: 12,
    border: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'pre-wrap' as const, margin: '0 0 12px',
  },
  actionBtn: {
    width: '100%', padding: 12, background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
    color: 'rgba(255,255,255,0.8)', fontSize: 14, cursor: 'pointer',
  },
  textarea: {
    width: '100%', minHeight: 120, padding: 14, background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
    color: 'white', fontSize: 13, fontFamily: 'monospace', outline: 'none', resize: 'vertical' as const,
    boxSizing: 'border-box' as const, marginBottom: 12,
  },
  row: { display: 'flex', gap: 8 },
  fileBtn: {
    padding: '10px 16px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer',
  },
  importBtn: {
    flex: 1, padding: '10px 16px', background: '#7c3aed', border: 'none',
    borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  error: { color: '#f87171', fontSize: 13, marginTop: 8 },
};

export default TemplateShare;
