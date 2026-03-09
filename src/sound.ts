// Procedural sound effects and background music using Web Audio API
// No external audio files — everything generated in code

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicPlaying = false;
let musicOscillators: OscillatorNode[] = [];
let musicTimeouts: number[] = [];

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.25;
    musicGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.5;
    sfxGain.connect(masterGain);
  }
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

// ── Helpers ──

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.3,
  delay = 0,
  destination?: GainNode
): OscillatorNode {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, c.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, c.currentTime + delay + 0.01);
  gain.gain.linearRampToValueAtTime(0, c.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(destination || sfxGain!);
  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + duration + 0.05);
  return osc;
}

function playNoise(duration: number, volume = 0.1, delay = 0): void {
  const c = getCtx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const source = c.createBufferSource();
  source.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2000;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, c.currentTime + delay + 0.005);
  gain.gain.linearRampToValueAtTime(0, c.currentTime + delay + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGain!);
  source.start(c.currentTime + delay);
}

// ── Sound Effects ──

export function playDrop(): void {
  // Thud impact
  playTone(120, 0.15, "sine", 0.4);
  playTone(80, 0.2, "triangle", 0.3, 0.02);
  playNoise(0.08, 0.15);
}

export function playPerfect(): void {
  // Bright chime
  playTone(880, 0.3, "sine", 0.25);
  playTone(1100, 0.25, "sine", 0.2, 0.05);
  playTone(1320, 0.3, "sine", 0.15, 0.1);
}

export function playCombo(count: number): void {
  // Ascending sparkle — pitch rises with combo
  const baseFreq = 600 + count * 80;
  for (let i = 0; i < Math.min(count, 6); i++) {
    playTone(baseFreq + i * 120, 0.2, "sine", 0.2, i * 0.07);
    playTone((baseFreq + i * 120) * 1.5, 0.15, "triangle", 0.08, i * 0.07);
  }
}

export function playSlice(): void {
  // Quick swoosh
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(800, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.12);
  gain.gain.setValueAtTime(0.15, c.currentTime);
  gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(sfxGain!);
  osc.start();
  osc.stop(c.currentTime + 0.15);
  playNoise(0.06, 0.1);
}

export function playPowerUpCollect(): void {
  // Sparkly pickup — rising arpeggiated tones
  playTone(660, 0.15, "sine", 0.2);
  playTone(880, 0.15, "sine", 0.2, 0.06);
  playTone(1100, 0.15, "sine", 0.2, 0.12);
  playTone(1320, 0.2, "sine", 0.25, 0.18);
  // Shimmer
  playTone(1760, 0.3, "triangle", 0.08, 0.15);
}

export function playMagnetActivate(): void {
  // Magnetic hum — deep wobble
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(150, c.currentTime);
  osc.frequency.linearRampToValueAtTime(300, c.currentTime + 0.2);
  osc.frequency.linearRampToValueAtTime(150, c.currentTime + 0.4);
  gain.gain.setValueAtTime(0.2, c.currentTime);
  gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(sfxGain!);
  osc.start();
  osc.stop(c.currentTime + 0.45);
}

export function playExpandActivate(): void {
  // Growing/stretching — rising pitch
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(200, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.3);
  gain.gain.setValueAtTime(0.25, c.currentTime);
  gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.35);
  osc.connect(gain);
  gain.connect(sfxGain!);
  osc.start();
  osc.stop(c.currentTime + 0.4);
  playTone(500, 0.15, "sine", 0.1, 0.15);
}

export function playSlowMoActivate(): void {
  // Time-warp — descending warble
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(600, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, c.currentTime + 0.5);
  gain.gain.setValueAtTime(0.2, c.currentTime);
  gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(sfxGain!);
  osc.start();
  osc.stop(c.currentTime + 0.55);
  // Echo effect
  playTone(400, 0.3, "sine", 0.08, 0.15);
  playTone(250, 0.3, "sine", 0.05, 0.3);
}

export function playFreezeActivate(): void {
  // Icy crystallize — high shimmery tone
  playTone(2000, 0.3, "sine", 0.15);
  playTone(2400, 0.25, "sine", 0.1, 0.03);
  playTone(1600, 0.35, "triangle", 0.1, 0.05);
  playNoise(0.15, 0.12);
  // Crackle
  playTone(3000, 0.1, "square", 0.05, 0.1);
  playTone(3500, 0.08, "square", 0.04, 0.15);
}

export function playGameOver(): void {
  // Descending sad tones
  playTone(440, 0.3, "sine", 0.3);
  playTone(370, 0.3, "sine", 0.3, 0.2);
  playTone(330, 0.3, "sine", 0.25, 0.4);
  playTone(260, 0.5, "sine", 0.3, 0.6);
  playTone(260, 0.5, "triangle", 0.1, 0.6);
}

export function playGameStart(): void {
  // Quick upbeat jingle
  playTone(523, 0.12, "sine", 0.2);
  playTone(659, 0.12, "sine", 0.2, 0.1);
  playTone(784, 0.12, "sine", 0.2, 0.2);
  playTone(1047, 0.25, "sine", 0.25, 0.3);
}

// ── Background Music ──
// Simple ambient loop using a chord progression

const CHORDS = [
  [261.6, 329.6, 392.0],  // C major
  [220.0, 277.2, 329.6],  // A minor
  [349.2, 440.0, 523.3],  // F major
  [392.0, 493.9, 587.3],  // G major
];

function playMusicChord(chordIndex: number): void {
  if (!musicPlaying || !ctx || !musicGain) return;

  const c = ctx;
  const chord = CHORDS[chordIndex % CHORDS.length];
  const duration = 3.0;

  for (const freq of chord) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;

    // Soft pad envelope
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, c.currentTime + 0.4);
    gain.gain.setValueAtTime(0.12, c.currentTime + duration - 0.8);
    gain.gain.linearRampToValueAtTime(0, c.currentTime + duration);

    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration + 0.1);
    musicOscillators.push(osc);

    // Add subtle octave shimmer
    const osc2 = c.createOscillator();
    const gain2 = c.createGain();
    osc2.type = "triangle";
    osc2.frequency.value = freq * 2;
    gain2.gain.setValueAtTime(0, c.currentTime);
    gain2.gain.linearRampToValueAtTime(0.03, c.currentTime + 0.6);
    gain2.gain.linearRampToValueAtTime(0, c.currentTime + duration);
    osc2.connect(gain2);
    gain2.connect(musicGain);
    osc2.start(c.currentTime);
    osc2.stop(c.currentTime + duration + 0.1);
    musicOscillators.push(osc2);
  }

  // Schedule next chord
  const tid = window.setTimeout(() => {
    playMusicChord(chordIndex + 1);
  }, duration * 1000 - 200); // slight overlap for smooth transition
  musicTimeouts.push(tid);
}

export function startMusic(): void {
  if (musicPlaying) return;
  getCtx();
  musicPlaying = true;
  playMusicChord(0);
}

export function stopMusic(): void {
  musicPlaying = false;
  for (const osc of musicOscillators) {
    try { osc.stop(); } catch { /* already stopped */ }
  }
  musicOscillators = [];
  for (const tid of musicTimeouts) {
    clearTimeout(tid);
  }
  musicTimeouts = [];
}

export function setMusicVolume(vol: number): void {
  if (musicGain) musicGain.gain.value = vol;
}

export function setSfxVolume(vol: number): void {
  if (sfxGain) sfxGain.gain.value = vol;
}

// Ensure audio context is unlocked on first user interaction
export function unlockAudio(): void {
  getCtx();
}
