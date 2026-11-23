import React, {useEffect, useState} from 'react';
import {
  BookOpenCheck,
  Camera,
  CheckCircle2,
  ClipboardList,
  Cpu,
  FileText,
  HelpCircle,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  Upload,
  WifiOff,
  XCircle,
} from 'lucide-react';
import {
  PadhaiState,
  SolvedQuestionItem,
  StudyNoteEntry,
  SundayTestSession,
  getLocalDateStr,
} from '../types';
import {compressImageFile} from '../utils/imageUtils';
import {solveQuestionOffline} from '../utils/offlineSolver';
import {buildOfflineSundayTest} from '../utils/offlineSundayTest';

interface SmartBuddyTabProps {
  state: PadhaiState;
  onSaveSolvedQuestion: (item: SolvedQuestionItem) => void;
  onDeleteSolvedQuestion: (id: string) => void;
  onAddStudyNote: (note: StudyNoteEntry) => void;
  onDeleteStudyNote: (id: string) => void;
  onSaveSundayTest: (test: SundayTestSession) => void;
  onAnswerSundayTest: (testId: string, questionId: string, optionIdx: number) => void;
  onSubmitSundayTest: (testId: string) => void;
  onDeleteSundayTest: (testId: string) => void;
  onShowToast: (msg: string) => void;
}

const SOLVER_SUBJECTS = [
  'Auto',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Science',
  'English',
  'Hindi',
  'Social Science / NDA GAT',
];

const QUICK_OFFLINE_DEMOS = [
  {label: 'x^2-5x+6=0', text: 'x^2-5x+6=0'},
  {label: 'V=12, I=3', text: 'V=12, I=3'},
  {label: 'm=5, a=4', text: 'm=5, a=4'},
  {label: 'sin(30)+cos(60)', text: 'sin(30)+cos(60)'},
  {label: 'Sandhi / Samas', text: 'Sandhi Samas Alankar rules'},
  {label: 'Active-Passive', text: 'Active Passive tense rules'},
];

export const SmartBuddyTab: React.FC<SmartBuddyTabProps> = ({
  state,
  onSaveSolvedQuestion,
  onDeleteSolvedQuestion,
  onAddStudyNote,
  onDeleteStudyNote,
  onSaveSundayTest,
  onAnswerSundayTest,
  onSubmitSundayTest,
  onDeleteSundayTest,
  onShowToast,
}) => {
  const isHindi = state.boardMedium === 'up_hindi';
  const [subTab, setSubTab] = useState<'solver' | 'sunday'>('solver');

  // --- Smart Buddy Solver State ---
  const [solverSubject, setSolverSubject] = useState('Auto');
  const [questionText, setQuestionText] = useState('');
  const [attachedPhoto, setAttachedPhoto] = useState<{
    dataUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [solving, setSolving] = useState(false);

  // --- Study Notes & Sunday Test State ---
  const [noteSubject, setNoteSubject] = useState(state.subjects[0]?.name || 'Maths');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSummary, setNoteSummary] = useState('');
  const [notePhoto, setNotePhoto] = useState<{
    dataUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [generatingTest, setGeneratingTest] = useState(false);

  useEffect(() => {
    if (state.subjects.length > 0 && !state.subjects.some((s) => s.name === noteSubject)) {
      setNoteSubject(state.subjects[0].name);
    }
  }, [state.subjects, noteSubject]);

  const handleQuestionPhotoPick = async (file: File) => {
    try {
      const compressed = await compressImageFile(file, 960, 0.78);
      setAttachedPhoto(compressed);
      onShowToast('Question photo ready! Ab Solve Question dabao.');
    } catch {
      onShowToast('Photo load karne me dikkat aayi.');
    }
  };

  const handleNotePhotoPick = async (file: File) => {
    try {
      const compressed = await compressImageFile(file, 900, 0.72);
      setNotePhoto(compressed);
      onShowToast('Notes photo attach ho gaya!');
    } catch {
      onShowToast('Notes photo load nahi ho saka.');
    }
  };

  const handleSolveQuestion = async (forceOffline = false) => {
    if (!questionText.trim() && !attachedPhoto) {
      onShowToast('Pehle question likho ya photo click/upload karo!');
      return;
    }

    setSolving(true);
    try {
      let solvedBy: 'gemini' | 'offline' = 'offline';
      let result = null as null | {
        subject: string;
        conceptUsed: string;
        steps: string[];
        finalAnswer: string;
        tip: string;
      };

      const canTryOnline =
        !forceOffline && (typeof navigator === 'undefined' || navigator.onLine);

      if (canTryOnline) {
        try {
          const resp = await fetch('/api/gemini/solve', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              questionText: questionText.trim(),
              subject: solverSubject,
              studentClass: state.studentClass,
              boardMedium: state.boardMedium,
              imageBase64: attachedPhoto?.base64,
              imageMimeType: attachedPhoto?.mimeType,
            }),
          });
          const data = (await resp.json()) as {
            ok?: boolean;
            result?: {
              subject: string;
              conceptUsed: string;
              steps: string[];
              finalAnswer: string;
              tip: string;
            };
          };
          if (data.ok && data.result) {
            result = data.result;
            solvedBy = 'gemini';
          }
        } catch {
          // Graceful fallback to offline solver
        }
      }

      if (!result) {
        result = solveQuestionOffline(
          questionText,
          solverSubject,
          state.boardMedium,
          Boolean(attachedPhoto),
        );
        solvedBy = 'offline';
      }

      const item: SolvedQuestionItem = {
        id: `sb_${Date.now()}`,
        timestamp: Date.now(),
        subject: result.subject,
        questionText:
          questionText.trim() ||
          (attachedPhoto ? 'Photo Question Uploaded' : 'Question'),
        imageDataUrl: attachedPhoto?.dataUrl,
        conceptUsed: result.conceptUsed,
        steps: result.steps,
        finalAnswer: result.finalAnswer,
        tip: result.tip,
        solvedBy,
      };

      onSaveSolvedQuestion(item);
      onShowToast(
        solvedBy === 'gemini'
          ? 'Smart Buddy ne AI Vision se question solve kar diya!'
          : 'Offline Engine (Bina Data) ne solution ready kar diya!',
      );
    } finally {
      setSolving(false);
    }
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteSummary.trim() && !notePhoto) {
      onShowToast('Note ka topic ya photo zaroor daalo!');
      return;
    }
    const entry: StudyNoteEntry = {
      id: `note_${Date.now()}`,
      date: getLocalDateStr(),
      timestamp: Date.now(),
      subject: noteSubject || 'General',
      title: noteTitle.trim() || `${noteSubject} Notes`,
      textSummary: noteSummary.trim(),
      imageDataUrl: notePhoto?.dataUrl,
    };
    onAddStudyNote(entry);
    setNoteTitle('');
    setNoteSummary('');
    setNotePhoto(null);
    onShowToast('Notes save ho gaye! Sunday Test me include honge.');
  };

  const handleGenerateSundayTest = async () => {
    setGeneratingTest(true);
    try {
      const todayMs = Date.now();
      const weekAgoMs = todayMs - 7 * 86_400_000;
      const weeklyLogs = state.logs.filter((l) => l.timestamp >= weekAgoMs);
      const weeklyNotes = state.studyNotes.filter((n) => n.timestamp >= weekAgoMs);
      const studiedTopics = [
        ...weeklyLogs.map((l) => l.topic),
        ...state.onlineClasses.map((c) => c.title),
      ].slice(0, 20);

      let testTitle = '';
      let questions: SundayTestSession['questions'] = [];
      let source: 'gemini' | 'offline' = 'offline';

      if (typeof navigator === 'undefined' || navigator.onLine) {
        try {
          const noteImages = weeklyNotes
            .filter((n) => n.imageDataUrl)
            .slice(0, 3)
            .map((n) => ({
              base64: (n.imageDataUrl || '').split(',')[1] || '',
              mimeType: 'image/jpeg',
            }));

          const resp = await fetch('/api/gemini/sunday-test', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              notesTextList: weeklyNotes.map((n) => `${n.subject}: ${n.title} (${n.textSummary})`),
              noteImages,
              studiedTopics,
              studentClass: state.studentClass,
              studyTrack: state.studyTrack,
              boardMedium: state.boardMedium,
              questionCount: 10,
            }),
          });
          const data = (await resp.json()) as {
            ok?: boolean;
            testTitle?: string;
            questions?: SundayTestSession['questions'];
          };
          if (data.ok && Array.isArray(data.questions) && data.questions.length > 0) {
            testTitle = data.testTitle || 'Sunday Weekly Test';
            questions = data.questions;
            source = 'gemini';
          }
        } catch {
          // Fallback to offline Sunday test builder
        }
      }

      if (questions.length === 0) {
        const offlineRes = buildOfflineSundayTest({
          notes: weeklyNotes.length > 0 ? weeklyNotes : state.studyNotes,
          logs: weeklyLogs.length > 0 ? weeklyLogs : state.logs,
          onlineClasses: state.onlineClasses,
          studentClass: state.studentClass,
          studyTrack: state.studyTrack,
          boardMedium: state.boardMedium,
        });
        testTitle = offlineRes.testTitle;
        questions = offlineRes.questions;
        source = 'offline';
      }

      const session: SundayTestSession = {
        id: `stest_${Date.now()}`,
        createdAtMs: Date.now(),
        dateStr: getLocalDateStr(),
        title: testTitle,
        questions,
        userAnswers: {},
        submitted: false,
        score: 0,
        source,
      };
      onSaveSundayTest(session);
      onShowToast(
        source === 'gemini'
          ? 'Sunday Revision Test aapke notes & classes se ready hai!'
          : 'Offline Sunday Test aapke topics se ban gaya!',
      );
    } finally {
      setGeneratingTest(false);
    }
  };

  const latestTest = state.sundayTests[0] || null;
  const isSundayToday = new Date().getDay() === 0;

  return (
    <div className="space-y-5">
      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <button
            type="button"
            onClick={() => setSubTab('solver')}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              subTab === 'solver'
                ? 'bg-[#0c2340] text-white dark:bg-sky-500 dark:text-slate-950'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Smart Buddy Solver</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('sunday')}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              subTab === 'sunday'
                ? 'bg-[#0c2340] text-white dark:bg-sky-500 dark:text-slate-950'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Sunday Test &amp; Notes ({state.studyNotes.length})</span>
          </button>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Cpu className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            {isHindi
              ? 'UP Board Hindi + Offline Solver Active'
              : 'English + Offline Solver Active'}
          </span>
        </span>
      </div>

      {subTab === 'solver' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.05fr_1.25fr]">
          {/* Question Input Card */}
          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
                <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  Smart Buddy · All-Subject Solver
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Bina Data Ready
              </span>
            </div>

            <p className="mb-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {isHindi
                ? 'Maths, Physics, Chemistry, Biology, English, Hindi ya GAT ke mushkil sawal ka photo click/upload karein ya equation likhein. Online par AI Vision aur bina data ke Offline Engine turant solve karega.'
                : 'Click/upload a photo or type any question across Maths, Physics, Chemistry, Biology, English, Hindi, or GAT. Uses AI Vision online and deterministic Offline Engine without data.'}
            </p>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Subject Chunein
              </label>
              <select
                value={solverSubject}
                onChange={(e) => setSolverSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {SOLVER_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s === 'Auto' ? 'All Subjects (Auto-Detect)' : s}
                  </option>
                ))}
              </select>
            </div>

            {/* Camera & Upload Photo Row */}
            <div className="mb-3 grid grid-cols-2 gap-2.5">
              <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-[#0c2340] transition hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300">
                <Camera className="h-4 w-4" />
                <span>Camera se Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleQuestionPhotoPick(f);
                    e.target.value = '';
                  }}
                />
              </label>

              <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Upload className="h-4 w-4" />
                <span>Gallery Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleQuestionPhotoPick(f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            {attachedPhoto && (
              <div className="relative mb-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/60">
                <img
                  src={attachedPhoto.dataUrl}
                  alt="Uploaded question"
                  className="max-h-48 w-full rounded-lg object-contain"
                />
                <button
                  type="button"
                  onClick={() => setAttachedPhoto(null)}
                  className="mt-2 w-full rounded-lg bg-rose-50 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300"
                >
                  Remove Photo
                </button>
              </div>
            )}

            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder={
                isHindi
                  ? 'Question ya equation likho (e.g. x^2-5x+6=0, V=12 I=3, m=5 a=4, sin(30)+cos(60), ya kisi topic ka naam)...'
                  : 'Type question, equation, or values from photo (e.g. x^2-5x+6=0, V=12 I=3, Newton laws)...'
              }
              className="mb-2.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            {/* Quick Offline Test Chips */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {QUICK_OFFLINE_DEMOS.map((demo) => (
                <button
                  key={demo.label}
                  type="button"
                  onClick={() => setQuestionText(demo.text)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {demo.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={solving}
                onClick={() => void handleSolveQuestion(false)}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#0c2340] px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-95 disabled:opacity-60 dark:bg-sky-500 dark:text-slate-950"
              >
                {solving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{solving ? 'Solving...' : 'Solve with Smart Buddy'}</span>
              </button>

              <button
                type="button"
                disabled={solving}
                onClick={() => void handleSolveQuestion(true)}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-extrabold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
              >
                <WifiOff className="h-4 w-4" />
                <span>Solve Bina Data (Offline)</span>
              </button>
            </div>
          </section>

          {/* Solved Answers Feed */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Solved Questions Notebook ({state.solvedQuestions.length})
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Offline Saved
              </span>
            </div>

            {state.solvedQuestions.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center dark:bg-slate-800/50">
                <Sparkles className="mx-auto mb-2 h-8 w-8 text-[#0284c7] dark:text-sky-400" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Abhi koi solved question nahi hai
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Kisi bhi subject ka photo upload karein ya equation likhkar solve karein — sab
                  yahan offline revision ke liye save hoga.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {state.solvedQuestions.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-[#0284c7] dark:text-sky-400">
                          {item.subject} · {item.solvedBy === 'gemini' ? 'AI Vision' : 'Offline Solver'}
                        </p>
                        <h4 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                          {item.questionText}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteSolvedQuestion(item.id)}
                        aria-label="Delete solved question"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-rose-500 dark:hover:bg-slate-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {item.imageDataUrl && (
                      <img
                        src={item.imageDataUrl}
                        alt="Question snapshot"
                        className="mb-2.5 max-h-36 rounded-lg border border-slate-200 object-contain dark:border-slate-700"
                      />
                    )}

                    <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Concept: {item.conceptUsed}
                    </p>

                    <ol className="mb-3 list-inside list-decimal space-y-1 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                      {item.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>

                    <div className="rounded-lg bg-emerald-50 p-2.5 text-xs font-extrabold text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200">
                      Final Answer: {item.finalAnswer}
                    </div>

                    {item.tip && (
                      <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Exam Tip: {item.tip}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.95fr_1.35fr]">
          {/* Upload Weekly Notes Photos */}
          <section className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Apne Notes ka Photo &amp; Topics Add Karein
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Poore hafte ke copy notes ke photos aur topics yahan save karein — har Sunday ko
                inhi notes + live classes + self-study logs se automatic Sunday Test banega!
              </p>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-2.5">
              <select
                value={noteSubject}
                onChange={(e) => setNoteSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {state.subjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Chapter / Topic Title (e.g. Trigonometry Identities)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />

              <textarea
                rows={2}
                value={noteSummary}
                onChange={(e) => setNoteSummary(e.target.value)}
                placeholder="Important formulas ya points likhein (optional)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />

              <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-sky-400/70 bg-sky-50/70 px-3 py-2.5 text-xs font-bold text-[#0c2340] transition hover:bg-sky-100 dark:border-sky-400/40 dark:bg-sky-500/10 dark:text-sky-300">
                <Camera className="h-4 w-4" />
                <span>{notePhoto ? 'Notes Photo Selected (Change)' : 'Copy Notes ka Photo Click / Upload Karein'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleNotePhotoPick(f);
                    e.target.value = '';
                  }}
                />
              </label>

              {notePhoto && (
                <img
                  src={notePhoto.dataUrl}
                  alt="Study note preview"
                  className="max-h-36 w-full rounded-xl border border-slate-200 object-contain dark:border-slate-700"
                />
              )}

              <button
                type="submit"
                className="min-h-[44px] w-full rounded-xl bg-[#0284c7] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-95"
              >
                + Save Study Note
              </button>
            </form>

            {state.studyNotes.length > 0 && (
              <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Saved Weekly Notes ({state.studyNotes.length})
                </p>
                {state.studyNotes.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-center justify-between gap-2.5 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60"
                  >
                    {n.imageDataUrl && (
                      <img
                        src={n.imageDataUrl}
                        alt={n.title}
                        className="h-11 w-11 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                        {n.title}
                      </p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {n.subject} · {n.date}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteStudyNote(n.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sunday Test Generator & Interactive Quiz */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-display text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    Sunday Weekly Revision Test
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {isSundayToday
                    ? 'Aaj Sunday Hai! Weekly Test dene ka samay aa gaya!'
                    : 'Har Sunday ya kabhi bhi apne hafte bhar ke notes, live classes & study logs se test banayein.'}
                </p>
              </div>

              <button
                type="button"
                disabled={generatingTest}
                onClick={() => void handleGenerateSundayTest()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0c2340] px-4 py-2 text-xs font-extrabold text-white transition hover:opacity-95 disabled:opacity-60 dark:bg-sky-500 dark:text-slate-950"
              >
                {generatingTest ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>{generatingTest ? 'Generating Test...' : 'Generate Sunday Test'}</span>
              </button>
            </div>

            {!latestTest ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center dark:bg-slate-800/50">
                <ClipboardList className="mx-auto mb-2 h-8 w-8 text-[#0284c7]" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Abhi koi Sunday Test generate nahi hua hai
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Upar "Generate Sunday Test" dabakar turant 10-question revision test shuru karein
                  (Online &amp; Offline dono mode me kaam karta hai).
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {latestTest.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {latestTest.dateStr} · {latestTest.questions.length} MCQs ·{' '}
                      {latestTest.source === 'gemini' ? 'AI Custom From Notes' : 'Offline Smart Mix'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {latestTest.submitted && (
                      <span className="font-mono-num rounded-lg bg-emerald-600 px-3 py-1 text-xs font-extrabold text-white">
                        Score: {latestTest.score}/{latestTest.questions.length}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteSundayTest(latestTest.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {latestTest.questions.map((q, qIdx) => {
                    const picked = latestTest.userAnswers[q.id];
                    return (
                      <div
                        key={q.id}
                        className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700"
                      >
                        <p className="text-xs font-bold text-[#0284c7] dark:text-sky-400">
                          Q{qIdx + 1} · {q.subject}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {q.question}
                        </p>

                        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {q.options.map((opt, oIdx) => {
                            const isPicked = picked === oIdx;
                            const isCorrect = q.correctIndex === oIdx;
                            let cls =
                              'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200';
                            if (latestTest.submitted) {
                              if (isCorrect) {
                                cls =
                                  'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200';
                              } else if (isPicked && !isCorrect) {
                                cls =
                                  'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-500/20 dark:text-rose-200';
                              }
                            } else if (isPicked) {
                              cls =
                                'border-[#0284c7] bg-sky-50 text-[#0c2340] dark:border-sky-400 dark:bg-sky-500/20 dark:text-sky-200';
                            }

                            return (
                              <button
                                key={oIdx}
                                type="button"
                                disabled={latestTest.submitted}
                                onClick={() => onAnswerSundayTest(latestTest.id, q.id, oIdx)}
                                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${cls}`}
                              >
                                <span>
                                  {String.fromCharCode(65 + oIdx)}. {opt}
                                </span>
                                {latestTest.submitted && isCorrect && (
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                )}
                                {latestTest.submitted && isPicked && !isCorrect && (
                                  <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {latestTest.submitted && q.explanation && (
                          <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            Explanation: {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!latestTest.submitted && (
                  <button
                    type="button"
                    onClick={() => onSubmitSundayTest(latestTest.id)}
                    className="min-h-[46px] w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-700"
                  >
                    Submit Sunday Test &amp; Check Score
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
