import React from 'react';
import { getTodayUsage, getMonthUsage, getTotalUsage, getDailyLimit, formatMinutes, isPremium } from '../services/usageTracker';

interface Props {
  onClose: () => void;
  onUpgrade: () => void;
}

const CreditsDisplay: React.FC<Props> = ({ onClose, onUpgrade }) => {
  const todayUsed = getTodayUsage();
  const limit = getDailyLimit();
  const remaining = Math.max(0, limit - todayUsed);
  const premium = isPremium();

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Usage & Credits</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.statGrid}>
          <div style={styles.stat}>
            <span style={styles.statValue}>{formatMinutes(todayUsed)}</span>
            <span style={styles.statLabel}>Used Today</span>
          </div>
          <div style={styles.stat}>
            <span style={{ ...styles.statValue, color: premium ? '#34d399' : remaining <= 1 ? '#f87171' : '#34d399' }}>
              {premium ? '∞' : formatMinutes(remaining)}
            </span>
            <span style={styles.statLabel}>Remaining</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{formatMinutes(getMonthUsage())}</span>
            <span style={styles.statLabel}>This Month</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{formatMinutes(getTotalUsage())}</span>
            <span style={styles.statLabel}>All Time</span>
          </div>
        </div>

        {!premium && (
          <div style={styles.tierBadge}>
            <span style={{ fontSize: 14 }}>🆓</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Free Tier — {limit} min/day</span>
          </div>
        )}
        {premium && (
          <div style={{ ...styles.tierBadge, borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.1)' }}>
            <span style={{ fontSize: 14 }}>👑</span>
            <span style={{ color: '#c084fc', fontSize: 13 }}>Premium — Unlimited</span>
          </div>
        )}

        {!premium && (
          <button onClick={onUpgrade} style={styles.buyBtn}>
            ✨ Upgrade to Premium
          </button>
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
    width: '90%', maxWidth: 380, background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
    borderRadius: 20, padding: 24,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer' },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
  stat: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4,
    padding: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 14,
  },
  statValue: { fontSize: 22, fontWeight: 700, color: 'white', fontFamily: 'monospace' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: 1 },
  tierBadge: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, marginBottom: 16,
  },
  buyBtn: {
    width: '100%', padding: 14, background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
};

export default CreditsDisplay;
