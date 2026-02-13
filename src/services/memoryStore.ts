import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface MemoryFact {
  id: string;
  fact: string;
  source: string; // conversation id
  extractedAt: number;
}

interface MemoryDB extends DBSchema {
  facts: {
    key: string;
    value: MemoryFact;
  };
}

let dbPromise: Promise<IDBPDatabase<MemoryDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MemoryDB>('voicechat-memory', 1, {
      upgrade(db) {
        db.createObjectStore('facts', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function saveFacts(facts: MemoryFact[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('facts', 'readwrite');
  for (const fact of facts) {
    await tx.store.put(fact);
  }
  await tx.done;
}

export async function getAllFacts(): Promise<MemoryFact[]> {
  const db = await getDB();
  return db.getAll('facts');
}

export async function deleteFact(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('facts', id);
}

export async function extractMemoryFromTranscript(
  apiKey: string,
  transcript: string,
  conversationId: string,
  existingFacts: MemoryFact[]
): Promise<MemoryFact[]> {
  if (!transcript.trim()) return [];

  const existingStr = existingFacts.map(f => `- ${f.fact}`).join('\n') || 'None yet';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract key personal facts about the USER from this conversation transcript. Focus on: name, preferences, hobbies, work, relationships, opinions, important life events.

Already known facts:
${existingStr}

Only return NEW facts not already known. Return each fact on its own line, prefixed with "- ". If no new facts, return "NONE".

Transcript:
${transcript}`
            }]
          }]
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (text.trim() === 'NONE') return [];

    const lines = text.split('\n').filter((l: string) => l.trim().startsWith('-'));
    return lines.map((line: string) => ({
      id: crypto.randomUUID(),
      fact: line.replace(/^-\s*/, '').trim(),
      source: conversationId,
      extractedAt: Date.now(),
    }));
  } catch (err) {
    console.error('Memory extraction failed:', err);
    return [];
  }
}

export async function generateSummary(apiKey: string, transcript: string): Promise<string> {
  if (!transcript.trim()) return '';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Write a brief 1-2 sentence summary of this voice conversation. Be concise and capture the main topics discussed.

Transcript:
${transcript}`
            }]
          }]
        }),
      }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  } catch (err) {
    console.error('Summary generation failed:', err);
    return '';
  }
}

export function buildMemoryPrompt(facts: MemoryFact[]): string {
  if (facts.length === 0) return '';
  const factList = facts.map(f => `- ${f.fact}`).join('\n');
  return `\n\nMuffin remembers these things about Tom:\n${factList}\n\nUse this knowledge naturally in conversation — reference things you remember when relevant, but don't list them all at once.`;
}
