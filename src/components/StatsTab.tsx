import React, {useState} from 'react';
import {
  Anchor,
  BarChart3,
  Camera,
  CheckCircle2,
  Download,
  GraduationCap,
  Palette,
  QrCode,
  Shield,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import {
  AppTheme,
  BoardMedium,
  PadhaiState,
  StudentClass,
  StudyTrack,
  WEEKDAYS,
  formatMins,
  getLocalDateStr,
} from '../types';
import {compressImageFile} from '../utils/imageUtils';
import {
  APP_THEMES,
  getThemeMeta,
  getTrackDisplayLabel,
  trackIncludesNda,
} from '../utils/themeConfig';
import {FighterJetSvg, IafFinFlashSvg} from './FighterJetIcon';
import {PWAInstallButton} from './PWAInstallButton';
import {QrCodeCard} from './QrCodeCard';

interface StatsTabProps {
  state: PadhaiState;
  onAddMock: (name: string, maths: number, gat: number) => void;
  onDeleteMock: (id: string) => void;
  onSaveSettings: (examName: string, examDate: string, dailyGoalHours: number) => void;
  onUpdateProfile: (profile: {
    studentName: string;
    studentPhotoDataUrl: string;
    studentClass: StudentClass;
    studyTrack: StudyTrack;
    boardMedium: BoardMedium;
  }, applyRecommendedSubjects?: boolean) => void;
  onChangeTheme: (theme: AppTheme) => void;
  onToggleStrictMode: () => void;
  onToggleAutoFocusOnStrict: () => void;
  onUpdateShareUrl: (url: string) => void;
  onShowToast: (msg: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetAll: () => void;
}

const TRACK_OPTIONS: Array<{id: StudyTrack; label: string; sub: string}> = [
  {id: 'class_only', label: 'Keval Class (9–12)', sub: 'Board / School Focus'},
  {id: 'nda_only', label: 'Keval NDA', sub: 'Full Defence Prep'},
  {id: 'class_9_nda', label: 'Class 9 + NDA', sub: 'Foundation Track'},
  {id: 'class_10_nda', label: 'Class 10 + NDA', sub: 'Board + NDA Base'},
  {id: 'class_11_nda', label: 'Class 11 + NDA', sub: 'Target Track'},
  {id: 'class_12_nda', label: 'Class 12 + NDA', sub: 'Final Board + NDA'},
];

export const StatsTab: React.FC<StatsTabProps> = ({
  state,
  onAddMock,
  onDeleteMock,
  onSaveSettings,
  onUpdateProfile,
  onChangeTheme,
  onToggleStrictMode,
  onToggleAutoFocusOnStrict,
  onUpdateShareUrl,
  onShowToast,
  onExportBackup,
  onImportBackup,
  onResetAll,
}) => {
  const theme = getThemeMeta(state.appTheme);
  const includesNda = trackIncludesNda(state.studyTrack);
  const todayStr = getLocalDateStr();
  const todayDay = WEEKDAYS[new Date().getDay()];

  // Profile Draft State
  const [nameDraft, setNameDraft] = useState(state.studentName);
  const [photoDraft, setPhotoDraft] = useState(state.studentPhotoDataUrl);
  const [classDraft, setClassDraft] = useState<StudentClass>(state.studentClass);
  const [trackDraft, setTrackDraft] = useState<StudyTrack>(state.studyTrack);
  const [mediumDraft, setMediumDraft] = useState<BoardMedium>(state.boardMedium);
  const [autoResetSubjects, setAutoResetSubjects] = useState(true);

  // Mock & Settings State
  const [mockName, setMockName] = useState('');
  const [mockMaths, setMockMaths] = useState('');
  const [mockGat, setMockGat] = useState('');
  const [examName, setExamName] = useState(state.examName);
  const [examDate, setExamDate] = useState(state.examDate);
  const [dailyGoal, setDailyGoal] = useState(String(state.dailyGoalHours));
  const [confirmReset, setConfirmReset] = useState(false);

  // Progress Chart Range Toggle
  const [progressView, setProgressView] = useState<'weekly' | 'monthly'>('weekly');

  const handlePhotoUpload = async (file: File) => {
    try {
      const {dataUrl} = await compressImageFile(file, 256, 0.85);
      setPhotoDraft(dataUrl);
      onUpdateProfile(
        {
          studentName: nameDraft.trim() || state.studentName,
          studentPhotoDataUrl: dataUrl,
          studentClass: classDraft,
          studyTrack: trackDraft,
          boardMedium: mediumDraft,
        },
        false,
      );
      onShowToast('Student photo upload ho gayi!');
    } catch {
      onShowToast('Photo read nahi ho saki, dusri image try karo.');
    }
  };

  // Weekly 7 days
  const days7 = Array.from({length: 7}, (_, idx) => {
    const i = 6 - idx;
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateStr(d);
    const mins = state.logs
      .filter((l) => l.date === dateStr)
      .reduce((s, l) => s + Number(l.mins), 0);
    return {
      label: WEEKDAYS[d.getDay()],
      dateStr,
      hours: +(mins / 60).toFixed(1),
      mins,
    };
  });

  // Monthly 30 days
  const days30 = Array.from({length: 30}, (_, idx) => {
    const i = 29 - idx;
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateStr(d);
    const mins = state.logs
      .filter((l) => l.date === dateStr)
      .reduce((s, l) => s + Number(l.mins), 0);
    return {
      dayNum: d.getDate(),
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      dateStr,
      hours: +(mins / 60).toFixed(1),
      mins,
    };
  });

  const maxHours7 = Math.max(state.dailyGoalHours || 6, ...days7.map((d) => d.hours), 1);
  const maxHours30 = Math.max(state.dailyGoalHours || 6, ...days30.map((d) => d.hours), 1);

  const weekMins = days7.reduce((s, d) => s + d.mins, 0);
  const monthMins = days30.reduce((s, d) => s + d.mins, 0);
  const activeMonthDays = days30.filter((d) => d.mins > 0).length;
  const totalMins = state.logs.reduce((s, l) => s + Number(l.mins), 0);
  const totalKm = Object.values(state.ndaHabits).reduce(
    (s, h) => s + (Number(h.runKm) || 0),
    0,
  );

  // Today Done vs Remaining Summary
  const todayMins = state.logs
    .filter((l) => l.date === todayStr)
    .reduce((s, l) => s + Number(l.mins), 0);
  const todaySlots = state.timetable.filter((t) => t.day === 'Daily' || t.day === todayDay);
  const doneSlots = state.completedSlots[todayStr] || [];
  const pendingSlots = todaySlots.filter((t) => !doneSlots.includes(t.id));

  const todayClasses = state.onlineClasses.filter((c) => c.day === 'Daily' || c.day === todayDay);
  const doneClasses = state.completedClasses[todayStr] || [];
  const pendingClasses = todayClasses.filter((c) => !doneClasses.includes(c.id));

  const todos = state.todos[todayStr] || [];
  const pendingTodos = todos.filter((t) => !t.done);

  const subTotals: Record<string, number> = {};
  state.logs.forEach((l) => {
    subTotals[l.subjectId] = (subTotals[l.subjectId] || 0) + Number(l.mins);
  });

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Left Column */}
      <div className="space-y-5">
        {/* Student Profile, Photo, Class & Track Selector */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Student Profile, Class &amp; Medium
              </h3>
            </div>
            <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-[#0c2340] dark:bg-sky-500/15 dark:text-sky-300">
              {getTrackDisplayLabel(state.studentClass, state.studyTrack, state.boardMedium)}
            </span>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            {photoDraft ? (
              <img
                src={photoDraft}
                alt="Student"
                className="h-16 w-16 shrink-0 rounded-2xl border-2 border-[#0284c7] object-cover"
              />
            ) : (
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold text-white"
                style={{backgroundColor: theme.accentHex}}
              >
                {(nameDraft || 'AS').slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-lg bg-[#0c2340] px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-95 dark:bg-sky-500 dark:text-slate-950">
                  <Camera className="h-3.5 w-3.5" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handlePhotoUpload(f);
                      e.target.value = '';
                    }}
                  />
                </label>
                {photoDraft && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoDraft('');
                      onUpdateProfile(
                        {
                          studentName: nameDraft.trim() || state.studentName,
                          studentPhotoDataUrl: '',
                          studentClass: classDraft,
                          studyTrack: trackDraft,
                          boardMedium: mediumDraft,
                        },
                        false,
                      );
                    }}
                    className="min-h-[38px] rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-300"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Aapki photo aur naam Home dashboard hero banner par dikhega.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Student Name
              </label>
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Apna naam likho (e.g. Atharv Singh)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Dashboard Mode (Class 9–12 / NDA / Combined)
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TRACK_OPTIONS.map((opt) => {
                  const selected = trackDraft === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setTrackDraft(opt.id);
                        if (opt.id === 'class_9_nda') setClassDraft('9');
                        else if (opt.id === 'class_10_nda') setClassDraft('10');
                        else if (opt.id === 'class_11_nda') setClassDraft('11');
                        else if (opt.id === 'class_12_nda') setClassDraft('12');
                      }}
                      className={`rounded-xl border px-2.5 py-2 text-left transition ${
                        selected
                          ? 'border-[#0284c7] bg-sky-50 text-[#0c2340] dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-200'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200'
                      }`}
                    >
                      <span className="block text-xs font-bold">{opt.label}</span>
                      <span className="block text-[10px] opacity-75">{opt.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {trackDraft === 'class_only' && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Class Chuno (Class 9–12)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['9', '10', '11', '12'] as StudentClass[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setClassDraft(c)}
                      className={`min-h-[40px] rounded-xl border text-xs font-bold transition ${
                        classDraft === c
                          ? 'border-[#0c2340] bg-[#0c2340] text-white dark:border-sky-500 dark:bg-sky-500 dark:text-slate-950'
                          : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      Class {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Board Medium
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMediumDraft('up_hindi')}
                  className={`min-h-[42px] rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    mediumDraft === 'up_hindi'
                      ? 'border-[#0284c7] bg-sky-50 text-[#0c2340] dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-200'
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  UP Board Hindi Medium
                </button>
                <button
                  type="button"
                  onClick={() => setMediumDraft('english')}
                  className={`min-h-[42px] rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    mediumDraft === 'english'
                      ? 'border-[#0284c7] bg-sky-50 text-[#0c2340] dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-200'
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  English Medium
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <input
                type="checkbox"
                checked={autoResetSubjects}
                onChange={(e) => setAutoResetSubjects(e.target.checked)}
                className="h-4 w-4 rounded accent-[#0284c7]"
              />
              <span>
                Track/Class ke hisab se subjects automatic update karo (e.g. UP Board / NDA)
              </span>
            </label>

            <button
              type="button"
              onClick={() => {
                onUpdateProfile(
                  {
                    studentName: nameDraft.trim() || 'Student',
                    studentPhotoDataUrl: photoDraft,
                    studentClass: classDraft,
                    studyTrack: trackDraft,
                    boardMedium: mediumDraft,
                  },
                  autoResetSubjects,
                );
              }}
              className="min-h-[44px] w-full rounded-xl bg-[#0c2340] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-95 dark:bg-sky-500 dark:text-slate-950"
            >
              Save Profile &amp; Apply Dashboard
            </button>
          </div>
        </section>

        {/* Theme Selector (Army / Air Force / Navy / Default) */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="mb-3 flex items-center gap-2">
            <Palette className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              App Theme Chuno (Army / Air Force / Navy / Default)
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {Object.values(APP_THEMES).map((t) => {
              const active = state.appTheme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChangeTheme(t.id)}
                  className={`group relative overflow-hidden rounded-xl border p-3 text-left transition ${
                    active
                      ? 'border-2 border-[#0284c7] ring-2 ring-[#0284c7]/20 dark:border-sky-400'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <div
                    className={`mb-2 relative h-14 w-full overflow-hidden rounded-lg bg-gradient-to-r ${t.heroGradient}`}
                  >
                    {t.heroImage && (
                      <img
                        src={t.heroImage}
                        alt={t.name}
                        className="h-full w-full object-cover opacity-85"
                      />
                    )}
                    {active && (
                      <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {t.taglineHi}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Mock / Board Test Tracker */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {state.appTheme === 'airforce' ? (
                <img
                  src="/src/assets/images/iaf_squadron_crest_1795071260293.jpg"
                  alt="Indian Air Force Wings"
                  referrerPolicy="no-referrer"
                  className="h-9 w-9 shrink-0 rounded-lg border border-sky-400/35 object-cover"
                />
              ) : state.appTheme === 'army' ? (
                <Shield className="h-6 w-6 shrink-0 text-[#0284c7] dark:text-sky-400" />
              ) : state.appTheme === 'navy' ? (
                <Anchor className="h-6 w-6 shrink-0 text-[#0284c7] dark:text-sky-400" />
              ) : (
                <GraduationCap className="h-6 w-6 shrink-0 text-[#0284c7] dark:text-sky-400" />
              )}
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                {includesNda ? 'NDA Mock Test / PYQ Tracker' : `Class ${state.studentClass} Test / Exam Tracker`}
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {includesNda ? 'Out of 900' : 'Score Log'}
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const m = parseFloat(mockMaths);
              const g = parseFloat(mockGat);
              onAddMock(mockName.trim(), m, g);
              if (!Number.isNaN(m) && !Number.isNaN(g) && m >= 0 && m <= 300 && g >= 0 && g <= 600) {
                setMockName('');
                setMockMaths('');
                setMockGat('');
              }
            }}
            className="mb-3 space-y-2.5"
          >
            <input
              type="text"
              value={mockName}
              onChange={(e) => setMockName(e.target.value)}
              placeholder={
                includesNda
                  ? 'Test Name (e.g. NDA 2024 Paper-1 PYQ / Sunday Mock)'
                  : 'Test Name (e.g. Half Yearly Exam / Unit Test 2)'
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0c2340] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="number"
                step="0.5"
                min="0"
                max="300"
                value={mockMaths}
                onChange={(e) => setMockMaths(e.target.value)}
                placeholder={includesNda ? 'Maths (/300)' : 'Maths/Sci Marks (0–300)'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0c2340] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <input
                type="number"
                step="0.5"
                min="0"
                max="600"
                value={mockGat}
                onChange={(e) => setMockGat(e.target.value)}
                placeholder={includesNda ? 'GAT (/600)' : 'Other Subjects (0–600)'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0c2340] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="min-h-[44px] w-full rounded-xl bg-[#0c2340] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
            >
              + Save Test Score
            </button>
          </form>

          <p className="mb-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {includesNda
              ? 'Note: NDA pass karne ke liye Maths (75+/300) aur GAT (150+/600) dono me kam se kam 25% aur total ~360+ score safe maana jata hai.'
              : 'Apne school unit test, pre-board ya Sunday tests ke marks yahan track karo.'}
          </p>

          {state.mockTests.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Abhi koi test score nahi hai. Pehla test dekar score daalo!
            </p>
          ) : (
            <div className="space-y-2.5">
              {state.mockTests.map((m) => {
                const total = +(m.maths + m.gat).toFixed(1);
                const mathsPass = m.maths >= 75;
                const gatPass = m.gat >= 150;
                const status = includesNda
                  ? !mathsPass || !gatPass
                    ? {
                        label: !mathsPass ? 'Maths < 25%' : 'GAT < 25%',
                        cls: 'text-rose-700 dark:text-rose-400',
                      }
                    : total >= 360
                      ? {label: 'Safe Zone', cls: 'text-emerald-700 dark:text-emerald-400'}
                      : {label: 'Need 360+', cls: 'text-amber-700 dark:text-amber-400'}
                  : {label: 'Recorded', cls: 'text-sky-700 dark:text-sky-400'};

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        <span className="truncate">{m.name}</span>
                        <span className="font-mono-num">· {total}</span>
                        <span className={`text-xs font-bold ${status.cls}`}>· {status.label}</span>
                      </div>
                      <p className="font-mono-num mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {m.date} · Part-1: {m.maths} · Part-2: {m.gat}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteMock(m.id)}
                      aria-label={`Delete ${m.name}`}
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

        {/* Download & Share App QR Code + Mobile PWA Install */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                App Download QR &amp; Mobile Install
              </h3>
            </div>
            {theme.showTricolour && (
              <IafFinFlashSvg className="h-3.5 w-6 rounded-[2px] border border-slate-200 dark:border-slate-700" />
            )}
          </div>
          <div className="mb-4 space-y-2.5">
            <PWAInstallButton onShowToast={onShowToast} />
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
              <p className="font-bold text-slate-900 dark:text-slate-100">
                Android App (.apk) &amp; Mobile Install Guide:
              </p>
              <p className="mt-1 leading-relaxed">
                1) Chrome me <strong>Install Study Tracker</strong> dabakar sidhe fullscreen mobile
                app install karein. 2) Agar share karne ke liye <strong>.apk file</strong> chahiye
                toh Vercel par deploy karke apna URL <strong>pwabuilder.com</strong> par daalein aur
                Android package (.apk) download karein.
              </p>
            </div>
          </div>
          <QrCodeCard
            shareUrl={state.appShareUrl}
            onUpdateShareUrl={onUpdateShareUrl}
            onCopySuccess={onShowToast}
          />
        </section>
      </div>

      {/* Right Column */}
      <div className="space-y-5">
        {/* Weekly & Monthly Progress Dashboard */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {state.appTheme === 'airforce' ? (
                <FighterJetSvg className="h-4 w-4 -rotate-12 text-[#0284c7] dark:text-sky-400" />
              ) : state.appTheme === 'army' ? (
                <Shield className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
              ) : state.appTheme === 'navy' ? (
                <Anchor className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
              ) : (
                <BarChart3 className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
              )}
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                {progressView === 'weekly' ? 'Weekly Progress (7 Days)' : 'Monthly Progress (30 Days)'}
              </h3>
            </div>
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setProgressView('weekly')}
                className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                  progressView === 'weekly'
                    ? 'bg-[#0c2340] text-white dark:bg-sky-500 dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setProgressView('monthly')}
                className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                  progressView === 'monthly'
                    ? 'bg-[#0c2340] text-white dark:bg-sky-500 dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {progressView === 'weekly' ? (
            <div className="flex h-40 items-end justify-between gap-2 pt-4">
              {days7.map((d, index) => {
                const heightPct = Math.round((d.hours / maxHours7) * 100);
                return (
                  <div
                    key={`${d.label}-${index}`}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    <span className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                      {d.hours}h
                    </span>
                    <div className="flex w-full flex-1 items-end justify-center">
                      <div
                        className="w-full max-w-[34px] rounded-t-md bg-[#0284c7] transition-all duration-300 dark:bg-sky-400"
                        style={{height: `${Math.max(5, heightPct)}%`}}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="flex h-36 items-end justify-between gap-[3px]">
                {days30.map((d) => {
                  const heightPct = Math.round((d.hours / maxHours30) * 100);
                  return (
                    <div
                      key={d.dateStr}
                      title={`${d.dateStr}: ${d.hours}h`}
                      className="flex h-full flex-1 flex-col items-center justify-end"
                    >
                      <div
                        className={`w-full rounded-t-sm transition-all ${
                          d.mins > 0
                            ? 'bg-emerald-500 dark:bg-emerald-400'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                        style={{height: `${d.mins > 0 ? Math.max(10, heightPct) : 6}%`}}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{days30[0]?.label}</span>
                <span>Active Days: {activeMonthDays}/30</span>
                <span>Today ({days30[29]?.label})</span>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
              <strong className="font-mono-num block text-base font-bold text-[#0284c7] dark:text-sky-400">
                {formatMins(todayMins)}
              </strong>
              <span className="text-xs text-slate-500 dark:text-slate-400">Aaj Padha</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
              <strong className="font-mono-num block text-base font-bold text-[#0284c7] dark:text-sky-400">
                {formatMins(weekMins)}
              </strong>
              <span className="text-xs text-slate-500 dark:text-slate-400">7 Days</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
              <strong className="font-mono-num block text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatMins(monthMins)}
              </strong>
              <span className="text-xs text-slate-500 dark:text-slate-400">30 Days</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
              <strong className="font-mono-num block text-base font-bold text-[#0284c7] dark:text-sky-400">
                {totalKm.toFixed(1)} km
              </strong>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Run</span>
            </div>
          </div>

          {/* Remaining Tasks Snapshot inside Progress */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Aaj Baki Tasks Summary:
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Timetable baki: <strong>{pendingSlots.length}</strong> · Online classes baki:{' '}
              <strong>{pendingClasses.length}</strong> · Daily targets baki:{' '}
              <strong>{pendingTodos.length}</strong>
            </p>
            {(pendingSlots.length > 0 || pendingClasses.length > 0 || pendingTodos.length > 0) && (
              <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                {pendingSlots.slice(0, 3).map((s) => (
                  <li key={s.id}>• Timetable: {s.task} ({s.start}–{s.end})</li>
                ))}
                {pendingClasses.slice(0, 2).map((c) => (
                  <li key={c.id}>• Class: {c.title} ({c.start}–{c.end})</li>
                ))}
                {pendingTodos.slice(0, 2).map((t) => (
                  <li key={t.id}>• Target: {t.text}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Subject Breakdown */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <h3 className="font-display mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
            Subject-wise Time ({formatMins(totalMins)} Total)
          </h3>
          {totalMins === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Padhai log karne ke baad yahan subject breakdown dikhega.
            </p>
          ) : (
            <div className="space-y-3">
              {state.subjects.map((sub) => {
                const mins = subTotals[sub.id] || 0;
                const pct = Math.round((mins / totalMins) * 100);
                return (
                  <div key={sub.id}>
                    <div className="flex items-center justify-between text-xs">
                      <strong className="font-semibold text-slate-800 dark:text-slate-200">
                        {sub.name}
                      </strong>
                      <span className="font-mono-num text-slate-500 dark:text-slate-400">
                        {formatMins(mins)} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{width: `${pct}%`, backgroundColor: sub.color}}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Settings: Strict Mode + Exam Target */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <h3 className="font-display mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
            Settings · Strict Rules &amp; Exam Target
          </h3>

          <div className="mb-4 space-y-2.5">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                  <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Strict Task Lock (Bhut Sakt Mode)
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Jab tak task ka full timer (e.g. 12:30–2:30) pura na ho tab tak task complete nahi hoga.
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleStrictMode}
                className={`min-h-[38px] shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                  state.strictMode
                    ? 'bg-[#0c2340] text-white'
                    : 'border border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                {state.strictMode ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Auto Focus App Lock on Timer Start
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Strict task start hote hi distraction apps automatic block ho jayenge.
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleAutoFocusOnStrict}
                className={`min-h-[38px] shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                  state.autoFocusOnStrict
                    ? 'bg-[#0284c7] text-white'
                    : 'border border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                {state.autoFocusOnStrict ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSaveSettings(examName, examDate, parseFloat(dailyGoal) || state.dailyGoalHours);
            }}
            className="space-y-2.5"
          >
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="Exam Target (e.g. NDA II 2027 + 11th Board)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <input
                type="number"
                step="0.5"
                min="1"
                max="18"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                placeholder="Daily Target (Hours)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="min-h-[44px] w-full rounded-xl bg-[#0284c7] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Save Settings
            </button>
          </form>
        </section>

        {/* Backup & Restore */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Data Backup &amp; Restore
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <Sparkles className="h-3 w-3" />
              Design &amp; Created by Atharv Singh
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onExportBackup}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              Export Backup
            </button>

            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap">
              <Upload className="h-4 w-4" />
              Import Backup
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImportBackup(file);
                  e.target.value = '';
                }}
              />
            </label>

            {confirmReset ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetAll();
                    setConfirmReset(false);
                  }}
                  className="min-h-[44px] rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-[44px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 whitespace-nowrap"
              >
                <Trash2 className="h-4 w-4" />
                Reset All
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
