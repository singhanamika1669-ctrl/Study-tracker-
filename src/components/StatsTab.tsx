import React, {useState} from 'react';
import {Download, QrCode, ShieldAlert, Trash2, Upload} from 'lucide-react';
import {PadhaiState, WEEKDAYS, formatMins, getLocalDateStr} from '../types';
import {FighterJetSvg, IafFinFlashSvg} from './FighterJetIcon';
import {PWAInstallButton} from './PWAInstallButton';
import {QrCodeCard} from './QrCodeCard';

interface StatsTabProps {
  state: PadhaiState;
  onAddMock: (name: string, maths: number, gat: number) => void;
  onDeleteMock: (id: string) => void;
  onSaveSettings: (examName: string, examDate: string, dailyGoalHours: number) => void;
  onToggleStrictMode: () => void;
  onToggleAutoFocusOnStrict: () => void;
  onUpdateShareUrl: (url: string) => void;
  onShowToast: (msg: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetAll: () => void;
}

export const StatsTab: React.FC<StatsTabProps> = ({
  state,
  onAddMock,
  onDeleteMock,
  onSaveSettings,
  onToggleStrictMode,
  onToggleAutoFocusOnStrict,
  onUpdateShareUrl,
  onShowToast,
  onExportBackup,
  onImportBackup,
  onResetAll,
}) => {
  const [mockName, setMockName] = useState('');
  const [mockMaths, setMockMaths] = useState('');
  const [mockGat, setMockGat] = useState('');

  const [examName, setExamName] = useState(state.examName);
  const [examDate, setExamDate] = useState(state.examDate);
  const [dailyGoal, setDailyGoal] = useState(String(state.dailyGoalHours));
  const [confirmReset, setConfirmReset] = useState(false);

  // Weekly chart data
  const days = Array.from({length: 7}, (_, idx) => {
    const i = 6 - idx;
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateStr(d);
    const mins = state.logs.filter((l) => l.date === dateStr).reduce((s, l) => s + Number(l.mins), 0);
    return {
      label: WEEKDAYS[d.getDay()],
      hours: +(mins / 60).toFixed(1),
      mins,
    };
  });

  const maxHours = Math.max(state.dailyGoalHours || 6, ...days.map((d) => d.hours), 1);
  const weekMins = days.reduce((s, d) => s + d.mins, 0);
  const totalMins = state.logs.reduce((s, l) => s + Number(l.mins), 0);
  const totalKm = Object.values(state.ndaHabits).reduce((s, h) => s + (Number(h.runKm) || 0), 0);

  const subTotals: Record<string, number> = {};
  state.logs.forEach((l) => {
    subTotals[l.subjectId] = (subTotals[l.subjectId] || 0) + Number(l.mins);
  });

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Left Column */}
      <div className="space-y-5">
        {/* NDA Mock Test Tracker */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/src/assets/images/iaf_squadron_crest_1795071260293.jpg"
                alt="Indian Air Force Wings"
                referrerPolicy="no-referrer"
                className="h-9 w-9 shrink-0 rounded-lg border border-sky-400/35 object-cover"
              />
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                NDA Flying Mock Test / PYQ Tracker
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Out of 900</span>
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
              placeholder="Test Name (e.g. NDA 2024 Paper-1 PYQ / Sunday Mock)"
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
                placeholder="Maths (/300)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0c2340] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <input
                type="number"
                step="0.5"
                min="0"
                max="600"
                value={mockGat}
                onChange={(e) => setMockGat(e.target.value)}
                placeholder="GAT (/600)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0c2340] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="min-h-[44px] w-full rounded-xl bg-[#0c2340] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
            >
              + Save Mock Score
            </button>
          </form>

          <p className="mb-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Note: NDA pass karne ke liye Maths (75+/300) aur GAT (150+/600) dono me kam se kam 25% aur
            total ~360+ score safe maana jata hai.
          </p>

          {state.mockTests.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Abhi koi mock test score nahi hai. Pehla PYQ ya Mock test dekar score daalo!
            </p>
          ) : (
            <div className="space-y-2.5">
              {state.mockTests.map((m) => {
                const total = +(m.maths + m.gat).toFixed(1);
                const mathsPass = m.maths >= 75;
                const gatPass = m.gat >= 150;
                const status =
                  !mathsPass || !gatPass
                    ? {
                        label: !mathsPass ? 'Maths < 25%' : 'GAT < 25%',
                        cls: 'text-rose-700 dark:text-rose-400',
                      }
                    : total >= 360
                      ? {label: 'Safe Zone', cls: 'text-emerald-700 dark:text-emerald-400'}
                      : {label: 'Need 360+', cls: 'text-amber-700 dark:text-amber-400'};

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        <span className="truncate">{m.name}</span>
                        <span className="font-mono-num">· {total}/900</span>
                        <span className={`text-xs font-bold ${status.cls}`}>· {status.label}</span>
                      </div>
                      <p className="font-mono-num mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {m.date} · Maths: {m.maths}/300 · GAT: {m.gat}/600
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

        {/* Download & Share App QR Code + Mobile PWA Install */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-[#0284c7] dark:text-sky-400" />
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                App Download QR &amp; Mobile Install
              </h3>
            </div>
            <IafFinFlashSvg className="h-3.5 w-6 rounded-[2px] border border-slate-200 dark:border-slate-700" />
          </div>
          <div className="mb-4">
            <PWAInstallButton onShowToast={onShowToast} />
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
        {/* Weekly Chart */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="mb-4 flex items-center gap-2">
            <FighterJetSvg className="h-4 w-4 -rotate-12 text-[#0284c7] dark:text-sky-400" />
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Pichle 7 Din ki Sortie Hours
            </h3>
          </div>

          <div className="flex h-40 items-end justify-between gap-2 pt-4">
            {days.map((d, index) => {
              const heightPct = Math.round((d.hours / maxHours) * 100);
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

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
              <strong className="font-mono-num block text-base font-bold text-[#0284c7] dark:text-sky-400">
                {formatMins(weekMins)}
              </strong>
              <span className="text-xs text-slate-500 dark:text-slate-400">Last 7 Days</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
              <strong className="font-mono-num block text-base font-bold text-[#0284c7] dark:text-sky-400">
                {formatMins(totalMins)}
              </strong>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Studied</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
              <strong className="font-mono-num block text-base font-bold text-[#0284c7] dark:text-sky-400">
                {totalKm.toFixed(1)} km
              </strong>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Running</span>
            </div>
          </div>
        </section>

        {/* Subject Breakdown */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <h3 className="font-display mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
            Subject-wise Time
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

        {/* Backup & Restore */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <h3 className="font-display mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
            Data Backup &amp; Restore
          </h3>
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
