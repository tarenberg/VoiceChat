import React from 'react';
import { Conversation } from '../services/conversationStore';

interface Props {
  conversation: Conversation | null;
  onClose: () => void;
}

const ConversationDetail: React.FC<Props> = ({ conversation, onClose }) => {
  if (!conversation) return null;

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  };

  const formatDuration = (start: number, end?: number) => {
    if (!end) return 'In progress';
    const mins = Math.round((end - start) / 60000);
    if (mins < 1) return 'Less than a minute';
    if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''}`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const relativeTimestamp = (msgTs: number) => {
    const elapsed = Math.round((msgTs - conversation.startedAt) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #15151f 0%, #0d0d15 100%)',
          borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)',
          width: '100%', maxWidth: 520, maxHeight: '80vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>🧁</span>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                  {conversation.title}
                </h2>
              </div>
              <p style={{ margin: '4px 0 0 28px', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                {formatDate(conversation.startedAt)} · {formatDuration(conversation.startedAt, conversation.endedAt)}
              </p>
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              fontSize: 20, cursor: 'pointer', padding: '4px 8px',
            }}>✕</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* Summary */}
          {conversation.summary && (
            <div style={{
              padding: 14, background: 'rgba(139,92,246,0.08)', borderRadius: 10,
              border: '1px solid rgba(139,92,246,0.15)', marginBottom: 20,
            }}>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(139,92,246,0.7)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                Summary
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                {conversation.summary}
              </p>
            </div>
          )}

          {/* Bookmarks */}
          {conversation.bookmarks.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                Bookmarks
              </p>
              {conversation.bookmarks.map(bm => (
                <div key={bm.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ fontSize: 12 }}>⭐</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    {formatTime(bm.timestamp)}
                  </span>
                  {bm.label && (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{bm.label}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Timeline */}
          {conversation.messages.length > 0 && (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                Timeline
              </p>
              {conversation.messages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, padding: '8px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', flexShrink: 0, width: 36, textAlign: 'right' }}>
                    {relativeTimestamp(msg.timestamp)}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, flexShrink: 0, width: 32,
                    color: msg.role === 'user' ? 'rgba(96,165,250,0.7)' : 'rgba(192,132,252,0.7)',
                  }}>
                    {msg.role === 'user' ? 'You' : 'AI'}
                  </span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                    {msg.transcription || '(audio only)'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {conversation.messages.length === 0 && !conversation.summary && (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 40 }}>
              No transcript available for this conversation.
              <br />
              <span style={{ fontSize: 11 }}>Audio transcription coming in a future update.</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationDetail;
