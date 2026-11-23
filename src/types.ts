export type AppTab =
  | 'today'
  | 'timer'
  | 'buddy'
  | 'fitness'
  | 'timetable'
  | 'syllabus'
  | 'stats';

export type AppTheme = 'airforce' | 'army' | 'navy' | 'default';
export type StudentClass = '9' | '10' | '11' | '12';
export type StudyTrack =
  | 'class_only'
  | 'nda_only'
  | 'class_9_nda'
  | 'class_10_nda'
  | 'class_11_nda'
  | 'class_12_nda';
export type BoardMedium = 'up_hindi' | 'english';

export type TimerMode = 'stopwatch' | 'pomo25' | 'pomo50' | 'online_class';

export type BuiltInAlarmToneId =
  | 'air_raid'
  | 'classic_beep'
  | 'squadron_bugle'
  | 'cockpit_red_alert'
  | 'radar_scramble'
  | 'commando_whistle'
  | 'missile_lock'
  | 'sonar_ping'
  | 'afterburner_roar'
  | 'parade_march'
  | 'bunker_klaxon'
  | 'fighter_chime'
  | 'morse_sos'
  | 'stealth_pulse'
  | 'barrack_bell'
  | 'countdown_beeps'
  | 'interceptor_wail';

export type AlarmToneId = BuiltInAlarmToneId | `custom_${string}`;

export interface AlarmToneOption {
  id: BuiltInAlarmToneId;
  name: string;
  intensity: string;
  description: string;
}

export interface CustomAlarmToneMeta {
  id: `custom_${string}`;
  name: string;
  mimeType: string;
  sizeBytes: number;
  addedAtMs: number;
}

export const ALARM_TONES: AlarmToneOption[] = [
  {
    id: 'air_raid',
    name: 'IAF Air-Raid Siren',
    intensity: 'Extreme',
    description: 'Heavy rising & falling Air Force base siren',
  },
  {
    id: 'classic_beep',
    name: 'Digital Beep-Beep',
    intensity: 'Crisp',
    description: 'Sharp 4-pulse military watch beep-beep alarm',
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
  {
    id: 'sonar_ping',
    name: 'Naval Sonar Ping',
    intensity: 'Medium',
    description: 'Echoing high-clarity radar & submarine sonar beep',
  },
  {
    id: 'afterburner_roar',
    name: 'Tejas Afterburner Takeoff',
    intensity: 'Extreme',
    description: 'Turbine spool rumble with avionics caution tone',
  },
  {
    id: 'parade_march',
    name: 'NDA Parade Snare',
    intensity: 'Hard',
    description: 'Crisp drill march cadence beats with brass hit',
  },
  {
    id: 'bunker_klaxon',
    name: 'Base Bunker Klaxon',
    intensity: 'Max',
    description: 'Deep industrial bunker blast horn for heavy sleepers',
  },
  {
    id: 'fighter_chime',
    name: 'Cockpit HUD Chime',
    intensity: 'High',
    description: 'Urgent twin-tone Hal Tejas HUD priority chime',
  },
  {
    id: 'morse_sos',
    name: 'Morse Code S-O-S Beep',
    intensity: 'Crisp',
    description: 'Rapid telemetry dit-dit-dit dah-dah-dah beep alert',
  },
  {
    id: 'stealth_pulse',
    name: 'Stealth Radar Sweep',
    intensity: 'High',
    description: 'Dual-oscillator sweeping frequency radar pulse',
  },
  {
    id: 'barrack_bell',
    name: 'Cadet Barrack Bell',
    intensity: 'Hard',
    description: 'Rapid metallic morning assembly wake-up bell',
  },
  {
    id: 'countdown_beeps',
    name: 'Ignition Countdown Beep',
    intensity: 'High',
    description: 'Accelerating launch sequence beeps',
  },
  {
    id: 'interceptor_wail',
    name: 'Interceptor Scramble Wail',
    intensity: 'Extreme',
    description: 'Ultra-fast dual-siren fighter scramble alarm',
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
  /** Accumulated active study milliseconds before current active segment */
  studiedAccumulatedMs: number;
  /** Epoch ms when the current unpaused study segment started, or null while paused */
  activeSegmentStartedAtMs: number | null;
  pausedCount: number;
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

export interface RunningSession {
  id: string;
  date: string;
  timestamp: number;
  durationSec: number;
  distanceKm: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  paceMinPerKm: number;
  calories: number;
  source: 'gps' | 'manual';
  route: Array<{lat: number; lng: number}>;
  notes?: string;
}

export type WorkoutKind = 'reps' | 'timed';

export interface WorkoutDefinition {
  id: string;
  name: string;
  category: 'Running/Cardio' | 'Strength' | 'Core' | 'Mobility';
  kind: WorkoutKind;
  targetValue: number; // reps OR seconds if timed
  caloriesPerUnit: number;
}

export interface WorkoutLogEntry {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string;
  timestamp: number;
  durationSec: number;
  summary: string;
  calories: number;
}

export interface SolvedQuestionItem {
  id: string;
  timestamp: number;
  subject: string;
  questionText: string;
  imageDataUrl?: string;
  conceptUsed: string;
  steps: string[];
  finalAnswer: string;
  tip: string;
  solvedBy: 'gemini' | 'offline';
}

export interface StudyNoteEntry {
  id: string;
  date: string;
  timestamp: number;
  subject: string;
  title: string;
  textSummary: string;
  imageDataUrl?: string;
}

export interface SundayTestQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SundayTestSession {
  id: string;
  createdAtMs: number;
  dateStr: string;
  title: string;
  questions: SundayTestQuestion[];
  userAnswers: Record<string, number>;
  submitted: boolean;
  score: number;
  source: 'gemini' | 'offline';
}

export interface PadhaiState {
  darkMode: boolean;
  appTheme: AppTheme;
  studentName: string;
  studentPhotoDataUrl: string;
  studentClass: StudentClass;
  studyTrack: StudyTrack;
  boardMedium: BoardMedium;
  wakeLockForAlarms: boolean;
  dailyGoalHours: number;
  examName: string;
  examDate: string;
  strictMode: boolean;
  autoFocusOnStrict: boolean;
  defaultAlarmTone: AlarmToneId;
  customAlarmTones: CustomAlarmToneMeta[];
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
  runningLogs: RunningSession[];
  workouts: WorkoutDefinition[];
  workoutLogs: WorkoutLogEntry[];
  waterGlasses: Record<string, number>;
  solvedQuestions: SolvedQuestionItem[];
  studyNotes: StudyNoteEntry[];
  sundayTests: SundayTestSession[];
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

export const DEFAULT_WORKOUTS: WorkoutDefinition[] = [
  {id: 'wk_pushups', name: 'Push-ups (NDA PT)', category: 'Strength', kind: 'reps', targetValue: 40, caloriesPerUnit: 0.45},
  {id: 'wk_pullups', name: 'Pull-ups / Chin-ups', category: 'Strength', kind: 'reps', targetValue: 10, caloriesPerUnit: 1.1},
  {id: 'wk_squats', name: 'Free Squats', category: 'Strength', kind: 'reps', targetValue: 50, caloriesPerUnit: 0.35},
  {id: 'wk_plank', name: 'Core Plank Hold', category: 'Core', kind: 'timed', targetValue: 120, caloriesPerUnit: 0.08},
  {id: 'wk_skipping', name: 'Skipping / Rope Jump', category: 'Running/Cardio', kind: 'timed', targetValue: 300, caloriesPerUnit: 0.18},
  {id: 'wk_situps', name: 'Sit-ups / Crunches', category: 'Core', kind: 'reps', targetValue: 40, caloriesPerUnit: 0.3},
  {id: 'wk_surya', name: 'Surya Namaskar', category: 'Mobility', kind: 'reps', targetValue: 12, caloriesPerUnit: 1.4},
];

export const DEFAULT_STATE: PadhaiState = {
  darkMode: false,
  appTheme: 'airforce',
  studentName: 'Atharv Singh',
  studentPhotoDataUrl: '',
  studentClass: '11',
  studyTrack: 'class_11_nda',
  boardMedium: 'up_hindi',
  wakeLockForAlarms: false,
  dailyGoalHours: 6,
  examName: 'NDA Air Force Flying + 11th Board',
  examDate: '2027-09-05',
  strictMode: true,
  autoFocusOnStrict: true,
  defaultAlarmTone: 'air_raid',
  customAlarmTones: [],
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
  runningLogs: [],
  workouts: DEFAULT_WORKOUTS,
  workoutLogs: [],
  waterGlasses: {},
  solvedQuestions: [],
  studyNotes: [],
  sundayTests: [],
};

export function isCustomToneId(id: string | undefined): id is `custom_${string}` {
  return typeof id === 'string' && id.startsWith('custom_');
}

export function isValidToneId(
  id: string | undefined,
  customTones: CustomAlarmToneMeta[] = [],
): id is AlarmToneId {
  if (!id) return false;
  if (ALARM_TONES.some((t) => t.id === id)) return true;
  return customTones.some((c) => c.id === id);
}

export function getToneMeta(
  toneId: AlarmToneId | undefined,
  customTones: CustomAlarmToneMeta[] = [],
): {id: string; name: string; intensity: string; description: string; isCustom: boolean} {
  if (toneId && isCustomToneId(toneId)) {
    const custom = customTones.find((c) => c.id === toneId);
    if (custom) {
      return {
        id: custom.id,
        name: custom.name,
        intensity: 'Phone File',
        description: `Custom audio file (${Math.max(1, Math.round(custom.sizeBytes / 1024))} KB)`,
        isCustom: true,
      };
    }
  }
  const builtIn = ALARM_TONES.find((t) => t.id === toneId) || ALARM_TONES[0];
  return {...builtIn, isCustom: false};
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

export function getStrictActualStudiedMs(session: StrictSession, nowMs = Date.now()): number {
  const runningDelta =
    session.activeSegmentStartedAtMs !== null
      ? Math.max(0, nowMs - session.activeSegmentStartedAtMs)
      : 0;
  return Math.max(0, (session.studiedAccumulatedMs || 0) + runningDelta);
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

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function loadPadhaiState(): PadhaiState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw) as Partial<PadhaiState>;
    const customTones = Array.isArray(parsed.customAlarmTones) ? parsed.customAlarmTones : [];
    const rawDefaultTone = parsed.defaultAlarmTone;
    const defaultTone: AlarmToneId = isValidToneId(rawDefaultTone, customTones)
      ? rawDefaultTone
      : 'air_raid';

    const parsedReminders = Array.isArray(parsed.reminders)
      ? parsed.reminders.map((r) => ({
          ...r,
          toneId: isValidToneId(r.toneId, customTones) ? r.toneId : defaultTone,
        }))
      : structuredClone(DEFAULT_STATE.reminders);

    const migratedStrictSession: StrictSession | null = parsed.activeStrictSession
      ? {
          ...parsed.activeStrictSession,
          studiedAccumulatedMs: parsed.activeStrictSession.studiedAccumulatedMs ?? 0,
          activeSegmentStartedAtMs:
            parsed.activeStrictSession.activeSegmentStartedAtMs === undefined
              ? parsed.activeStrictSession.startedAtMs
              : parsed.activeStrictSession.activeSegmentStartedAtMs,
          pausedCount: parsed.activeStrictSession.pausedCount ?? 0,
        }
      : null;

    const validTheme: AppTheme =
      parsed.appTheme === 'airforce' ||
      parsed.appTheme === 'army' ||
      parsed.appTheme === 'navy' ||
      parsed.appTheme === 'default'
        ? parsed.appTheme
        : 'airforce';

    const validClass: StudentClass =
      parsed.studentClass === '9' ||
      parsed.studentClass === '10' ||
      parsed.studentClass === '11' ||
      parsed.studentClass === '12'
        ? parsed.studentClass
        : '11';

    const validTrack: StudyTrack =
      parsed.studyTrack === 'class_only' ||
      parsed.studyTrack === 'nda_only' ||
      parsed.studyTrack === 'class_9_nda' ||
      parsed.studyTrack === 'class_10_nda' ||
      parsed.studyTrack === 'class_11_nda' ||
      parsed.studyTrack === 'class_12_nda'
        ? parsed.studyTrack
        : 'class_11_nda';

    const validMedium: BoardMedium =
      parsed.boardMedium === 'up_hindi' || parsed.boardMedium === 'english'
        ? parsed.boardMedium
        : 'up_hindi';

    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      appTheme: validTheme,
      studentName: typeof parsed.studentName === 'string' && parsed.studentName.trim()
        ? parsed.studentName
        : DEFAULT_STATE.studentName,
      studentPhotoDataUrl: typeof parsed.studentPhotoDataUrl === 'string'
        ? parsed.studentPhotoDataUrl
        : '',
      studentClass: validClass,
      studyTrack: validTrack,
      boardMedium: validMedium,
      wakeLockForAlarms: Boolean(parsed.wakeLockForAlarms),
      strictMode: parsed.strictMode !== undefined ? Boolean(parsed.strictMode) : true,
      autoFocusOnStrict:
        parsed.autoFocusOnStrict !== undefined ? Boolean(parsed.autoFocusOnStrict) : true,
      defaultAlarmTone: defaultTone,
      customAlarmTones: customTones,
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
      activeStrictSession: migratedStrictSession,
      runningLogs: Array.isArray(parsed.runningLogs) ? parsed.runningLogs : [],
      workouts: Array.isArray(parsed.workouts) && parsed.workouts.length > 0
        ? parsed.workouts
        : structuredClone(DEFAULT_WORKOUTS),
      workoutLogs: Array.isArray(parsed.workoutLogs) ? parsed.workoutLogs : [],
      waterGlasses: parsed.waterGlasses || {},
      solvedQuestions: Array.isArray(parsed.solvedQuestions) ? parsed.solvedQuestions : [],
      studyNotes: Array.isArray(parsed.studyNotes) ? parsed.studyNotes : [],
      sundayTests: Array.isArray(parsed.sundayTests) ? parsed.sundayTests : [],
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}
