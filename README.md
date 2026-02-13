<div align="center">

# 🎙️ VoiceChat

### Real-time voice conversations with AI

A full-duplex voice conversation app powered by Google's Gemini Live Audio API. Talk naturally — no buttons to hold, no waiting for turns. Just speak, and your AI companion speaks back.

*Built by [Thomas Arenberg](https://github.com/tarenberg)*

---

**[Getting Started](#-getting-started)** · **[How It Works](#-how-it-works)** · **[Features](#-features)** · **[Tech Stack](#-tech-stack)**

</div>

---

## ✨ Features

- **🔊 Full Duplex Audio** — Speak and listen simultaneously, just like a real phone call
- **🎨 Animated Voice Orb** — Beautiful visual feedback that responds to conversation state
  - 🔵 **Blue glow** — Listening to you
  - 🟣 **Purple pulse** — AI is speaking (scales with audio intensity)
  - ⚫ **Subtle pulse** — Idle, waiting to connect
  - 🌀 **Rotating gradient** — Connecting...
- **⚡ Low Latency** — Powered by Gemini's native audio streaming for near-instant responses
- **📱 Mobile Friendly** — Works on any device with a microphone and modern browser
- **🌙 Beautiful Dark UI** — Minimal, distraction-free interface
- **🔒 HTTPS Enabled** — Secure by default (required for microphone access on network)

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ installed
- A **Google Gemini API key** — get one free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/tarenberg/VoiceChat.git
   cd VoiceChat
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Add your API key:**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and set your Gemini API key:
   ```
   VITE_API_KEY=your_gemini_api_key_here
   ```

4. **Start the app:**
   ```bash
   npm run dev
   ```

5. **Open in your browser:**
   - Local: `https://localhost:3001`
   - Network: `https://YOUR_IP:3001`
   
   > ⚠️ You'll see a certificate warning (self-signed cert). Click **Advanced → Proceed** — this is safe for local use and required for microphone access over the network.

6. **Click "Start Conversation"** and start talking! 🎙️

## 🔧 How It Works

```
┌─────────────┐     16kHz PCM      ┌──────────────────┐
│  Your Mic   │ ──────────────────► │                  │
│             │                     │  Gemini Live     │
│  Speakers   │ ◄────────────────── │  Audio API       │
└─────────────┘     24kHz PCM      └──────────────────┘
                                           │
       ┌───────────────────────────────────┘
       │
  ┌────▼─────┐
  │ Voice    │  Visual feedback
  │ Orb UI   │  reacts to audio
  └──────────┘  levels in real-time
```

1. **Microphone capture** — Browser captures audio at 16kHz, converts to PCM16
2. **Stream to Gemini** — Raw audio streams via WebSocket to Gemini's multimodal live API
3. **AI processes & responds** — Gemini understands speech natively (no transcription step!) and generates audio responses
4. **Playback** — Response audio (24kHz PCM) plays through your speakers in real-time
5. **Visual feedback** — The orb animates based on conversation state and audio levels

### Why Gemini Live Audio?

Unlike traditional voice assistants that chain speech-to-text → LLM → text-to-speech, Gemini processes audio **natively**. This means:
- 🚀 Lower latency (no transcription bottleneck)
- 🎭 Better understanding of tone and emotion
- 🗣️ More natural-sounding responses
- 🔄 True full-duplex (can be interrupted naturally)

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React + TypeScript** | UI framework |
| **Vite** | Build tool & dev server |
| **Google Gemini API** | `gemini-2.5-flash-native-audio-preview` for live audio |
| **Web Audio API** | Microphone capture & audio playback |
| **CSS Animations** | Orb visual effects |

## 📁 Project Structure

```
VoiceChat/
├── src/
│   ├── App.tsx              # Main app — connection logic & audio pipeline
│   ├── components/
│   │   └── VoiceOrb.tsx     # Animated orb with state-based visuals
│   └── main.tsx             # React entry point
├── index.html
├── .env.local               # Your API key (not committed)
├── vite.config.ts           # HTTPS + network config
└── package.json
```

## 🎨 Customization

### Change the AI Personality

Edit the `SYSTEM_INSTRUCTION` in `src/App.tsx`:

```typescript
const SYSTEM_INSTRUCTION = `You are a friendly art curator who loves 
discussing paintings, sculpture, and creative techniques...`;
```

### Change the Orb Colors

Edit the color values in `src/components/VoiceOrb.tsx`:
- `listening` state → Blue tones (`#3B82F6`)
- `speaking` state → Purple tones (`#8B5CF6`)
- `idle` state → Gray tones (`#6B7280`)

## 📝 License

MIT — do whatever you want with it.

---

<div align="center">

*Built with 🧁 and ☕ in New Haven, CT*

</div>
