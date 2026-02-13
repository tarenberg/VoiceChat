import React, { useState } from 'react';

interface Props {
  personaName: string;
  personaIcon: string;
  durationMinutes: number;
  onClose: () => void;
}

const ShareDialog: React.FC<Props> = ({ personaName, personaIcon, durationMinutes, onClose }) => {
  const [copied, setCopied] = useState(false);

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const mins = Math.floor(durationMinutes);
  const secs = Math.round((durationMinutes - mins) * 60);
  const durationStr = `${mins}m ${secs}s`;

  const summaryText = `🎙️ Voice Chat with ${personaIcon} ${personaName}\n📅 ${dateStr} • ⏱️ ${durationStr}\n\nPowered by Muffin Voice`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = () => {
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voicechat-${personaName.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateCard = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 340;
    const ctx = canvas.getContext('2d')!;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 600, 340);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, 600, 340, 20);
    ctx.fill();

    // Accent line
    const accent = ctx.createLinearGradient(0, 0, 300, 0);
    accent.addColorStop(0, '#7c3aed');
    accent.addColorStop(1, '#a855f7');
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 600, 4);

    // Icon
    ctx.font = '48px sans-serif';
    ctx.fillText(personaIcon, 36, 72);

    // Title
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 26px -apple-system, sans-serif';
    ctx.fillText(`Chat with ${personaName}`, 100, 66);

    // Date + duration
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '15px -apple-system, sans-serif';
    ctx.fillText(`${dateStr}  •  ${durationStr}`, 100, 92);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(36, 120);
    ctx.lineTo(564, 120);
    ctx.stroke();

    // Summary snippet
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '16px -apple-system, sans-serif';
    ctx.fillText('A voice conversation powered by AI', 36, 160);
    ctx.fillText(`Duration: ${durationStr}`, 36, 190);

    // Branding
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '13px -apple-system, sans-serif';
    ctx.fillText('🧁 Muffin Voice', 36, 310);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voicechat-card-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const webShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Chat with ${personaName}`, text: summaryText });
      } catch {}
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Share Conversation</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.preview}>
          <span style={{ fontSize: 28 }}>{personaIcon}</span>
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>Chat with {personaName}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{dateStr} • {durationStr}</div>
          </div>
        </div>

        <div style={styles.actions}>
          <button onClick={copyToClipboard} style={styles.actionBtn}>
            {copied ? '✅ Copied!' : '📋 Copy Summary'}
          </button>
          <button onClick={downloadText} style={styles.actionBtn}>
            📄 Download Text
          </button>
          <button onClick={generateCard} style={styles.actionBtn}>
            🖼️ Download Card
          </button>
          {typeof navigator.share === 'function' && (
            <button onClick={webShare} style={{ ...styles.actionBtn, background: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)' }}>
              🔗 Share...
            </button>
          )}
        </div>
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
    width: '90%', maxWidth: 400, background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
    borderRadius: 20, padding: 24,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer' },
  preview: {
    display: 'flex', alignItems: 'center', gap: 14, padding: 16,
    background: 'rgba(255,255,255,0.04)', borderRadius: 14, marginBottom: 16,
  },
  actions: { display: 'flex', flexDirection: 'column' as const, gap: 8 },
  actionBtn: {
    padding: '12px 16px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
    color: 'rgba(255,255,255,0.8)', fontSize: 14, cursor: 'pointer',
    textAlign: 'left' as const, transition: 'all 0.2s',
  },
};

export default ShareDialog;
