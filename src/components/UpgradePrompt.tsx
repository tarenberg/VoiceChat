import React from 'react';

interface Props {
  onClose: () => void;
}

const UpgradePrompt: React.FC<Props> = ({ onClose }) => {
  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>

        <div style={styles.iconWrap}>
          <span style={{ fontSize: 56 }}>👑</span>
        </div>

        <h2 style={styles.title}>You've used your free minutes today!</h2>
        <p style={styles.subtitle}>Upgrade for unlimited conversations with all personas</p>

        <div style={styles.benefits}>
          {['Unlimited daily minutes', 'All personas unlocked', 'Priority connection speed', 'Early access to new features'].map((b) => (
            <div key={b} style={styles.benefitRow}>
              <span style={styles.check}>✓</span>
              <span style={styles.benefitText}>{b}</span>
            </div>
          ))}
        </div>

        <button onClick={() => alert('Coming soon!')} style={styles.upgradeBtn}>
          ✨ Upgrade to Premium
        </button>

        <button onClick={() => alert('Coming soon!')} style={styles.adBtn}>
          🎬 Watch Ad for 2 Free Minutes
        </button>

        <button onClick={onClose} style={styles.dismissBtn}>
          Maybe later
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'linear-gradient(180deg, rgba(10,10,15,0.97) 0%, rgba(15,15,26,0.99) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  panel: {
    width: '90%', maxWidth: 400, display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', textAlign: 'center' as const, padding: '40px 24px',
  },
  closeBtn: {
    position: 'absolute' as const, top: 20, right: 20,
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 24, cursor: 'pointer',
  },
  iconWrap: {
    width: 100, height: 100, borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(168,85,247,0.1))',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: {
    fontSize: 22, fontWeight: 700, color: 'white', margin: '0 0 8px', lineHeight: 1.3,
  },
  subtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 28px',
  },
  benefits: {
    width: '100%', display: 'flex', flexDirection: 'column' as const, gap: 12, marginBottom: 32,
    textAlign: 'left' as const,
  },
  benefitRow: { display: 'flex', alignItems: 'center', gap: 10 },
  check: { color: '#34d399', fontSize: 16, fontWeight: 700 },
  benefitText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  upgradeBtn: {
    width: '100%', padding: 16,
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none',
    borderRadius: 14, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer',
    marginBottom: 10, boxShadow: '0 4px 24px rgba(139,92,246,0.4)',
  },
  adBtn: {
    width: '100%', padding: 14,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, color: 'rgba(255,255,255,0.7)', fontSize: 14, cursor: 'pointer',
    marginBottom: 16,
  },
  dismissBtn: {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
    fontSize: 13, cursor: 'pointer', padding: 8,
  },
};

export default UpgradePrompt;
