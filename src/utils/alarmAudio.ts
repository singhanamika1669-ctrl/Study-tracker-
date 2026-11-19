import {AlarmToneId} from '../types';

let alarmIntervalId: number | null = null;
let previewTimeoutId: number | null = null;
let audioCtx: AudioContext | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;

function ensureAudioGraph(): {ctx: AudioContext; out: AudioNode} | null {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) {
      audioCtx = new Ctx();
      masterCompressor = audioCtx.createDynamicsCompressor();
      masterCompressor.threshold.setValueAtTime(-10, audioCtx.currentTime);
      masterCompressor.knee.setValueAtTime(12, audioCtx.currentTime);
      masterCompressor.ratio.setValueAtTime(8, audioCtx.currentTime);
      masterCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
      masterCompressor.release.setValueAtTime(0.15, audioCtx.currentTime);
      masterCompressor.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return {ctx: audioCtx, out: masterCompressor || audioCtx.destination};
  } catch {
    return null;
  }
}

function scheduleOscNote(
  ctx: AudioContext,
  out: AudioNode,
  type: OscillatorType,
  startFreq: number,
  endFreq: number,
  startTime: number,
  duration: number,
  peakGain = 0.38,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, startTime);
  if (Math.abs(endFreq - startFreq) > 1) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), startTime + duration);
  }
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.015);
  gain.gain.setValueAtTime(peakGain, Math.max(startTime + 0.02, startTime + duration - 0.03));
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(out);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function playToneCycle(toneId: AlarmToneId) {
  const graph = ensureAudioGraph();
  if (!graph) return;
  const {ctx, out} = graph;
  const t = ctx.currentTime;

  switch (toneId) {
    case 'air_raid': {
      // Heavy rising & wailing fighter airbase raid siren (dual detuned sawtooth)
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o1.type = 'sawtooth';
      o2.type = 'sawtooth';
      o1.frequency.setValueAtTime(340, t);
      o1.frequency.exponentialRampToValueAtTime(980, t + 0.72);
      o1.frequency.exponentialRampToValueAtTime(420, t + 1.48);

      o2.frequency.setValueAtTime(347, t);
      o2.frequency.exponentialRampToValueAtTime(995, t + 0.72);
      o2.frequency.exponentialRampToValueAtTime(428, t + 1.48);

      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.32, t + 0.05);
      g.gain.setValueAtTime(0.32, t + 1.32);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.48);

      o1.connect(g);
      o2.connect(g);
      g.connect(out);
      o1.start(t);
      o2.start(t);
      o1.stop(t + 1.5);
      o2.stop(t + 1.5);
      break;
    }

    case 'squadron_bugle': {
      // Crisp hard brass-like reveille fanfare: G4 - C5 - E5 - G5 - E5 - G5!
      const notes = [
        {f: 523.25, off: 0.0, dur: 0.16},
        {f: 659.25, off: 0.18, dur: 0.16},
        {f: 783.99, off: 0.36, dur: 0.22},
        {f: 1046.5, off: 0.62, dur: 0.34},
        {f: 783.99, off: 1.0, dur: 0.16},
        {f: 1046.5, off: 1.18, dur: 0.38},
      ];
      notes.forEach((n) => {
        scheduleOscNote(ctx, out, 'sawtooth', n.f, n.f * 1.005, t + n.off, n.dur, 0.28);
        scheduleOscNote(ctx, out, 'triangle', n.f * 0.5, n.f * 0.5, t + n.off, n.dur, 0.22);
      });
      break;
    }

    case 'cockpit_red_alert': {
      // Fighter cockpit master caution klaxon: rapid hard high/low square blasts
      const pattern = [0.0, 0.26, 0.52, 0.88, 1.14];
      pattern.forEach((off) => {
        scheduleOscNote(ctx, out, 'square', 1320, 760, t + off, 0.21, 0.32);
        scheduleOscNote(ctx, out, 'sawtooth', 660, 380, t + off, 0.21, 0.24);
      });
      break;
    }

    case 'radar_scramble': {
      // Heavy double-blast battle hangar scramble horn (low punchy square + buzz)
      const blasts = [0.0, 0.36, 0.72, 1.12];
      blasts.forEach((off) => {
        scheduleOscNote(ctx, out, 'sawtooth', 260, 245, t + off, 0.27, 0.36);
        scheduleOscNote(ctx, out, 'square', 520, 495, t + off, 0.27, 0.32);
      });
      break;
    }

    case 'commando_whistle': {
      // Piercing dual-frequency PT/drill officer trill whistle
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const mainGain = ctx.createGain();

      o1.type = 'triangle';
      o2.type = 'sine';
      o1.frequency.setValueAtTime(2850, t);
      o2.frequency.setValueAtTime(3120, t);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(34, t);
      lfoGain.gain.setValueAtTime(210, t);
      lfo.connect(lfoGain);
      lfoGain.connect(o1.frequency);

      [0.0, 0.65].forEach((burstOff) => {
        mainGain.gain.setValueAtTime(0.001, t + burstOff);
        mainGain.gain.exponentialRampToValueAtTime(0.36, t + burstOff + 0.02);
        mainGain.gain.setValueAtTime(0.36, t + burstOff + 0.45);
        mainGain.gain.exponentialRampToValueAtTime(0.001, t + burstOff + 0.54);
      });

      o1.connect(mainGain);
      o2.connect(mainGain);
      mainGain.connect(out);
      lfo.start(t);
      o1.start(t);
      o2.start(t);
      lfo.stop(t + 1.3);
      o1.stop(t + 1.3);
      o2.stop(t + 1.3);
      break;
    }

    case 'missile_lock': {
      // Fast escalating radar target-lock crescendo pulse
      for (let i = 0; i < 8; i++) {
        const off = i * 0.16;
        const f = 1480 + i * 95;
        scheduleOscNote(ctx, out, 'square', f, f, t + off, 0.09, 0.32);
      }
      break;
    }
  }
}

export function previewWebAlarmTone(toneId: AlarmToneId) {
  stopWebAlarmTone();
  playToneCycle(toneId);
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([250, 100, 250]);
    } catch {
      // Ignore vibration errors
    }
  }
  previewTimeoutId = window.setTimeout(() => {
    previewTimeoutId = null;
  }, 1600);
}

export function startWebAlarmTone(toneId: AlarmToneId = 'air_raid') {
  stopWebAlarmTone();
  playToneCycle(toneId);
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([550, 180, 550, 180]);
    } catch {
      // Ignore vibration errors
    }
  }
  alarmIntervalId = window.setInterval(() => {
    playToneCycle(toneId);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([550, 180, 550, 180]);
      } catch {
        // Ignore
      }
    }
  }, 1580);
}

export function stopWebAlarmTone() {
  if (alarmIntervalId !== null) {
    window.clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
  if (previewTimeoutId !== null) {
    window.clearTimeout(previewTimeoutId);
    previewTimeoutId = null;
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch {
      // Ignore
    }
  }
}
