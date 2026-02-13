import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import VoiceOrb, { OrbState } from './components/VoiceOrb';
import ConversationHistory from './components/ConversationHistory';
import ConversationDetail from './components/ConversationDetail';
import {
  Conversation,
  createConversation,
  saveConversation,
} from './services/conversationStore';
import {
  MemoryFact,
  getAllFacts,
  saveFacts,
  extractMemoryFromTranscript,
  generateSummary,
  buildMemoryPrompt,
} from './services/memoryStore';

const BASE_SYSTEM_INSTRUCTION = `You are Muffin, Tom's friendly AI assistant. You have a warm, conversational personality. Talk naturally like a friend. Keep responses concise and conversational — this is a voice chat, not an essay. Be helpful, have opinions, and be genuinely engaging.`;

const App: React.FC = () => {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [statusText, setStatusText] = useState('Tap to start');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailConversation, setDetailConversation] = useState<Conversation | null>(null);
  const [bookmarkFlash, setBookmarkFlash] = useState(false);

  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const connectedRef = useRef(false);
  const currentConvRef = useRef<Conversation | null>(null);
  const memoryFactsRef = useRef<MemoryFact[]>([]);

  useEffect(() => {
    // Load memory facts on mount
    getAllFacts().then(facts => { memoryFactsRef.current = facts; });
    return () => { disconnect(); };
  }, []);

  const addBookmark = useCallback(() => {
    if (!currentConvRef.current || !connectedRef.current) return;
    const bookmark = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    currentConvRef.current.bookmarks.push(bookmark);
    setBookmarkFlash(true);
    setTimeout(() => setBookmarkFlash(false), 600);
  }, []);

  const finalizeConversation = useCallback(async () => {
    const conv = currentConvRef.current;
    if (!conv) return;

    conv.endedAt = Date.now();

    // Build transcript from messages
    const transcript = conv.messages
      .map(m => `${m.role === 'user' ? 'User' : 'Muffin'}: ${m.transcription || '(audio)'}`)
      .join('\n');

    const apiKey = import.meta.env.VITE_API_KEY;
    if (apiKey && transcript.trim()) {
      // Generate summary
      const summary = await generateSummary(apiKey, transcript);
      if (summary) conv.summary = summary;

      // Generate title from summary or first message
      if (summary) {
        conv.title = summary.length > 60 ? summary.substring(0, 57) + '...' : summary;
      } else if (conv.messages.length > 0) {
        const first = conv.messages.find(m => m.transcription);
        conv.title = first?.transcription?.substring(0, 50) || 'Voice Conversation';
      }

      // Extract memory
      const newFacts = await extractMemoryFromTranscript(
        apiKey, transcript, conv.id, memoryFactsRef.current
      );
      if (newFacts.length > 0) {
        await saveFacts(newFacts);
        memoryFactsRef.current = [...memoryFactsRef.current, ...newFacts];
      }
    }

    await saveConversation(conv);
    currentConvRef.current = null;
  }, []);

  const connect = useCallback(async () => {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
      setError('API key missing. Create .env.local with VITE_API_KEY=your_key');
      return;
    }

    try {
      setError(null);
      setOrbState('connecting');
      setStatusText('Connecting...');

      // Create conversation record
      const conv = createConversation('muffin');
      currentConvRef.current = conv;

      // Build system prompt with memory
      const memoryPrompt = buildMemoryPrompt(memoryFactsRef.current);
      const systemInstruction = BASE_SYSTEM_INSTRUCTION + memoryPrompt;

      const ai = new GoogleGenAI({ apiKey });

      inputCtxRef.current = new AudioContext({ sampleRate: 16000 });
      outputCtxRef.current = new AudioContext({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const callbacks = {
        onopen: () => {
          connectedRef.current = true;
          setOrbState('listening');
          setStatusText('Listening...');

          if (inputCtxRef.current) {
            const source = inputCtxRef.current.createMediaStreamSource(stream);
            sourceNodeRef.current = source;
            const processor = inputCtxRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
              if (!connectedRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm = float32ToPcmBase64(inputData);
              sessionRef.current?.sendRealtimeInput({
                media: { data: pcm, mimeType: 'audio/pcm;rate=16000' },
              });
            };

            source.connect(processor);
            processor.connect(inputCtxRef.current.destination);
          }
        },
        onmessage: (message: any) => {
          const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioData && outputCtxRef.current) {
            setOrbState('speaking');
            setStatusText('Muffin is speaking...');

            const ctx = outputCtxRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

            const raw = base64ToUint8(audioData);
            const buffer = pcmToAudioBuffer(raw, ctx, 24000);

            const src = ctx.createBufferSource();
            src.buffer = buffer;
            src.connect(ctx.destination);

            src.addEventListener('ended', () => {
              sourcesRef.current.delete(src);
              if (sourcesRef.current.size === 0 && connectedRef.current) {
                setOrbState('listening');
                setStatusText('Listening...');
                setAudioLevel(0);
              }
            });

            src.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            sourcesRef.current.add(src);

            const int16 = new Int16Array(raw.buffer);
            let sum = 0;
            for (let i = 0; i < int16.length; i++) sum += Math.abs(int16[i]);
            const avg = sum / int16.length / 32768;
            setAudioLevel(Math.min(1, avg * 4));
          }

          // Track AI messages (no transcription available from audio-only model for now)
          if (message.serverContent?.modelTurn?.parts?.length > 0) {
            if (currentConvRef.current) {
              // Only add one message entry per turn
              const parts = message.serverContent.modelTurn.parts;
              const textPart = parts.find((p: any) => p.text);
              if (textPart) {
                currentConvRef.current.messages.push({
                  role: 'ai',
                  timestamp: Date.now(),
                  transcription: textPart.text,
                });
              }
            }
          }

          if (message.serverContent?.turnComplete) {
            if (connectedRef.current) {
              setOrbState('listening');
              setStatusText('Listening...');
              setAudioLevel(0);
            }
          }
        },
        onclose: () => {
          connectedRef.current = false;
          setOrbState('idle');
          setStatusText('Disconnected');
          finalizeConversation();
        },
        onerror: (e: any) => {
          console.error('Session error', e);
          setError('Connection lost. Try again.');
          connectedRef.current = false;
          setOrbState('idle');
          setStatusText('Tap to start');
          finalizeConversation();
        },
      };

      sessionRef.current = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: systemInstruction,
        },
        callbacks,
      });
    } catch (err: any) {
      console.error(err);
      if (err?.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow mic access and try again.');
      } else {
        setError('Could not connect. Check your API key and try again.');
      }
      setOrbState('idle');
      setStatusText('Tap to start');
    }
  }, [finalizeConversation]);

  const disconnect = useCallback(() => {
    connectedRef.current = false;

    sourcesRef.current.forEach((s) => { try { s.stop(); } catch {} });
    sourcesRef.current.clear();

    scriptProcessorRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();

    try { sessionRef.current?.close(); } catch {}
    sessionRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    try { inputCtxRef.current?.close(); } catch {}
    try { outputCtxRef.current?.close(); } catch {}
    inputCtxRef.current = null;
    outputCtxRef.current = null;

    nextStartTimeRef.current = 0;
    setOrbState('idle');
    setStatusText('Tap to start');
    setAudioLevel(0);

    finalizeConversation();
  }, [finalizeConversation]);

  const handleToggle = () => {
    if (orbState === 'idle') connect();
    else disconnect();
  };

  const isActive = orbState !== 'idle';

  return (
    <div style={styles.page}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <button onClick={() => setHistoryOpen(true)} style={styles.iconButton} title="Conversation History">
          🕐
        </button>
        {isActive && (
          <button
            onClick={addBookmark}
            style={{
              ...styles.iconButton,
              ...(bookmarkFlash ? { transform: 'scale(1.3)', color: '#fbbf24' } : {}),
              transition: 'all 0.2s ease',
            }}
            title="Add Bookmark"
          >
            ⭐
          </button>
        )}
      </div>

      <h1 style={styles.title}>Muffin Voice</h1>

      <div style={styles.orbWrapper}>
        <VoiceOrb state={orbState} audioLevel={audioLevel} />
      </div>

      <p style={styles.status}>{statusText}</p>

      {error && <p style={styles.error}>{error}</p>}

      <button onClick={handleToggle} style={{
        ...styles.button,
        ...(orbState !== 'idle' ? styles.buttonActive : {}),
      }}>
        {orbState === 'idle' ? 'Start Conversation' : 'End Conversation'}
      </button>

      {/* Memory indicator */}
      {memoryFactsRef.current.length > 0 && orbState === 'idle' && (
        <p style={styles.memoryHint}>
          🧠 {memoryFactsRef.current.length} thing{memoryFactsRef.current.length !== 1 ? 's' : ''} remembered
        </p>
      )}

      <ConversationHistory
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectConversation={(conv) => {
          setHistoryOpen(false);
          setDetailConversation(conv);
        }}
      />

      <ConversationDetail
        conversation={detailConversation}
        onClose={() => setDetailConversation(null)}
      />
    </div>
  );
};

// --- Helpers ---

function float32ToPcmBase64(data: Float32Array): string {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) {
    int16[i] = Math.max(-32768, Math.min(32767, data[i] * 32768));
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function pcmToAudioBuffer(data: Uint8Array, ctx: AudioContext, sampleRate: number): AudioBuffer {
  const int16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, int16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < int16.length; i++) {
    channelData[i] = int16[i] / 32768.0;
  }
  return buffer;
}

// --- Styles ---

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    padding: 24,
    background: 'linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%)',
    position: 'relative',
  },
  topBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  iconButton: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.6)',
  },
  title: {
    fontSize: 28,
    fontWeight: 300,
    letterSpacing: 4,
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  orbWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  error: {
    fontSize: 14,
    color: '#f87171',
    background: 'rgba(248, 113, 113, 0.1)',
    padding: '8px 16px',
    borderRadius: 8,
    maxWidth: 400,
    textAlign: 'center' as const,
  },
  button: {
    padding: '14px 36px',
    fontSize: 16,
    fontWeight: 500,
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 50,
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.8)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    letterSpacing: 1,
  },
  buttonActive: {
    borderColor: 'rgba(248, 113, 113, 0.4)',
    background: 'rgba(248, 113, 113, 0.1)',
    color: '#f87171',
  },
  memoryHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 0.5,
  },
};

export default App;
