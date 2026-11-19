import React, {useState} from 'react';
import {CalendarDays, ExternalLink, Play, Trash2, Video} from 'lucide-react';
import {
  OnlineClassSlot,
  PadhaiState,
  Subject,
  TimetableSlot,
  computeSlotDurationMins,
  formatMins,
} from '../types';

interface TimetableTabProps {
  state: PadhaiState;
  onAddSlot: (day: string, subjectId: string, start: string, end: string, task: string) => void;
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
  onAddSlot,
  onDeleteSlot,
  onStartStrictSlot,
  onAddOnlineClass,
  onDeleteOnlineClass,
  onStartStrictOnlineClass,
}) => {
  const [section, setSection] = useState<'study' | 'online'>('study');

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

  const [filterDay, setFilterDay] = useState('All');

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

  return (
    <div className="space-y-5">
      {/* Sub-mode Switcher */}
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
          Self-Study Timetable ({state.timetable.length})
        </button>
        <button
          type="button"
          onClick={() => setSection('online')}
          className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
            section === 'online'
              ? 'bg-[#0c2340] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
          }`}
        >
          <Video className="h-4 w-4" />
          Online Class Timetable ({state.onlineClasses.length})
        </button>
      </div>

      {section === 'study' ? (
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
