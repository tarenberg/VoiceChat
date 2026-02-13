export interface AmbientDef {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  /** Creates the Web Audio nodes; returns a teardown function */
  create?: (ctx: AudioContext, gain: GainNode) => () => void;
}

// --- noise helper ---
function createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

export const ambients: AmbientDef[] = [
  {
    id: 'rain',
    name: 'Rain',
    icon: '🌧️',
    available: true,
    create(ctx, gain) {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 4);
      noise.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 800;
      bp.Q.value = 0.5;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3000;
      noise.connect(bp).connect(lp).connect(gain);
      noise.start();

      // droplet pulses
      let alive = true;
      const droplets: OscillatorNode[] = [];
      const tick = () => {
        if (!alive) return;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 2000 + Math.random() * 4000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.03 + Math.random() * 0.04, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(g).connect(gain);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
        droplets.push(osc);
        setTimeout(tick, 40 + Math.random() * 200);
      };
      tick();
      return () => { alive = false; try { noise.stop(); } catch {} };
    },
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    icon: '🌊',
    available: true,
    create(ctx, gain) {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 4);
      noise.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 400;
      // LFO to modulate filter
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.12;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 350;
      lfo.connect(lfoGain).connect(lp.frequency);
      lfo.start();
      noise.connect(lp).connect(gain);
      noise.start();
      return () => { try { noise.stop(); lfo.stop(); } catch {} };
    },
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    icon: '🔥',
    available: true,
    create(ctx, gain) {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 4);
      noise.loop = true;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1000;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.3;
      noise.connect(hp).connect(noiseGain).connect(gain);
      noise.start();

      // random crackles
      let alive = true;
      const crackle = () => {
        if (!alive) return;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.15 + Math.random() * 0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02 + Math.random() * 0.04);
        const b = ctx.createBufferSource();
        b.buffer = createNoiseBuffer(ctx, 0.05);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 3000 + Math.random() * 5000;
        bp.Q.value = 2;
        b.connect(bp).connect(g).connect(gain);
        b.start();
        setTimeout(crackle, 30 + Math.random() * 150);
      };
      crackle();
      return () => { alive = false; try { noise.stop(); } catch {} };
    },
  },
  {
    id: 'whitenoise',
    name: 'White Noise',
    icon: '📻',
    available: true,
    create(ctx, gain) {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 4);
      noise.loop = true;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      noise.connect(g).connect(gain);
      noise.start();
      return () => { try { noise.stop(); } catch {} };
    },
  },
  { id: 'coffee', name: 'Coffee Shop', icon: '☕', available: false },
  { id: 'forest', name: 'Forest', icon: '🌲', available: false },
  { id: 'lofi', name: 'Lo-fi Beats', icon: '🎵', available: false },
];
