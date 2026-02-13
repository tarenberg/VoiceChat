import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

// Components
import VoiceOrb, { OrbState } from './components/VoiceOrb';
import ModeSelector from './components/ModeSelector';
import ModeSetup from './components/ModeSetup';
import UsageMeter from './components/UsageMeter';
import CreditsDisplay from './components/CreditsDisplay';
import ShareDialog from './components/ShareDialog';
import UpgradePrompt from './components/UpgradePrompt';
import TemplateShare from './components/TemplateShare';
import PersonaSelector from './components/PersonaSelector';
import Settings from './components/Settings';
import ConversationHistory from './components/ConversationHistory';
import ConversationDetail from './components/ConversationDetail';
import CameraView from './components/CameraView';
import ScreenShare from './components/ScreenShare';
import ImageDisplay from './components/ImageDisplay';
import AmbientSound from './components/AmbientSound';
import AudioSettings from './components/AudioSettings';

// Services
import { addMinutes, isLimitReached } from './services/usageTracker';
import { loadProfile, saveProfile, loadSelectedPersonaId, saveSelectedPersonaId } from './services/storage';
import {
  createConversation, saveConversation,
  Conversation, Bookmark,
} from './services/conversationStore';
import {
  getAllFacts, saveFacts, extractMemoryFromTranscript,
  generateSummary, buildMemoryPrompt, MemoryFact,
} from './services/memoryStore';

// Data & Types
import { Persona, UserProfile } from './types';
import { builtInPersonas, DEFAULT_PERSONA_ID } from './data/personas';
import { Mode } from './data/modes';

const App: React.FC = () => {
  // --- Core state ---
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [statusText, setStatusText] = useState('Tap to start');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // --- Persona ---
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const allPersonas = [...builtInPersonas, ...profile.customPersonas];
  const [selectedPersonaId, setSelectedPersonaId] = useState(() => loadSelectedPersonaId());
  const currentPersona = allPersonas.find(p => p.id === selectedPersonaId) || builtInPersonas[0];
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // --- Modes ---
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);
  const [showSetup, setShowSetup] = useState<Mode | null>(null);
  const [activeMode, setActiveMode] = useState<{ mode: Mode; config?: string } | null>(null);

  // --- Memory ---
  const [memoryFacts, setMemoryFacts] = useState<MemoryFact[]>([]);
  const transcriptRef = useRef<string>('');

  // --- Conversation tracking ---
  const conversationRef = useRef<Conversation | null>(null);

  // --- History panel ---
  const [showHistory, setShowHistory] = useState(false);
  const [detailConversation, setDetailConversation] = useState<Conversation | null>(null);

  // --- Camera / Screen / Images ---
  const [cameraActive, setCameraActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [displayImages, setDisplayImages] = useState<string[]>([]);

  // --- Ambient ---
  const [showAmbient, setShowAmbient] = useState(false);

  // --- Audio settings ---
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [audioInputDevice, setAudioInputDevice] = useState('');
  const [audioOutputDevice, setAudioOutputDevice] = useState('');

  // --- Monetization ---
  const [usageRefresh, setUsageRefresh] = useState(0);
  const [showCredits, setShowCredits] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showTemplateShare, setShowTemplateShare] = useState(false);
  const [lastSessionMinutes, setLastSessionMinutes] = useState(0);

  // --- Hands-free ---
  const [handsFree, setHandsFree] = useState(false);

  // --- Refs ---
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
  const handsFreeRef = useRef(false);

  // Keep handsFreeRef in sync
  useEffect(() => { handsFreeRef.current = handsFree; }, [handsFree]);

  // --- Load memory on mount ---
  useEffect(() => {
    getAllFacts().then(setMemoryFacts);
    return () => { disconnect(); };
  }, []);

  // --- Usage tracking helpers ---
  const startUsageTracking = () => {
    sessionStartRef.current = Date.now();
    usageIntervalRef.current = setInterval(() => {
      addMinutes(0.25);
      setUsageRefresh(r => r + 1);
    }, 15000);
  };

  const stopUsageTracking = () => {
    if (usageIntervalRef.current) {
      clearInterval(usageIntervalRef.current);
      usageIntervalRef.current = null;
    }
    if (sessionStartRef.current) {
      const elapsed = (Date.now() - sessionStartRef.current) / 60000;
      const remainder = elapsed % 0.25;
      if (remainder > 0.01) addMinutes(remainder);
      setLastSessionMinutes(elapsed);
      sessionStartRef.current = 0;
      setUsageRefresh(r => r + 1);
    }
  };

  // --- Build system prompt ---
  const buildSystemPrompt = useCallback((): string => {
    let prompt = currentPersona.systemPrompt;

    // Inject user profile
    const prof = loadProfile();
    if (prof.name) {
      prompt += `\n\nThe user's name is ${prof.name}.`;
    }
    if (prof.interests.length > 0) {
      prompt += ` Their interests include: ${prof.interests.join(', ')}.`;
    }

    // Inject mode
    if (activeMode) {
      let modePrompt = activeMode.mode.systemPromptOverride;
      if (activeMode.config) {
        modePrompt = modePrompt.replace(/\[language\]/gi, activeMode.config).replace(/\[role\]/gi, activeMode.config);
      }
      prompt += `\n\nAdditional mode: ${modePrompt}`;
    }

    // Inject memory
    prompt += buildMemoryPrompt(memoryFacts);

    return prompt;
  }, [currentPersona, activeMode, memoryFacts]);

  // --- Haptic helper ---
  const vibrate = (pattern: number | number[]) => {
    try { navigator.vibrate?.(pattern); } catch {}
  };

  // --- Connect ---
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
      transcriptRef.current = '';

      // Create conversation record
      conversationRef.current = createConversation(currentPersona.id);

      const ai = new GoogleGenAI({ apiKey });

      inputCtxRef.current = new AudioContext({ sampleRate: 16000 });
      outputCtxRef.current = new AudioContext({ sampleRate: 24000 });

      const audioConstraints: MediaTrackConstraints = { ...(audioInputDevice ? { deviceId: { exact: audioInputDevice } } : {}) };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints.deviceId ? audioConstraints : true });
      streamRef.current = stream;

      const callbacks = {
        onopen: () => {
          connectedRef.current = true;
          setOrbState('listening');
          setStatusText('Listening...');
          startUsageTracking();
          vibrate(50);

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
            setStatusText(`${currentPersona.name} is speaking...`);
            vibrate(20);

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

          // Check for image data in response
          const parts = message.serverContent?.modelTurn?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
              setDisplayImages(prev => [...prev, `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`]);
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
          stopUsageTracking();
          setOrbState('idle');
          setStatusText('Disconnected');
          finalizeConversation();
          setShowShare(true);

          // Hands-free auto-reconnect
          if (handsFreeRef.current) {
            setTimeout(() => { connect(); }, 2000);
          }
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
        setError('Microphone permission denied.');
      } else {
        setError('Could not connect. Check your API key and try again.');
      }
      setOrbState('idle');
      setStatusText('Tap to start');
    }
  }, [buildSystemPrompt, currentPersona, audioInputDevice]);

  // --- Finalize conversation (memory extraction, summary, save) ---
  const finalizeConversation = useCallback(async () => {
    const conv = conversationRef.current;
    if (!conv) return;
    conv.endedAt = Date.now();

    const apiKey = import.meta.env.VITE_API_KEY;
    if (apiKey && transcriptRef.current.trim()) {
      try {
        const [summary, newFacts] = await Promise.all([
          generateSummary(apiKey, transcriptRef.current),
          extractMemoryFromTranscript(apiKey, transcriptRef.current, conv.id, memoryFacts),
        ]);
        conv.summary = summary;
        conv.title = summary.slice(0, 60) || 'Conversation';
        if (newFacts.length > 0) {
          await saveFacts(newFacts);
          setMemoryFacts(prev => [...prev, ...newFacts]);
        }
      } catch (err) {
        console.error('Finalize error:', err);
      }
    }

    await saveConversation(conv);
    conversationRef.current = null;
  }, [memoryFacts]);

  // --- Disconnect ---
  const disconnect = useCallback(() => {
    connectedRef.current = false;
    stopUsageTracking();

    sourcesRef.current.forEach(s => { try { s.stop(); } catch {} });
    sourcesRef.current.clear();

    scriptProcessorRef.current?.disconnect();
    sourceNodeRef.current?.disconnect();

    try { sessionRef.current?.close(); } catch {}
    sessionRef.current = null;

    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;

    try { inputCtxRef.current?.close(); } catch {}
    try { outputCtxRef.current?.close(); } catch {}
    inputCtxRef.current = null;
    outputCtxRef.current = null;

    nextStartTimeRef.current = 0;
    setOrbState('idle');
    setStatusText('Tap to start');
    setAudioLevel(0);
    setCameraActive(false);
    setScreenActive(false);
  }, []);

  // --- Mode handlers ---
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

  // --- Persona handlers ---
  const handleSelectPersona = (persona: Persona) => {
    setSelectedPersonaId(persona.id);
    saveSelectedPersonaId(persona.id);
    setShowPersonaSelector(false);
  };

  const handleCreateCustomPersona = (data: Omit<Persona, 'id'>) => {
    const newPersona: Persona = { ...data, id: `custom-${Date.now()}` };
    const updated = { ...profile, customPersonas: [...profile.customPersonas, newPersona] };
    setProfile(updated);
    saveProfile(updated);
    handleSelectPersona(newPersona);
  };

  const handleDeletePersona = (id: string) => {
    const updated = { ...profile, customPersonas: profile.customPersonas.filter(p => p.id !== id) };
    setProfile(updated);
    saveProfile(updated);
    if (selectedPersonaId === id) {
      setSelectedPersonaId(DEFAULT_PERSONA_ID);
      saveSelectedPersonaId(DEFAULT_PERSONA_ID);
    }
  };

  const handleSaveProfile = (p: UserProfile) => {
    setProfile(p);
    saveProfile(p);
  };

  const handleImportPersona = (persona: Omit<Persona, 'id'>) => {
    handleCreateCustomPersona(persona);
  };

  // --- Bookmark ---
  const addBookmark = () => {
    if (!conversationRef.current) return;
    const bm: Bookmark = { id: crypto.randomUUID(), timestamp: Date.now() };
    conversationRef.current.bookmarks.push(bm);
    vibrate(30);
  };

  // --- Camera/Screen frame handler ---
  const handleFrame = (base64: string) => {
    if (sessionRef.current && connectedRef.current) {
      sessionRef.current.sendRealtimeInput({
        media: { data: base64, mimeType: 'image/jpeg' },
      });
    }
  };

  // --- Toggle ---
  const handleToggle = () => {
    if (orbState === 'idle') connect();
    else disconnect();
  };

  // --- Hands-free tap handler ---
  const handlePageClick = () => {
    if (handsFree && orbState === 'idle') {
      connect();
    }
  };

  const isActive = orbState !== 'idle';

  return (
    <div style={styles.page} onClick={handlePageClick}>
      {/* ===== TOP BAR ===== */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <button onClick={(e) => { e.stopPropagation(); setShowHistory(true); }} style={styles.iconBtn} title="History">🕐</button>
          <span style={styles.brandSmall}>{currentPersona.icon} {currentPersona.name}</span>
        </div>
        <div style={styles.topBarRight}>
          <UsageMeter refreshKey={usageRefresh} onLimitReached={() => setShowUpgrade(true)} />
          <button onClick={(e) => { e.stopPropagation(); setShowCredits(true); }} style={styles.smallBtn}>Credits</button>
          <button onClick={(e) => { e.stopPropagation(); setShowTemplateShare(true); }} style={styles.smallBtn}>Import</button>
          <button onClick={(e) => { e.stopPropagation(); setShowSettings(true); }} style={styles.iconBtn} title="Settings">⚙️</button>
          <button onClick={(e) => { e.stopPropagation(); setShowAudioSettings(!showAudioSettings); }} style={styles.iconBtn} title="Audio Settings">🎧</button>
        </div>
      </div>

      {/* Audio settings dropdown */}
      {showAudioSettings && (
        <div style={styles.audioSettingsDropdown} onClick={e => e.stopPropagation()}>
          <AudioSettings
            selectedInput={audioInputDevice}
            selectedOutput={audioOutputDevice}
            onChangeInput={setAudioInputDevice}
            onChangeOutput={setAudioOutputDevice}
          />
          <button onClick={() => setShowAudioSettings(false)} style={{ ...styles.smallBtn, marginTop: 10 }}>Done</button>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div style={styles.mainContent}>
        {/* Persona name + icon above orb */}
        <div style={styles.personaHeader}>
          <span style={{ fontSize: 32 }}>{currentPersona.icon}</span>
          <h1 style={{ ...styles.title, color: currentPersona.color }}>{currentPersona.name}</h1>
        </div>

        {/* Active mode badge */}
        {activeMode && (
          <div style={{ ...styles.modeBadge, borderColor: activeMode.mode.color + '60', color: activeMode.mode.color }}>
            {activeMode.mode.icon} {activeMode.mode.name}
            {activeMode.config ? ` — ${activeMode.config}` : ''}
          </div>
        )}

        {/* Memory count */}
        {memoryFacts.length > 0 && (
          <div style={styles.memoryBadge}>
            🧠 {memoryFacts.length} memor{memoryFacts.length === 1 ? 'y' : 'ies'}
          </div>
        )}

        {/* Orb area */}
        <div style={{
          ...styles.orbWrapper,
          ...(cameraActive || screenActive ? { transform: 'scale(0.75) translateY(-20px)' } : {}),
        }}>
          <VoiceOrb state={orbState} audioLevel={audioLevel} color={currentPersona.color} />
        </div>

        <p style={styles.status}>{statusText}</p>

        {/* Camera / Screen previews */}
        {isActive && (cameraActive || screenActive) && (
          <div style={styles.previewRow}>
            <CameraView active={cameraActive} onFrame={handleFrame} onClose={() => setCameraActive(false)} />
            <ScreenShare active={screenActive} onFrame={handleFrame} onClose={() => setScreenActive(false)} />
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}
      </div>

      {/* ===== BOTTOM AREA ===== */}
      <div style={styles.bottomArea}>
        {/* Mode selector when idle */}
        {!isActive && (
          <ModeSelector selectedMode={selectedMode} onSelect={handleModeSelect} />
        )}

        {/* Floating action buttons during call */}
        {isActive && (
          <div style={styles.fabRow}>
            <button onClick={(e) => { e.stopPropagation(); addBookmark(); }} style={styles.fab} title="Bookmark">⭐</button>
            <button onClick={(e) => { e.stopPropagation(); setCameraActive(!cameraActive); }} style={{ ...styles.fab, ...(cameraActive ? styles.fabActive : {}) }} title="Camera">📷</button>
            <button onClick={(e) => { e.stopPropagation(); setScreenActive(!screenActive); }} style={{ ...styles.fab, ...(screenActive ? styles.fabActive : {}) }} title="Screen Share">🖥️</button>
            <button onClick={(e) => { e.stopPropagation(); setShowAmbient(true); }} style={styles.fab} title="Ambient Sounds">🎵</button>
            <button onClick={(e) => { e.stopPropagation(); setHandsFree(!handsFree); }} style={{ ...styles.fab, ...(handsFree ? styles.fabActive : {}) }} title="Hands-free">
              {handsFree ? '🔄' : '✋'}
            </button>
          </div>
        )}

        {/* Persona selector + main button */}
        <div style={styles.buttonRow}>
          {!isActive && (
            <button onClick={(e) => { e.stopPropagation(); setShowPersonaSelector(true); }} style={styles.personaBtn}>
              {currentPersona.icon} Switch
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); handleToggle(); }} style={{
            ...styles.button,
            ...(isActive ? styles.buttonActive : {}),
            ...(isActive ? {} : { borderColor: currentPersona.color + '40' }),
          }}>
            {orbState === 'idle' ? 'Start Conversation' : 'End Conversation'}
          </button>
        </div>

        {handsFree && !isActive && (
          <p style={styles.handsFreeHint}>Hands-free: tap anywhere to reconnect</p>
        )}
      </div>

      {/* ===== MODALS & PANELS ===== */}
      <ConversationHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectConversation={(conv) => { setShowHistory(false); setDetailConversation(conv); }}
      />
      {detailConversation && (
        <ConversationDetail conversation={detailConversation} onClose={() => setDetailConversation(null)} />
      )}
      {showPersonaSelector && (
        <PersonaSelector
          personas={allPersonas}
          selectedId={selectedPersonaId}
          onSelect={handleSelectPersona}
          onCreateCustom={handleCreateCustomPersona}
          onClose={() => setShowPersonaSelector(false)}
        />
      )}
      {showSettings && (
        <Settings
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setShowSettings(false)}
          onDeletePersona={handleDeletePersona}
        />
      )}
      {showSetup && <ModeSetup mode={showSetup} onConfirm={handleSetupConfirm} onCancel={() => setShowSetup(null)} />}
      {showCredits && (
        <CreditsDisplay onClose={() => setShowCredits(false)} onUpgrade={() => { setShowCredits(false); setShowUpgrade(true); }} />
      )}
      {showUpgrade && <UpgradePrompt onClose={() => setShowUpgrade(false)} />}
      {showShare && (
        <ShareDialog
          personaName={currentPersona.name}
          personaIcon={currentPersona.icon}
          durationMinutes={lastSessionMinutes}
          onClose={() => setShowShare(false)}
        />
      )}
      {showTemplateShare && (
        <TemplateShare onImport={handleImportPersona} onClose={() => setShowTemplateShare(false)} />
      )}
      <AmbientSound open={showAmbient} onClose={() => setShowAmbient(false)} />
      {displayImages.length > 0 && (
        <ImageDisplay images={displayImages} onDismiss={() => setDisplayImages([])} />
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
    background: 'linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%)',
    position: 'relative',
    overflowX: 'hidden',
    overflowY: 'auto',
  },
  topBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: 'rgba(10,10,15,0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    zIndex: 50,
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  brandSmall: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 8,
  },
  smallBtn: {
    padding: '5px 10px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    cursor: 'pointer',
    fontWeight: 500,
  },
  audioSettingsDropdown: {
    position: 'fixed',
    top: 52,
    right: 12,
    width: 280,
    padding: 16,
    background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    zIndex: 60,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 70,
    paddingBottom: 220,
    width: '100%',
    minHeight: 0,
  },
  personaHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 300,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    margin: 0,
  },
  modeBadge: {
    padding: '4px 14px',
    border: '1px solid',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
  },
  memoryBadge: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
  },
  orbWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.4s ease',
  },
  status: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    margin: 0,
  },
  previewRow: {
    display: 'flex',
    gap: 12,
    marginTop: 8,
  },
  error: {
    fontSize: 13,
    color: '#f87171',
    background: 'rgba(248,113,113,0.1)',
    padding: '8px 16px',
    borderRadius: 8,
    maxWidth: 400,
    textAlign: 'center' as const,
  },
  bottomArea: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '8px 0 max(16px, env(safe-area-inset-bottom))',
    background: 'linear-gradient(0deg, rgba(10,10,15,0.98) 70%, transparent 100%)',
    pointerEvents: 'none',
    zIndex: 40,
    maxHeight: '45vh',
    overflowY: 'auto',
  },
  fabRow: {
    display: 'flex',
    gap: 10,
    pointerEvents: 'auto',
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    pointerEvents: 'auto',
  },
  fabActive: {
    background: 'rgba(139,92,246,0.25)',
    borderColor: 'rgba(139,92,246,0.5)',
    boxShadow: '0 0 12px rgba(139,92,246,0.3)',
  },
  buttonRow: {
    display: 'flex',
    gap: 10,
    pointerEvents: 'auto',
    paddingBottom: 4,
  },
  personaBtn: {
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 50,
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  button: {
    padding: '12px 28px',
    fontSize: 15,
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
    borderColor: 'rgba(248,113,113,0.4)',
    background: 'rgba(248,113,113,0.1)',
    color: '#f87171',
  },
  handsFreeHint: {
    fontSize: 11,
    color: 'rgba(139,92,246,0.5)',
    margin: 0,
    pointerEvents: 'none',
  },
};

export default App;
