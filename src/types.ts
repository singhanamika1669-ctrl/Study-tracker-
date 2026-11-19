export type AppTab = 'today' | 'timer' | 'timetable' | 'syllabus' | 'stats';
export type TimerMode = 'stopwatch' | 'pomo25' | 'pomo50' | 'online_class';

export type AlarmToneId =
  | 'air_raid'
  | 'squadron_bugle'
  | 'cockpit_red_alert'
  | 'radar_scramble'
  | 'commando_whistle'
  | 'missile_lock';

export interface AlarmToneOption {
  id: AlarmToneId;
  name: string;
  intensity: string;
  description: string;
}

export const ALARM_TONES: AlarmToneOption[] = [
  {
    id: 'air_raid',
    name: 'IAF Air-Raid Siren',
    intensity: 'Extreme',
    description: 'Heavy rising & falling Air Force base siren',
  },
  {
    id: 'squadron_bugle',
    name: 'Squadron Dawn Bugle',
    intensity: 'Hard',
    description: 'Sharp army brass reveille wake-up call',
  },
  {
    id: 'cockpit_red_alert',
    name: 'Cockpit Master Alert',
    intensity: 'Extreme',
    description: 'Urgent fighter jet cockpit warning klaxon',
  },
  {
    id: 'radar_scramble',
    name: 'Scramble Hangar Horn',
    intensity: 'Max',
    description: 'Rapid double-blast battle scramble horn',
  },
  {
    id: 'commando_whistle',
    name: 'Commando Drill Whistle',
    intensity: 'Sharp',
    description: 'Piercing parade ground & PT officer whistle',
  },
  {
    id: 'missile_lock',
    name: 'Target Lock Beep',
    intensity: 'High',
    description: 'High-pitch radar lock-on warning pulse',
  },
];

export interface Subject {
  id: string;
  name: string;
  totalChapters: number;
  doneChapters: number;
  color: string;
}

export interface TimetableSlot {
  id: string;
  day: string;
  start: string;
  end: string;
  subjectId: string;
  task: string;
}

export interface OnlineClassSlot {
  id: string;
  day: string;
  start: string;
  end: string;
  subjectId: string;
  title: string;
  platform: string;
  meetingUrl: string;
}

export interface StrictSession {
  taskId: string;
  taskKind: 'slot' | 'online_class' | 'todo' | 'custom';
  title: string;
  subjectId: string;
  startClock: string;
  endClock: string;
  totalDurationMs: number;
  startedAtMs: number;
  unlockAtMs: number;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  requiredMins?: number;
}

export interface DailyHabits {
  ptDone: boolean;
  vocabDone: boolean;
  caDone: boolean;
  pyqDone: boolean;
  runKm: number;
  pushups: number;
}

export interface MockTest {
  id: string;
  date: string;
  name: string;
  maths: number;
  gat: number;
}

export interface StudyLog {
  id: string;
  date: string;
  subjectId: string;
  mins: number;
  topic: string;
  focus: number;
  timestamp: number;
}

export interface StudyReminder {
  id: string;
  title: string;
  time: string;
  days: string[];
  enabled: boolean;
  vibrate: boolean;
  toneId: AlarmToneId;
}

export interface FocusModeConfig {
  enabled: boolean;
  allowedPackages: string[];
  endTimestampMs: number | null;
}

export interface FocusAppItem {
  id: string;
  name: string;
  category: 'Study' | 'Utility' | 'Social/Distraction';
}

export interface PadhaiState {
  darkMode: boolean;
  dailyGoalHours: number;
  examName: string;
  examDate: string;
  strictMode: boolean;
  autoFocusOnStrict: boolean;
  defaultAlarmTone: AlarmToneId;
  appShareUrl: string;
  subjects: Subject[];
  timetable: TimetableSlot[];
  onlineClasses: OnlineClassSlot[];
  completedSlots: Record<string, string[]>;
  completedClasses: Record<string, string[]>;
  todos: Record<string, TodoItem[]>;
  notes: Record<string, string>;
  ndaHabits: Record<string, DailyHabits>;
  mockTests: MockTest[];
  logs: StudyLog[];
  reminders: StudyReminder[];
  focusMode: FocusModeConfig;
  customApps: FocusAppItem[];
  activeStrictSession: StrictSession | null;
}

export const STORAGE_KEY = 'padhaiProNDA_v2';
export const DEFAULT_APP_SHARE_URL =
  'https://ais-pre-z5ftxyececum6xkkxh757w-435085567542.asia-northeast1.run.app';
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const PRESET_PHONE_APPS: FocusAppItem[] = [
  {id: 'com.google.android.calculator', name: 'Calculator', category: 'Utility'},
  {id: 'com.google.android.apps.docs', name: 'PDF / Notes Reader', category: 'Study'},
  {id: 'in.ncert.books', name: 'NCERT Books', category: 'Study'},
  {id: 'com.dictionary', name: 'English Dictionary', category: 'Study'},
  {id: 'com.whatsapp', name: 'WhatsApp', category: 'Social/Distraction'},
  {id: 'com.instagram.android', name: 'Instagram', category: 'Social/Distraction'},
  {id: 'com.google.android.youtube', name: 'YouTube', category: 'Social/Distraction'},
  {id: 'com.pubg.imobile', name: 'BGMI / Games', category: 'Social/Distraction'},
];

export const DEFAULT_STATE: PadhaiState = {
  darkMode: false,
  dailyGoalHours: 6,
  examName: 'NDA Air Force Flying + 11th Board',
  examDate: '2027-09-05',
  strictMode: true,
  autoFocusOnStrict: true,
  defaultAlarmTone: 'air_raid',
  appShareUrl: DEFAULT_APP_SHARE_URL,
  subjects: [
    {id: 'sub_maths', name: 'Maths (11th + NDA)', totalChapters: 16, doneChapters: 0, color: '#0284c7'},
    {id: 'sub_phy', name: 'Physics (11th + NDA)', totalChapters: 15, doneChapters: 0, color: '#4f46e5'},
    {id: 'sub_chem', name: 'Chemistry (11th + NDA)', totalChapters: 14, doneChapters: 0, color: '#059669'},
    {id: 'sub_eng', name: 'English & Vocab (NDA)', totalChapters: 12, doneChapters: 0, color: '#d97706'},
    {id: 'sub_gat', name: 'GAT (GS: History/Geo/Polity)', totalChapters: 15, doneChapters: 0, color: '#dc2626'},
    {id: 'sub_hin', name: 'Hindi (UP Board 11th)', totalChapters: 12, doneChapters: 0, color: '#0891b2'},
  ],
  timetable: [
    {id: 'tt1', day: 'Daily', start: '05:30', end: '06:30', subjectId: 'sub_eng', task: 'Morning PT + 10 Vocab Words'},
    {id: 'tt2', day: 'Daily', start: '12:30', end: '14:30', subjectId: 'sub_maths', task: 'Maths 11th Concept + NDA PYQ Practice'},
    {id: 'tt3', day: 'Daily', start: '18:00', end: '19:30', subjectId: 'sub_phy', task: 'Physics Aeronautical Concept & Numericals'},
    {id: 'tt4', day: 'Daily', start: '20:30', end: '21:30', subjectId: 'sub_gat', task: 'NDA GAT (GK + Defence Current Affairs)'},
    {id: 'tt5', day: 'Sun', start: '10:00', end: '12:30', subjectId: 'sub_maths', task: 'NDA Air Force Full Mock Test + Analysis'},
  ],
  onlineClasses: [
    {
      id: 'oc1',
      day: 'Daily',
      start: '16:00',
      end: '17:30',
      subjectId: 'sub_maths',
      title: 'NDA Maths Live Class (Sets & Trig)',
      platform: 'Physics Wallah',
      meetingUrl: '',
    },
    {
      id: 'oc2',
      day: 'Daily',
      start: '19:30',
      end: '20:30',
      subjectId: 'sub_phy',
      title: 'Class 11th Physics Live Lecture',
      platform: 'YouTube Live',
      meetingUrl: '',
    },
  ],
  completedSlots: {},
  completedClasses: {},
  todos: {},
  notes: {},
  ndaHabits: {},
  mockTests: [],
  logs: [],
  reminders: [
    {
      id: 'rem1',
      title: 'Morning PT + Vocab Alarm',
      time: '05:30',
      days: ['Daily'],
      enabled: false,
      vibrate: true,
      toneId: 'squadron_bugle',
    },
    {
      id: 'rem2',
      title: 'Maths 11th + NDA PYQ Alarm',
      time: '12:30',
      days: ['Daily'],
      enabled: false,
      vibrate: true,
      toneId: 'air_raid',
    },
  ],
  focusMode: {
    enabled: false,
    allowedPackages: ['com.google.android.calculator', 'in.ncert.books'],
    endTimestampMs: null,
  },
  customApps: [],
  activeStrictSession: null,
};

export function isValidToneId(id: string | undefined): id is AlarmToneId {
  return ALARM_TONES.some((t) => t.id === id);
}

export function getToneMeta(toneId: AlarmToneId | undefined): AlarmToneOption {
  return ALARM_TONES.find((t) => t.id === toneId) || ALARM_TONES[0];
}

export function getLocalDateStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatMins(totalMins: number): string {
  const safe = Math.max(0, Math.round(totalMins));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

export function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function formatCountdownClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function parseClockMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number.parseInt(hStr || '0', 10);
  const m = Number.parseInt(mStr || '0', 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return Math.max(0, Math.min(23, h)) * 60 + Math.max(0, Math.min(59, m));
}

export function computeSlotDurationMins(start: string, end: string): number {
  const startM = parseClockMinutes(start);
  const endM = parseClockMinutes(end);
  if (endM > startM) return endM - startM;
  if (endM < startM) return 24 * 60 - startM + endM;
  return 60;
}

export function computeStrictUnlockTarget(
  start: string,
  end: string,
  now = new Date(),
): {totalDurationMs: number; unlockAtMs: number; startedAtMs: number; endsAtClock: boolean} {
  const nowMs = now.getTime();
  const fullMins = computeSlotDurationMins(start, end);
  const fullDurationMs = Math.max(60_000, fullMins * 60_000);

  const startM = parseClockMinutes(start);
  const endM = parseClockMinutes(end);
  const nowM = now.getHours() * 60 + now.getMinutes();

  if (endM > startM && nowM >= startM && nowM < endM) {
    const endDate = new Date(now);
    endDate.setHours(Math.floor(endM / 60), endM % 60, 0, 0);
    const remainingMs = Math.max(60_000, endDate.getTime() - nowMs);
    return {
      totalDurationMs: remainingMs,
      startedAtMs: nowMs,
      unlockAtMs: nowMs + remainingMs,
      endsAtClock: true,
    };
  }

  return {
    totalDurationMs: fullDurationMs,
    startedAtMs: nowMs,
    unlockAtMs: nowMs + fullDurationMs,
    endsAtClock: false,
  };
}

export function calculateStreak(logs: StudyLog[]): number {
  const activeDates = new Set(logs.filter((l) => l.mins > 0).map((l) => l.date));
  let streak = 0;
  const d = new Date();
  if (!activeDates.has(getLocalDateStr(d))) {
    d.setDate(d.getDate() - 1);
  }
  while (activeDates.has(getLocalDateStr(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function loadPadhaiState(): PadhaiState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw) as Partial<PadhaiState>;
    const rawDefaultTone = parsed.defaultAlarmTone;
    const defaultTone: AlarmToneId = isValidToneId(rawDefaultTone) ? rawDefaultTone : 'air_raid';

    const parsedReminders = Array.isArray(parsed.reminders)
      ? parsed.reminders.map((r) => ({
          ...r,
          toneId: isValidToneId(r.toneId) ? r.toneId : defaultTone,
        }))
      : structuredClone(DEFAULT_STATE.reminders);

    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      strictMode: parsed.strictMode !== undefined ? Boolean(parsed.strictMode) : true,
      autoFocusOnStrict:
        parsed.autoFocusOnStrict !== undefined ? Boolean(parsed.autoFocusOnStrict) : true,
      defaultAlarmTone: defaultTone,
      appShareUrl: parsed.appShareUrl || DEFAULT_APP_SHARE_URL,
      completedSlots: parsed.completedSlots || {},
      completedClasses: parsed.completedClasses || {},
      todos: parsed.todos || {},
      notes: parsed.notes || {},
      ndaHabits: parsed.ndaHabits || {},
      mockTests: Array.isArray(parsed.mockTests) ? parsed.mockTests : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      subjects: parsed.subjects?.length ? parsed.subjects : structuredClone(DEFAULT_STATE.subjects),
      timetable: Array.isArray(parsed.timetable) ? parsed.timetable : structuredClone(DEFAULT_STATE.timetable),
      onlineClasses: Array.isArray(parsed.onlineClasses)
        ? parsed.onlineClasses
        : structuredClone(DEFAULT_STATE.onlineClasses),
      reminders: parsedReminders,
      focusMode: parsed.focusMode
        ? {
            enabled: Boolean(parsed.focusMode.enabled),
            allowedPackages: Array.isArray(parsed.focusMode.allowedPackages)
              ? parsed.focusMode.allowedPackages
              : [],
            endTimestampMs: parsed.focusMode.endTimestampMs ?? null,
          }
        : structuredClone(DEFAULT_STATE.focusMode),
      customApps: Array.isArray(parsed.customApps) ? parsed.customApps : [],
      activeStrictSession: parsed.activeStrictSession || null,
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}
