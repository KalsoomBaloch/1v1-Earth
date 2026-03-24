// Web Audio API sound engine — all sounds generated programmatically

let audioCtx: AudioContext | null = null;
let muted = localStorage.getItem('sound_muted') === 'true';
let currentMusic: { nodes: (OscillatorNode | BiquadFilterNode)[]; gain: GainNode } | null = null;
let currentMusicType: string | null = null;

function ctx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function isMuted() { return muted; }

export function toggleMute() {
  muted = !muted;
  localStorage.setItem('sound_muted', String(muted));
  if (muted) stopAllMusic();
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

// --- Per-screen background music system ---

function stopAllMusic() {
  if (!currentMusic) return;
  try {
    currentMusic.nodes.forEach(n => { try { if (n instanceof OscillatorNode) n.stop(); } catch {} });
  } catch {}
  currentMusic = null;
  currentMusicType = null;
}

function crossfadeTo(type: string, builder: (ac: AudioContext, masterGain: GainNode) => (OscillatorNode | BiquadFilterNode)[]) {
  if (muted) return;
  if (currentMusicType === type) return;

  try {
    const ac = ctx();
    // Fade out old
    if (currentMusic) {
      const oldGain = currentMusic.gain;
      const oldNodes = currentMusic.nodes;
      oldGain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.5);
      setTimeout(() => {
        oldNodes.forEach(n => { try { if (n instanceof OscillatorNode) n.stop(); } catch {} });
      }, 600);
    }

    // Build new
    const masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(0, ac.currentTime);
    masterGain.gain.linearRampToValueAtTime(1, ac.currentTime + 0.5);
    masterGain.connect(ac.destination);

    const nodes = builder(ac, masterGain);
    currentMusic = { nodes, gain: masterGain };
    currentMusicType = type;
  } catch {}
}

// Home: soft mysterious pad
export function playMusicHome() {
  crossfadeTo('home', (ac, master) => {
    const nodes: OscillatorNode[] = [];
    // Soft pad chord: C3, E3, G3
    [130.81, 164.81, 196.00].forEach(freq => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = 0.02;
      // Slow LFO vibrato
      const lfo = ac.createOscillator();
      const lfoG = ac.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.2 + Math.random() * 0.2;
      lfoG.gain.value = 3;
      lfo.connect(lfoG).connect(osc.frequency);
      lfo.start();
      osc.connect(g).connect(master);
      osc.start();
      nodes.push(osc, lfo as OscillatorNode);
    });
    return nodes;
  });
}

// Matchmaking: building tension
export function playMusicMatchmaking() {
  crossfadeTo('matchmaking', (ac, master) => {
    const nodes: OscillatorNode[] = [];
    // Pulsing bass
    const bass = ac.createOscillator();
    const bassG = ac.createGain();
    bass.type = 'sawtooth';
    bass.frequency.value = 55;
    bassG.gain.value = 0.03;
    // Tremolo for tension
    const trem = ac.createOscillator();
    const tremG = ac.createGain();
    trem.type = 'sine';
    trem.frequency.value = 4; // faster pulse
    tremG.gain.value = 0.03;
    trem.connect(tremG).connect(bassG.gain);
    trem.start();
    bass.connect(bassG).connect(master);
    bass.start();
    nodes.push(bass, trem);

    // High tension tone
    const hi = ac.createOscillator();
    const hiG = ac.createGain();
    hi.type = 'sine';
    hi.frequency.value = 440;
    hiG.gain.value = 0.01;
    const lfo2 = ac.createOscillator();
    const lfo2G = ac.createGain();
    lfo2.type = 'sine';
    lfo2.frequency.value = 0.5;
    lfo2G.gain.value = 30;
    lfo2.connect(lfo2G).connect(hi.frequency);
    lfo2.start();
    hi.connect(hiG).connect(master);
    hi.start();
    nodes.push(hi, lfo2);
    return nodes;
  });
}

// Duel: fast intense beat
export function playMusicDuel() {
  crossfadeTo('duel', (ac, master) => {
    const nodes: OscillatorNode[] = [];
    // Fast pulsing bass
    const bass = ac.createOscillator();
    const bassG = ac.createGain();
    bass.type = 'square';
    bass.frequency.value = 82.41; // E2
    bassG.gain.value = 0.02;
    const trem = ac.createOscillator();
    const tremG = ac.createGain();
    trem.type = 'square';
    trem.frequency.value = 8; // fast pulse
    tremG.gain.value = 0.02;
    trem.connect(tremG).connect(bassG.gain);
    trem.start();
    bass.connect(bassG).connect(master);
    bass.start();
    nodes.push(bass, trem);

    // Tense high
    const hi = ac.createOscillator();
    const hiG = ac.createGain();
    hi.type = 'sawtooth';
    hi.frequency.value = 330;
    hiG.gain.value = 0.008;
    const lfo = ac.createOscillator();
    const lfoG = ac.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 6;
    lfoG.gain.value = 20;
    lfo.connect(lfoG).connect(hi.frequency);
    lfo.start();
    hi.connect(hiG).connect(master);
    hi.start();
    nodes.push(hi, lfo);
    return nodes;
  });
}

// Victory: triumphant loop
export function playMusicVictory() {
  crossfadeTo('victory', (ac, master) => {
    const nodes: OscillatorNode[] = [];
    // Major chord: C4, E4, G4, C5
    [261.63, 329.63, 392.00, 523.25].forEach(freq => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = 0.025;
      const lfo = ac.createOscillator();
      const lfoG = ac.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.3;
      lfoG.gain.value = 4;
      lfo.connect(lfoG).connect(osc.frequency);
      lfo.start();
      osc.connect(g).connect(master);
      osc.start();
      nodes.push(osc, lfo);
    });
    return nodes;
  });
}

// Defeat: slow sad melody
export function playMusicDefeat() {
  crossfadeTo('defeat', (ac, master) => {
    const nodes: OscillatorNode[] = [];
    // Minor chord: A3, C4, E4
    [220, 261.63, 329.63].forEach(freq => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = 0.015;
      const lfo = ac.createOscillator();
      const lfoG = ac.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.15;
      lfoG.gain.value = 3;
      lfo.connect(lfoG).connect(osc.frequency);
      lfo.start();
      osc.connect(g).connect(master);
      osc.start();
      nodes.push(osc, lfo);
    });
    return nodes;
  });
}

// Leaderboard: relaxed ambient
export function playMusicLeaderboard() {
  crossfadeTo('leaderboard', (ac, master) => {
    const nodes: OscillatorNode[] = [];
    // Soft fifths: D3, A3
    [146.83, 220].forEach(freq => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = 0.02;
      const lfo = ac.createOscillator();
      const lfoG = ac.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1;
      lfoG.gain.value = 5;
      lfo.connect(lfoG).connect(osc.frequency);
      lfo.start();
      osc.connect(g).connect(master);
      osc.start();
      nodes.push(osc, lfo);
    });
    return nodes;
  });
}

// Legacy compat
export function startBgMusic() { playMusicHome(); }
export function fadeOutBgMusic() { /* handled by crossfade */ }
export function stopBgMusic() { stopAllMusic(); }
