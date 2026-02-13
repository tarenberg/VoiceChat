import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import VoiceOrb, { OrbState } from './components/VoiceOrb';
import AmbientSound from './components/AmbientSound';
import AudioSettings from './components/AudioSettings';

const SYSTEM_INSTRUCTION = `You are Muffin, Tom's friendly AI assistant. You have a warm, conversational personality. Talk naturally like a friend. Keep responses concise and conversational — this is a voice chat, not an essay. Be helpful, have opinions, and be genuinely engaging.`;

const App: React.FC = () => {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [statusText, setStatusText] = useState('Tap to start');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [ambientOpen, setAmbientOpen] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [inputDevice, setInputDevice] = useState('');
  const [outputDevice, setOutputDevice] = useState('');
  const [handsFree, setHandsFree] = useState(false);

  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const connectedRef = useRef(false);
  const handsFreeRef = useRef(false);

  // Keep ref in sync
  useEffect(() => { handsFreeRef.current = handsFree; }, [handsFree]);

  useEffect(() => {
    return () => { disconnect(); };
  }, []);

  // Haptic helper
  const haptic = useCallback((pattern: number | number[]) => {
    try { navigator.vibrate?.(pattern); } catch {}
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

      const ai = new GoogleGenAI({ apiKey });

      inputCtxRef.current = new AudioContext({ sampleRate: 16000 });
      outputCtxRef.current = new AudioContext({ sampleRate: 24000 });

      const constraints: MediaStreamConstraints = {
        audio: inputDevice ? { deviceId: { exact: inputDevice } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const callbacks = {
        onopen: () => {
          connectedRef.current = true;
          setOrbState('listening');
          setStatusText('Listening...');
          // Haptic: connected
          haptic([100, 50, 100]);

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
            // Haptic: AI speaking
            haptic(50);

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
          if (handsFreeRef.current) {
            // Auto-reconnect in hands-free mode
            setOrbState('connecting');
            setStatusText('Reconnecting...');
            setTimeout(() => connect(), 1000);
            return;
          }
          setOrbState('idle');
          setStatusText('Disconnected');
        },
        onerror: (e: any) => {
          console.error('Session error', e);
          setError('Connection lost. Try again.');
          connectedRef.current = false;
          if (handsFreeRef.current) {
            setTimeout(() => connect(), 2000);
            return;
          }
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
          systemInstruction: SYSTEM_INSTRUCTION,
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
  }, [inputDevice, haptic]);

  const disconnect = useCallback(() => {
    connectedRef.current = false;
    handsFreeRef.current = false;
    setHandsFree(false);

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
  }, []);

  const handleToggle = () => {
    if (orbState === 'idle') connect();
    else disconnect();
  };

  // Tap-anywhere-to-talk when idle
  const handlePageTap = (e: React.MouseEvent) => {
    // Don't trigger if clicking a button or control
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('[data-no-tap]')) return;
    if (orbState === 'idle') connect();
  };

  return (
    <div style={styles.page} onClick={handlePageTap}>
      <h1 style={styles.title}>Muffin Voice</h1>

      {/* Top-right controls */}
      <div style={styles.topControls}>
        <button
          onClick={() => setAmbientOpen(true)}
          style={styles.iconBtn}
          title="Ambient Sounds"
        >
          🎵
        </button>
        <button
          onClick={() => setShowAudioSettings(!showAudioSettings)}
          style={styles.iconBtn}
          title="Audio Settings"
        >
          🎧
        </button>
      </div>

      {/* Audio settings dropdown */}
      {showAudioSettings && (
        <div style={styles.audioSettingsPanel} data-no-tap>
          <AudioSettings
            selectedInput={inputDevice}
            selectedOutput={outputDevice}
            onChangeInput={setInputDevice}
            onChangeOutput={setOutputDevice}
          />
          <button onClick={() => setShowAudioSettings(false)} style={styles.doneBtn}>Done</button>
        </div>
      )}

      <div style={styles.orbWrapper}>
        <VoiceOrb state={orbState} audioLevel={audioLevel} />
      </div>

      <p style={styles.status}>{statusText}</p>
      {orbState === 'idle' && (
        <p style={styles.hint}>Tap anywhere to start</p>
      )}

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.bottomControls}>
        <button onClick={handleToggle} style={{
          ...styles.button,
          ...(orbState !== 'idle' ? styles.buttonActive : {}),
        }}>
          {orbState === 'idle' ? 'Start Conversation' : 'End Conversation'}
        </button>

        {orbState !== 'idle' && (
          <button
            onClick={() => setHandsFree(!handsFree)}
            style={{
              ...styles.handsFreeBadge,
              ...(handsFree ? styles.handsFreeActive : {}),
            }}
          >
            {handsFree ? '🙌 Hands-free ON' : '✋ Hands-free'}
          </button>
        )}
      </div>

      {/* Ambient panel */}
      <AmbientSound open={ambientOpen} onClose={() => setAmbientOpen(false)} />
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
    gap: 24,
    padding: 24,
    background: 'linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%)',
    cursor: 'default',
    userSelect: 'none',
  },
  title: {
    fontSize: 28,
    fontWeight: 300,
    letterSpacing: 4,
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  topControls: {
    position: 'fixed',
    top: 16,
    right: 16,
    display: 'flex',
    gap: 8,
    zIndex: 50,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    backdropFilter: 'blur(10px)',
  },
  audioSettingsPanel: {
    position: 'fixed',
    top: 68,
    right: 16,
    width: 300,
    background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
    borderRadius: 16,
    padding: 16,
    border: '1px solid rgba(255,255,255,0.1)',
    zIndex: 50,
    backdropFilter: 'blur(10px)',
  },
  doneBtn: {
    width: '100%',
    padding: 10,
    marginTop: 12,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    cursor: 'pointer',
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
    margin: 0,
  },
  hint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
    margin: 0,
    animation: 'slowPulse 3s ease-in-out infinite',
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
  bottomControls: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
  handsFreeBadge: {
    padding: '8px 20px',
    fontSize: 13,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 50,
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  handsFreeActive: {
    borderColor: 'rgba(34, 197, 94, 0.4)',
    background: 'rgba(34, 197, 94, 0.12)',
    color: '#22c55e',
  },
};

export default App;
