/**
 * High-quality Web Audio Background Music & Sound Effects Engine
 * Generates lush, gentle ambient music (Music Box, Warm Piano, Rain & Chimes)
 * completely client-side with 0 external dependency failure risk.
 */

export type MusicTrackId = 'music-box' | 'warm-piano' | 'rain-chimes';

export interface MusicTrackInfo {
  id: MusicTrackId;
  title: string;
  description: string;
  icon: string;
}

export const MUSIC_TRACKS: MusicTrackInfo[] = [
  {
    id: 'music-box',
    title: 'Hộp Nhạc Ngọt Ngào',
    description: 'Âm sắc du dương, lãng mạn như giai điệu tuổi thơ',
    icon: '🎵',
  },
  {
    id: 'warm-piano',
    title: 'Piano Thư Giãn',
    description: 'Hợp âm êm dịu, ấm áp giúp tập trung suy nghĩ',
    icon: '🎹',
  },
  {
    id: 'rain-chimes',
    title: 'Mưa Rơi & Chuông Gió',
    description: 'Tiếng mưa êm ái kết hợp chuông gió thanh khiết',
    icon: '🌧️',
  },
];

class AudioManager {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentTrack: MusicTrackId = 'music-box';
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private volume: number = 0.5;
  private sfxEnabled: boolean = true;
  private loopTimer: any = null;
  private ambientNoiseNode: AudioNode | null = null;
  private stepIndex: number = 0;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Restore saved volume if any
    const savedVol = localStorage.getItem('sudoku_music_volume');
    if (savedVol !== null) {
      this.volume = Math.max(0, Math.min(1, parseFloat(savedVol)));
    }
    const savedTrack = localStorage.getItem('sudoku_music_track');
    if (savedTrack && MUSIC_TRACKS.some(t => t.id === savedTrack)) {
      this.currentTrack = savedTrack as MusicTrackId;
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 0.35 : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentTrack(): MusicTrackId {
    return this.currentTrack;
  }

  public isSfxOn(): boolean {
    return this.sfxEnabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('sudoku_music_volume', this.volume.toString());
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxEnabled ? 0.35 : 0, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public setTrack(trackId: MusicTrackId) {
    if (this.currentTrack === trackId) return;
    this.currentTrack = trackId;
    localStorage.setItem('sudoku_music_track', trackId);
    if (this.isPlaying) {
      this.stopMusicEngine();
      this.startMusicEngine();
    }
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public play() {
    this.initContext();
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.startMusicEngine();
      this.notify();
    }
  }

  public pause() {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.stopMusicEngine();
      this.notify();
    }
  }

  // --- Sound Effects ---
  public playClick(pitch: number = 1.0) {
    if (!this.sfxEnabled) return;
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(880 * pitch, now + 0.04);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {
      // AudioContext policy
    }
  }

  public playVictoryFanfare() {
    try {
      this.initContext();
      if (!this.ctx || !this.sfxGain) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteTime = now + idx * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.25, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.8);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.85);
      });
    } catch (e) {
      // ignore
    }
  }

  // --- Music Generation Engine ---
  private startMusicEngine() {
    if (!this.ctx || !this.musicGain) return;
    this.stepIndex = 0;

    // Start ambient background texture if track has rain
    if (this.currentTrack === 'rain-chimes') {
      this.startRainAmbience();
    }

    // Interval to sequence soothing notes
    const tickInterval = this.currentTrack === 'music-box' ? 520 : 680;
    this.loopTimer = setInterval(() => {
      this.tick();
    }, tickInterval);

    // Initial immediate tick
    this.tick();
  }

  private stopMusicEngine() {
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.ambientNoiseNode) {
      try {
        (this.ambientNoiseNode as any).stop?.();
        this.ambientNoiseNode.disconnect();
      } catch (e) {}
      this.ambientNoiseNode = null;
    }
  }

  private startRainAmbience() {
    if (!this.ctx || !this.musicGain) return;
    try {
      // Generate pink/white noise buffer for gentle rain drizzle
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
        b6 = white * 0.115926;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter for gentle rain sound
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      whiteNoise.start();
      this.ambientNoiseNode = whiteNoise;
    } catch (e) {
      console.warn('Could not start rain ambience:', e);
    }
  }

  private tick() {
    if (!this.ctx || !this.musicGain || !this.isPlaying) return;

    if (this.currentTrack === 'music-box') {
      this.playMusicBoxStep();
    } else if (this.currentTrack === 'warm-piano') {
      this.playWarmPianoStep();
    } else if (this.currentTrack === 'rain-chimes') {
      this.playRainChimesStep();
    }

    this.stepIndex++;
  }

  // Track 1: Music Box (C Maj / G / Am / F peaceful lullaby progression)
  private playMusicBoxStep() {
    if (!this.ctx || !this.musicGain) return;

    // Frequencies (Hz) for C major scale: C4, D4, E4, G4, A4, C5, D5, E5, G5
    const melodyPattern = [
      [261.63, 523.25], // C4, C5
      [329.63],         // E4
      [392.00],         // G4
      [659.25],         // E5
      [220.00, 440.00], // A3, A4
      [261.63],         // C4
      [329.63],         // E4
      [523.25],         // C5
      [174.61, 349.23], // F3, F4
      [261.63],         // C4
      [329.63],         // E4
      [440.00],         // A4
      [196.00, 392.00], // G3, G4
      [246.94],         // B3
      [293.66],         // D4
      [493.88],         // B4
    ];

    const currentNotes = melodyPattern[this.stepIndex % melodyPattern.length];
    currentNotes.forEach((freq, i) => {
      this.triggerChime(freq, 0.15, 1.2, i * 0.06);
    });
  }

  // Track 2: Warm Piano / Rhodes Chords & Arpeggio (Fmaj7 -> Em7 -> Dm7 -> Cmaj7)
  private playWarmPianoStep() {
    if (!this.ctx || !this.musicGain) return;

    const chords = [
      // Fmaj7: F3, A3, C4, E4
      [174.61, 220.00, 261.63, 329.63],
      [220.00, 261.63, 329.63, 392.00],
      // Em7: E3, G3, B3, D4
      [164.81, 196.00, 246.94, 293.66],
      [196.00, 246.94, 293.66, 392.00],
      // Dm7: D3, F3, A3, C4
      [146.83, 174.61, 220.00, 261.63],
      [174.61, 220.00, 261.63, 349.23],
      // Cmaj7: C3, E3, G3, B3
      [130.81, 164.81, 196.00, 246.94],
      [164.81, 196.00, 246.94, 329.63],
    ];

    const chord = chords[this.stepIndex % chords.length];
    // Strum arpeggiate
    chord.forEach((freq, idx) => {
      this.triggerPianoNote(freq, 0.14 - idx * 0.02, 1.8, idx * 0.08);
    });
  }

  // Track 3: Rain & Wind Chimes (Pentatonic random gentle chimes)
  private playRainChimesStep() {
    if (!this.ctx || !this.musicGain) return;

    // Pentatonic high chimes
    const chimeFrequencies = [
      587.33, // D5
      659.25, // E5
      783.99, // G5
      880.00, // A5
      1046.50, // C6
      1174.66, // D6
      1318.51, // E6
      1567.98, // G6
    ];

    // Every step has a 65% chance to ring 1 or 2 sweet chimes
    if (Math.random() < 0.7) {
      const freq1 = chimeFrequencies[Math.floor(Math.random() * chimeFrequencies.length)];
      this.triggerChime(freq1, 0.12, 2.2, 0);

      if (Math.random() < 0.4) {
        const freq2 = chimeFrequencies[Math.floor(Math.random() * chimeFrequencies.length)];
        this.triggerChime(freq2, 0.09, 1.8, 0.14);
      }
    }
  }

  // Synthesizes a pure, resonant music-box / bell timbre
  private triggerChime(freq: number, volume: number, duration: number, delaySec: number) {
    if (!this.ctx || !this.musicGain) return;

    const now = this.ctx.currentTime + delaySec;

    // Main fundamental sine wave
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Soft attack, prolonged bell decay
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Add high harmonic overtone for chime shimmer
    const overtone = this.ctx.createOscillator();
    const overGain = this.ctx.createGain();
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2.76, now); // Inharmonic chime ratio
    overGain.gain.setValueAtTime(volume * 0.25, now);
    overGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.45);

    osc.connect(gain);
    overtone.connect(overGain);

    gain.connect(this.musicGain);
    overGain.connect(this.musicGain);

    osc.start(now);
    overtone.start(now);

    osc.stop(now + duration + 0.05);
    overtone.stop(now + duration + 0.05);
  }

  // Synthesizes a warm, rounded piano/Rhodes tone
  private triggerPianoNote(freq: number, volume: number, duration: number, delaySec: number) {
    if (!this.ctx || !this.musicGain) return;

    const now = this.ctx.currentTime + delaySec;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    // Slight detune for richness
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 1.002, now);

    // Warm low-pass filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(350, now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }
}

export const audioManager = new AudioManager();
