import React, {useState} from 'react';
import {
  AlarmClock,
  BellRing,
  Check,
  Lock,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Video,
  Volume2,
} from 'lucide-react';
import {
  ALARM_TONES,
  AlarmToneId,
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
import {FighterJetSvg, IafRoundelSvg} from './FighterJetIcon';

interface TimerTabProps {
  subjects: Subject[];
  onlineClasses: OnlineClassSlot[];
  strictMode: boolean;
  activeStrictSession: StrictSession | null;
  strictRemainingMs: number;
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
  onSelectMode: (mode: TimerMode) => void;
  onSelectSubject: (id: string) => void;
  onChangeTopic: (topic: string) => void;
  onChangeOnlineClassMins: (mins: number) => void;
  onToggleStartPause: () => void;
  onFinishSave: () => void;
  onReset: () => void;
  onStartStrictOnlineClass: (cls: OnlineClassSlot) => void;
  onToggleFocusMode: (durationMins: number | null) => void;
  onToggleAllowedApp: (appId: string) => void;
  onAddCustomApp: (name: string) => void;
  onTestAppLaunch: (app: FocusAppItem) => void;
  onSelectDefaultTone: (toneId: AlarmToneId) => void;
  onPreviewTone: (toneId: AlarmToneId) => void;
  onAddReminder: (title: string, time: string, days: string[], toneId: AlarmToneId) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onTestAlarm: (toneId: AlarmToneId) => void;
}

const DAY_OPTIONS = ['Daily', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TimerTab: React.FC<TimerTabProps> = ({
  subjects,
  onlineClasses,
  strictMode,
  activeStrictSession,
  strictRemainingMs,
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
  onSelectMode,
  onSelectSubject,
  onChangeTopic,
  onChangeOnlineClassMins,
  onToggleStartPause,
  onFinishSave,
  onReset,
  onStartStrictOnlineClass,
  onToggleFocusMode,
  onToggleAllowedApp,
  onAddCustomApp,
  onTestAppLaunch,
  onSelectDefaultTone,
  onPreviewTone,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onTestAlarm,
}) => {
  const [focusDuration, setFocusDuration] = useState<number>(0);
  const [customAppName, setCustomAppName] = useState('');

  const [alarmTitle, setAlarmTitle] = useState('');
  const [alarmTime, setAlarmTime] = useState('06:00');
  const [alarmDay, setAlarmDay] = useState('Daily');
  const [selectedToneId, setSelectedToneId] = useState<AlarmToneId>(defaultAlarmTone);

  const allApps = [...customApps, ...PRESET_PHONE_APPS];

  const modeOptions: Array<{id: TimerMode; label: string}> = [
    {id: 'stopwatch', label: 'Stopwatch'},
    {id: 'pomo25', label: 'Sortie 25m'},
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
    ? 'Sortie Complete! Finish & Save dabao.'
    : running
      ? mode === 'online_class'
        ? 'Online Class Sortie ON... Full Focus!'
        : 'Cockpit Focus ON... Touch the Sky Pilot!'
      : hasStarted
        ? 'Holding Pattern (Paused). Resume ya Save karo.'
        : mode === 'online_class'
          ? 'Online Class select karo ya duration chuno.'
          : 'Ready for Takeoff! Start dabao.';

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

  return (
    <div className="space-y-5">
      {/* Study Timer & NDA Rule */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-[#0f1b2d]">
          {activeStrictSession ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                <ShieldAlert className="h-4 w-4" />
                <span>
                  STRICT LOCK ACTIVE ·{' '}
                  {activeStrictSession.taskKind === 'online_class'
                    ? 'Online Class Timer'
                    : 'Study Task Lock'}
                </span>
              </div>

              <div>
                <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {activeStrictSession.title}
                </h3>
                {activeStrictSession.startClock && activeStrictSession.endClock && (
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Slot: {activeStrictSession.startClock} – {activeStrictSession.endClock} · Pura
                    hone ke baad hi complete hoga
                  </p>
                )}
              </div>

              {/* Indian Air Force Stratosphere HUD Frame for Countdown */}
              <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-sky-400/35 bg-gradient-to-br from-[#08101c] to-[#0c2340] p-6 text-white shadow-inner">
                <img
                  src="/src/assets/images/iaf_stratosphere_night_1795071299650.jpg"
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
                />
                <div className="relative z-10">
                  <div className="mb-2 flex items-center justify-center gap-2 text-xs font-bold tracking-wide text-sky-300 uppercase">
                    <IafRoundelSvg className="h-4 w-4" />
                    <FighterJetSvg className="animate-jet-cruise h-4 w-4 rotate-90 text-sky-300" />
                    <span>IAF Cockpit Lock Active</span>
                  </div>
                  <div className="font-mono-num text-5xl font-extrabold tracking-wider text-white sm:text-6xl">
                    {formatCountdownClock(strictRemainingMs)}
                  </div>
                </div>
              </div>

              <div className="mx-auto max-w-md space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Sortie Progress</span>
                  <span className="font-mono-num text-[#0284c7] dark:text-sky-400">
                    {strictProgressPct}%
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0c2340] via-[#0284c7] to-emerald-500 transition-all duration-300"
                    style={{width: `${strictProgressPct}%`}}
                  />
                </div>
              </div>

              <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <Lock className="mr-1.5 inline h-3.5 w-3.5" />
                Strict Mode ON hai: Jab tak timer 00:00:00 na ho jaye tab tak Pause, Reset, ya
                Manual Complete locked hai!
              </div>
            </div>
          ) : (
            <>
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

              {/* Indian Air Force Stratosphere Cockpit HUD */}
              <div className="relative mx-auto my-5 max-w-md overflow-hidden rounded-2xl border border-sky-400/30 bg-gradient-to-br from-[#08101c] via-[#0c2340] to-[#08101c] px-5 py-6 text-white shadow-inner">
                <img
                  src="/src/assets/images/iaf_stratosphere_night_1795071299650.jpg"
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-b from-[#08101c]/55 via-[#08101c]/70 to-[#08101c]/85"
                />
                <div className="relative z-10">
                  <div className="mb-1.5 flex items-center justify-center gap-2 text-xs font-bold tracking-wider text-sky-300 uppercase">
                    <IafRoundelSvg className="h-4 w-4" />
                    <FighterJetSvg
                      className={`h-4 w-4 rotate-90 text-sky-300 ${running ? 'animate-jet-cruise' : ''}`}
                    />
                    <span>IAF Focus Cockpit</span>
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
                  {running ? 'Pause' : hasStarted && !isCompleted ? 'Resume' : 'Start Sortie'}
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
            </>
          )}
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="mb-3 flex items-center gap-2">
            <FighterJetSvg className="h-5 w-5 -rotate-12 text-[#0284c7] dark:text-sky-400" />
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Indian Air Force Squadron Rules
            </h3>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              <strong className="text-slate-900 dark:text-slate-100">Zero-Cheat Strict Lock:</strong>{' '}
              Jab aap koi timetable slot (e.g. 12:30–14:30 Maths) ya online class launch karte ho,
              mission tabhi complete hota hai jab full timer pura ho jaye.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-slate-100">No Snooze Policy:</strong>{' '}
              Alarm bajne par koi snooze option nahi milega — cadet turant uthkar study start kare.
            </p>
            <p>
              <strong className="text-slate-900 dark:text-slate-100">NDA Flying Speed Rule:</strong>{' '}
              NDA Maths me 120 sawal 150 minute me karne hote hain — roz timer lagakar solve karo.
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

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
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

        {/* Study Alarm & 6 Hard Military / Air Force Tones (No Snooze) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlarmClock className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Air Force Alarm &amp; 6 Hard Tones
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
                alarmTitle.trim() || 'Air Force Padhai Alarm',
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

            {/* 6 Hard Army & Air Force Tone Picker */}
            <div>
              <p className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                Select Military / Air Force Hard Tone (No Snooze):
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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

          {reminders.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Abhi koi alarm set nahi hai. Upar time aur hard tone chuno aur Set Alarm dabao!
            </p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {reminders.map((rem) => {
                const toneMeta = getToneMeta(rem.toneId);
                return (
                  <div
                    key={rem.id}
                    className="flex items-center justify-between gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60"
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
