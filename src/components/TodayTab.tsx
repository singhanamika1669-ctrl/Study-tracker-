import React, {useState} from 'react';
import {
  BookOpen,
  Calculator,
  Check,
  Dumbbell,
  ExternalLink,
  Footprints,
  Lock,
  Newspaper,
  Pencil,
  Play,
  Plus,
  ShieldAlert,
  Trash2,
  Video,
} from 'lucide-react';
import {
  AppTab,
  DailyHabits,
  OnlineClassSlot,
  PadhaiState,
  Subject,
  TimetableSlot,
  TodoItem,
  WEEKDAYS,
  computeSlotDurationMins,
  formatCountdownClock,
  formatMins,
  getLocalDateStr,
} from '../types';
import {FighterJetSvg, IafRoundelSvg} from './FighterJetIcon';

interface TodayTabProps {
  state: PadhaiState;
  strictRemainingMs: number;
  onSwitchTab: (tab: AppTab) => void;
  onUpdateGoal: (hours: number) => void;
  onToggleHabit: (key: keyof Pick<DailyHabits, 'ptDone' | 'vocabDone' | 'caDone' | 'pyqDone'>) => void;
  onSavePt: (runKm: number, pushups: number) => void;
  onToggleSlot: (slot: TimetableSlot) => void;
  onStartStrictSlot: (slot: TimetableSlot) => void;
  onToggleOnlineClass: (cls: OnlineClassSlot) => void;
  onStartStrictOnlineClass: (cls: OnlineClassSlot) => void;
  onAddTodo: (text: string, requiredMins?: number) => void;
  onToggleTodo: (todo: TodoItem) => void;
  onStartStrictTodo: (todo: TodoItem) => void;
  onDeleteTodo: (id: string) => void;
  onSaveQuickLog: (subjectId: string, mins: number, topic: string, focus: number) => void;
  onSaveNote: (note: string) => void;
}

export const TodayTab: React.FC<TodayTabProps> = ({
  state,
  strictRemainingMs,
  onSwitchTab,
  onUpdateGoal,
  onToggleHabit,
  onSavePt,
  onToggleSlot,
  onStartStrictSlot,
  onToggleOnlineClass,
  onStartStrictOnlineClass,
  onAddTodo,
  onToggleTodo,
  onStartStrictTodo,
  onDeleteTodo,
  onSaveQuickLog,
  onSaveNote,
}) => {
  const todayStr = getLocalDateStr();
  const todayDay = WEEKDAYS[new Date().getDay()];

  const todayLogs = state.logs.filter((l) => l.date === todayStr);
  const todayMins = todayLogs.reduce((sum, l) => sum + Number(l.mins), 0);
  const goalMins = (state.dailyGoalHours || 6) * 60;
  const pct = Math.min(100, Math.round((todayMins / goalMins) * 100));

  const todaySlots = state.timetable
    .filter((t) => t.day === 'Daily' || t.day === todayDay)
    .sort((a, b) => a.start.localeCompare(b.start));
  const completedSlots = state.completedSlots[todayStr] || [];
  const doneSlotCount = todaySlots.filter((t) => completedSlots.includes(t.id)).length;

  const todayClasses = state.onlineClasses
    .filter((c) => c.day === 'Daily' || c.day === todayDay)
    .sort((a, b) => a.start.localeCompare(b.start));
  const completedClasses = state.completedClasses[todayStr] || [];
  const doneClassCount = todayClasses.filter((c) => completedClasses.includes(c.id)).length;

  const todos = state.todos[todayStr] || [];
  const doneTodos = todos.filter((t) => t.done).length;

  const habits = state.ndaHabits[todayStr] || {
    ptDone: false,
    vocabDone: false,
    caDone: false,
    pyqDone: false,
    runKm: 0,
    pushups: 0,
  };
  const doneHabits = [habits.ptDone, habits.vocabDone, habits.caDone, habits.pyqDone].filter(
    Boolean,
  ).length;

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(state.dailyGoalHours));
  const [runKmInput, setRunKmInput] = useState(habits.runKm ? String(habits.runKm) : '');
  const [pushupsInput, setPushupsInput] = useState(
    habits.pushups ? String(habits.pushups) : '',
  );
  const [todoText, setTodoText] = useState('');
  const [todoDurationMins, setTodoDurationMins] = useState<number>(state.strictMode ? 60 : 0);

  const [quickSub, setQuickSub] = useState(state.subjects[0]?.id || '');
  const [quickMins, setQuickMins] = useState('');
  const [quickTopic, setQuickTopic] = useState('');
  const [quickFocus, setQuickFocus] = useState(4);
  const [noteDraft, setNoteDraft] = useState(state.notes[todayStr] || '');

  const getSubject = (id: string): Subject =>
    state.subjects.find((s) => s.id === id) || {
      id: 'general',
      name: 'General',
      totalChapters: 1,
      doneChapters: 0,
      color: '#64748b',
    };

  const diffDays = state.examDate
    ? Math.ceil(
        (new Date(`${state.examDate}T00:00:00`).getTime() -
          new Date(`${todayStr}T00:00:00`).getTime()) /
          86_400_000,
      )
    : null;

  const countdownText =
    state.examName && state.examDate && diffDays !== null
      ? diffDays > 0
        ? `${diffDays} din baaki hain · Touch the Sky with Glory`
        : diffDays === 0
          ? 'Aaj Exam Day hai · Best of luck Future Pilot!'
          : 'Target date complete'
      : 'Goal dabake apni exam date set karo';

  const habitItems: Array<{
    key: keyof Pick<DailyHabits, 'ptDone' | 'vocabDone' | 'caDone' | 'pyqDone'>;
    label: string;
    icon: React.ReactNode;
    active: boolean;
  }> = [
    {key: 'ptDone', label: 'Morning PT', icon: <Footprints className="h-4 w-4" />, active: habits.ptDone},
    {key: 'vocabDone', label: '10 Vocab Words', icon: <BookOpen className="h-4 w-4" />, active: habits.vocabDone},
    {key: 'caDone', label: 'Current Affairs', icon: <Newspaper className="h-4 w-4" />, active: habits.caDone},
    {key: 'pyqDone', label: '20+ Maths PYQ', icon: <Calculator className="h-4 w-4" />, active: habits.pyqDone},
  ];

  const activeStrict = state.activeStrictSession;

  return (
    <div className="space-y-5">
      {/* Indian Air Force Hero Mission Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-sky-400/25 bg-gradient-to-br from-[#08101c] via-[#0c2340] to-[#0284c7] text-white shadow-md">
        <div
          aria-hidden="true"
          className="relative z-20 h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]"
        />
        <img
          src="/src/assets/images/iaf_tejas_himalayas_1795071299389.jpg"
          alt="Indian Air Force HAL Tejas fighter jets flying over Himalayas"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#08101c]/92 via-[#0c2340]/76 to-[#08101c]/40"
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <img
              src="/src/assets/images/iaf_squadron_crest_1795071260293.jpg"
              alt="Indian Air Force Aviator Wings Emblem"
              referrerPolicy="no-referrer"
              className="hidden h-14 w-14 shrink-0 rounded-xl border border-sky-400/40 object-cover shadow-sm sm:block"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <IafRoundelSvg className="h-4 w-4 shrink-0" />
                <p className="text-xs font-semibold text-sky-300">
                  Jai Hind, Future Indian Air Force Officer!
                </p>
                {state.strictMode && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                    <ShieldAlert className="h-3 w-3" />
                    Strict Mode ON
                  </span>
                )}
              </div>
              <h2 className="font-display mt-0.5 text-xl font-extrabold tracking-tight text-balance sm:text-2xl">
                {state.examName || 'NDA Air Force Flying + 11th Board'}
              </h2>
              <p className="mt-1 text-sm text-slate-200">{countdownText}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSwitchTab('stats')}
            className="min-h-[44px] shrink-0 rounded-xl border border-sky-300/35 bg-[#0c2340]/75 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-sky-500 hover:text-slate-950 whitespace-nowrap"
          >
            Edit Goal
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Daily Sortie Progress */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FighterJetSvg className="h-4 w-4 rotate-90 text-[#0284c7] dark:text-sky-400" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Aaj ki Sortie (Study Progress)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGoalDraft(String(state.dailyGoalHours));
                  setEditingGoal((prev) => !prev);
                }}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                <Pencil className="h-3.5 w-3.5" />
                Target: {state.dailyGoalHours}h
              </button>
            </div>

            {editingGoal && (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/70">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="20"
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Hours (e.g. 6)"
                />
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseFloat(goalDraft);
                    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 20) {
                      onUpdateGoal(parsed);
                      setEditingGoal(false);
                    }
                  }}
                  className="min-h-[40px] shrink-0 rounded-lg bg-[#0c2340] px-4 py-2 text-xs font-semibold text-white hover:opacity-95 dark:bg-sky-500 dark:text-slate-950"
                >
                  Save
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                <span className="font-mono-num font-semibold text-slate-800 dark:text-slate-200">
                  {formatMins(todayMins)}
                </span>{' '}
                completed
              </span>
              <span className="font-mono-num font-bold text-[#0284c7] dark:text-sky-400">
                {pct}%
              </span>
            </div>

            {/* Runway progress bar with Fighter Jet icon tracking flight */}
            <div className="relative my-3 flex items-center">
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0c2340] via-[#0284c7] to-emerald-500 transition-all duration-300"
                  style={{width: `${pct}%`}}
                />
              </div>
              <div
                className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-0.5 shadow-sm ring-1 ring-sky-400/50 transition-all duration-300 dark:bg-[#0c2340]"
                style={{left: `${Math.max(4, Math.min(96, pct))}%`}}
              >
                <FighterJetSvg className="h-3.5 w-3.5 rotate-90 text-[#0c2340] dark:text-sky-300" />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                <strong className="font-mono-num block text-base font-bold text-[#0c2340] dark:text-sky-400">
                  {todayLogs.length}
                </strong>
                <span className="text-xs text-slate-500 dark:text-slate-400">Sorties</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                <strong className="font-mono-num block text-base font-bold text-[#0c2340] dark:text-sky-400">
                  {doneSlotCount}/{todaySlots.length}
                </strong>
                <span className="text-xs text-slate-500 dark:text-slate-400">Timetable</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                <strong className="font-mono-num block text-base font-bold text-[#0c2340] dark:text-sky-400">
                  {doneClassCount}/{todayClasses.length}
                </strong>
                <span className="text-xs text-slate-500 dark:text-slate-400">Classes</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                <strong className="font-mono-num block text-base font-bold text-[#0c2340] dark:text-sky-400">
                  {doneTodos}/{todos.length}
                </strong>
                <span className="text-xs text-slate-500 dark:text-slate-400">Targets</span>
              </div>
            </div>
          </section>

          {/* Online Classes Today */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Aaj ki Online Classes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSwitchTab('timetable')}
                className="min-h-[38px] rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                + Class Timetable
              </button>
            </div>

            {todayClasses.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Aaj ke liye koi online class add nahi hai.
              </p>
            ) : (
              <div className="space-y-2.5">
                {todayClasses.map((cls) => {
                  const sub = getSubject(cls.subjectId);
                  const isDone = completedClasses.includes(cls.id);
                  const isRunningThis =
                    activeStrict?.taskKind === 'online_class' && activeStrict.taskId === cls.id;
                  const durationMins = computeSlotDurationMins(cls.start, cls.end);

                  return (
                    <div
                      key={cls.id}
                      onClick={() => {
                        if (!isDone) onStartStrictOnlineClass(cls);
                      }}
                      className={`flex cursor-pointer items-center justify-between gap-2.5 rounded-xl border p-3 transition ${
                        isRunningThis
                          ? 'border-[#0284c7] bg-sky-50/70 dark:border-sky-400 dark:bg-sky-500/10'
                          : isDone
                            ? 'border-transparent bg-slate-50 opacity-65 dark:bg-slate-800/60'
                            : 'border-slate-200/70 bg-slate-50 hover:border-[#0284c7]/50 dark:border-slate-700/60 dark:bg-slate-800/60'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleOnlineClass(cls);
                        }}
                        aria-label={`Status for ${cls.title}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition ${
                            isDone
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : state.strictMode
                                ? 'border-amber-600 bg-amber-50 text-amber-700 dark:border-amber-400 dark:bg-amber-500/10 dark:text-amber-300'
                                : 'border-[#0284c7] dark:border-sky-400'
                          }`}
                        >
                          {isDone ? (
                            <Check className="h-4 w-4" />
                          ) : state.strictMode ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : null}
                        </span>
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{backgroundColor: isDone ? '#10b981' : sub.color}}
                          />
                          <p
                            className={`truncate text-sm font-semibold text-slate-900 dark:text-slate-100 ${
                              isDone ? 'line-through' : ''
                            }`}
                          >
                            {cls.title}
                          </p>
                          <span className="rounded bg-[#0284c7]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#0284c7] dark:bg-sky-400/15 dark:text-sky-300">
                            {cls.platform || 'Online'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {cls.start} – {cls.end} ({formatMins(durationMins)}) · {sub.name}
                        </p>
                        {isRunningThis && (
                          <p className="font-mono-num mt-1 text-xs font-bold text-[#0284c7] dark:text-sky-400">
                            Class Timer Chal Raha Hai · {formatCountdownClock(strictRemainingMs)} left
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {cls.meetingUrl && (
                          <a
                            href={cls.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Open class link"
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {!isDone && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartStrictOnlineClass(cls);
                            }}
                            aria-label={`Start class timer for ${cls.title}`}
                            className="flex h-10 items-center gap-1 rounded-lg bg-[#0c2340] px-3 text-xs font-bold text-white transition hover:opacity-95 dark:bg-sky-500 dark:text-slate-950"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>{isRunningThis ? 'Live' : 'Start'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* NDA Routine & PT Fitness */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                NDA Air Force Routine &amp; PT
              </h3>
              <span className="font-mono-num text-xs font-semibold text-slate-500 dark:text-slate-400">
                {doneHabits}/4 Done
              </span>
            </div>

            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {habitItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onToggleHabit(item.key)}
                  className={`flex min-h-[44px] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                    item.active
                      ? 'border-[#0284c7] bg-sky-50 text-[#0c2340] dark:border-sky-400/60 dark:bg-sky-500/15 dark:text-sky-200'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2.5 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end dark:bg-slate-800/60">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Running (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={runKmInput}
                  onChange={(e) => setRunKmInput(e.target.value)}
                  placeholder="2.4"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Push-ups
                </label>
                <input
                  type="number"
                  min="0"
                  value={pushupsInput}
                  onChange={(e) => setPushupsInput(e.target.value)}
                  placeholder="30"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  onSavePt(parseFloat(runKmInput) || 0, parseInt(pushupsInput, 10) || 0)
                }
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#0c2340] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 whitespace-nowrap dark:bg-sky-500 dark:text-slate-950"
              >
                <Dumbbell className="h-4 w-4" />
                Save PT
              </button>
            </div>
          </section>

          {/* Quick Study Log */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <h3 className="font-display mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
              Quick Sortie Log
            </h3>
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <select
                  value={quickSub}
                  onChange={(e) => setQuickSub(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {state.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={quickMins}
                  onChange={(e) => setQuickMins(e.target.value)}
                  placeholder="Minutes (e.g. 45)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <input
                type="text"
                value={quickTopic}
                onChange={(e) => setQuickTopic(e.target.value)}
                placeholder="Chapter / Topic kya padha?"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_auto]">
                <select
                  value={quickFocus}
                  onChange={(e) => setQuickFocus(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value={5}>Focus: 5/5 (Fighter Pilot Level)</option>
                  <option value={4}>Focus: 4/5 (Accha)</option>
                  <option value={3}>Focus: 3/5 (Theek-thaak)</option>
                  <option value={2}>Focus: 2/5 (Distracted)</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const mins = parseInt(quickMins, 10);
                    onSaveQuickLog(quickSub, mins, quickTopic, quickFocus);
                    if (mins > 0) {
                      setQuickMins('');
                      setQuickTopic('');
                    }
                  }}
                  className="min-h-[44px] rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 whitespace-nowrap"
                >
                  + Save Study
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Today's Timetable (Strict Task Lock enabled) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Aaj ka Flight Plan (Timetable)
              </h3>
              <button
                type="button"
                onClick={() => onSwitchTab('timetable')}
                className="min-h-[38px] rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                + Manage
              </button>
            </div>
            {state.strictMode && (
              <p className="mb-3 text-xs font-medium text-amber-700 dark:text-amber-300">
                Strict Rule: Kisi bhi mission par click karte hi timer shuru hoga — pura time
                complete hone par hi task Done hoga.
              </p>
            )}

            {todaySlots.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Aaj ke liye koi timetable slot nahi hai.
              </p>
            ) : (
              <div className="space-y-2">
                {todaySlots.map((slot) => {
                  const sub = getSubject(slot.subjectId);
                  const isDone = completedSlots.includes(slot.id);
                  const isRunningThis =
                    activeStrict?.taskKind === 'slot' && activeStrict.taskId === slot.id;
                  const durationMins = computeSlotDurationMins(slot.start, slot.end);

                  return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        if (!isDone) onStartStrictSlot(slot);
                      }}
                      className={`flex cursor-pointer items-center justify-between gap-2.5 rounded-xl border p-3 transition ${
                        isRunningThis
                          ? 'border-[#0284c7] bg-sky-50/70 dark:border-sky-400 dark:bg-sky-500/10'
                          : isDone
                            ? 'border-transparent bg-slate-50 opacity-65 dark:bg-slate-800/60'
                            : 'border-slate-200/70 bg-slate-50 hover:border-[#0284c7]/50 dark:border-slate-700/60 dark:bg-slate-800/60'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSlot(slot);
                        }}
                        aria-label={`Status for ${sub.name}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition ${
                            isDone
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : state.strictMode
                                ? 'border-amber-600 bg-amber-50 text-amber-700 dark:border-amber-400 dark:bg-amber-500/10 dark:text-amber-300'
                                : 'border-[#0284c7] dark:border-sky-400'
                          }`}
                        >
                          {isDone ? (
                            <Check className="h-4 w-4" />
                          ) : state.strictMode ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : null}
                        </span>
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{backgroundColor: isDone ? '#10b981' : sub.color}}
                          />
                          <p
                            className={`truncate text-sm font-semibold text-slate-900 dark:text-slate-100 ${
                              isDone ? 'line-through' : ''
                            }`}
                          >
                            {sub.name} — {slot.task || 'Study'}
                          </p>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {slot.start} – {slot.end} ({formatMins(durationMins)}) · {slot.day}
                        </p>
                        {isRunningThis && (
                          <p className="font-mono-num mt-1 text-xs font-bold text-[#0284c7] dark:text-sky-400">
                            Locked Timer ON · {formatCountdownClock(strictRemainingMs)} remaining
                          </p>
                        )}
                      </div>

                      {!isDone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartStrictSlot(slot);
                          }}
                          aria-label={`Start strict timer for ${sub.name}`}
                          className="flex h-10 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#0c2340] transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-800"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>{isRunningThis ? 'Live' : 'Launch'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Daily To-Do List */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <h3 className="font-display mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
              Aaj ke Mission Targets (11th + NDA)
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (todoText.trim()) {
                  onAddTodo(todoText.trim(), todoDurationMins > 0 ? todoDurationMins : undefined);
                  setTodoText('');
                }
              }}
              className="mb-3 space-y-2"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={todoText}
                  onChange={(e) => setTodoText(e.target.value)}
                  placeholder="Trigonometry ke 30 sawal + Hindi lesson 1"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-xl bg-[#0c2340] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 whitespace-nowrap dark:bg-sky-500 dark:text-slate-950"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Timer Lock:</span>
                {[0, 30, 60, 90, 120].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTodoDurationMins(m)}
                    className={`rounded-lg border px-2.5 py-1 font-semibold transition ${
                      todoDurationMins === m
                        ? 'border-[#0c2340] bg-[#0c2340] text-white dark:border-sky-500 dark:bg-sky-500 dark:text-slate-950'
                        : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {m === 0 ? 'Free' : formatMins(m)}
                  </button>
                ))}
              </div>
            </form>

            {todos.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Aaj ke targets add karo (e.g. Sets Ex 1.2 + 20 PYQs).
              </p>
            ) : (
              <div className="space-y-2">
                {todos.map((todo) => {
                  const hasTimer = Boolean(todo.requiredMins && todo.requiredMins > 0);
                  const isRunningThis =
                    activeStrict?.taskKind === 'todo' && activeStrict.taskId === todo.id;

                  return (
                    <div
                      key={todo.id}
                      onClick={() => {
                        if (!todo.done && hasTimer) onStartStrictTodo(todo);
                      }}
                      className={`flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-800/60 ${
                        hasTimer && !todo.done ? 'cursor-pointer' : ''
                      } ${todo.done ? 'opacity-60' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTodo(todo);
                        }}
                        aria-label={`Toggle ${todo.text}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition ${
                            todo.done
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : state.strictMode && hasTimer
                                ? 'border-amber-600 bg-amber-50 text-amber-700 dark:border-amber-400 dark:bg-amber-500/10 dark:text-amber-300'
                                : 'border-[#0284c7] dark:border-sky-400'
                          }`}
                        >
                          {todo.done ? (
                            <Check className="h-4 w-4" />
                          ) : state.strictMode && hasTimer ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : null}
                        </span>
                      </button>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`block break-words text-sm font-medium text-slate-800 dark:text-slate-200 ${
                            todo.done ? 'line-through' : ''
                          }`}
                        >
                          {todo.text}
                        </span>
                        {hasTimer && (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {isRunningThis
                              ? `Timer ON · ${formatCountdownClock(strictRemainingMs)} left`
                              : `Required: ${formatMins(todo.requiredMins!)}`}
                          </span>
                        )}
                      </div>

                      {hasTimer && !todo.done && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartStrictTodo(todo);
                          }}
                          className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-[#0c2340] dark:border-slate-700 dark:bg-slate-900 dark:text-sky-300"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Launch</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTodo(todo.id);
                        }}
                        aria-label={`Delete ${todo.text}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200/70 hover:text-rose-500 dark:hover:bg-slate-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Daily Review Note */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Flight Debrief &amp; Weak Topics
              </h3>
              <button
                type="button"
                onClick={() => onSaveNote(noteDraft)}
                className="min-h-[38px] rounded-lg bg-[#0c2340] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-95 whitespace-nowrap dark:bg-sky-500 dark:text-slate-950"
              >
                Save Note
              </button>
            </div>
            <textarea
              rows={3}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Aaj kaunsa topic strong hua? Kal Maths ya GAT me kya revise karna hai?"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </section>
        </div>
      </div>
    </div>
  );
};
