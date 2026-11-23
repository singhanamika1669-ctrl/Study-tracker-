import React, {useEffect, useState} from 'react';
import {
  BookOpen,
  CalendarDays,
  Camera,
  ExternalLink,
  Loader2,
  Play,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import {
  AppTab,
  OnlineClassSlot,
  PadhaiState,
  Subject,
  TimetableSlot,
  computeSlotDurationMins,
  formatMins,
} from '../types';
import {compressImageFile} from '../utils/imageUtils';
import {
  ParsedTimetableCandidate,
  buildTemplateSlotsForTrack,
  matchSubjectId,
  parseTimetableTextOffline,
} from '../utils/offlineTimetableParser';

interface TimetableTabProps {
  state: PadhaiState;
  onSwitchTab: (tab: AppTab) => void;
  onAddSlot: (day: string, subjectId: string, start: string, end: string, task: string) => void;
  onImportSlots: (
    slots: Array<{day: string; subjectId: string; start: string; end: string; task: string}>,
  ) => void;
  onDeleteSlot: (slotId: string) => void;
  onStartStrictSlot: (slot: TimetableSlot) => void;
  onAddOnlineClass: (
    day: string,
    subjectId: string,
    platform: string,
    title: string,
    start: string,
    end: string,
    meetingUrl: string,
  ) => void;
  onDeleteOnlineClass: (classId: string) => void;
  onStartStrictOnlineClass: (cls: OnlineClassSlot) => void;
  onShowToast: (msg: string) => void;
}

const FILTER_DAYS = ['All', 'Daily', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CLASS_PLATFORMS = [
  'Physics Wallah',
  'YouTube Live',
  'Unacademy',
  'Zoom',
  'Google Meet',
  'School / Coaching App',
];

export const TimetableTab: React.FC<TimetableTabProps> = ({
  state,
  onSwitchTab,
  onAddSlot,
  onImportSlots,
  onDeleteSlot,
  onStartStrictSlot,
  onAddOnlineClass,
  onDeleteOnlineClass,
  onStartStrictOnlineClass,
  onShowToast,
}) => {
  const [section, setSection] = useState<'study' | 'online' | 'scan'>('study');

  // Self-study form state
  const [day, setDay] = useState('Daily');
  const [subjectId, setSubjectId] = useState(state.subjects[0]?.id || '');
  const [start, setStart] = useState('12:30');
  const [end, setEnd] = useState('14:30');
  const [task, setTask] = useState('');

  // Online class form state
  const [classDay, setClassDay] = useState('Daily');
  const [classSubjectId, setClassSubjectId] = useState(state.subjects[0]?.id || '');
  const [platform, setPlatform] = useState(CLASS_PLATFORMS[0]);
  const [classTitle, setClassTitle] = useState('');
  const [classStart, setClassStart] = useState('16:00');
  const [classEnd, setClassEnd] = useState('17:30');
  const [meetingUrl, setMeetingUrl] = useState('');

  // Photo / Copy Timetable Scanner State
  const [scanPhoto, setScanPhoto] = useState<{
    dataUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [scanRawText, setScanRawText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedCandidates, setScannedCandidates] = useState<ParsedTimetableCandidate[]>([]);

  const [filterDay, setFilterDay] = useState('All');

  useEffect(() => {
    if (state.subjects.length === 0) return;
    if (!state.subjects.some((s) => s.id === subjectId)) {
      setSubjectId(state.subjects[0].id);
    }
    if (!state.subjects.some((s) => s.id === classSubjectId)) {
      setClassSubjectId(state.subjects[0].id);
    }
  }, [state.subjects, subjectId, classSubjectId]);

  const getSubject = (id: string): Subject =>
    state.subjects.find((s) => s.id === id) || {
      id: 'general',
      name: 'General',
      totalChapters: 1,
      doneChapters: 0,
      color: '#64748b',
    };

  const filteredSlots = state.timetable
    .filter((t) => filterDay === 'All' || t.day === filterDay)
    .sort((a, b) => a.start.localeCompare(b.start));

  const filteredClasses = state.onlineClasses
    .filter((c) => filterDay === 'All' || c.day === filterDay)
    .sort((a, b) => a.start.localeCompare(b.start));

  const handleScanPickPhoto = async (file: File) => {
    try {
      const compressed = await compressImageFile(file, 960, 0.78);
      setScanPhoto(compressed);
      onShowToast('Copy timetable photo ready! Ab "Scan & Extract Timetable" dabao.');
    } catch {
      onShowToast('Photo load karne me dikkat aayi.');
    }
  };

  const handleScanTimetable = async () => {
    if (!scanPhoto && !scanRawText.trim()) {
      onShowToast('Copy timetable ka photo upload karo ya time lines likho!');
      return;
    }
    setScanning(true);
    try {
      let extracted: ParsedTimetableCandidate[] = [];
      if (typeof navigator === 'undefined' || navigator.onLine) {
        try {
          const resp = await fetch('/api/gemini/timetable-ocr', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              imageBase64: scanPhoto?.base64,
              imageMimeType: scanPhoto?.mimeType,
              rawText: scanRawText.trim(),
              studentClass: state.studentClass,
              studyTrack: state.studyTrack,
              availableSubjects: state.subjects.map((s) => s.name),
            }),
          });
          const data = (await resp.json()) as {
            ok?: boolean;
            slots?: Array<{
              day: string;
              start: string;
              end: string;
              subjectHint: string;
              task: string;
            }>;
          };
          if (data.ok && Array.isArray(data.slots) && data.slots.length > 0) {
            extracted = data.slots.map((sl) => ({
              day: sl.day || 'Daily',
              start: sl.start || '08:00',
              end: sl.end || '09:00',
              subjectHint: sl.subjectHint || 'Study',
              subjectId: matchSubjectId(sl.subjectHint || sl.task || '', state.subjects),
              task: sl.task || 'Study Session',
            }));
          }
        } catch {
          // Fallback to offline text parser
        }
      }

      if (extracted.length === 0 && scanRawText.trim()) {
        extracted = parseTimetableTextOffline(scanRawText, state.subjects);
      }

      if (extracted.length === 0) {
        onShowToast(
          'Offline mode me text format (e.g. 12:30-14:30 Maths) likhein ya preset use karein.',
        );
      } else {
        setScannedCandidates(extracted);
        onShowToast(`${extracted.length} slots extract ho gaye! Review karke Import karein.`);
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Sub-mode Switcher + Syllabus Link */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="inline-flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <button
            type="button"
            onClick={() => setSection('study')}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              section === 'study'
                ? 'bg-[#0c2340] text-white shadow-sm dark:bg-sky-500 dark:text-slate-950'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Study Timetable ({state.timetable.length})
          </button>
          <button
            type="button"
            onClick={() => setSection('online')}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              section === 'online'
                ? 'bg-[#0c2340] text-white shadow-sm dark:bg-sky-500 dark:text-slate-950'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <Video className="h-4 w-4" />
            Online Classes ({state.onlineClasses.length})
          </button>
          <button
            type="button"
            onClick={() => setSection('scan')}
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              section === 'scan'
                ? 'bg-[#0c2340] text-white shadow-sm dark:bg-sky-500 dark:text-slate-950'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <Camera className="h-4 w-4" />
            Copy Photo Scan
          </button>
        </div>

        <button
          type="button"
          onClick={() => onSwitchTab('syllabus')}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#0c2340] transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0f1b2d] dark:text-sky-300"
        >
          <BookOpen className="h-4 w-4" />
          <span>Syllabus &amp; Study Logs</span>
        </button>
      </div>

      {section === 'scan' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Copy / Notebook Photo se Timetable Banayein
              </h3>
            </div>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              Apni copy me likhe timetable ki photo click/upload karein (AI automatically slots
              nikalega) ya neeche har line par time likhkar offline parse karein.
            </p>

            <div className="mb-3 grid grid-cols-2 gap-2.5">
              <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-[#0c2340] dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300">
                <Camera className="h-4 w-4" />
                <span>Camera Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleScanPickPhoto(f);
                    e.target.value = '';
                  }}
                />
              </label>

              <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Upload className="h-4 w-4" />
                <span>Upload Copy Pic</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleScanPickPhoto(f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            {scanPhoto && (
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/60">
                <img
                  src={scanPhoto.dataUrl}
                  alt="Notebook timetable preview"
                  className="max-h-44 w-full rounded-lg object-contain"
                />
              </div>
            )}

            <textarea
              rows={4}
              value={scanRawText}
              onChange={(e) => setScanRawText(e.target.value)}
              placeholder={'Offline/Text format example:\n05:30 - 06:30 Morning PT + Vocab\n12:30 - 14:30 Maths Class\n18:00 - 19:30 Physics Numericals'}
              className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={scanning}
                onClick={() => void handleScanTimetable()}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#0c2340] px-4 py-2 text-xs font-extrabold text-white disabled:opacity-60 dark:bg-sky-500 dark:text-slate-950"
              >
                {scanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>{scanning ? 'Scanning...' : 'Scan & Extract Timetable'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const template = buildTemplateSlotsForTrack(
                    state.studentClass,
                    state.studyTrack,
                    state.boardMedium,
                    state.subjects,
                  );
                  setScannedCandidates(template);
                  onShowToast('Aapki Class/Track ka smart daily routine load ho gaya!');
                }}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Load Class {state.studentClass} Preset
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Extracted Daily Slots ({scannedCandidates.length})
              </h3>
              {scannedCandidates.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onImportSlots(
                      scannedCandidates.map((c) => ({
                        day: c.day,
                        subjectId: c.subjectId,
                        start: c.start,
                        end: c.end,
                        task: c.task,
                      })),
                    );
                    setScannedCandidates([]);
                    setSection('study');
                  }}
                  className="min-h-[38px] rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-700"
                >
                  + Import All to Timetable
                </button>
              )}
            </div>

            {scannedCandidates.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Photo scan karne ya template load karne ke baad yahan aapke daily time slots
                dikhenge.
              </p>
            ) : (
              <div className="space-y-2">
                {scannedCandidates.map((item, idx) => {
                  const sub = getSubject(item.subjectId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                          {sub.name} — {item.task}
                        </p>
                        <p className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                          {item.day} · {item.start} – {item.end}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setScannedCandidates((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-500"
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
      ) : section === 'study' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.95fr_1.35fr]">
          {/* Add Self-Study Slot */}
          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <h3 className="font-display mb-4 text-base font-bold text-slate-900 dark:text-slate-100">
              Naya Study Slot Add Karein
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddSlot(day, subjectId, start, end, task);
                setTask('');
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="Daily">Har Roz (Daily)</option>
                  <option value="Mon">Monday</option>
                  <option value="Tue">Tuesday</option>
                  <option value="Wed">Wednesday</option>
                  <option value="Thu">Thursday</option>
                  <option value="Fri">Friday</option>
                  <option value="Sat">Saturday</option>
                  <option value="Sun">Sunday (Mock Test Day)</option>
                </select>

                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {state.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Kya padhna hai? (e.g. 12:30-2:30 Maths PYQ)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />

              <button
                type="submit"
                className="min-h-[44px] w-full rounded-xl bg-[#0284c7] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Add to Timetable
              </button>
            </form>
          </section>

          {/* Study Schedule List */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <h3 className="font-display mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
              Tumhara Study Schedule
            </h3>

            <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
              {FILTER_DAYS.map((dayOption) => {
                const active = filterDay === dayOption;
                return (
                  <button
                    key={dayOption}
                    type="button"
                    onClick={() => setFilterDay(dayOption)}
                    className={`min-h-[38px] shrink-0 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                      active
                        ? 'border-[#0284c7] bg-[#0284c7] text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {dayOption}
                  </button>
                );
              })}
            </div>

            {filteredSlots.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Is filter mein koi slot nahi hai.
              </p>
            ) : (
              <div className="space-y-2.5">
                {filteredSlots.map((slot) => {
                  const sub = getSubject(slot.subjectId);
                  const durMins = computeSlotDurationMins(slot.start, slot.end);
                  return (
                    <div
                      key={slot.id}
                      onClick={() => onStartStrictSlot(slot)}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-3 transition hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{backgroundColor: sub.color}}
                          />
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {sub.name} — {slot.task}
                          </p>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {slot.day} · {slot.start} to {slot.end} ({formatMins(durMins)})
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartStrictSlot(slot);
                          }}
                          className="inline-flex h-10 items-center gap-1 rounded-lg bg-[#0284c7] px-3 text-xs font-bold text-white"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Start</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSlot(slot.id);
                          }}
                          aria-label={`Delete ${slot.task}`}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.95fr_1.35fr]">
          {/* Add Online Class Slot */}
          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <h3 className="font-display mb-4 text-base font-bold text-slate-900 dark:text-slate-100">
              Online Class Add Karein
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddOnlineClass(
                  classDay,
                  classSubjectId,
                  platform,
                  classTitle,
                  classStart,
                  classEnd,
                  meetingUrl,
                );
                setClassTitle('');
                setMeetingUrl('');
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <select
                  value={classDay}
                  onChange={(e) => setClassDay(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0c2340] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="Daily">Har Roz (Daily)</option>
                  <option value="Mon">Monday</option>
                  <option value="Tue">Tuesday</option>
                  <option value="Wed">Wednesday</option>
                  <option value="Thu">Thursday</option>
                  <option value="Fri">Friday</option>
                  <option value="Sat">Saturday</option>
                  <option value="Sun">Sunday</option>
                </select>

                <select
                  value={classSubjectId}
                  onChange={(e) => setClassSubjectId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0c2340] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {state.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0c2340] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {CLASS_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    Platform: {p}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Class Start
                  </label>
                  <input
                    type="time"
                    value={classStart}
                    onChange={(e) => setClassStart(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0c2340] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Class End
                  </label>
                  <input
                    type="time"
                    value={classEnd}
                    onChange={(e) => setClassEnd(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0c2340] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <input
                type="text"
                value={classTitle}
                onChange={(e) => setClassTitle(e.target.value)}
                placeholder="Class Title (e.g. Trigonometry Live Batch)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0c2340] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />

              <input
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="Class Link optional (YouTube / Meet / PW URL)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0c2340] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />

              <button
                type="submit"
                className="min-h-[44px] w-full rounded-xl bg-[#0c2340] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
              >
                + Add Online Class
              </button>
            </form>
          </section>

          {/* Online Class Schedule List */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <h3 className="font-display mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
              Online Class Schedule
            </h3>

            <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
              {FILTER_DAYS.map((dayOption) => {
                const active = filterDay === dayOption;
                return (
                  <button
                    key={dayOption}
                    type="button"
                    onClick={() => setFilterDay(dayOption)}
                    className={`min-h-[38px] shrink-0 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                      active
                        ? 'border-[#0c2340] bg-[#0c2340] text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {dayOption}
                  </button>
                );
              })}
            </div>

            {filteredClasses.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Is filter mein koi online class nahi hai.
              </p>
            ) : (
              <div className="space-y-2.5">
                {filteredClasses.map((cls) => {
                  const sub = getSubject(cls.subjectId);
                  const durMins = computeSlotDurationMins(cls.start, cls.end);
                  return (
                    <div
                      key={cls.id}
                      onClick={() => onStartStrictOnlineClass(cls)}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-3 transition hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{backgroundColor: sub.color}}
                          />
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {cls.title}
                          </p>
                          <span className="rounded bg-[#0c2340]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#0c2340] dark:bg-emerald-500/20 dark:text-emerald-300">
                            {cls.platform}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {cls.day} · {cls.start} to {cls.end} ({formatMins(durMins)}) · {sub.name}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {cls.meetingUrl && (
                          <a
                            href={cls.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-[#0f1b2d] dark:text-slate-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartStrictOnlineClass(cls);
                          }}
                          className="inline-flex h-10 items-center gap-1 rounded-lg bg-[#0c2340] px-3 text-xs font-bold text-white"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Class Timer</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteOnlineClass(cls.id);
                          }}
                          aria-label={`Delete ${cls.title}`}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
