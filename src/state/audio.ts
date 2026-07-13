/**
 * Fully original, procedurally-generated placeholder audio using the Web
 * Audio API. No audio files are shipped or downloaded, so there is no
 * risk of including copyrighted music or sound effects. Everything here
 * is simple oscillator/noise synthesis — easy to replace later with
 * licensed audio files by swapping this module for an <audio>-tag-based
 * player.
 */

export type SfxName =
  | "dialogue"
  | "confirm"
  | "clue"
  | "footstep"
  | "water"
  | "fire"
  | "electric"
  | "countdown"
  | "celebration"
  | "error"
  | "unlock"
  | "click";

export type MusicTrack = "title" | "town" | "challenge" | "reveal" | "none";

interface TrackConfig {
  notes: number[];
  stepDuration: number;
  waveform: OscillatorType;
  /** Adds a driving rhythmic tick under the melody — used for the title
   * theme's more energetic, adventure-fanfare feel. */
  pulse?: boolean;
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;
  private musicVolume = 0.6;
  private sfxVolume = 0.8;
  private currentMusicNodes: { stop: () => void } | null = null;
  private currentTrack: MusicTrack = "none";

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.muted ? 0 : this.musicVolume;
        this.musicGain.connect(this.ctx.destination);

        // A gentle music-box-style echo send on top of the dry signal —
        // short delay with modest feedback — for the wistful, bell-like
        // atmosphere classic handheld town themes are loved for, without
        // reproducing any specific copyrighted melody.
        const delay = this.ctx.createDelay(1.0);
        delay.delayTime.value = 0.24;
        const feedback = this.ctx.createGain();
        feedback.gain.value = 0.3;
        const wet = this.ctx.createGain();
        wet.gain.value = 0.32;
        this.musicGain.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(wet);
        wet.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this.muted ? 0 : this.sfxVolume;
        this.sfxGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  resume(): void {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === "suspended") {
      void ctx.resume().catch(() => {
        // Autoplay policies may block resume until a user gesture;
        // fail silently, sound simply stays off until interaction.
      });
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.musicGain) this.musicGain.gain.value = muted ? 0 : this.musicVolume;
    if (this.sfxGain) this.sfxGain.gain.value = muted ? 0 : this.sfxVolume;
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = volume;
    if (this.musicGain && !this.muted) this.musicGain.gain.value = volume;
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = volume;
    if (this.sfxGain && !this.muted) this.sfxGain.gain.value = volume;
  }

  playSfx(name: SfxName): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    try {
      const now = ctx.currentTime;
      switch (name) {
        case "dialogue":
          this.blip(ctx, now, 880, 0.03);
          break;
        case "click":
          this.blip(ctx, now, 300, 0.018, "square");
          break;
        case "confirm":
          this.tone(ctx, now, 660, 0.08, "square");
          this.tone(ctx, now + 0.09, 880, 0.1, "square");
          break;
        case "clue":
          this.tone(ctx, now, 523, 0.09, "triangle");
          this.tone(ctx, now + 0.1, 659, 0.09, "triangle");
          this.tone(ctx, now + 0.2, 784, 0.18, "triangle");
          break;
        case "footstep":
          this.blip(ctx, now, 140, 0.02, "square");
          break;
        case "water":
          this.noiseBurst(ctx, now, 0.15, 1200);
          break;
        case "fire":
          this.noiseBurst(ctx, now, 0.12, 400);
          break;
        case "electric":
          this.tone(ctx, now, 1400, 0.03, "square");
          this.tone(ctx, now + 0.04, 1800, 0.03, "square");
          this.tone(ctx, now + 0.08, 2200, 0.05, "square");
          break;
        case "countdown":
          this.tone(ctx, now, 440, 0.12, "square");
          break;
        case "celebration":
          [523, 659, 784, 1046].forEach((f, i) => this.tone(ctx, now + i * 0.11, f, 0.16, "triangle"));
          break;
        case "error":
          this.tone(ctx, now, 220, 0.2, "sawtooth");
          break;
        case "unlock":
          this.tone(ctx, now, 392, 0.1, "triangle");
          this.tone(ctx, now + 0.12, 523, 0.12, "triangle");
          this.tone(ctx, now + 0.26, 659, 0.22, "triangle");
          break;
      }
    } catch {
      // Audio synthesis failure should never break gameplay.
    }
  }

  private tone(
    ctx: AudioContext,
    start: number,
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
  ): void {
    if (!this.sfxGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.22, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private blip(ctx: AudioContext, start: number, freq: number, duration: number, type: OscillatorType = "sine"): void {
    this.tone(ctx, start, freq, duration, type);
  }

  private noiseBurst(ctx: AudioContext, start: number, duration: number, filterFreq: number): void {
    if (!this.sfxGain) return;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.value = 0.3;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    source.start(start);
  }

  playMusic(track: MusicTrack): void {
    if (track === this.currentTrack) return;
    this.stopMusic();
    this.currentTrack = track;
    if (track === "none") return;
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;

    const configs: Record<Exclude<MusicTrack, "none">, TrackConfig> = {
      // A punchier, faster, triumphant original fanfare for the title —
      // a bright square-wave lead with a driving rhythmic pulse under it,
      // reaching for that "adventure is about to begin" energy without
      // reusing any specific copyrighted melody.
      title: {
        notes: [392, 392, 587, 494, 587, 784, 659, 784],
        stepDuration: 0.24,
        waveform: "square",
        pulse: true,
      },
      town: { notes: [330, 392, 440, 392, 330, 294, 330, 392], stepDuration: 0.42, waveform: "triangle" },
      challenge: { notes: [440, 494, 523, 494, 440, 494, 523, 587], stepDuration: 0.42, waveform: "triangle" },
      reveal: { notes: [523, 587, 659, 784, 880, 784, 659, 587], stepDuration: 0.42, waveform: "triangle" },
    };
    const config = configs[track];
    const { notes, stepDuration, waveform } = config;
    let step = 0;
    const gain = this.musicGain;

    // A soft, sustained low drone under the melody — held for the whole
    // loop rather than re-triggered per note — adds the warm, layered
    // "pad" quality that makes a simple melody feel like a fuller theme.
    const droneFreq = notes[0] / 4;
    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = "sine";
    drone.frequency.value = droneFreq;
    droneGain.gain.setValueAtTime(0, ctx.currentTime);
    droneGain.gain.linearRampToValueAtTime(config.pulse ? 0.035 : 0.05, ctx.currentTime + 1.2);
    drone.connect(droneGain);
    droneGain.connect(gain);
    drone.start();

    const scheduleStep = () => {
      if (this.currentTrack !== track) return;
      const now = ctx.currentTime;
      const freq = notes[step % notes.length];

      // Main body of the note.
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = waveform;
      osc.frequency.value = freq;
      noteGain.gain.setValueAtTime(0, now);
      noteGain.gain.linearRampToValueAtTime(config.pulse ? 0.13 : 0.15, now + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.9);
      osc.connect(noteGain);
      noteGain.connect(gain);
      osc.start(now);
      osc.stop(now + stepDuration);

      // A quiet, fast-decaying octave-up overtone on the attack only —
      // this is what gives a plain tone its "music box chime" character.
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bell.type = "sine";
      bell.frequency.value = freq * 2;
      bellGain.gain.setValueAtTime(0.09, now);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.35);
      bell.connect(bellGain);
      bellGain.connect(gain);
      bell.start(now);
      bell.stop(now + stepDuration * 0.4);

      // A driving rhythmic tick on every step — this is what gives the
      // title theme forward momentum instead of just a floating melody.
      if (config.pulse) this.musicTick(ctx, now, gain);

      step += 1;
    };

    scheduleStep();
    const intervalId = window.setInterval(scheduleStep, stepDuration * 1000);
    this.currentMusicNodes = {
      stop: () => {
        window.clearInterval(intervalId);
        const stopAt = ctx.currentTime + 0.05;
        droneGain.gain.exponentialRampToValueAtTime(0.001, stopAt);
        drone.stop(stopAt + 0.05);
      },
    };
  }

  private musicTick(ctx: AudioContext, start: number, destination: GainNode): void {
    const duration = 0.045;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 4500;
    const tickGain = ctx.createGain();
    tickGain.gain.value = 0.05;
    source.connect(filter);
    filter.connect(tickGain);
    tickGain.connect(destination);
    source.start(start);
  }

  stopMusic(): void {
    if (this.currentMusicNodes) {
      this.currentMusicNodes.stop();
      this.currentMusicNodes = null;
    }
    this.currentTrack = "none";
  }
}

export const soundManager = new SoundManager();
