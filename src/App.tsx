import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import VoiceOrb, { OrbState } from './components/VoiceOrb';
import ModeSelector from './components/ModeSelector';
import ModeSetup from './components/ModeSetup';
import UsageMeter from './components/UsageMeter';
import CreditsDisplay from './components/CreditsDisplay';
import ShareDialog from './components/ShareDialog';
import UpgradePrompt from './components/UpgradePrompt';
import TemplateShare from './components/TemplateShare';
import { addMinutes, isLimitReached } from './services/usageTracker';
import { Persona } from './types';
import { Mode } from './data/modes';

const BASE_SYSTEM_INSTRUCTION = `You are Muffin, Tom's friendly AI assistant. You have a warm, conversational personality. Talk naturally like a friend. Keep responses concise and conversational — this is a voice chat, not an essay. Be helpful, have opinions, and be genuinely engaging.`;

const App: React.FC = () => {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [statusText, setStatusText] = useState('Tap to start');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);
  const [showSetup, setShowSetup] = useState<Mode | null>(null);
  const [activeMode, setActiveMode] = useState<{ mode: Mode; config?: string } | null>(null);
  const [usageRefresh, setUsageRefresh] = useState(0);
  const [showCredits, setShowCredits] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showTemplateShare, setShowTemplateShare] = useState(false);
  const [lastSessionMinutes, setLastSessionMinutes] = useState(0);

  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const connectedRef = useRef(false);
  const sessionStartRef = useRef<number>(0);
  const usageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { disconnect(); };
  }, []);

  const startUsageTracking = () => {
    sessionStartRef.current = Date.now();
    // Track usage every 15 seconds
    usageIntervalRef.current = setInterval(() => {
      addMinutes(0.25); // 15s = 0.25 min
      setUsageRefresh((r) => r + 1);
      if (isLimitReached()) {
        // Don't force disconnect, just update UI
        setUsageRefresh((r) => r + 1);
      }
    }, 15000);
  };

  const stopUsageTracking = () => {
    if (usageIntervalRef.current) {
      clearInterval(usageIntervalRef.current);
      usageIntervalRef.current = null;
    }
    if (sessionStartRef.current) {
      const elapsed = (Date.now() - sessionStartRef.current) / 60000;
      // Add any remaining fractional time not yet tracked
      const remainder = elapsed % 0.25;
      if (remainder > 0.01) addMinutes(remainder);
      setLastSessionMinutes(elapsed);
      sessionStartRef.current = 0;
      setUsageRefresh((r) => r + 1);
    }
  };

  const connect = useCallback(async () => {
    if (isLimitReached()) {
      setShowUpgrade(true);
      return;
    }

    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
      setError('API key missing. Create .env.local with VITE_API_KEY=your_key');
      return;
    }

    try {
      setError(null);
      setOrbState('connecting');
      setStatusText('Connecting...');

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
          startUsageTracking();

          // Set up mic input
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

            // Estimate audio level from PCM data
            const int16 = new Int16Array(raw.buffer);
            let sum = 0;
            for (let i = 0; i < int16.length; i++) sum += Math.abs(int16[i]);
            const avg = sum / int16.length / 32768;
            setAudioLevel(Math.min(1, avg * 4));
          }

          // Handle turn complete
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
          stopUsageTracking();
          setOrbState('idle');
          setStatusText('Disconnected');
          setShowShare(true);
        },
        onerror: (e: any) => {
          console.error('Session error', e);
          setError('Connection lost. Try again.');
          connectedRef.current = false;
          stopUsageTracking();
          setOrbState('idle');
          setStatusText('Tap to start');
        },
      };

      sessionRef.current = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: buildSystemPrompt(),
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
  }, []);

  const disconnect = useCallback(() => {
    connectedRef.current = false;
    stopUsageTracking();

    // Stop audio sources
    sourcesRef.current.forEach((s) => { try { s.stop(); } catch {} });
    sourcesRef.current.clear();

    // Disconnect audio nodes
    scriptProcessorRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();

    // Close session
    try { sessionRef.current?.close(); } catch {}
    sessionRef.current = null;

    // Stop mic
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    // Close audio contexts
    try { inputCtxRef.current?.close(); } catch {}
    try { outputCtxRef.current?.close(); } catch {}
    inputCtxRef.current = null;
    outputCtxRef.current = null;

    nextStartTimeRef.current = 0;
    setOrbState('idle');
    setStatusText('Tap to start');
    setAudioLevel(0);

    if (sessionStartRef.current) {
      setShowShare(true);
    }
  }, []);

  const handleModeSelect = (mode: Mode | null) => {
    if (!mode) {
      setSelectedMode(null);
      setActiveMode(null);
      return;
    }
    if (mode.settings?.requiresLanguage || mode.settings?.requiresRole) {
      setShowSetup(mode);
    } else {
      setSelectedMode(mode);
      setActiveMode({ mode });
    }
  };

  const handleSetupConfirm = (value: string) => {
    if (showSetup) {
      setSelectedMode(showSetup);
      setActiveMode({ mode: showSetup, config: value });
      setShowSetup(null);
    }
  };

  const buildSystemPrompt = (): string => {
    if (!activeMode) return BASE_SYSTEM_INSTRUCTION;
    let modePrompt = activeMode.mode.systemPromptOverride;
    if (activeMode.config) {
      modePrompt = modePrompt.replace(/\[language\]/gi, activeMode.config).replace(/\[role\]/gi, activeMode.config);
    }
    return `${BASE_SYSTEM_INSTRUCTION}\n\nAdditional mode: ${modePrompt}`;
  };

  const handleToggle = () => {
    if (orbState === 'idle') connect();
    else disconnect();
  };

  const handleImportPersona = (persona: Omit<Persona, 'id'>) => {
    // For now just log — full integration would add to profile.customPersonas
    console.log('Imported persona:', persona);
    alert(`Imported persona: ${persona.name}`);
  };

  return (
    <div style={styles.page}>
      {/* Top bar with usage meter */}
      <div style={styles.topBar}>
        <span style={styles.brandSmall}>🧁 Muffin</span>
        <div style={styles.topBarRight}>
          <UsageMeter refreshKey={usageRefresh} onLimitReached={() => setShowUpgrade(true)} />
          <button onClick={() => setShowCredits(true)} style={styles.creditsBtn}>Credits</button>
          <button onClick={() => setShowTemplateShare(true)} style={styles.creditsBtn}>Import</button>
        </div>
      </div>

      <h1 style={styles.title}>Muffin Voice</h1>

      <div style={styles.orbWrapper}>
        <VoiceOrb state={orbState} audioLevel={audioLevel} />
      </div>

      <p style={styles.status}>{statusText}</p>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.buttonRow}>
        <button onClick={handleToggle} style={{
          ...styles.button,
          ...(orbState !== 'idle' ? styles.buttonActive : {}),
        }}>
          {orbState === 'idle' ? 'Start Conversation' : 'End Conversation'}
        </button>
      </div>

      {/* Modals */}
      {showCredits && (
        <CreditsDisplay onClose={() => setShowCredits(false)} onUpgrade={() => { setShowCredits(false); setShowUpgrade(true); }} />
      )}
      {showUpgrade && <UpgradePrompt onClose={() => setShowUpgrade(false)} />}
      {showShare && (
        <ShareDialog
          personaName="Muffin"
          personaIcon="🧁"
          durationMinutes={lastSessionMinutes}
          onClose={() => setShowShare(false)}
        />
      )}
      {showTemplateShare && (
        <TemplateShare
          onImport={handleImportPersona}
          onClose={() => setShowTemplateShare(false)}
        />
      )}
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
  },
  topBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: 'rgba(10,10,15,0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    zIndex: 50,
  },
  brandSmall: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 600,
    letterSpacing: 1,
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  creditsBtn: {
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 500,
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
  buttonRow: {
    display: 'flex',
    gap: 12,
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
};

export default App;
