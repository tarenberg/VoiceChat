import React, { useState, useEffect } from 'react';
import { Conversation, getAllConversations, deleteConversation } from '../services/conversationStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conv: Conversation) => void;
}

const ConversationHistory: React.FC<Props> = ({ isOpen, onClose, onSelectConversation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getAllConversations().then(setConversations);
    }
  }, [isOpen]);

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.summary?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirm === id) {
      await deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const formatDuration = (start: number, end?: number) => {
    if (!end) return '';
    const mins = Math.round((end - start) / 60000);
    if (mins < 1) return '<1m';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease', zIndex: 998,
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 340,
        background: 'linear-gradient(180deg, #12121a 0%, #0d0d15 100%)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 999, display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 }}>
              History
            </h2>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              fontSize: 20, cursor: 'pointer', padding: '4px 8px',
            }}>✕</button>
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
              color: 'rgba(255,255,255,0.8)', fontSize: 13, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 40 }}>
              {conversations.length === 0 ? 'No conversations yet' : 'No matches'}
            </p>
          )}
          {filtered.map(conv => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              style={{
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>🧁</span>
                    <span style={{
                      fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.8)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{conv.title}</span>
                  </div>
                  {conv.summary && (
                    <p style={{
                      margin: '2px 0 0 24px', fontSize: 12, color: 'rgba(255,255,255,0.35)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{conv.summary}</p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0, marginLeft: 8 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{formatDate(conv.startedAt)}</span>
                  {conv.endedAt && (
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                      {formatDuration(conv.startedAt, conv.endedAt)}
                    </span>
                  )}
                  <button
                    onClick={(e) => handleDelete(conv.id, e)}
                    style={{
                      background: 'none', border: 'none', fontSize: 11, cursor: 'pointer', marginTop: 2,
                      color: deleteConfirm === conv.id ? '#f87171' : 'rgba(255,255,255,0.2)',
                      padding: '2px 4px',
                    }}
                  >
                    {deleteConfirm === conv.id ? 'Confirm?' : '🗑'}
                  </button>
                </div>
              </div>
              {conv.bookmarks.length > 0 && (
                <div style={{ marginTop: 4, marginLeft: 24 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                    ⭐ {conv.bookmarks.length} bookmark{conv.bookmarks.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ConversationHistory;
