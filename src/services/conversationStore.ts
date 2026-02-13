import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface ConversationMessage {
  role: 'user' | 'ai';
  timestamp: number;
  transcription?: string;
}

export interface Bookmark {
  id: string;
  timestamp: number;
  label?: string;
}

export interface Conversation {
  id: string;
  title: string;
  startedAt: number;
  endedAt?: number;
  persona: string;
  messages: ConversationMessage[];
  bookmarks: Bookmark[];
  summary?: string;
}

interface VoiceChatDB extends DBSchema {
  conversations: {
    key: string;
    value: Conversation;
    indexes: { 'by-date': number };
  };
}

let dbPromise: Promise<IDBPDatabase<VoiceChatDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<VoiceChatDB>('voicechat-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('conversations', { keyPath: 'id' });
        store.createIndex('by-date', 'startedAt');
      },
    });
  }
  return dbPromise;
}

export async function saveConversation(conv: Conversation): Promise<void> {
  const db = await getDB();
  await db.put('conversations', conv);
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const db = await getDB();
  return db.get('conversations', id);
}

export async function getAllConversations(): Promise<Conversation[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('conversations', 'by-date');
  return all.reverse(); // newest first
}

export async function deleteConversation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('conversations', id);
}

export function createConversation(persona: string): Conversation {
  return {
    id: crypto.randomUUID(),
    title: 'New Conversation',
    startedAt: Date.now(),
    persona,
    messages: [],
    bookmarks: [],
  };
}
