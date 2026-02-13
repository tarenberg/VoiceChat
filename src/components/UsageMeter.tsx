import React from 'react';
import { getTodayUsage, getDailyLimit, formatMinutes, isPremium } from '../services/usageTracker';

interface Props {
  refreshKey?: number;
  onLimitReached?: () => void;
}

const UsageMeter: React.FC<Props> = ({ refreshKey, onLimitReached }) => {
  const used = getTodayUsage();
  const limit = getDailyLimit();
  const premium = isPremium();
  const pct = premium ? 0 : Math.min(1, used / limit);
  const remaining = Math.max(0, limit - used);

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  const color = pct >= 1 ? '#f87171' : pct > 0.7 ? '#fbbf24' : '#34d399';

  return (
    <button
      onClick={() => { if (pct >= 1 && onLimitReached) onLimitReached(); }}
      style={styles.container}
      title={premium ? 'Premium — Unlimited' : `${formatMinutes(used)} / ${formatMinutes(limit)} today`}
    >
      <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="22" cy="22" r={radius} fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span style={{ ...styles.text, color }}>
        {premium ? '∞' : formatMinutes(remaining)}
      </span>
    </button>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  text: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'monospace',
  },
};

export default UsageMeter;
