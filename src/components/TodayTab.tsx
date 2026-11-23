import React, {useEffect, useState} from 'react';
import {
  Anchor,
  BarChart3,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  ExternalLink,
  Footprints,
  GraduationCap,
  ListChecks,
  Lock,
  Newspaper,
  Pause,
  Pencil,
  Play,
  Plus,
  Shield,
  ShieldAlert,
  Sparkles,
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
  formatClock,
  formatCountdownClock,
  formatMins,
  getLocalDateStr,
} from '../types';
import {getThemeMeta, getTrackDisplayLabel, trackIncludesNda} from '../utils/themeConfig';
import {FighterJetSvg, IafRoundelSvg} from './FighterJetIcon';

interface TodayTabProps {
  state: PadhaiState;
  strictRemainingMs: number;
  strictStudiedMs: number;
  onSwitchTab: (tab: AppTab) => void;
  onUpdateGoal: (hours: number) => void;
  onToggleHabit: (key: keyof Pick<DailyHabits, 'ptDone' | 'vocabDone' | 'caDone' | 'pyqDone'>) => void;
  onSavePt: (runKm: number, pushups: number) => void;
  onToggleSlot: (slot: TimetableSlot) => void;
  onStartStrictSlot: (slot: TimetableSlot) => void;
  onToggleOnlineClass: (cls: OnlineClassSlot) => void;
  onStartStrictOnlineClass: (cls: OnlineClassSlot) => void;
  onToggleStrictPause: () => void;
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
  strictStudiedMs,
  onSwitchTab,
  onUpdateGoal,
  onToggleHabit,
  onSavePt,
  onToggleSlot,
  onStartStrictSlot,
  onToggleOnlineClass,
  onStartStrictOnlineClass,
  onToggleStrictPause,
  onAddTodo,
  onToggleTodo,
  onStartStrictTodo,
  onDeleteTodo,
  onSaveQuickLog,
  onSaveNote,
}) => {
  const todayStr = getLocalDateStr();
  const todayDay = WEEKDAYS[new Date().getDay()];
  const theme = getThemeMeta(state.appTheme);
  const includesNda = trackIncludesNda(state.studyTrack);
  const trackLabel = getTrackDisplayLabel(state.studentClass, state.studyTrack, state.boardMedium);
  const isHindi = state.boardMedium === 'up_hindi';

  const todayLogs = state.logs.filter((l) => l.date === todayStr);
  const todayMins = todayLogs.reduce((sum, l) => sum + Number(l.mins), 0);
  const goalMins = (state.dailyGoalHours || 6) * 60;
  const pct = Math.min(100, Math.round((todayMins / goalMins) * 100));

  const todaySlots = state.timetable
    .filter((t) => t.day === 'Daily' || t.day === todayDay)
    .sort((a, b) => a.start.localeCompare(b.start));
  const completedSlots = state.completedSlots[todayStr] || [];
  const pendingSlots = todaySlots.filter((t) => !completedSlots.includes(t.id));
  const doneSlotCount = todaySlots.length - pendingSlots.length;

  const todayClasses = state.onlineClasses
    .filter((c) => c.day === 'Daily' || c.day === todayDay)
    .sort((a, b) => a.start.localeCompare(b.start));
  const completedClasses = state.completedClasses[todayStr] || [];
  const pendingClasses = todayClasses.filter((c) => !completedClasses.includes(c.id));
  const doneClassCount = todayClasses.length - pendingClasses.length;

  const todos = state.todos[todayStr] || [];
  const pendingTodos = todos.filter((t) => !t.done);
  const doneTodos = todos.length - pendingTodos.length;
  const totalRemainingCount = pendingSlots.length + pendingClasses.length + pendingTodos.length;

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

  useEffect(() => {
    if (state.subjects.length > 0 && !state.subjects.some((s) => s.id === quickSub)) {
      setQuickSub(state.subjects[0].id);
    }
  }, [state.subjects, quickSub]);

  useEffect(() => {
    setNoteDraft(state.notes[todayStr] || '');
  }, [todayStr, state.notes]);

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
        ? `${diffDays} din baaki hain · ${theme.tagline}`
        : diffDays === 0
          ? 'Aaj Exam Day hai · Best of luck Champion!'
          : 'Target date complete'
      : theme.tagline;

  const habitItems: Array<{
    key: keyof Pick<DailyHabits, 'ptDone' | 'vocabDone' | 'caDone' | 'pyqDone'>;
    label: string;
    icon: React.ReactNode;
    active: boolean;
  }> = includesNda
    ? [
        {key: 'ptDone', label: 'Morning PT', icon: <Footprints className="h-4 w-4" />, active: habits.ptDone},
        {key: 'vocabDone', label: '10 Vocab Words', icon: <BookOpen className="h-4 w-4" />, active: habits.vocabDone},
        {key: 'caDone', label: 'Current Affairs', icon: <Newspaper className="h-4 w-4" />, active: habits.caDone},
        {key: 'pyqDone', label: '20+ Maths PYQ', icon: <Calculator className="h-4 w-4" />, active: habits.pyqDone},
      ]
    : [
        {key: 'ptDone', label: isHindi ? 'NCERT Reading' : 'NCERT Reading', icon: <BookOpen className="h-4 w-4" />, active: habits.ptDone},
        {key: 'vocabDone', label: isHindi ? 'Notes Revision' : 'Notes Revision', icon: <GraduationCap className="h-4 w-4" />, active: habits.vocabDone},
        {key: 'caDone', label: isHindi ? 'Homework / Writing' : 'Homework / Writing', icon: <Newspaper className="h-4 w-4" />, active: habits.caDone},
        {key: 'pyqDone', label: isHindi ? 'Board Sample Paper' : 'Sample Paper PYQ', icon: <Calculator className="h-4 w-4" />, active: habits.pyqDone},
      ];

  const activeStrict = state.activeStrictSession;
  const isStrictPaused = Boolean(activeStrict && activeStrict.activeSegmentStartedAtMs === null);

  const initials = (state.studentName || 'AS')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className="space-y-5">
      {/* Theme & Student Hero Banner (Compact Mobile Height) */}
      <section
        className={`relative overflow-hidden rounded-2xl border border-slate-700/30 bg-gradient-to-br ${theme.heroGradient} text-white shadow-md`}
      >
        {theme.showTricolour && (
          <div
            aria-hidden="true"
            className="relative z-20 h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]"
          />
        )}
        {theme.heroImage && (
          <>
            <img
              src={theme.heroImage}
              alt={theme.heroAlt}
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-[#08101c]/92 via-[#0c2340]/78 to-[#08101c]/45"
            />
          </>
        )}

        <div className="relative z-10 flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {state.studentPhotoDataUrl ? (
              <img
                src={state.studentPhotoDataUrl}
                alt={state.studentName}
                className="h-11 w-11 shrink-0 rounded-xl border-2 border-white/45 object-cover shadow-md sm:h-12 sm:w-12"
              />
            ) : (
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/30 text-sm font-extrabold text-white shadow-md sm:h-12 sm:w-12 sm:text-base"
                style={{backgroundColor: theme.accentHex}}
              >
                {initials || 'ST'}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {state.appTheme === 'airforce' && <IafRoundelSvg className="h-3.5 w-3.5 shrink-0" />}
                <p className="truncate text-[11px] font-semibold text-sky-200 sm:text-xs">
                  {state.appTheme === 'default'
                    ? `Namaste, ${state.studentName}!`
                    : `Jai Hind, ${state.studentName} · ${theme.shortLabel}`}
                </p>
                {state.strictMode && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-500/25 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
                    <ShieldAlert className="h-2.5 w-2.5" />
                    Strict
                  </span>
                )}
              </div>
              <h2 className="font-display truncate text-base font-extrabold tracking-tight sm:text-xl">
                {state.examName || trackLabel}
              </h2>
              <p className="truncate text-[11px] text-slate-200/90 sm:text-xs">
                {diffDays !== null && diffDays > 0 ? `${diffDays} din baaki · ` : ''}
                {trackLabel}
                <span className="hidden sm:inline"> · {countdownText}</span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onSwitchTab('buddy')}
              className="inline-flex min-h-[34px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-[11px] font-extrabold text-slate-950 transition hover:bg-amber-300 whitespace-nowrap sm:min-h-[38px] sm:flex-none sm:rounded-xl sm:px-3.5 sm:text-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Smart Buddy
            </button>
            <button
              type="button"
              onClick={() => onSwitchTab('stats')}
              className="min-h-[34px] flex-1 shrink-0 rounded-lg border border-white/30 bg-black/35 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm transition hover:bg-white/20 whitespace-nowrap sm:min-h-[38px] sm:flex-none sm:rounded-xl sm:px-3.5 sm:text-xs"
            >
              Profile &amp; Theme
            </button>
          </div>
        </div>
      </section>

      {/* Today's Done vs Pending ("Kya Baki Hai") Quick Dashboard */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0f1b2d] sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 sm:text-base">
                Aaj Kya Kiya &amp; Koun Se Tasks Baki Hain
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aaj {formatMins(todayMins)} padhai · {doneSlotCount + doneClassCount + doneTodos} complete ·{' '}
                {totalRemainingCount} baki hain
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSwitchTab('stats')}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Weekly / Monthly Progress
          </button>
        </div>

        {totalRemainingCount === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Shabash {state.studentName}! Aaj ke saare scheduled tasks aur classes complete ho gaye hain.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pendingSlots.slice(0, 3).map((slot) => {
              const sub = getSubject(slot.subjectId);
              return (
                <button
                  key={`rem_slot_${slot.id}`}
                  type="button"
                  onClick={() => onStartStrictSlot(slot)}
                  className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-left transition hover:border-amber-400 dark:border-amber-500/30 dark:bg-amber-500/10"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                      {sub.name} — {slot.task}
                    </p>
                    <p className="font-mono-num text-[11px] text-amber-700 dark:text-amber-300">
                      Baki · {slot.start}–{slot.end}
                    </p>
                  </div>
                  <Play className="h-3.5 w-3.5 shrink-0 fill-current text-amber-700 dark:text-amber-300" />
                </button>
              );
            })}
            {pendingClasses.slice(0, 2).map((cls) => (
              <button
                key={`rem_cls_${cls.id}`}
                type="button"
                onClick={() => onStartStrictOnlineClass(cls)}
                className="flex items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50/70 px-3 py-2 text-left transition hover:border-sky-400 dark:border-sky-500/30 dark:bg-sky-500/10"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                    Live: {cls.title}
                  </p>
                  <p className="font-mono-num text-[11px] text-sky-700 dark:text-sky-300">
                    Class Baki · {cls.start}–{cls.end}
                  </p>
                </div>
                <Video className="h-3.5 w-3.5 shrink-0 text-sky-700 dark:text-sky-300" />
              </button>
            ))}
            {pendingTodos.slice(0, 2).map((td) => (
              <div
                key={`rem_td_${td.id}`}
                onClick={() => {
                  if (td.requiredMins && td.requiredMins > 0) onStartStrictTodo(td);
                }}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                    {td.text}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Target Baki {td.requiredMins ? `· ${formatMins(td.requiredMins)}` : ''}
                  </p>
                </div>
                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Daily Study Progress */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {state.appTheme === 'airforce' ? (
                  <FighterJetSvg className="h-4 w-4 rotate-90 text-[#0284c7] dark:text-sky-400" />
                ) : state.appTheme === 'army' ? (
                  <Shield className="h-4 w-4 text-[#0284c7] dark:text-sky-400" />
                ) : state.appTheme === 'navy' ? (
                  <Anchor className="h-4 w-4 text-[#0284c7] dark:text-sky-400" />
                ) : (
                  <GraduationCap className="h-4 w-4 text-[#0284c7] dark:text-sky-400" />
                )}
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  {theme.progressHeading}
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

            <div className="relative my-3 flex items-center">
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${theme.primaryHex}, ${theme.accentHex}, #10b981)`,
                  }}
                />
              </div>
              <div
                className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-0.5 shadow-sm ring-1 ring-sky-400/50 transition-all duration-300 dark:bg-[#0c2340]"
                style={{left: `${Math.max(4, Math.min(96, pct))}%`}}
              >
                {state.appTheme === 'airforce' ? (
                  <FighterJetSvg className="h-3.5 w-3.5 rotate-90 text-[#0c2340] dark:text-sky-300" />
                ) : state.appTheme === 'army' ? (
                  <Shield className="h-3.5 w-3.5 text-[#0c2340] dark:text-sky-300" />
                ) : state.appTheme === 'navy' ? (
                  <Anchor className="h-3.5 w-3.5 text-[#0c2340] dark:text-sky-300" />
                ) : (
                  <GraduationCap className="h-3.5 w-3.5 text-[#0c2340] dark:text-sky-300" />
                )}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
                <strong className="font-mono-num block text-base font-bold text-[#0c2340] dark:text-sky-400">
                  {todayLogs.length}
                </strong>
                <span className="text-xs text-slate-500 dark:text-slate-400">Sessions</span>
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
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold">
                            <span className="font-mono-num text-[#0284c7] dark:text-sky-400">
                              Lock: {formatCountdownClock(strictRemainingMs)} left
                            </span>
                            <span className="font-mono-num text-emerald-600 dark:text-emerald-400">
                              Asli Padhai: {formatClock(strictStudiedMs)}
                              {isStrictPaused ? ' (Paused)' : ''}
                            </span>
                          </div>
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
                        {isRunningThis && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStrictPause();
                            }}
                            aria-label={isStrictPaused ? 'Resume study stopwatch' : 'Pause study stopwatch'}
                            className={`flex h-10 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-white transition ${
                              isStrictPaused
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-amber-600 hover:bg-amber-700'
                            }`}
                          >
                            {isStrictPaused ? (
                              <Play className="h-3.5 w-3.5 fill-current" />
                            ) : (
                              <Pause className="h-3.5 w-3.5" />
                            )}
                            <span>{isStrictPaused ? 'Resume' : 'Pause'}</span>
                          </button>
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

          {/* Track-Adapted Routine & PT Fitness */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  {includesNda
                    ? `NDA (${theme.shortLabel}) Routine & PT`
                    : `Class ${state.studentClass} Daily Routine`}
                </h3>
                <span className="font-mono-num text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {doneHabits}/4 Done
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSwitchTab('fitness')}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-[#0c2340] transition hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300 whitespace-nowrap"
              >
                <Footprints className="h-3.5 w-3.5" />
                <span>GPS Run &amp; Workout</span>
              </button>
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
              {theme.quickLogHeading}
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
                  <option value={5}>Focus: 5/5 (Top Focus)</option>
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
                {theme.planHeading}
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
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold">
                            <span className="font-mono-num text-[#0284c7] dark:text-sky-400">
                              Lock: {formatCountdownClock(strictRemainingMs)} left
                            </span>
                            <span className="font-mono-num text-emerald-600 dark:text-emerald-400">
                              Asli Padhai: {formatClock(strictStudiedMs)}
                              {isStrictPaused ? ' (Paused)' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {isRunningThis && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStrictPause();
                          }}
                          aria-label={isStrictPaused ? 'Resume study stopwatch' : 'Pause study stopwatch'}
                          className={`flex h-10 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-white transition ${
                            isStrictPaused
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-amber-600 hover:bg-amber-700'
                          }`}
                        >
                          {isStrictPaused ? (
                            <Play className="h-3.5 w-3.5 fill-current" />
                          ) : (
                            <Pause className="h-3.5 w-3.5" />
                          )}
                          <span>{isStrictPaused ? 'Resume' : 'Pause'}</span>
                        </button>
                      )}

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
              Aaj ke Targets ({includesNda ? `Class ${state.studentClass} + NDA` : `Class ${state.studentClass}`})
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
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                            {isRunningThis ? (
                              <>
                                <span className="font-mono-num text-[#0284c7] dark:text-sky-400">
                                  Lock: {formatCountdownClock(strictRemainingMs)} left
                                </span>
                                <span className="font-mono-num text-emerald-600 dark:text-emerald-400">
                                  Asli: {formatClock(strictStudiedMs)}
                                  {isStrictPaused ? ' (Paused)' : ''}
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400">
                                Required: {formatMins(todo.requiredMins!)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {isRunningThis && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleStrictPause();
                          }}
                          className={`flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-white transition ${
                            isStrictPaused
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-amber-600 hover:bg-amber-700'
                          }`}
                        >
                          {isStrictPaused ? (
                            <Play className="h-3.5 w-3.5 fill-current" />
                          ) : (
                            <Pause className="h-3.5 w-3.5" />
                          )}
                          <span>{isStrictPaused ? 'Resume' : 'Pause'}</span>
                        </button>
                      )}

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
                          <span>{isRunningThis ? 'Live' : 'Launch'}</span>
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
                {theme.debriefHeading}
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
