import React, {useState} from 'react';
import {Trash2} from 'lucide-react';
import {PadhaiState, Subject, formatMins} from '../types';

interface SyllabusTabProps {
  state: PadhaiState;
  onAddSubject: (name: string, totalChapters: number, color: string) => void;
  onUpdateChapter: (subjectId: string, delta: number) => void;
  onDeleteSubject: (subjectId: string) => void;
  onDeleteLog: (logId: string) => void;
}

export const SyllabusTab: React.FC<SyllabusTabProps> = ({
  state,
  onAddSubject,
  onUpdateChapter,
  onDeleteSubject,
  onDeleteLog,
}) => {
  const [subName, setSubName] = useState('');
  const [subChapters, setSubChapters] = useState('');
  const [subColor, setSubColor] = useState('#0284c7');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const getSubject = (id: string): Subject =>
    state.subjects.find((s) => s.id === id) || {
      id: 'general',
      name: 'General',
      totalChapters: 1,
      doneChapters: 0,
      color: '#64748b',
    };

  const recentLogs = state.logs.slice(0, 20);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-5">
        {/* Add Subject */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <h3 className="font-display mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
            Naya Subject Add Karein
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!subName.trim()) {
                onAddSubject('', 10, subColor);
                return;
              }
              onAddSubject(subName.trim(), parseInt(subChapters, 10) || 10, subColor);
              setSubName('');
              setSubChapters('');
            }}
            className="space-y-2.5"
          >
            <input
              type="text"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder="Subject Name (e.g. NDA Polity, Computer)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <div className="grid grid-cols-[1fr_72px] gap-2.5">
              <input
                type="number"
                min="1"
                value={subChapters}
                onChange={(e) => setSubChapters(e.target.value)}
                placeholder="Total Chapters (e.g. 15)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <input
                type="color"
                value={subColor}
                onChange={(e) => setSubColor(e.target.value)}
                aria-label="Subject Color"
                className="h-[42px] w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <button
              type="submit"
              className="min-h-[44px] w-full rounded-xl bg-[#0c2340] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 dark:bg-sky-500 dark:text-slate-950"
            >
              + Add Subject
            </button>
          </form>
        </section>

        {/* Subjects List */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <h3 className="font-display mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
            UP Board 11th + NDA Syllabus
          </h3>
          <div className="space-y-3">
            {state.subjects.map((sub) => {
              const pct = Math.round((sub.doneChapters / Math.max(1, sub.totalChapters)) * 100);
              const isConfirming = confirmDeleteId === sub.id;
              return (
                <div
                  key={sub.id}
                  className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{backgroundColor: sub.color}}
                      />
                      <strong className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                        {sub.name}
                      </strong>
                    </div>
                    <span className="font-mono-num shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {sub.doneChapters}/{sub.totalChapters} Ch ({pct}%)
                    </span>
                  </div>

                  <div className="my-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{width: `${pct}%`, backgroundColor: sub.color}}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateChapter(sub.id, -1)}
                        className="min-h-[38px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-[#0f1b2d] dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
                      >
                        -1 Ch
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateChapter(sub.id, 1)}
                        className="min-h-[38px] rounded-lg bg-[#0284c7] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-95 whitespace-nowrap"
                      >
                        +1 Ch Done
                      </button>
                    </div>

                    {isConfirming ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteSubject(sub.id);
                            setConfirmDeleteId(null);
                          }}
                          className="min-h-[38px] rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[38px] rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(sub.id)}
                        aria-label={`Delete ${sub.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Recent Study History */}
      <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
        <h3 className="font-display mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
          Recent Study History
        </h3>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Abhi tak koi study log nahi hai.
          </p>
        ) : (
          <div className="space-y-2.5">
            {recentLogs.map((log) => {
              const sub = getSubject(log.subjectId);
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{backgroundColor: sub.color}}
                      />
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {sub.name} · {formatMins(log.mins)}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {log.date} · {log.topic} · Focus: {log.focus}/5
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteLog(log.id)}
                    aria-label="Delete study log"
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
  );
};
