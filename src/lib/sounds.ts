// Web Audio API sound engine — all sounds generated programmatically

let audioCtx: AudioContext | null = null;
let muted = localStorage.getItem('sound_muted') === 'true';
let bgOsc: OscillatorNode | null = null;
let bgGain: GainNode | null = null;

function ctx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function isMuted() { return muted; }

export function toggleMute() {
  muted = !muted;
  localStorage.setItem('sound_muted', String(muted));
  if (muted) stopBgMusic();
  return muted;
}

function play(fn: (ac: AudioContext) => void) {
  if (muted) return;
  try { fn(ctx()); } catch {}
}

// --- Individual sounds ---

export function playClick() {
  play((ac) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'square';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.08, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.06);
  });
}

export function playCorrect() {
  play((ac) => {
    const t = ac.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.2);
      osc.connect(gain).connect(ac.destination);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.2);
    });
  });
}

export function playWrong() {
  play((ac) => {
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(150, t + 0.3);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

export function playCountdownTick() {
  play((ac) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.06, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.08);
  });
}

export function playVictory() {
  play((ac) => {
    const t = ac.currentTime;
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.25);
      osc.connect(gain).connect(ac.destination);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.25);
    });
  });
}

export function playDefeat() {
  play((ac) => {
    const t = ac.currentTime;
    [400, 350, 300, 220].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, t + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.2 + 0.3);
      osc.connect(gain).connect(ac.destination);
      osc.start(t + i * 0.2);
      osc.stop(t + i * 0.2 + 0.3);
    });
  });
}

export function playMatchFound() {
  play((ac) => {
    const t = ac.currentTime;
    [880, 1100, 1320].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
      osc.connect(gain).connect(ac.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.15);
    });
  });
}

// --- Background music (soft looping pads) ---

export function startBgMusic() {
  if (muted || bgOsc) return;
  try {
    const ac = ctx();
    bgGain = ac.createGain();
    bgGain.gain.value = 0.03;
    bgGain.connect(ac.destination);

    bgOsc = ac.createOscillator();
    bgOsc.type = 'sine';
    bgOsc.frequency.value = 220;

    const lfo = ac.createOscillator();
    const lfoGain = ac.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;
    lfoGain.gain.value = 15;
    lfo.connect(lfoGain).connect(bgOsc.frequency);
    lfo.start();

    bgOsc.connect(bgGain);
    bgOsc.start();
  } catch {}
}

export function fadeOutBgMusic() {
  if (!bgGain || !bgOsc) return;
  try {
    const ac = ctx();
    bgGain.gain.linearRampToValueAtTime(0, ac.currentTime + 1);
    const osc = bgOsc;
    setTimeout(() => { try { osc.stop(); } catch {} }, 1200);
    bgOsc = null;
    bgGain = null;
  } catch {}
}

export function stopBgMusic() {
  try { bgOsc?.stop(); } catch {}
  bgOsc = null;
  bgGain = null;
}
