import {useEffect, useRef, useState} from 'react';
import {
  AlarmClock,
  Award,
  BookOpen,
  CalendarDays,
  Flame,
  Home,
  Lock,
  Moon,
  QrCode,
  Settings,
  ShieldAlert,
  Sun,
  Timer as TimerIcon,
  X,
} from 'lucide-react';
import {FighterJetSvg, IafFinFlashSvg, IafRoundelSvg} from './components/FighterJetIcon';
import {OfflineIndicator, PWAInstallButton} from './components/PWAInstallButton';
import {QrCodeCard} from './components/QrCodeCard';
import {StatsTab} from './components/StatsTab';
import {SyllabusTab} from './components/SyllabusTab';
import {TimerTab} from './components/TimerTab';
import {TimetableTab} from './components/TimetableTab';
import {TodayTab} from './components/TodayTab';
import {
  AlarmToneId,
  AppTab,
  DEFAULT_STATE,
  DailyHabits,
  FocusAppItem,
  OnlineClassSlot,
  PadhaiState,
  STORAGE_KEY,
  StrictSession,
  StudyReminder,
  TimerMode,
  TimetableSlot,
  TodoItem,
  WEEKDAYS,
  calculateStreak,
  computeStrictUnlockTarget,
  formatCountdownClock,
  getLocalDateStr,
  getToneMeta,
  loadPadhaiState,
} from './types';
import {
  previewWebAlarmTone,
  startWebAlarmTone,
  stopWebAlarmTone,
} from './utils/alarmAudio';

const NAV_TABS: Array<{id: AppTab; label: string}> = [
  {id: 'today', label: 'Today'},
  {id: 'timer', label: 'Focus'},
  {id: 'timetable', label: 'Timetable'},
  {id: 'syllabus', label: 'Syllabus'},
  {id: 'stats', label: 'Stats & QR'},
];

export default function App() {
  const [state, setState] = useState<PadhaiState>(() => loadPadhaiState());
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Study Timer State
  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
  const [onlineClassMins, setOnlineClassMins] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerHasStarted, setTimerHasStarted] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [timerSubjectId, setTimerSubjectId] = useState(
    () => state.subjects[0]?.id || '',
  );
  const [timerTopic, setTimerTopic] = useState('');
  const accumulatedRef = useRef(0);
  const startedAtRef = useRef(0);

  // Strict countdown remaining ms
  const [strictRemainingMs, setStrictRemainingMs] = useState(() =>
    state.activeStrictSession
      ? Math.max(0, state.activeStrictSession.unlockAtMs - Date.now())
      : 0,
  );

  // Alarm Ringing State (No Snooze — hard dismiss only)
  const [ringingAlarm, setRingingAlarm] = useState<{
    id: string;
    title: string;
    time: string;
    toneId: AlarmToneId;
  } | null>(null);
  const lastFiredMinuteKeyRef = useRef<string>('');

  // Focus Mode Blocked Overlay State
  const [blockedAppAttempt, setBlockedAppAttempt] = useState<FocusAppItem | null>(null);

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  // Sync dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode);
  }, [state.darkMode]);

  // Stop alarm audio on unmount
  useEffect(() => {
    return () => stopWebAlarmTone();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 2800);
  };

  const fireAlarm = (
    id: string,
    title: string,
    time: string,
    toneId: AlarmToneId = state.defaultAlarmTone,
  ) => {
    setRingingAlarm({id, title, time, toneId});
    startWebAlarmTone(toneId);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`Study Tracker Alarm · ${time}`, {body: title});
      } catch {
        // Ignore notification errors
      }
    }
  };

  const requestNotificationPermissionIfSupported = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      void Notification.requestPermission().catch(() => {});
    }
  };

  // Standard Stopwatch / Pomodoro / Online Class Timer loop
  useEffect(() => {
    if (!timerRunning) return;
    startedAtRef.current = Date.now();
    const id = window.setInterval(() => {
      const current = accumulatedRef.current + (Date.now() - startedAtRef.current);
      const targetMs =
        timerMode === 'pomo25'
          ? 25 * 60_000
          : timerMode === 'pomo50'
            ? 50 * 60_000
            : timerMode === 'online_class'
              ? onlineClassMins * 60_000
              : 0;

      if (targetMs > 0 && current >= targetMs) {
        accumulatedRef.current = targetMs;
        setElapsedMs(targetMs);
        setTimerRunning(false);
        setTimerCompleted(true);
        showToast(
          timerMode === 'online_class'
            ? 'Online Class Sortie Complete! Finish & Save dabao.'
            : 'Pomodoro Sortie Complete! Save kar lo.',
        );
      } else {
        setElapsedMs(current);
      }
    }, 250);

    return () => {
      window.clearInterval(id);
    };
  }, [timerRunning, timerMode, onlineClassMins]);

  // Complete a strict task session once unlock timestamp is reached
  const completeStrictSession = (session: StrictSession) => {
    const todayKey = getLocalDateStr();
    const loggedMins = Math.max(1, Math.round(session.totalDurationMs / 60_000));

    setState((prev) => {
      let nextCompletedSlots = prev.completedSlots;
      let nextCompletedClasses = prev.completedClasses;
      let nextTodos = prev.todos;

      if (session.taskKind === 'slot') {
        const currentList = prev.completedSlots[todayKey] || [];
        if (!currentList.includes(session.taskId)) {
          nextCompletedSlots = {
            ...prev.completedSlots,
            [todayKey]: [...currentList, session.taskId],
          };
        }
      } else if (session.taskKind === 'online_class') {
        const currentList = prev.completedClasses[todayKey] || [];
        if (!currentList.includes(session.taskId)) {
          nextCompletedClasses = {
            ...prev.completedClasses,
            [todayKey]: [...currentList, session.taskId],
          };
        }
      } else if (session.taskKind === 'todo') {
        nextTodos = {
          ...prev.todos,
          [todayKey]: (prev.todos[todayKey] || []).map((t) =>
            t.id === session.taskId ? {...t, done: true} : t,
          ),
        };
      }

      const newLog = {
        id: `log_${Date.now()}`,
        date: todayKey,
        subjectId: session.subjectId || prev.subjects[0]?.id || '',
        mins: loggedMins,
        topic: session.title,
        focus: 5,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        activeStrictSession: null,
        completedSlots: nextCompletedSlots,
        completedClasses: nextCompletedClasses,
        todos: nextTodos,
        logs: [newLog, ...prev.logs],
      };
    });

    setStrictRemainingMs(0);
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    fireAlarm(
      `strict_done_${session.taskId}`,
      `Mission Complete! ${session.title}`,
      `${hh}:${mm}`,
      state.defaultAlarmTone,
    );
    showToast(`Shabash Pilot! "${session.title}" complete & ${loggedMins}m log ho gaya!`);
  };

  // Real-time Alarm, Strict Lock Countdown & Focus-Mode expiry ticker
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const nowMs = now.getTime();

      // Update strict session countdown
      if (state.activeStrictSession) {
        const remaining = state.activeStrictSession.unlockAtMs - nowMs;
        if (remaining <= 0) {
          completeStrictSession(state.activeStrictSession);
        } else {
          setStrictRemainingMs(remaining);
        }
      } else {
        setStrictRemainingMs(0);
      }

      // Auto-expire Focus Mode timer if set
      if (
        state.focusMode.enabled &&
        state.focusMode.endTimestampMs &&
        nowMs >= state.focusMode.endTimestampMs
      ) {
        setState((prev) => ({
          ...prev,
          focusMode: {...prev.focusMode, enabled: false, endTimestampMs: null},
        }));
        showToast('Focus Mode session complete!');
      }

      // Check scheduled reminders (exact time trigger, no snooze)
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentHHmm = `${hh}:${mm}`;
      const todayWeekday = WEEKDAYS[now.getDay()];
      const minuteStamp = `${getLocalDateStr(now)}_${currentHHmm}`;

      if (lastFiredMinuteKeyRef.current !== minuteStamp) {
        const matched = state.reminders.find(
          (r) =>
            r.enabled &&
            r.time === currentHHmm &&
            (r.days.length === 0 || r.days.includes('Daily') || r.days.includes(todayWeekday)),
        );
        if (matched) {
          lastFiredMinuteKeyRef.current = minuteStamp;
          fireAlarm(
            matched.id,
            matched.title,
            matched.time,
            matched.toneId || state.defaultAlarmTone,
          );
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [state.reminders, state.focusMode, state.activeStrictSession, state.defaultAlarmTone]);

  const streakDays = calculateStreak(state.logs);
  const todayStr = getLocalDateStr();
  const formattedToday = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const targetMs =
    timerMode === 'pomo25'
      ? 25 * 60_000
      : timerMode === 'pomo50'
        ? 50 * 60_000
        : timerMode === 'online_class'
          ? onlineClassMins * 60_000
          : 0;
  const displayMs = targetMs > 0 ? Math.max(0, targetMs - elapsedMs) : elapsedMs;

  // Strict task launcher helper
  const launchStrictSession = (session: StrictSession) => {
    if (state.activeStrictSession && state.activeStrictSession.taskId !== session.taskId) {
      showToast(
        `Pehle chal raha task "${state.activeStrictSession.title}" pura karo!`,
      );
      setActiveTab('timer');
      return;
    }
    if (state.activeStrictSession?.taskId === session.taskId) {
      setActiveTab('timer');
      return;
    }

    requestNotificationPermissionIfSupported();
    setTimerRunning(false);
    setStrictRemainingMs(Math.max(0, session.unlockAtMs - Date.now()));
    setState((prev) => ({
      ...prev,
      activeStrictSession: session,
      focusMode:
        prev.autoFocusOnStrict && !prev.focusMode.enabled
          ? {
              ...prev.focusMode,
              enabled: true,
              endTimestampMs: session.unlockAtMs,
            }
          : prev.focusMode,
    }));
    setActiveTab('timer');
    showToast(`Sortie Strict Timer Shuru! ${session.title}`);
  };

  const handleStartStrictSlot = (slot: TimetableSlot) => {
    const sub = state.subjects.find((s) => s.id === slot.subjectId);
    const title = `${sub?.name || 'Study'} — ${slot.task || 'Study'}`;
    const timing = computeStrictUnlockTarget(slot.start, slot.end);
    launchStrictSession({
      taskId: slot.id,
      taskKind: 'slot',
      title,
      subjectId: slot.subjectId,
      startClock: slot.start,
      endClock: slot.end,
      totalDurationMs: timing.totalDurationMs,
      startedAtMs: timing.startedAtMs,
      unlockAtMs: timing.unlockAtMs,
    });
  };

  const handleStartStrictOnlineClass = (cls: OnlineClassSlot) => {
    const title = `${cls.title} (${cls.platform})`;
    const timing = computeStrictUnlockTarget(cls.start, cls.end);
    launchStrictSession({
      taskId: cls.id,
      taskKind: 'online_class',
      title,
      subjectId: cls.subjectId,
      startClock: cls.start,
      endClock: cls.end,
      totalDurationMs: timing.totalDurationMs,
      startedAtMs: timing.startedAtMs,
      unlockAtMs: timing.unlockAtMs,
    });
  };

  const handleStartStrictTodo = (todo: TodoItem) => {
    if (!todo.requiredMins || todo.requiredMins <= 0) return;
    const nowMs = Date.now();
    const durationMs = todo.requiredMins * 60_000;
    launchStrictSession({
      taskId: todo.id,
      taskKind: 'todo',
      title: todo.text,
      subjectId: state.subjects[0]?.id || '',
      startClock: '',
      endClock: '',
      totalDurationMs: durationMs,
      startedAtMs: nowMs,
      unlockAtMs: nowMs + durationMs,
    });
  };

  // Standard Timer Handlers
  const handleSelectTimerMode = (nextMode: TimerMode) => {
    if (state.activeStrictSession) {
      showToast('Strict Lock ON hai! Current timer pura hone do.');
      return;
    }
    if (timerRunning) {
      showToast('Pehle timer Pause/Reset karo!');
      return;
    }
    accumulatedRef.current = 0;
    setElapsedMs(0);
    setTimerHasStarted(false);
    setTimerCompleted(false);
    setTimerMode(nextMode);
  };

  const handleToggleStartPause = () => {
    if (state.activeStrictSession) {
      showToast('Strict Mode me timer pause nahi kar sakte!');
      return;
    }
    if (timerRunning) {
      accumulatedRef.current += Date.now() - startedAtRef.current;
      setElapsedMs(accumulatedRef.current);
      setTimerRunning(false);
    } else {
      if (timerCompleted) {
        accumulatedRef.current = 0;
        setElapsedMs(0);
        setTimerCompleted(false);
      }
      setTimerHasStarted(true);
      setTimerRunning(true);
    }
  };

  const handleResetTimer = () => {
    if (state.activeStrictSession) {
      showToast('Strict Lock ON hai! Reset locked hai.');
      return;
    }
    accumulatedRef.current = 0;
    setTimerRunning(false);
    setTimerHasStarted(false);
    setTimerCompleted(false);
    setElapsedMs(0);
  };

  const handleFinishTimer = () => {
    if (state.activeStrictSession) {
      showToast('Strict Lock ON hai! Timer pura hone par hi save hoga.');
      return;
    }
    const totalMs = timerRunning
      ? accumulatedRef.current + (Date.now() - startedAtRef.current)
      : elapsedMs;
    const mins = Math.max(1, Math.round(totalMs / 60_000));
    const subId = timerSubjectId || state.subjects[0]?.id || '';
    const topic =
      timerTopic.trim() ||
      (timerMode === 'online_class' ? 'Online Class Session' : 'Focused Study');

    setState((prev) => ({
      ...prev,
      logs: [
        {
          id: `log_${Date.now()}`,
          date: getLocalDateStr(),
          subjectId: subId,
          mins,
          topic,
          focus: 5,
          timestamp: Date.now(),
        },
        ...prev.logs,
      ],
    }));

    handleResetTimer();
    setTimerTopic('');
    showToast(`Shabash Pilot! ${mins} mins sortie log ho gayi!`);
  };

  const handleToggleHabit = (
    key: keyof Pick<DailyHabits, 'ptDone' | 'vocabDone' | 'caDone' | 'pyqDone'>,
  ) => {
    setState((prev) => {
      const existing = prev.ndaHabits[todayStr] || {
        ptDone: false,
        vocabDone: false,
        caDone: false,
        pyqDone: false,
        runKm: 0,
        pushups: 0,
      };
      return {
        ...prev,
        ndaHabits: {
          ...prev.ndaHabits,
          [todayStr]: {
            ...existing,
            [key]: !existing[key],
          },
        },
      };
    });
  };

  const handleSavePt = (runKm: number, pushups: number) => {
    const safeKm = Math.max(0, runKm);
    const safePushups = Math.max(0, pushups);
    setState((prev) => {
      const existing = prev.ndaHabits[todayStr] || {
        ptDone: false,
        vocabDone: false,
        caDone: false,
        pyqDone: false,
        runKm: 0,
        pushups: 0,
      };
      return {
        ...prev,
        ndaHabits: {
          ...prev.ndaHabits,
          [todayStr]: {
            ...existing,
            runKm: safeKm,
            pushups: safePushups,
            ptDone: safeKm > 0 || safePushups > 0 ? true : existing.ptDone,
          },
        },
      };
    });
    showToast('PT Fitness record save ho gaya!');
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyTracker-Backup-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup download ho gayi!');
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(String(ev.target?.result || '')) as Partial<PadhaiState>;
        if (!imported.subjects || !imported.logs) {
          throw new Error('Invalid');
        }
        const next: PadhaiState = {
          ...structuredClone(DEFAULT_STATE),
          ...imported,
        };
        setState(next);
        showToast('Backup restore ho gaya!');
      } catch {
        showToast('Invalid backup file!');
      }
    };
    reader.readAsText(file);
  };

  const renderTabIcon = (tab: AppTab) => {
    switch (tab) {
      case 'today':
        return <Home className="h-5 w-5" />;
      case 'timer':
        return <TimerIcon className="h-5 w-5" />;
      case 'timetable':
        return <CalendarDays className="h-5 w-5" />;
      case 'syllabus':
        return <BookOpen className="h-5 w-5" />;
      case 'stats':
        return <Award className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6fb] pb-20 text-slate-900 transition-colors dark:bg-[#08101c] dark:text-slate-100 md:pb-8">
      {/* Top Bar Contract: Brand — Nav Links — Primary Control */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-[#0d1726]/95">
        <div
          aria-hidden="true"
          className="h-[3px] w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]"
        />
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('today');
            }}
            className="font-display flex shrink-0 items-center gap-2 text-base font-extrabold tracking-tight text-[#0c2340] whitespace-nowrap dark:text-white"
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#0c2340] text-sky-400 dark:bg-sky-500/20 dark:text-sky-300">
              <FighterJetSvg className="h-4 w-4 -rotate-12" />
            </span>
            <span>Study Tracker</span>
            <IafRoundelSvg className="hidden h-4 w-4 sm:block" />
          </a>

          <nav className="hidden items-center gap-6 md:flex">
            {NAV_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 border-b-2 py-4 text-sm font-semibold transition whitespace-nowrap ${
                    active
                      ? 'border-[#0284c7] text-[#0c2340] dark:border-sky-400 dark:text-sky-300'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <PWAInstallButton compact onShowToast={showToast} />
            <span className="font-mono-num hidden items-center gap-1 text-xs font-bold text-amber-600 sm:inline-flex dark:text-amber-400">
              <Flame className="h-4 w-4" />
              {streakDays}d
            </span>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open Settings and QR Code"
              className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Settings className="h-4 w-4" />
              <QrCode className="h-4 w-4 text-[#0284c7] dark:text-sky-400" />
            </button>
            <button
              type="button"
              onClick={() => setState((prev) => ({...prev, darkMode: !prev.darkMode}))}
              aria-label="Toggle dark mode"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {state.darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <OfflineIndicator />

      {/* Active Strict Task Lock Strip */}
      {state.activeStrictSession && (
        <div
          onClick={() => setActiveTab('timer')}
          className="cursor-pointer border-b border-amber-500/30 bg-amber-600 text-white"
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-xs sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span className="truncate font-bold">
                STRICT LOCK · {state.activeStrictSession.title}
              </span>
            </div>
            <span className="font-mono-num shrink-0 rounded-md bg-white/20 px-2.5 py-0.5 font-extrabold">
              {formatCountdownClock(strictRemainingMs)} left
            </span>
          </div>
        </div>
      )}

      {/* Active Focus Mode Strip */}
      {state.focusMode.enabled && (
        <div className="border-b border-sky-500/30 bg-[#0c2340] text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-xs sm:px-6">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 shrink-0 text-sky-300" />
              <span className="font-semibold">
                Air Force Focus Lock ON · Keval {state.focusMode.allowedPackages.length} allowed
                study apps open honge
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (state.activeStrictSession && state.autoFocusOnStrict) {
                  showToast('Strict Lock chal raha hai! Focus Mode OFF nahi hoga.');
                  return;
                }
                setState((prev) => ({
                  ...prev,
                  focusMode: {...prev.focusMode, enabled: false, endTimestampMs: null},
                }));
              }}
              className="shrink-0 rounded-md bg-white/15 px-2.5 py-1 font-bold hover:bg-white/25"
            >
              Turn OFF
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          className="fixed top-16 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-xl bg-[#0c2340] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg ring-1 ring-sky-400/30 dark:bg-sky-500 dark:text-slate-950"
        >
          {toastMsg}
        </div>
      )}

      {/* Quick Settings & QR Code Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-[#0f1b2d]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Settings · QR Code &amp; Strict Mode
              </h2>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 space-y-2.5">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Strict Task Lock (Bhut Sakt)
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Timer pura hue bina task complete nahi hoga
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (state.activeStrictSession) {
                      showToast('Active Strict Timer ke dauran OFF nahi kar sakte!');
                      return;
                    }
                    setState((prev) => ({...prev, strictMode: !prev.strictMode}));
                  }}
                  className={`min-h-[36px] rounded-lg px-3.5 text-xs font-bold ${
                    state.strictMode
                      ? 'bg-[#0284c7] text-white'
                      : 'border border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  {state.strictMode ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Auto Focus Mode on Timer
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Strict timer start hote hi distraction apps lock honge
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setState((prev) => ({...prev, autoFocusOnStrict: !prev.autoFocusOnStrict}))
                  }
                  className={`min-h-[36px] rounded-lg px-3.5 text-xs font-bold ${
                    state.autoFocusOnStrict
                      ? 'bg-[#0c2340] text-white dark:bg-sky-500 dark:text-slate-950'
                      : 'border border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  {state.autoFocusOnStrict ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <PWAInstallButton onShowToast={showToast} />
            </div>

            <QrCodeCard
              shareUrl={state.appShareUrl}
              onUpdateShareUrl={(url) => {
                setState((prev) => ({...prev, appShareUrl: url}));
                showToast('Download QR link update ho gaya!');
              }}
              onCopySuccess={showToast}
            />
          </div>
        </div>
      )}

      {/* Active Alarm Ringing Modal — NO SNOOZE */}
      {ringingAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-sky-400/35 bg-[#08101c] p-6 text-center text-white shadow-2xl">
            <img
              src="/src/assets/images/iaf_stratosphere_night_1795071299650.jpg"
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
            />
            <div className="relative z-10">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-sky-400/40 bg-[#0c2340]/90">
                <FighterJetSvg className="h-8 w-8 -rotate-12 animate-bounce text-sky-300" />
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-wide text-amber-300 uppercase">
                <AlarmClock className="h-3.5 w-3.5" />
                <span>Indian Air Force Scramble Alert</span>
              </div>
              <p className="font-mono-num mt-1.5 text-4xl font-extrabold text-white">
                {ringingAlarm.time}
              </p>
              <p className="mt-2 text-base font-bold text-slate-100">{ringingAlarm.title}</p>
              <p className="mt-1 text-xs font-medium text-sky-300">
                Tone: {getToneMeta(ringingAlarm.toneId).name} · No Snooze Allowed
              </p>

              <button
                type="button"
                onClick={() => {
                  stopWebAlarmTone();
                  setRingingAlarm(null);
                }}
                className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-amber-400"
              >
                <IafRoundelSvg className="h-5 w-5" />
                <span>Dismiss Alarm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Focus Shield Blocked App Modal */}
      {blockedAppAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-sky-500/30 bg-[#0c2340] p-6 text-center text-white shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500/20">
              <Lock className="h-7 w-7 text-sky-300" />
            </div>
            <p className="text-xs font-semibold text-sky-300">Air Force Focus Shield ON</p>
            <h3 className="font-display mt-1 text-xl font-extrabold">
              {blockedAppAttempt.name} Blocked Hai
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Distraction se bachne ke liye abhi keval aapke select kiye hue study apps hi open ho
              sakte hain.
            </p>
            <button
              type="button"
              onClick={() => setBlockedAppAttempt(null)}
              className="mt-6 min-h-[46px] w-full rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-sky-400"
            >
              Back to Study Tracker
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main id="top" className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-2">
            <IafFinFlashSvg className="h-3 w-5 rounded-[2px] border border-slate-200 dark:border-slate-700" />
            <span>{formattedToday} · UP Board 11th + Indian Air Force Wing</span>
          </span>
          <span className="font-mono-num font-semibold text-amber-600 sm:hidden dark:text-amber-400">
            Streak: {streakDays}d
          </span>
        </div>

        {activeTab === 'today' && (
          <TodayTab
            state={state}
            strictRemainingMs={strictRemainingMs}
            onSwitchTab={setActiveTab}
            onUpdateGoal={(hours) => {
              setState((prev) => ({...prev, dailyGoalHours: hours}));
              showToast('Daily target update ho gaya!');
            }}
            onToggleHabit={handleToggleHabit}
            onSavePt={handleSavePt}
            onToggleSlot={(slot) => {
              const isDone = (state.completedSlots[todayStr] || []).includes(slot.id);
              if (state.strictMode && !isDone) {
                showToast(
                  `Strict Lock! Pehle ${slot.start}–${slot.end} timer pura karo, tabhi complete hoga.`,
                );
                handleStartStrictSlot(slot);
                return;
              }
              setState((prev) => {
                const list = [...(prev.completedSlots[todayStr] || [])];
                const idx = list.indexOf(slot.id);
                if (idx > -1) list.splice(idx, 1);
                else list.push(slot.id);
                return {
                  ...prev,
                  completedSlots: {...prev.completedSlots, [todayStr]: list},
                };
              });
            }}
            onStartStrictSlot={handleStartStrictSlot}
            onToggleOnlineClass={(cls) => {
              const isDone = (state.completedClasses[todayStr] || []).includes(cls.id);
              if (state.strictMode && !isDone) {
                showToast(
                  `Strict Lock! Pehle ${cls.start}–${cls.end} online class timer pura karo.`,
                );
                handleStartStrictOnlineClass(cls);
                return;
              }
              setState((prev) => {
                const list = [...(prev.completedClasses[todayStr] || [])];
                const idx = list.indexOf(cls.id);
                if (idx > -1) list.splice(idx, 1);
                else list.push(cls.id);
                return {
                  ...prev,
                  completedClasses: {...prev.completedClasses, [todayStr]: list},
                };
              });
            }}
            onStartStrictOnlineClass={handleStartStrictOnlineClass}
            onAddTodo={(text, requiredMins) => {
              setState((prev) => ({
                ...prev,
                todos: {
                  ...prev.todos,
                  [todayStr]: [
                    ...(prev.todos[todayStr] || []),
                    {id: `td_${Date.now()}`, text, done: false, requiredMins},
                  ],
                },
              }));
            }}
            onToggleTodo={(todo) => {
              if (state.strictMode && todo.requiredMins && todo.requiredMins > 0 && !todo.done) {
                showToast(
                  `Strict Target! Pehle ${todo.requiredMins}m timer pura karo tabhi done hoga.`,
                );
                handleStartStrictTodo(todo);
                return;
              }
              setState((prev) => ({
                ...prev,
                todos: {
                  ...prev.todos,
                  [todayStr]: (prev.todos[todayStr] || []).map((t) =>
                    t.id === todo.id ? {...t, done: !t.done} : t,
                  ),
                },
              }));
            }}
            onStartStrictTodo={handleStartStrictTodo}
            onDeleteTodo={(id) => {
              if (state.activeStrictSession?.taskId === id) {
                showToast('Chal rahe strict target ko delete nahi kar sakte!');
                return;
              }
              setState((prev) => ({
                ...prev,
                todos: {
                  ...prev.todos,
                  [todayStr]: (prev.todos[todayStr] || []).filter((t) => t.id !== id),
                },
              }));
            }}
            onSaveQuickLog={(subjectId, mins, topic, focus) => {
              if (!mins || mins <= 0) {
                showToast('Please valid minutes daalo!');
                return;
              }
              setState((prev) => ({
                ...prev,
                logs: [
                  {
                    id: `log_${Date.now()}`,
                    date: todayStr,
                    subjectId,
                    mins,
                    topic: topic.trim() || 'Self Study',
                    focus,
                    timestamp: Date.now(),
                  },
                  ...prev.logs,
                ],
              }));
              showToast(`+${mins} mins padhai add ho gayi!`);
            }}
            onSaveNote={(note) => {
              setState((prev) => ({
                ...prev,
                notes: {...prev.notes, [todayStr]: note.trim()},
              }));
              showToast('Review note save ho gaya!');
            }}
          />
        )}

        {activeTab === 'timer' && (
          <TimerTab
            subjects={state.subjects}
            onlineClasses={state.onlineClasses}
            strictMode={state.strictMode}
            activeStrictSession={state.activeStrictSession}
            strictRemainingMs={strictRemainingMs}
            mode={timerMode}
            running={timerRunning}
            hasStarted={timerHasStarted}
            isCompleted={timerCompleted}
            displayMs={displayMs}
            subjectId={timerSubjectId}
            topic={timerTopic}
            onlineClassMins={onlineClassMins}
            focusMode={state.focusMode}
            customApps={state.customApps}
            reminders={state.reminders}
            defaultAlarmTone={state.defaultAlarmTone}
            onSelectMode={handleSelectTimerMode}
            onSelectSubject={setTimerSubjectId}
            onChangeTopic={setTimerTopic}
            onChangeOnlineClassMins={(m) => {
              if (timerRunning) return;
              setOnlineClassMins(m);
            }}
            onToggleStartPause={handleToggleStartPause}
            onFinishSave={handleFinishTimer}
            onReset={handleResetTimer}
            onStartStrictOnlineClass={handleStartStrictOnlineClass}
            onToggleFocusMode={(durationMins) => {
              if (state.focusMode.enabled && state.activeStrictSession && state.autoFocusOnStrict) {
                showToast('Strict Lock chal raha hai! Focus Mode OFF nahi hoga.');
                return;
              }
              setState((prev) => {
                const nextEnabled = !prev.focusMode.enabled;
                const endTs =
                  nextEnabled && durationMins && durationMins > 0
                    ? Date.now() + durationMins * 60_000
                    : null;
                showToast(
                  nextEnabled
                    ? 'Focus Mode ON! Keval selected study apps hi open honge.'
                    : 'Focus Mode OFF ho gaya.',
                );
                return {
                  ...prev,
                  focusMode: {
                    ...prev.focusMode,
                    enabled: nextEnabled,
                    endTimestampMs: endTs,
                  },
                };
              });
            }}
            onToggleAllowedApp={(appId) => {
              setState((prev) => {
                const exists = prev.focusMode.allowedPackages.includes(appId);
                const nextList = exists
                  ? prev.focusMode.allowedPackages.filter((id) => id !== appId)
                  : [...prev.focusMode.allowedPackages, appId];
                return {
                  ...prev,
                  focusMode: {...prev.focusMode, allowedPackages: nextList},
                };
              });
            }}
            onAddCustomApp={(name) => {
              const id = `custom_${Date.now()}`;
              setState((prev) => ({
                ...prev,
                customApps: [{id, name, category: 'Study'}, ...prev.customApps],
                focusMode: {
                  ...prev.focusMode,
                  allowedPackages: [...prev.focusMode.allowedPackages, id],
                },
              }));
              showToast(`${name} allowed apps me add ho gaya!`);
            }}
            onTestAppLaunch={(app) => {
              if (!state.focusMode.enabled || state.focusMode.allowedPackages.includes(app.id)) {
                showToast(`${app.name} open ho sakta hai (Allowed)!`);
              } else {
                setBlockedAppAttempt(app);
              }
            }}
            onSelectDefaultTone={(toneId) => {
              setState((prev) => ({...prev, defaultAlarmTone: toneId}));
              showToast(`Tone selected: ${getToneMeta(toneId).name}`);
            }}
            onPreviewTone={(toneId) => {
              previewWebAlarmTone(toneId);
            }}
            onAddReminder={(title, time, days, toneId) => {
              requestNotificationPermissionIfSupported();
              const newRem: StudyReminder = {
                id: `rem_${Date.now()}`,
                title,
                time,
                days,
                enabled: true,
                vibrate: true,
                toneId,
              };
              setState((prev) => ({
                ...prev,
                defaultAlarmTone: toneId,
                reminders: [newRem, ...prev.reminders],
              }));
              showToast(`Alarm set: ${time} · ${getToneMeta(toneId).name}`);
            }}
            onToggleReminder={(id) => {
              requestNotificationPermissionIfSupported();
              setState((prev) => ({
                ...prev,
                reminders: prev.reminders.map((r) =>
                  r.id === id ? {...r, enabled: !r.enabled} : r,
                ),
              }));
            }}
            onDeleteReminder={(id) => {
              setState((prev) => ({
                ...prev,
                reminders: prev.reminders.filter((r) => r.id !== id),
              }));
            }}
            onTestAlarm={(toneId) => {
              requestNotificationPermissionIfSupported();
              const now = new Date();
              const hh = String(now.getHours()).padStart(2, '0');
              const mm = String(now.getMinutes()).padStart(2, '0');
              fireAlarm(
                'test_alarm',
                'Air Force Mission Alarm · Padhai Shuru Karo!',
                `${hh}:${mm}`,
                toneId,
              );
            }}
          />
        )}

        {activeTab === 'timetable' && (
          <TimetableTab
            state={state}
            onAddSlot={(day, subjectId, start, end, task) => {
              if (!start || !end) {
                showToast('Start aur End time select karo');
                return;
              }
              setState((prev) => ({
                ...prev,
                timetable: [
                  ...prev.timetable,
                  {
                    id: `tt_${Date.now()}`,
                    day,
                    subjectId,
                    start,
                    end,
                    task: task.trim() || 'Study Session',
                  },
                ],
              }));
              showToast('Timetable slot add ho gaya!');
            }}
            onDeleteSlot={(slotId) => {
              if (state.activeStrictSession?.taskId === slotId) {
                showToast('Chal rahe strict slot ko delete nahi kar sakte!');
                return;
              }
              setState((prev) => ({
                ...prev,
                timetable: prev.timetable.filter((t) => t.id !== slotId),
              }));
            }}
            onStartStrictSlot={handleStartStrictSlot}
            onAddOnlineClass={(day, subjectId, platform, title, start, end, meetingUrl) => {
              if (!start || !end) {
                showToast('Class Start aur End time select karo');
                return;
              }
              setState((prev) => ({
                ...prev,
                onlineClasses: [
                  ...prev.onlineClasses,
                  {
                    id: `oc_${Date.now()}`,
                    day,
                    subjectId,
                    platform: platform.trim() || 'Online Class',
                    title: title.trim() || 'Live Study Class',
                    start,
                    end,
                    meetingUrl: meetingUrl.trim(),
                  },
                ],
              }));
              showToast('Online Class timetable me add ho gayi!');
            }}
            onDeleteOnlineClass={(classId) => {
              if (state.activeStrictSession?.taskId === classId) {
                showToast('Chal rahi online class ko delete nahi kar sakte!');
                return;
              }
              setState((prev) => ({
                ...prev,
                onlineClasses: prev.onlineClasses.filter((c) => c.id !== classId),
              }));
            }}
            onStartStrictOnlineClass={handleStartStrictOnlineClass}
          />
        )}

        {activeTab === 'syllabus' && (
          <SyllabusTab
            state={state}
            onAddSubject={(name, totalChapters, color) => {
              if (!name) {
                showToast('Subject ka naam likho!');
                return;
              }
              setState((prev) => ({
                ...prev,
                subjects: [
                  ...prev.subjects,
                  {
                    id: `sub_${Date.now()}`,
                    name,
                    totalChapters: Math.max(1, totalChapters),
                    doneChapters: 0,
                    color,
                  },
                ],
              }));
              showToast('Subject add ho gaya!');
            }}
            onUpdateChapter={(subjectId, delta) => {
              setState((prev) => ({
                ...prev,
                subjects: prev.subjects.map((s) =>
                  s.id === subjectId
                    ? {
                        ...s,
                        doneChapters: Math.max(0, Math.min(s.totalChapters, s.doneChapters + delta)),
                      }
                    : s,
                ),
              }));
            }}
            onDeleteSubject={(subjectId) => {
              if (state.subjects.length <= 1) {
                showToast('Kam se kam 1 subject hona chahiye!');
                return;
              }
              setState((prev) => ({
                ...prev,
                subjects: prev.subjects.filter((s) => s.id !== subjectId),
              }));
            }}
            onDeleteLog={(logId) => {
              setState((prev) => ({
                ...prev,
                logs: prev.logs.filter((l) => l.id !== logId),
              }));
            }}
          />
        )}

        {activeTab === 'stats' && (
          <StatsTab
            state={state}
            onAddMock={(name, maths, gat) => {
              if (
                Number.isNaN(maths) ||
                Number.isNaN(gat) ||
                maths < 0 ||
                maths > 300 ||
                gat < 0 ||
                gat > 600
              ) {
                showToast('Valid Maths (0-300) aur GAT (0-600) marks daalo!');
                return;
              }
              setState((prev) => ({
                ...prev,
                mockTests: [
                  {
                    id: `mt_${Date.now()}`,
                    date: todayStr,
                    name: name || `NDA Mock #${prev.mockTests.length + 1}`,
                    maths,
                    gat,
                  },
                  ...prev.mockTests,
                ],
              }));
              showToast('NDA Mock Score add ho gaya!');
            }}
            onDeleteMock={(id) => {
              setState((prev) => ({
                ...prev,
                mockTests: prev.mockTests.filter((m) => m.id !== id),
              }));
            }}
            onSaveSettings={(examName, examDate, dailyGoalHours) => {
              setState((prev) => ({
                ...prev,
                examName: examName.trim(),
                examDate,
                dailyGoalHours:
                  dailyGoalHours > 0 && dailyGoalHours <= 20
                    ? dailyGoalHours
                    : prev.dailyGoalHours,
              }));
              showToast('Settings save ho gayi!');
            }}
            onToggleStrictMode={() => {
              if (state.activeStrictSession) {
                showToast('Active Strict Timer ke dauran Strict Mode OFF nahi kar sakte!');
                return;
              }
              setState((prev) => {
                const next = !prev.strictMode;
                showToast(
                  next
                    ? 'Strict Mode ON! Timer pura hone par hi task complete hoga.'
                    : 'Strict Mode OFF ho gaya.',
                );
                return {...prev, strictMode: next};
              });
            }}
            onToggleAutoFocusOnStrict={() => {
              setState((prev) => ({
                ...prev,
                autoFocusOnStrict: !prev.autoFocusOnStrict,
              }));
            }}
            onUpdateShareUrl={(url) => {
              setState((prev) => ({...prev, appShareUrl: url}));
              showToast('Download QR link update ho gaya!');
            }}
            onShowToast={showToast}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onResetAll={() => {
              if (state.activeStrictSession) {
                showToast('Pehle chal raha strict task pura karo!');
                return;
              }
              handleResetTimer();
              setState(structuredClone(DEFAULT_STATE));
              showToast('App reset ho gaya');
            }}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed right-0 bottom-0 left-0 z-40 grid h-16 grid-cols-5 border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-[#0d1726]/95 md:hidden">
        {NAV_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                active
                  ? 'text-[#0284c7] dark:text-sky-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {renderTabIcon(tab.id)}
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
