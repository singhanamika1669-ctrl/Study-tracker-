import React, {useEffect, useState} from 'react';
import {
  AlarmClock,
  Anchor,
  BellRing,
  CalendarPlus,
  Check,
  Clock,
  GraduationCap,
  Lock,
  Music,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  Video,
  Volume2,
} from 'lucide-react';
import {
  ALARM_TONES,
  AlarmToneId,
  AppTheme,
  CustomAlarmToneMeta,
  FocusAppItem,
  FocusModeConfig,
  OnlineClassSlot,
  PRESET_PHONE_APPS,
  StrictSession,
  StudyReminder,
  Subject,
  TimerMode,
  computeSlotDurationMins,
  formatClock,
  formatCountdownClock,
  formatMins,
  getToneMeta,
} from '../types';
import {getThemeMeta} from '../utils/themeConfig';
import {FighterJetSvg, IafRoundelSvg} from './FighterJetIcon';

interface TimerTabProps {
  appTheme: AppTheme;
  subjects: Subject[];
  onlineClasses: OnlineClassSlot[];
  strictMode: boolean;
  activeStrictSession: StrictSession | null;
  strictRemainingMs: number;
  strictStudiedMs: number;
  mode: TimerMode;
  running: boolean;
  hasStarted: boolean;
  isCompleted: boolean;
  displayMs: number;
  subjectId: string;
  topic: string;
  onlineClassMins: number;
  focusMode: FocusModeConfig;
  customApps: FocusAppItem[];
  reminders: StudyReminder[];
  defaultAlarmTone: AlarmToneId;
  customAlarmTones: CustomAlarmToneMeta[];
  wakeLockForAlarms: boolean;
  onSelectMode: (mode: TimerMode) => void;
  onSelectSubject: (id: string) => void;
  onChangeTopic: (topic: string) => void;
  onChangeOnlineClassMins: (mins: number) => void;
  onToggleStartPause: () => void;
  onFinishSave: () => void;
  onReset: () => void;
  onToggleStrictPause: () => void;
  onStartStrictOnlineClass: (cls: OnlineClassSlot) => void;
  onToggleFocusMode: (durationMins: number | null) => void;
  onToggleAllowedApp: (appId: string) => void;
  onAddCustomApp: (name: string) => void;
  onTestAppLaunch: (app: FocusAppItem) => void;
  onSelectDefaultTone: (toneId: AlarmToneId) => void;
  onPreviewTone: (toneId: AlarmToneId) => void;
  onUploadCustomTone: (file: File) => void;
  onDeleteCustomTone: (toneId: string) => void;
  onAddReminder: (title: string, time: string, days: string[], toneId: AlarmToneId) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onTestAlarm: (toneId: AlarmToneId) => void;
  onToggleWakeLock: () => void;
  onRequestNotificationPermission: () => void;
  onExportReminderCalendar: (rem: StudyReminder) => void;
}

const DAY_OPTIONS = ['Daily', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TimerTab: React.FC<TimerTabProps> = ({
  appTheme,
  subjects,
  onlineClasses,
  strictMode,
  activeStrictSession,
  strictRemainingMs,
  strictStudiedMs,
  mode,
  running,
  hasStarted,
  isCompleted,
  displayMs,
  subjectId,
  topic,
  onlineClassMins,
  focusMode,
  customApps,
  reminders,
  defaultAlarmTone,
  customAlarmTones,
  wakeLockForAlarms,
  onSelectMode,
  onSelectSubject,
  onChangeTopic,
  onChangeOnlineClassMins,
  onToggleStartPause,
  onFinishSave,
  onReset,
  onToggleStrictPause,
  onStartStrictOnlineClass,
  onToggleFocusMode,
  onToggleAllowedApp,
  onAddCustomApp,
  onTestAppLaunch,
  onSelectDefaultTone,
  onPreviewTone,
  onUploadCustomTone,
  onDeleteCustomTone,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onTestAlarm,
  onToggleWakeLock,
  onRequestNotificationPermission,
  onExportReminderCalendar,
}) => {
  const [focusDuration, setFocusDuration] = useState<number>(0);
  const [customAppName, setCustomAppName] = useState('');

  const [alarmTitle, setAlarmTitle] = useState('');
  const [alarmTime, setAlarmTime] = useState('06:00');
  const [alarmDay, setAlarmDay] = useState('Daily');
  const [selectedToneId, setSelectedToneId] = useState<AlarmToneId>(defaultAlarmTone);
  const theme = getThemeMeta(appTheme);

  useEffect(() => {
    setSelectedToneId(defaultAlarmTone);
  }, [defaultAlarmTone]);

  const allApps = [...customApps, ...PRESET_PHONE_APPS];

  const modeOptions: Array<{id: TimerMode; label: string}> = [
    {id: 'stopwatch', label: 'Stopwatch'},
    {id: 'pomo25', label: `${theme.sessionWord} 25m`},
    {id: 'pomo50', label: 'Deep 50m'},
    {id: 'online_class', label: 'Online Class'},
  ];

  const durationOptions = [
    {mins: 0, label: 'Until Off'},
    {mins: 25, label: '25 min'},
    {mins: 50, label: '50 min'},
    {mins: 90, label: '90 min'},
  ];

  const classDurationPresets = [45, 60, 90, 120];

  const statusText = isCompleted
    ? `${theme.sessionWord} Complete! Finish & Save dabao.`
    : running
      ? mode === 'online_class'
        ? `Online Class ${theme.sessionWord} ON... Full Focus!`
        : theme.focusStatusActive
      : hasStarted
        ? 'Paused. Resume ya Finish & Save karo.'
        : mode === 'online_class'
          ? 'Online Class select karo ya duration chuno.'
          : `Ready! Start ${theme.sessionWord} dabao.`;

  const strictProgressPct = activeStrictSession
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((activeStrictSession.totalDurationMs - strictRemainingMs) /
              Math.max(1, activeStrictSession.totalDurationMs)) *
              100,
          ),
        ),
      )
    : 0;

  const isStrictPaused = Boolean(
    activeStrictSession && activeStrictSession.activeSegmentStartedAtMs === null,
  );

  return (
    <div className="space-y-5">
      {/* Active Strict Task Dual-Clock & Actual Study Stopwatch Banner */}
      {activeStrictSession && (
        <section
          className={`relative overflow-hidden rounded-2xl border border-sky-400/35 bg-gradient-to-br ${theme.heroGradient} p-5 text-white shadow-lg`}
        >
          {theme.hudImage && (
            <img
              src={theme.hudImage}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
            />
          )}
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-200">
                <ShieldAlert className="h-4 w-4 text-amber-300" />
                <span>
                  STRICT TASK LOCK ·{' '}
                  {activeStrictSession.taskKind === 'online_class'
                    ? 'Online Class'
                    : activeStrictSession.taskKind === 'slot'
                      ? 'Timetable Slot'
                      : 'Target Task'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-200">
                {appTheme === 'airforce' && <IafRoundelSvg className="h-4 w-4" />}
                <span>
                  {activeStrictSession.startClock && activeStrictSession.endClock
                    ? `Watch Deadline: ${activeStrictSession.endClock}`
                    : 'Target Timer Active'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-extrabold text-white sm:text-xl">
                  {activeStrictSession.title}
                </h3>
                <p className="mt-1 text-xs text-slate-300">
                  Mummy/Papa ya koi kaam aa jaye toh Pause daba sakte ho — Stopwatch ruke ga taaki
                  keval <strong>Asli Padhai Time</strong> count ho, aur task time watch ke hisab se
                  pura hone par hi complete hoga. Baki poora app use kar sakte ho!
                </p>
              </div>

              <button
                type="button"
                onClick={onToggleStrictPause}
                className={`inline-flex min-h-[46px] shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
                  isStrictPaused
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                }`}
              >
                {isStrictPaused ? (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Resume Padhai</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    <span>Pause (Kaam Aa Gaya)</span>
                  </>
                )}
              </button>
            </div>

            {/* Dual Counters: Slot Watch Countdown vs Actual Study Stopwatch */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/15 bg-black/30 p-3.5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-sky-300 uppercase">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Task Complete hone me bacha time
                  </span>
                  <span>{strictProgressPct}%</span>
                </div>
                <p className="font-mono-num mt-1 text-3xl font-extrabold text-white sm:text-4xl">
                  {formatCountdownClock(strictRemainingMs)}
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808] transition-all duration-300"
                    style={{width: `${strictProgressPct}%`}}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-emerald-400/30 bg-black/30 p-3.5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
                  <span>Asli Padhai Stopwatch (Actual)</span>
                  <span>
                    {isStrictPaused ? 'PAUSED' : 'COUNTING'} · Breaks:{' '}
                    {activeStrictSession.pausedCount || 0}
                  </span>
                </div>
                <p className="font-mono-num mt-1 text-3xl font-extrabold text-emerald-300 sm:text-4xl">
                  {formatClock(strictStudiedMs)}
                </p>
                <p className="mt-1.5 text-[11px] text-slate-300">
                  {isStrictPaused
                    ? 'Stopwatch paused hai — wapas aate hi Resume Padhai dabao.'
                    : 'Sirf aapki real active padhai ka time record ho raha hai.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Study Timer & Rules (Always usable alongside strict lock!) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="mx-auto mb-5 inline-flex flex-wrap justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            {modeOptions.map((item) => {
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectMode(item.id)}
                  className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                    active
                      ? 'bg-[#0c2340] text-white shadow-sm dark:bg-sky-500 dark:text-slate-950'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mx-auto max-w-sm space-y-2.5">
            <select
              value={subjectId}
              onChange={(e) => onSelectSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={topic}
              onChange={(e) => onChangeTopic(e.target.value)}
              placeholder={
                mode === 'online_class'
                  ? 'Kaunsi Online Class chal rahi hai?'
                  : 'Abhi kaunsa chapter padh rahe ho?'
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            {mode === 'online_class' && (
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap justify-center gap-1.5">
                  {classDurationPresets.map((mins) => {
                    const active = onlineClassMins === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => onChangeOnlineClassMins(mins)}
                        className={`rounded-lg border px-3 py-1 text-xs font-bold transition ${
                          active
                            ? 'border-[#0284c7] bg-[#0284c7] text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {formatMins(mins)}
                      </button>
                    );
                  })}
                </div>

                {onlineClasses.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left dark:border-slate-700 dark:bg-slate-800/60">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <Video className="h-3.5 w-3.5 text-[#0284c7] dark:text-sky-400" />
                      Saved Online Classes (Click to Launch)
                    </p>
                    <div className="max-h-32 space-y-1.5 overflow-y-auto">
                      {onlineClasses.map((cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => onStartStrictOnlineClass(cls)}
                          className="flex w-full items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2 text-left text-xs transition hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800"
                        >
                          <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                            {cls.title} ({cls.platform})
                          </span>
                          <span className="font-mono-num shrink-0 font-bold text-[#0284c7] dark:text-sky-400">
                            {cls.start}–{cls.end} ({formatMins(computeSlotDurationMins(cls.start, cls.end))})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme-Aware Focus Timer HUD */}
          <div
            className={`relative mx-auto my-5 max-w-md overflow-hidden rounded-2xl border border-sky-400/30 bg-gradient-to-br ${theme.heroGradient} px-5 py-6 text-white shadow-inner`}
          >
            {theme.hudImage && (
              <img
                src={theme.hudImage}
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
              />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/50 to-black/70"
            />
            <div className="relative z-10">
              <div className="mb-1.5 flex items-center justify-center gap-2 text-xs font-bold tracking-wider text-sky-200 uppercase">
                {appTheme === 'airforce' ? (
                  <>
                    <IafRoundelSvg className="h-4 w-4" />
                    <FighterJetSvg
                      className={`h-4 w-4 rotate-90 text-sky-300 ${running ? 'animate-jet-cruise' : ''}`}
                    />
                  </>
                ) : appTheme === 'army' ? (
                  <Shield className="h-4 w-4 text-amber-300" />
                ) : appTheme === 'navy' ? (
                  <Anchor className="h-4 w-4 text-cyan-300" />
                ) : (
                  <GraduationCap className="h-4 w-4 text-indigo-300" />
                )}
                <span>
                  {theme.hudTitle} ({mode === 'stopwatch' ? 'Stopwatch' : theme.sessionWord})
                </span>
              </div>
              <div className="font-mono-num text-5xl font-extrabold tracking-wider text-white sm:text-6xl">
                {formatClock(displayMs)}
              </div>
              <p className="mt-2 text-xs font-medium text-sky-200">{statusText}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onToggleStartPause}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0c2340] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 whitespace-nowrap dark:bg-sky-500 dark:text-slate-950"
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
              {running ? 'Pause' : hasStarted && !isCompleted ? 'Resume' : `Start ${theme.sessionWord}`}
            </button>

            {hasStarted && (!strictMode || mode === 'stopwatch' || isCompleted) && (
              <button
                type="button"
                onClick={onFinishSave}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 whitespace-nowrap"
              >
                <Save className="h-4 w-4" />
                Finish &amp; Save
              </button>
            )}

            {(!strictMode || !running) && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            )}
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="mb-3 flex items-center gap-2">
            {appTheme === 'airforce' ? (
              <FighterJetSvg className="h-5 w-5 -rotate-12 text-[#0284c7] dark:text-sky-400" />
            ) : appTheme === 'army' ? (
              <Shield className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
            ) : appTheme === 'navy' ? (
              <Anchor className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
            ) : (
              <GraduationCap className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
            )}
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              {theme.name} Study Rules
            </h3>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              <strong className="text-slate-900 dark:text-slate-100">
                Real-Time Task Lock + Stopwatch:
              </strong>{' '}
              Jab aap 12:30–2:30 Maths slot par click karte ho, task tabhi complete hota hai jab
              ghadi ke 2:30 baj jayein ya full time ho jaye. Beech me ghar ka kaam aane par{' '}
              <strong>Pause (Kaam Aa Gaya)</strong> dabao taaki stopwatch sirf aapka{' '}
              <strong>asli padhai time</strong> ginke save kare!
            </p>
            <p>
              <strong className="text-slate-900 dark:text-slate-100">No Snooze Policy:</strong>{' '}
              Alarm bajne par koi snooze option nahi milega — cadet turant uthkar study start kare.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-slate-100">Baki App Unlocked:</strong>{' '}
              Strict task chalte waqt bhi aap GPS Running, Workout, Stopwatch, Syllabus aur Alarms
              poori tarah use kar sakte ho.
            </p>
          </div>
        </aside>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Focus Mode — Allowed Apps Only */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  focusMode.enabled
                    ? 'bg-sky-50 text-[#0c2340] dark:bg-sky-500/20 dark:text-sky-300'
                    : 'bg-slate-100 text-[#0c2340] dark:bg-slate-800 dark:text-sky-400'
                }`}
              >
                {focusMode.enabled ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Focus Mode (App Lock)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {focusMode.enabled
                    ? `Active · Keval ${focusMode.allowedPackages.length} allowed apps open honge`
                    : 'Select kiye hue apps ke alawa distraction apps block honge'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onToggleFocusMode(!focusMode.enabled && focusDuration > 0 ? focusDuration : null)
              }
              className={`min-h-[42px] shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                focusMode.enabled
                  ? 'bg-[#0284c7] text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
              }`}
            >
              {focusMode.enabled ? 'Focus ON' : 'Turn ON'}
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {durationOptions.map((opt) => {
              const active = focusDuration === opt.mins;
              return (
                <button
                  key={opt.mins}
                  type="button"
                  onClick={() => setFocusDuration(opt.mins)}
                  className={`min-h-[36px] rounded-lg border px-3 py-1 text-xs font-semibold transition whitespace-nowrap ${
                    active
                      ? 'border-[#0c2340] bg-[#0c2340] text-white dark:border-sky-500 dark:bg-sky-500 dark:text-slate-950'
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customAppName.trim()) {
                onAddCustomApp(customAppName.trim());
                setCustomAppName('');
              }
            }}
            className="mb-3 flex gap-2"
          >
            <input
              type="text"
              value={customAppName}
              onChange={(e) => setCustomAppName(e.target.value)}
              placeholder="Custom app add karein (e.g. PW App, Physics Wallah)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              className="inline-flex min-h-[42px] shrink-0 items-center gap-1 rounded-xl bg-[#0c2340] px-3.5 py-2 text-xs font-semibold text-white dark:bg-sky-500 dark:text-slate-950"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </form>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {allApps.map((app) => {
              const allowed = focusMode.allowedPackages.includes(app.id);
              return (
                <div
                  key={app.id}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 transition ${
                    allowed
                      ? 'border-[#0284c7]/45 bg-sky-50/70 dark:border-sky-400/40 dark:bg-sky-500/10'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleAllowedApp(app.id)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        allowed
                          ? 'border-[#0284c7] bg-[#0284c7] text-white dark:border-sky-400 dark:bg-sky-400 dark:text-slate-950'
                          : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900'
                      }`}
                    >
                      {allowed && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {app.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {app.category} · {allowed ? 'Allowed' : 'Blocked when Focus ON'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onTestAppLaunch(app)}
                    className="min-h-[34px] shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 whitespace-nowrap"
                  >
                    Test Open
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Study Alarm, 17 Built-in Tones (including Beep) + Custom Phone Audio File */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlarmClock className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                {theme.shortLabel} Alarm · {ALARM_TONES.length} Tones + Phone File
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onTestAlarm(selectedToneId)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <BellRing className="h-3.5 w-3.5 text-amber-500" />
              Test Alarm
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onAddReminder(
                alarmTitle.trim() || `${theme.shortLabel} Study Alarm`,
                alarmTime,
                [alarmDay],
                selectedToneId,
              );
              setAlarmTitle('');
            }}
            className="mb-4 space-y-3"
          >
            <input
              type="text"
              value={alarmTitle}
              onChange={(e) => setAlarmTitle(e.target.value)}
              placeholder="Alarm label (e.g. Morning PT + Maths PYQ)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                className="min-h-[44px] rounded-xl bg-[#0c2340] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 dark:bg-sky-500 dark:text-slate-950"
              >
                + Set Alarm
              </button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {DAY_OPTIONS.map((d) => {
                const active = alarmDay === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setAlarmDay(d)}
                    className={`min-h-[34px] shrink-0 rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                      active
                        ? 'border-[#0c2340] bg-[#0c2340] text-white dark:border-sky-500 dark:bg-sky-500 dark:text-slate-950'
                        : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {/* Custom Tone from Phone Storage Upload */}
            <div className="rounded-xl border border-dashed border-[#0284c7]/45 bg-sky-50/50 p-3 dark:border-sky-400/35 dark:bg-sky-500/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-[#0284c7] dark:text-sky-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Phone ki Audio File se Tone Lagayein
                  </span>
                </div>
                <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg bg-[#0c2340] px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-95 dark:bg-sky-500 dark:text-slate-950">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Choose Audio File</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onUploadCustomTone(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              {customAlarmTones.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  {customAlarmTones.map((ct) => {
                    const selected = selectedToneId === ct.id;
                    return (
                      <div
                        key={ct.id}
                        onClick={() => {
                          setSelectedToneId(ct.id);
                          onSelectDefaultTone(ct.id);
                        }}
                        className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-2 transition ${
                          selected
                            ? 'border-[#0284c7] bg-white dark:border-sky-400 dark:bg-slate-900'
                            : 'border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                            {ct.name}
                          </p>
                          <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                            Custom Phone Audio · {Math.max(1, Math.round(ct.sizeBytes / 1024))} KB
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedToneId(ct.id);
                              onSelectDefaultTone(ct.id);
                              onPreviewTone(ct.id);
                            }}
                            aria-label={`Preview ${ct.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0c2340] dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedToneId === ct.id) {
                                setSelectedToneId('air_raid');
                              }
                              onDeleteCustomTone(ct.id);
                            }}
                            aria-label={`Delete ${ct.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 17 Built-in Alarm Tones (including Beep-Beep & 10 New Tones) */}
            <div>
              <p className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                Select Alarm Tone ({ALARM_TONES.length} Hard &amp; Beep Tones · No Snooze):
              </p>
              <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {ALARM_TONES.map((tone) => {
                  const selected = selectedToneId === tone.id;
                  return (
                    <div
                      key={tone.id}
                      onClick={() => {
                        setSelectedToneId(tone.id);
                        onSelectDefaultTone(tone.id);
                      }}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-2.5 transition ${
                        selected
                          ? 'border-[#0284c7] bg-sky-50/80 dark:border-sky-400 dark:bg-sky-500/15'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                            {tone.name}
                          </span>
                          <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
                            {tone.intensity}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {tone.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedToneId(tone.id);
                          onSelectDefaultTone(tone.id);
                          onPreviewTone(tone.id);
                        }}
                        aria-label={`Preview ${tone.name}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0c2340] transition hover:bg-sky-50 dark:border-slate-600 dark:bg-slate-900 dark:text-sky-300"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </form>

          {/* Background & Phone-Lock Alarm Reliability Bar */}
          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <Smartphone className="h-3.5 w-3.5 text-[#0284c7] dark:text-sky-400" />
                  <span>Phone Lock / Background Alarm Alert</span>
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  App band ya phone lock par notification pane ke liye Permissions ON karein aur
                  Wake Lock / Calendar Alarm (.ics) use karein.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={onRequestNotificationPermission}
                  className="rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#0c2340] hover:bg-sky-50 dark:border-sky-500/30 dark:bg-slate-900 dark:text-sky-300"
                >
                  {typeof Notification !== 'undefined' && Notification.permission === 'granted'
                    ? 'Notifications Allowed'
                    : 'Allow Lock Notifications'}
                </button>
                <button
                  type="button"
                  onClick={onToggleWakeLock}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                    wakeLockForAlarms
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                  }`}
                >
                  {wakeLockForAlarms ? 'Screen Watch ON' : 'Keep Awake Watch'}
                </button>
              </div>
            </div>
          </div>

          {reminders.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Abhi koi alarm set nahi hai. Upar time aur hard tone chuno aur Set Alarm dabao!
            </p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {reminders.map((rem) => {
                const toneMeta = getToneMeta(rem.toneId, customAlarmTones);
                return (
                  <div
                    key={rem.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-mono-num text-lg font-extrabold ${
                          rem.enabled ? 'text-[#0c2340] dark:text-sky-400' : 'text-slate-400'
                        }`}
                      >
                        {rem.time}
                      </p>
                      <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                        {rem.title} · {rem.days.join(', ')}
                      </p>
                      <p className="truncate text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        {toneMeta.name} ({toneMeta.intensity})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onExportReminderCalendar(rem)}
                      title="Download Phone Calendar Alarm (.ics) so locked phone rings"
                      aria-label={`Export phone alarm for ${rem.title}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0284c7] transition hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-300"
                    >
                      <CalendarPlus className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleReminder(rem.id)}
                      className={`min-h-[36px] shrink-0 rounded-lg px-3 py-1 text-xs font-bold transition ${
                        rem.enabled
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                      }`}
                    >
                      {rem.enabled ? 'ON' : 'OFF'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteReminder(rem.id)}
                      aria-label={`Delete ${rem.title}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200/70 hover:text-rose-500 dark:hover:bg-slate-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
