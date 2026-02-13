import React, { useState, useEffect } from 'react';

interface Props {
  selectedInput: string;
  selectedOutput: string;
  onChangeInput: (id: string) => void;
  onChangeOutput: (id: string) => void;
}

const AudioSettings: React.FC<Props> = ({ selectedInput, selectedOutput, onChangeInput, onChangeOutput }) => {
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // Need permission first to get labels
        await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop()));
        const devices = await navigator.mediaDevices.enumerateDevices();
        setInputs(devices.filter(d => d.kind === 'audioinput'));
        setOutputs(devices.filter(d => d.kind === 'audiooutput'));
      } catch {}
    };
    load();
  }, []);

  return (
    <div style={{ marginTop: 16 }}>
      <label style={styles.label}>🎤 Microphone</label>
      <select
        value={selectedInput}
        onChange={(e) => onChangeInput(e.target.value)}
        style={styles.select}
      >
        <option value="">Default</option>
        {inputs.map(d => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
          </option>
        ))}
      </select>

      <label style={{ ...styles.label, marginTop: 12 }}>🔊 Speaker</label>
      <select
        value={selectedOutput}
        onChange={(e) => onChangeOutput(e.target.value)}
        style={styles.select}
      >
        <option value="">Default</option>
        {outputs.map(d => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || `Speaker ${d.deviceId.slice(0, 8)}`}
          </option>
        ))}
      </select>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  label: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' },
  select: {
    width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    color: 'white', fontSize: 14, outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box' as const, appearance: 'none' as const,
  },
};

export default AudioSettings;
