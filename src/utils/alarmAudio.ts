import {AlarmToneId, isCustomToneId} from '../types';
import {getCustomToneBlob} from './customToneDb';

let alarmIntervalId: number | null = null;
let previewTimeoutId: number | null = null;
let audioCtx: AudioContext | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;
let activeCustomAudioEl: HTMLAudioElement | null = null;
let activeCustomObjectUrl: string | null = null;

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
  peakGain = 0.36,
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

    case 'classic_beep': {
      // Crisp 4-pulse military digital watch BEEP-BEEP-BEEP-BEEP!
      [0.0, 0.16, 0.32, 0.48, 0.88, 1.04, 1.2, 1.36].forEach((off) => {
        scheduleOscNote(ctx, out, 'square', 2400, 2400, t + off, 0.09, 0.34);
      });
      break;
    }

    case 'squadron_bugle': {
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
      [0.0, 0.26, 0.52, 0.88, 1.14].forEach((off) => {
        scheduleOscNote(ctx, out, 'square', 1320, 760, t + off, 0.21, 0.32);
        scheduleOscNote(ctx, out, 'sawtooth', 660, 380, t + off, 0.21, 0.24);
      });
      break;
    }

    case 'radar_scramble': {
      [0.0, 0.36, 0.72, 1.12].forEach((off) => {
        scheduleOscNote(ctx, out, 'sawtooth', 260, 245, t + off, 0.27, 0.36);
        scheduleOscNote(ctx, out, 'square', 520, 495, t + off, 0.27, 0.32);
      });
      break;
    }

    case 'commando_whistle': {
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
      for (let i = 0; i < 8; i++) {
        const off = i * 0.16;
        const f = 1480 + i * 95;
        scheduleOscNote(ctx, out, 'square', f, f, t + off, 0.09, 0.32);
      }
      break;
    }

    case 'sonar_ping': {
      [0.0, 0.72].forEach((off) => {
        scheduleOscNote(ctx, out, 'sine', 1320, 1295, t + off, 0.45, 0.4);
        scheduleOscNote(ctx, out, 'triangle', 660, 650, t + off, 0.35, 0.2);
      });
      break;
    }

    case 'afterburner_roar': {
      scheduleOscNote(ctx, out, 'sawtooth', 140, 480, t, 0.9, 0.34);
      scheduleOscNote(ctx, out, 'square', 880, 1180, t + 0.35, 0.25, 0.28);
      scheduleOscNote(ctx, out, 'square', 880, 1180, t + 0.85, 0.28, 0.3);
      break;
    }

    case 'parade_march': {
      [0.0, 0.15, 0.3, 0.55, 0.7, 0.85, 1.1].forEach((off, idx) => {
        scheduleOscNote(ctx, out, 'triangle', idx % 3 === 0 ? 310 : 210, 110, t + off, 0.11, 0.38);
        if (idx % 3 === 0) {
          scheduleOscNote(ctx, out, 'sawtooth', 784, 784, t + off, 0.16, 0.22);
        }
      });
      break;
    }

    case 'bunker_klaxon': {
      [0.0, 0.52, 1.04].forEach((off) => {
        scheduleOscNote(ctx, out, 'sawtooth', 185, 175, t + off, 0.38, 0.38);
        scheduleOscNote(ctx, out, 'square', 277, 265, t + off, 0.38, 0.3);
      });
      break;
    }

    case 'fighter_chime': {
      [0.0, 0.48, 0.96].forEach((off) => {
        scheduleOscNote(ctx, out, 'triangle', 1174.66, 1174.66, t + off, 0.14, 0.36);
        scheduleOscNote(ctx, out, 'sine', 1567.98, 1567.98, t + off + 0.16, 0.22, 0.36);
      });
      break;
    }

    case 'morse_sos': {
      // S (...) O (---) S (...)
      const seq = [
        {off: 0.0, dur: 0.08},
        {off: 0.14, dur: 0.08},
        {off: 0.28, dur: 0.08},
        {off: 0.48, dur: 0.2},
        {off: 0.74, dur: 0.2},
        {off: 1.0, dur: 0.2},
        {off: 1.28, dur: 0.07},
        {off: 1.4, dur: 0.07},
      ];
      seq.forEach((s) => scheduleOscNote(ctx, out, 'square', 1850, 1850, t + s.off, s.dur, 0.32));
      break;
    }

    case 'stealth_pulse': {
      [0.0, 0.45, 0.9].forEach((off) => {
        scheduleOscNote(ctx, out, 'sine', 620, 1980, t + off, 0.34, 0.36);
      });
      break;
    }

    case 'barrack_bell': {
      for (let i = 0; i < 12; i++) {
        const off = i * 0.11;
        scheduleOscNote(ctx, out, 'triangle', i % 2 === 0 ? 1960 : 2320, 1800, t + off, 0.07, 0.34);
      }
      break;
    }

    case 'countdown_beeps': {
      [0.0, 0.35, 0.65, 0.9, 1.1, 1.26].forEach((off, idx) => {
        const freq = idx === 5 ? 2100 : 1200;
        const dur = idx === 5 ? 0.34 : 0.14;
        scheduleOscNote(ctx, out, 'square', freq, freq, t + off, dur, 0.34);
      });
      break;
    }

    case 'interceptor_wail': {
      [0.0, 0.72].forEach((off) => {
        scheduleOscNote(ctx, out, 'sawtooth', 520, 1520, t + off, 0.35, 0.34);
        scheduleOscNote(ctx, out, 'sawtooth', 1520, 520, t + off + 0.35, 0.35, 0.34);
      });
      break;
    }

    default: {
      [0.0, 0.18, 0.36, 0.72].forEach((off) => {
        scheduleOscNote(ctx, out, 'square', 2200, 2200, t + off, 0.1, 0.34);
      });
      break;
    }
  }
}

export function playTimerCompleteChime() {
  const graph = ensureAudioGraph();
  if (!graph) return;
  const {ctx, out} = graph;
  const t = ctx.currentTime;
  scheduleOscNote(ctx, out, 'triangle', 1046.5, 1046.5, t, 0.14, 0.35);
  scheduleOscNote(ctx, out, 'triangle', 1318.5, 1318.5, t + 0.16, 0.14, 0.35);
  scheduleOscNote(ctx, out, 'triangle', 1567.98, 1567.98, t + 0.32, 0.28, 0.38);
}

async function playCustomAudioElement(toneId: string, loop: boolean): Promise<boolean> {
  try {
    const blob = await getCustomToneBlob(toneId);
    if (!blob) return false;
    const url = URL.createObjectURL(blob);
    activeCustomObjectUrl = url;
    const audio = new Audio(url);
    audio.loop = loop;
    audio.volume = 1.0;
    activeCustomAudioEl = audio;
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export function previewWebAlarmTone(toneId: AlarmToneId) {
  stopWebAlarmTone();
  if (isCustomToneId(toneId)) {
    void playCustomAudioElement(toneId, false).then((ok) => {
      if (!ok) playToneCycle('classic_beep');
    });
    previewTimeoutId = window.setTimeout(() => {
      stopWebAlarmTone();
    }, 3500);
    return;
  }

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

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([550, 180, 550, 180]);
    } catch {
      // Ignore vibration errors
    }
  }

  if (isCustomToneId(toneId)) {
    void playCustomAudioElement(toneId, true).then((ok) => {
      if (!ok) {
        playToneCycle('classic_beep');
        alarmIntervalId = window.setInterval(() => {
          playToneCycle('classic_beep');
        }, 1580);
      }
    });
    return;
  }

  playToneCycle(toneId);
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
  if (activeCustomAudioEl) {
    try {
      activeCustomAudioEl.pause();
      activeCustomAudioEl.currentTime = 0;
    } catch {
      // Ignore
    }
    activeCustomAudioEl = null;
  }
  if (activeCustomObjectUrl) {
    try {
      URL.revokeObjectURL(activeCustomObjectUrl);
    } catch {
      // Ignore
    }
    activeCustomObjectUrl = null;
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch {
      // Ignore
    }
  }
}
