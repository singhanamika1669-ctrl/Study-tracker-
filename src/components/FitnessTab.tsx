import React, {useEffect, useRef, useState} from 'react';
import {
  Activity,
  Anchor,
  CheckCircle2,
  Droplets,
  Flame,
  Gauge,
  MapPin,
  Navigation,
  Pause,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Shield,
  Timer as TimerIcon,
  Trash2,
} from 'lucide-react';
import {
  PadhaiState,
  RunningSession,
  WorkoutDefinition,
  WorkoutKind,
  WorkoutLogEntry,
  formatClock,
  getLocalDateStr,
  haversineDistanceKm,
} from '../types';
import {playTimerCompleteChime} from '../utils/alarmAudio';
import {acquireScreenWakeLock} from '../utils/backgroundAlarm';
import {getThemeMeta} from '../utils/themeConfig';
import {FighterJetSvg} from './FighterJetIcon';

interface FitnessTabProps {
  state: PadhaiState;
  onSaveRunSession: (session: RunningSession) => void;
  onDeleteRunSession: (id: string) => void;
  onAddWorkoutDef: (
    name: string,
    category: WorkoutDefinition['category'],
    kind: WorkoutKind,
    targetValue: number,
  ) => void;
  onDeleteWorkoutDef: (id: string) => void;
  onSaveWorkoutLog: (entry: WorkoutLogEntry) => void;
  onDeleteWorkoutLog: (id: string) => void;
  onUpdateWaterGlasses: (delta: number) => void;
  onShowToast: (msg: string) => void;
}

function formatPace(paceMinPerKm: number): string {
  if (!Number.isFinite(paceMinPerKm) || paceMinPerKm <= 0 || paceMinPerKm > 45) {
    return '--:--';
  }
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}:${String(secs === 60 ? 59 : secs).padStart(2, '0')}`;
}

export const FitnessTab: React.FC<FitnessTabProps> = ({
  state,
  onSaveRunSession,
  onDeleteRunSession,
  onAddWorkoutDef,
  onDeleteWorkoutDef,
  onSaveWorkoutLog,
  onDeleteWorkoutLog,
  onUpdateWaterGlasses,
  onShowToast,
}) => {
  const todayStr = getLocalDateStr();
  const theme = getThemeMeta(state.appTheme);

  // --- GPS Running Tracker State ---
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [gpsSignalState, setGpsSignalState] = useState<
    'idle' | 'searching' | 'locked' | 'error'
  >('idle');
  const [gpsFixCount, setGpsFixCount] = useState(0);
  const [lastCoords, setLastCoords] = useState<{lat: number; lng: number} | null>(null);
  const [runElapsedMs, setRunElapsedMs] = useState(0);
  const [runDistanceKm, setRunDistanceKm] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [maxSpeedKmh, setMaxSpeedKmh] = useState(0);
  const [gpsAccuracyM, setGpsAccuracyM] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [routePoints, setRoutePoints] = useState<Array<{lat: number; lng: number}>>([]);

  // Manual run entry fallback
  const [showManualRun, setShowManualRun] = useState(false);
  const [manualRunKm, setManualRunKm] = useState('2.4');
  const [manualRunMins, setManualRunMins] = useState('12');

  const runAccumulatedMsRef = useRef(0);
  const runSegmentStartRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);
  const lastGpsFixRef = useRef<{lat: number; lng: number; ts: number} | null>(null);
  const recentFixesRef = useRef<Array<{lat: number; lng: number; ts: number}>>([]);
  const lastMovementTsRef = useRef<number>(0);
  const smoothedSpeedRef = useRef<number>(0);
  const runStatusRef = useRef(runStatus);
  const gpsSignalStateRef = useRef(gpsSignalState);
  runStatusRef.current = runStatus;
  gpsSignalStateRef.current = gpsSignalState;

  // --- Workout Timer / Log State ---
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(
    () => state.workouts[0]?.id || '',
  );
  const [wkTimerMode, setWkTimerMode] = useState<'stopwatch' | 'countdown'>('countdown');
  const [wkCustomTargetSec, setWkCustomTargetSec] = useState(120);
  const [wkRunning, setWkRunning] = useState(false);
  const [wkElapsedMs, setWkElapsedMs] = useState(0);
  const [wkSetsCount, setWkSetsCount] = useState('3');
  const [wkRepsCount, setWkRepsCount] = useState('20');
  const wkAccMsRef = useRef(0);
  const wkSegStartRef = useRef(0);

  // Add new workout form state
  const [newWkName, setNewWkName] = useState('');
  const [newWkCategory, setNewWkCategory] =
    useState<WorkoutDefinition['category']>('Strength');
  const [newWkKind, setNewWkKind] = useState<WorkoutKind>('reps');
  const [newWkTarget, setNewWkTarget] = useState('30');

  const selectedWorkout =
    state.workouts.find((w) => w.id === selectedWorkoutId) || state.workouts[0];

  // Sync workout target preset when switching workout
  useEffect(() => {
    if (!selectedWorkout) return;
    if (selectedWorkout.kind === 'timed') {
      setWkTimerMode('countdown');
      setWkCustomTargetSec(selectedWorkout.targetValue);
    } else {
      setWkTimerMode('stopwatch');
      setWkRepsCount(String(selectedWorkout.targetValue));
    }
    wkAccMsRef.current = 0;
    setWkRunning(false);
    setWkElapsedMs(0);
  }, [selectedWorkout?.id]);

  // Running elapsed clock + speed idle decay loop
  useEffect(() => {
    if (runStatus !== 'running') return;
    runSegmentStartRef.current = Date.now();
    const id = window.setInterval(() => {
      setRunElapsedMs(runAccumulatedMsRef.current + (Date.now() - runSegmentStartRef.current));
      if (
        lastMovementTsRef.current > 0 &&
        Date.now() - lastMovementTsRef.current > 4500 &&
        smoothedSpeedRef.current > 0
      ) {
        smoothedSpeedRef.current = 0;
        setCurrentSpeedKmh(0);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [runStatus]);

  // Keep screen awake during active GPS run so mobile browser doesn't sleep GPS
  useEffect(() => {
    if (runStatus !== 'running') return;
    let activeSentinel: WakeLockSentinel | null = null;
    let cancelled = false;
    void acquireScreenWakeLock().then(({sentinel}) => {
      if (!sentinel) return;
      if (cancelled) {
        void sentinel.release().catch(() => {});
      } else {
        activeSentinel = sentinel;
      }
    });
    return () => {
      cancelled = true;
      if (activeSentinel) void activeSentinel.release().catch(() => {});
    };
  }, [runStatus]);

  // Cleanup GPS watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const stopGpsWatch = () => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const processGpsPosition = (pos: GeolocationPosition) => {
    const {latitude, longitude, accuracy, speed} = pos.coords;
    const nowTs = Date.now();
    const safeAccuracy = Number.isFinite(accuracy) ? Math.round(accuracy) : 25;

    gpsSignalStateRef.current = 'locked';
    setGpsSignalState('locked');
    setGpsFixCount((c) => c + 1);
    setGpsAccuracyM(safeAccuracy);
    setLastCoords({lat: latitude, lng: longitude});
    setGpsError(null);

    if (runStatusRef.current !== 'running') return;

    // Discard very noisy points once locked, but allow up to 120m for Indian urban/cloudy reception
    if (safeAccuracy > 120 && lastGpsFixRef.current !== null) {
      return;
    }

    const prev = lastGpsFixRef.current;
    const hardwareSpeedKmh =
      typeof speed === 'number' && Number.isFinite(speed) && speed >= 0 ? speed * 3.6 : null;

    if (!prev) {
      lastGpsFixRef.current = {lat: latitude, lng: longitude, ts: nowTs};
      recentFixesRef.current = [{lat: latitude, lng: longitude, ts: nowTs}];
      setRoutePoints([{lat: latitude, lng: longitude}]);
      if (hardwareSpeedKmh !== null && hardwareSpeedKmh > 0.4) {
        const clamped = Math.min(40, +hardwareSpeedKmh.toFixed(1));
        smoothedSpeedRef.current = clamped;
        lastMovementTsRef.current = nowTs;
        setCurrentSpeedKmh(clamped);
        setMaxSpeedKmh((m) => Math.max(m, clamped));
      }
      return;
    }

    const stepKm = haversineDistanceKm(prev.lat, prev.lng, latitude, longitude);
    const dtSec = Math.max(0.5, (nowTs - prev.ts) / 1000);
    const stepKmh = (stepKm / dtSec) * 3600;

    // Reject impossible teleport spikes (> 42 km/h for running)
    if (stepKmh > 42 && stepKm > 0.05) {
      return;
    }

    // Dynamic jitter threshold based on GPS accuracy (min 1.5m, up to 7m when accuracy is poor)
    const minStepKm = safeAccuracy <= 30 ? 0.0015 : safeAccuracy <= 65 ? 0.0035 : 0.007;

    let measuredKmh: number | null =
      hardwareSpeedKmh !== null && hardwareSpeedKmh > 0.35 ? hardwareSpeedKmh : null;

    if (stepKm >= minStepKm) {
      setRunDistanceKm((d) => +(d + stepKm).toFixed(4));
      lastGpsFixRef.current = {lat: latitude, lng: longitude, ts: nowTs};
      lastMovementTsRef.current = nowTs;

      // Rolling 5-second window for smoother & accurate speed when hardware speed is null/0
      recentFixesRef.current = [
        ...recentFixesRef.current.filter((f) => nowTs - f.ts <= 5000),
        {lat: latitude, lng: longitude, ts: nowTs},
      ];

      if (measuredKmh === null && recentFixesRef.current.length >= 2) {
        const oldest = recentFixesRef.current[0];
        const winKm = haversineDistanceKm(oldest.lat, oldest.lng, latitude, longitude);
        const winHours = Math.max(1, nowTs - oldest.ts) / 3_600_000;
        const winSpeed = winKm / winHours;
        measuredKmh = winSpeed > 0.3 ? winSpeed : stepKmh;
      } else if (measuredKmh === null) {
        measuredKmh = stepKmh;
      }

      setRoutePoints((pts) => {
        if (pts.length > 240) {
          return [...pts.filter((_, i) => i % 2 === 0), {lat: latitude, lng: longitude}];
        }
        return [...pts, {lat: latitude, lng: longitude}];
      });
    } else if (hardwareSpeedKmh !== null && hardwareSpeedKmh >= 0.4) {
      lastMovementTsRef.current = nowTs;
    }

    if (measuredKmh !== null) {
      const clampedRaw = Math.min(40, Math.max(0, measuredKmh));
      const smoothed =
        smoothedSpeedRef.current > 0
          ? smoothedSpeedRef.current * 0.35 + clampedRaw * 0.65
          : clampedRaw;
      const finalKmh = +smoothed.toFixed(1);
      smoothedSpeedRef.current = finalKmh;
      setCurrentSpeedKmh(finalKmh);
      setMaxSpeedKmh((m) => Math.max(m, finalKmh));
    }
  };

  const handleGpsError = (err: GeolocationPositionError) => {
    // Ignore transient timeout if we already have an active GPS lock while user stands still
    if (err.code === err.TIMEOUT && gpsSignalStateRef.current === 'locked') {
      return;
    }
    setGpsSignalState('error');
    if (err.code === err.PERMISSION_DENIED) {
      setGpsError(
        'GPS Location permission denied hai. Browser ke lock icon me Location "Allow" karein ya Manual Run log karein.',
      );
    } else if (err.code === err.TIMEOUT) {
      setGpsError(
        'GPS signal timeout (indoors ho sakta hai). Khule sky me "Check GPS" dabao ya Manual Run save karo.',
      );
    } else {
      setGpsError(
        'GPS position abhi unavailable hai. Phone ka Location/GPS ON karke dubara try karo.',
      );
    }
  };

  const startGpsWatch = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsSignalState('error');
      setGpsError('Is browser/device me GPS Geolocation supported nahi hai. Manual Run use karein.');
      return;
    }
    setGpsError(null);
    gpsSignalStateRef.current = 'searching';
    setGpsSignalState('searching');
    stopGpsWatch();

    // Fast initial fix attempt
    navigator.geolocation.getCurrentPosition(processGpsPosition, handleGpsError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 20000,
    });

    // Continuous tracking watcher
    watchIdRef.current = navigator.geolocation.watchPosition(
      processGpsPosition,
      handleGpsError,
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 25000,
      },
    );
  };

  const handleCheckGpsSignal = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onShowToast('Is device par GPS available nahi hai.');
      return;
    }
    setGpsSignalState('searching');
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        processGpsPosition(pos);
        onShowToast(`GPS Locked! Accuracy ±${Math.round(pos.coords.accuracy)}m`);
      },
      (err) => {
        handleGpsError(err);
        onShowToast('GPS lock nahi hua — Location permission ya sky signal check karein.');
      },
      {enableHighAccuracy: true, maximumAge: 0, timeout: 12000},
    );
  };

  const handleStartGpsRun = () => {
    if (runStatus === 'idle') {
      runAccumulatedMsRef.current = 0;
      setRunElapsedMs(0);
      setRunDistanceKm(0);
      setCurrentSpeedKmh(0);
      setMaxSpeedKmh(0);
      setGpsFixCount(0);
      setRoutePoints([]);
      lastGpsFixRef.current = null;
      recentFixesRef.current = [];
      smoothedSpeedRef.current = 0;
      lastMovementTsRef.current = 0;
    }
    setRunStatus('running');
    startGpsWatch();
    onShowToast('GPS Running Tracker ON! Speed aur distance live track ho raha hai.');
  };

  const handlePauseGpsRun = () => {
    if (runStatus !== 'running') return;
    runAccumulatedMsRef.current += Date.now() - runSegmentStartRef.current;
    setRunElapsedMs(runAccumulatedMsRef.current);
    setRunStatus('paused');
    setCurrentSpeedKmh(0);
    smoothedSpeedRef.current = 0;
    lastGpsFixRef.current = null;
    recentFixesRef.current = [];
    stopGpsWatch();
  };

  const handleResetGpsRun = () => {
    stopGpsWatch();
    runAccumulatedMsRef.current = 0;
    lastGpsFixRef.current = null;
    recentFixesRef.current = [];
    smoothedSpeedRef.current = 0;
    lastMovementTsRef.current = 0;
    setRunStatus('idle');
    setGpsSignalState('idle');
    setGpsFixCount(0);
    setRunElapsedMs(0);
    setRunDistanceKm(0);
    setCurrentSpeedKmh(0);
    setMaxSpeedKmh(0);
    setGpsAccuracyM(null);
    setRoutePoints([]);
  };

  const handleFinishGpsRun = () => {
    const finalMs =
      runStatus === 'running'
        ? runAccumulatedMsRef.current + (Date.now() - runSegmentStartRef.current)
        : runElapsedMs;
    const durationSec = Math.max(1, Math.round(finalMs / 1000));
    const hours = durationSec / 3600;
    const avgKmh = runDistanceKm > 0 && hours > 0 ? +(runDistanceKm / hours).toFixed(1) : 0;
    const pace = runDistanceKm > 0.02 ? +(durationSec / 60 / runDistanceKm).toFixed(2) : 0;
    const calories = Math.max(5, Math.round(runDistanceKm * 62 + (durationSec / 60) * 5));

    onSaveRunSession({
      id: `run_${Date.now()}`,
      date: todayStr,
      timestamp: Date.now(),
      durationSec,
      distanceKm: +runDistanceKm.toFixed(2),
      avgSpeedKmh: avgKmh,
      maxSpeedKmh: Math.max(avgKmh, maxSpeedKmh),
      paceMinPerKm: pace,
      calories,
      source: 'gps',
      route: routePoints.slice(-120),
    });
    handleResetGpsRun();
  };

  // --- Workout Timer Loop ---
  useEffect(() => {
    if (!wkRunning) return;
    wkSegStartRef.current = Date.now();
    const id = window.setInterval(() => {
      const current = wkAccMsRef.current + (Date.now() - wkSegStartRef.current);
      const targetMs = wkTimerMode === 'countdown' ? wkCustomTargetSec * 1000 : 0;
      if (targetMs > 0 && current >= targetMs) {
        wkAccMsRef.current = targetMs;
        setWkElapsedMs(targetMs);
        setWkRunning(false);
        playTimerCompleteChime();
        onShowToast(`${selectedWorkout?.name || 'Workout'} timer complete! Log save karo.`);
      } else {
        setWkElapsedMs(current);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [wkRunning, wkTimerMode, wkCustomTargetSec, selectedWorkout?.name]);

  const wkDisplayMs =
    wkTimerMode === 'countdown'
      ? Math.max(0, wkCustomTargetSec * 1000 - wkElapsedMs)
      : wkElapsedMs;

  const avgSpeedDisplay =
    runElapsedMs > 1000 && runDistanceKm > 0
      ? +((runDistanceKm / (runElapsedMs / 3_600_000))).toFixed(1)
      : 0;
  const livePaceDisplay =
    runDistanceKm >= 0.02 && runElapsedMs > 0
      ? runElapsedMs / 60_000 / runDistanceKm
      : 0;
  const estRunCalories = Math.round(runDistanceKm * 62 + (runElapsedMs / 60_000) * 4.5);

  // Today aggregates
  const todayRuns = state.runningLogs.filter((r) => r.date === todayStr);
  const todayRunKm = todayRuns.reduce((sum, r) => sum + r.distanceKm, 0);
  const todayWorkoutLogs = state.workoutLogs.filter((w) => w.date === todayStr);
  const todayWorkoutMins = Math.round(
    (todayRuns.reduce((s, r) => s + r.durationSec, 0) +
      todayWorkoutLogs.reduce((s, w) => s + w.durationSec, 0)) /
      60,
  );
  const todayCalories =
    todayRuns.reduce((s, r) => s + r.calories, 0) +
    todayWorkoutLogs.reduce((s, w) => s + w.calories, 0);
  const todayWater = state.waterGlasses[todayStr] || 0;

  // Build normalized SVG polyline for GPS Route Trace
  const routePolylinePoints = (() => {
    if (routePoints.length < 2) return '';
    const lats = routePoints.map((p) => p.lat);
    const lngs = routePoints.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const spanLat = Math.max(0.0002, maxLat - minLat);
    const spanLng = Math.max(0.0002, maxLng - minLng);
    return routePoints
      .map((p) => {
        const x = 16 + ((p.lng - minLng) / spanLng) * 268;
        const y = 104 - ((p.lat - minLat) / spanLat) * 88;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  })();

  return (
    <div className="space-y-5">
      {/* Daily Health & PT Summary Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Aaj ki Running</span>
            <Navigation className="h-4 w-4 text-[#0284c7] dark:text-sky-400" />
          </div>
          <p className="font-mono-num mt-1 text-2xl font-extrabold text-[#0c2340] dark:text-white">
            {todayRunKm.toFixed(2)} km
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Target: 2.4 km+ PT
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Workout Time</span>
            <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-mono-num mt-1 text-2xl font-extrabold text-[#0c2340] dark:text-white">
            {todayWorkoutMins}m
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {todayRuns.length + todayWorkoutLogs.length} sessions today
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Calories Burned</span>
            <Flame className="h-4 w-4 text-amber-500" />
          </div>
          <p className="font-mono-num mt-1 text-2xl font-extrabold text-[#0c2340] dark:text-white">
            {todayCalories} kcal
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            PT + Running output
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Water Intake</span>
            <Droplets className="h-4 w-4 text-sky-500" />
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="font-mono-num text-2xl font-extrabold text-[#0c2340] dark:text-white">
              {todayWater}/10
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onUpdateWaterGlasses(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => onUpdateWaterGlasses(1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0284c7] text-sm font-bold text-white hover:opacity-95"
              >
                +
              </button>
            </div>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Glasses today</p>
        </div>
      </div>

      {/* Main Two-Column Health & Running Dashboard */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* LEFT COLUMN: LIVE GPS RUNNING TRACKER */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0c2340] text-white">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Live GPS Running Tracker
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time GPS distance, smoothed speed (km/h), pace &amp; time
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {gpsAccuracyM !== null && (
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  GPS ±{gpsAccuracyM}m · {gpsFixCount} fixes
                </span>
              )}
              <button
                type="button"
                onClick={handleCheckGpsSignal}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Radio className="h-3 w-3 text-emerald-500" />
                Check GPS
              </button>
            </div>
          </div>

          {/* Theme-aware GPS HUD Display */}
          <div
            className={`rounded-2xl border border-white/15 bg-gradient-to-br ${theme.heroGradient} p-4 text-white`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-sky-200 uppercase">
              <span className="flex items-center gap-1.5">
                {state.appTheme === 'airforce' ? (
                  <FighterJetSvg className="h-3.5 w-3.5 rotate-90 text-sky-300" />
                ) : state.appTheme === 'army' ? (
                  <Shield className="h-3.5 w-3.5 text-amber-300" />
                ) : state.appTheme === 'navy' ? (
                  <Anchor className="h-3.5 w-3.5 text-cyan-300" />
                ) : (
                  <Navigation className="h-3.5 w-3.5 text-indigo-300" />
                )}
                <span>{theme.gpsHudTitle}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    gpsSignalState === 'locked'
                      ? 'bg-emerald-400'
                      : gpsSignalState === 'searching'
                        ? 'animate-ping bg-amber-400'
                        : gpsSignalState === 'error'
                          ? 'bg-rose-400'
                          : 'bg-slate-400'
                  }`}
                />
                {runStatus === 'running'
                  ? gpsSignalState === 'locked'
                    ? 'TRACKING LIVE'
                    : 'ACQUIRING GPS...'
                  : runStatus === 'paused'
                    ? 'PAUSED'
                    : gpsSignalState === 'locked'
                      ? 'GPS READY'
                      : 'READY'}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-white/10 p-2.5 text-center backdrop-blur-sm">
                <p className="text-[10px] font-semibold text-sky-200 uppercase">Distance</p>
                <p className="font-mono-num mt-0.5 text-xl font-extrabold text-white">
                  {runDistanceKm.toFixed(2)} <span className="text-xs font-semibold">km</span>
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5 text-center backdrop-blur-sm">
                <p className="text-[10px] font-semibold text-sky-200 uppercase">Live Speed</p>
                <p className="font-mono-num mt-0.5 text-xl font-extrabold text-amber-300">
                  {currentSpeedKmh.toFixed(1)} <span className="text-xs font-semibold">km/h</span>
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5 text-center backdrop-blur-sm">
                <p className="text-[10px] font-semibold text-sky-200 uppercase">Time</p>
                <p className="font-mono-num mt-0.5 text-xl font-extrabold text-white">
                  {formatClock(runElapsedMs)}
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5 text-center backdrop-blur-sm">
                <p className="text-[10px] font-semibold text-sky-200 uppercase">Pace / Avg</p>
                <p className="font-mono-num mt-0.5 text-lg font-extrabold text-emerald-300">
                  {formatPace(livePaceDisplay)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200">
              <span>
                Avg Speed: <strong className="font-mono-num text-white">{avgSpeedDisplay} km/h</strong>{' '}
                · Max: <strong className="font-mono-num text-white">{maxSpeedKmh} km/h</strong>
              </span>
              <span>
                Burn: <strong className="font-mono-num text-amber-300">{estRunCalories} kcal</strong>
              </span>
            </div>

            {lastCoords && (
              <p className="font-mono-num mt-1.5 text-[10px] text-sky-200/80">
                Lat: {lastCoords.lat.toFixed(5)} · Lng: {lastCoords.lng.toFixed(5)}
              </p>
            )}

            {/* Live GPS Track SVG Plot */}
            <div className="mt-3 overflow-hidden rounded-xl border border-white/15 bg-black/35 p-2">
              {routePoints.length >= 2 ? (
                <svg viewBox="0 0 300 120" className="h-28 w-full">
                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={routePolylinePoints}
                  />
                </svg>
              ) : (
                <div className="flex h-24 flex-col items-center justify-center text-center text-xs text-sky-100/85">
                  <Gauge className="mb-1 h-5 w-5 text-amber-300" />
                  <span>
                    {runStatus === 'running'
                      ? gpsSignalState === 'locked'
                        ? 'GPS locked! Chalna ya daudna shuru karo, route & speed ab update hoga.'
                        : 'Satellites se location lock ho rahi hai...'
                      : 'Check GPS ya Start GPS Run dabao — live running route & speed dikhega.'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {gpsError && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-900 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-200">
              {gpsError}
            </div>
          )}

          {/* GPS Controls */}
          <div className="flex flex-wrap gap-2">
            {runStatus === 'running' ? (
              <button
                type="button"
                onClick={handlePauseGpsRun}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
              >
                <Pause className="h-4 w-4" />
                Pause Run
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartGpsRun}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#0c2340] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-95 dark:bg-sky-500 dark:text-slate-950"
              >
                <Play className="h-4 w-4 fill-current" />
                {runStatus === 'paused' ? 'Resume GPS Run' : 'Start GPS Run'}
              </button>
            )}

            {(runElapsedMs > 0 || runDistanceKm > 0) && (
              <>
                <button
                  type="button"
                  onClick={handleFinishGpsRun}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4" />
                  Save Run
                </button>
                <button
                  type="button"
                  onClick={handleResetGpsRun}
                  aria-label="Reset GPS run"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 px-3.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowManualRun((v) => !v)}
              className="min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {showManualRun ? 'Hide Manual' : '+ Manual Run'}
            </button>
          </div>

          {showManualRun && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const km = parseFloat(manualRunKm);
                const mins = parseFloat(manualRunMins);
                if (!km || km <= 0 || !mins || mins <= 0) {
                  onShowToast('Valid running km aur minutes daalo!');
                  return;
                }
                const durationSec = Math.round(mins * 60);
                const avgKmh = +((km / (mins / 60))).toFixed(1);
                const pace = +(mins / km).toFixed(2);
                onSaveRunSession({
                  id: `run_${Date.now()}`,
                  date: todayStr,
                  timestamp: Date.now(),
                  durationSec,
                  distanceKm: +km.toFixed(2),
                  avgSpeedKmh: avgKmh,
                  maxSpeedKmh: avgKmh,
                  paceMinPerKm: pace,
                  calories: Math.round(km * 62),
                  source: 'manual',
                  route: [],
                });
                setShowManualRun(false);
              }}
              className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"
            >
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                  Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={manualRunKm}
                  onChange={(e) => setManualRunKm(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                  Time (mins)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={manualRunMins}
                  onChange={(e) => setManualRunMins(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <button
                type="submit"
                className="self-end rounded-lg bg-[#0284c7] py-2.5 text-xs font-bold text-white"
              >
                Save Run
              </button>
            </form>
          )}

          {/* Running Log History */}
          <div>
            <h4 className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Running History ({state.runningLogs.length})
            </h4>
            {state.runningLogs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Abhi koi GPS run save nahi hai. Upar se run track karke Save karo!
              </p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {state.runningLogs.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                        <span className="font-mono-num">{run.distanceKm.toFixed(2)} km</span>
                        <span className="text-xs font-semibold text-[#0284c7] dark:text-sky-400">
                          {run.avgSpeedKmh} km/h
                        </span>
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase dark:bg-slate-700">
                          {run.source}
                        </span>
                      </div>
                      <p className="font-mono-num mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {run.date} · Time: {formatClock(run.durationSec * 1000)} · Pace:{' '}
                        {formatPace(run.paceMinPerKm)}/km · {run.calories} kcal
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteRunSession(run.id)}
                      aria-label="Delete running log"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: WORKOUT TRACKER + WORKOUT TIMER + ADD/DELETE */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <TimerIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Workout Tracker &amp; Exercise Timer
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Timed holds, sets/reps stopwatch, aur custom workout Add/Delete
                </p>
              </div>
            </div>
          </div>

          {/* Active Workout Timer Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <select
                value={selectedWorkout?.id || ''}
                onChange={(e) => setSelectedWorkoutId(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#0284c7] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {state.workouts.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.category})
                  </option>
                ))}
              </select>

              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    if (wkRunning) return;
                    setWkTimerMode('countdown');
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                    wkTimerMode === 'countdown'
                      ? 'bg-[#0c2340] text-white dark:bg-sky-500 dark:text-slate-950'
                      : 'text-slate-500'
                  }`}
                >
                  Timer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (wkRunning) return;
                    setWkTimerMode('stopwatch');
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                    wkTimerMode === 'stopwatch'
                      ? 'bg-[#0c2340] text-white dark:bg-sky-500 dark:text-slate-950'
                      : 'text-slate-500'
                  }`}
                >
                  Stopwatch
                </button>
              </div>
            </div>

            {wkTimerMode === 'countdown' && !wkRunning && wkElapsedMs === 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {[30, 60, 90, 120, 180, 300].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setWkCustomTargetSec(sec)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                      wkCustomTargetSec === sec
                        ? 'border-[#0284c7] bg-[#0284c7] text-white'
                        : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                  </button>
                ))}
              </div>
            )}

            <div className="my-2 text-center">
              <p className="font-mono-num text-4xl font-extrabold tracking-wider text-[#0c2340] dark:text-white">
                {formatClock(wkDisplayMs)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {selectedWorkout?.kind === 'timed'
                  ? `Target Hold: ${selectedWorkout.targetValue}s`
                  : `Target Reps: ${selectedWorkout?.targetValue || 20} reps`}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                  Sets
                </label>
                <input
                  type="number"
                  min="1"
                  value={wkSetsCount}
                  onChange={(e) => setWkSetsCount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                  {selectedWorkout?.kind === 'timed' ? 'Hold Seconds' : 'Reps / Set'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={wkRepsCount}
                  onChange={(e) => setWkRepsCount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (wkRunning) {
                    wkAccMsRef.current += Date.now() - wkSegStartRef.current;
                    setWkElapsedMs(wkAccMsRef.current);
                    setWkRunning(false);
                  } else {
                    if (
                      wkTimerMode === 'countdown' &&
                      wkElapsedMs >= wkCustomTargetSec * 1000
                    ) {
                      wkAccMsRef.current = 0;
                      setWkElapsedMs(0);
                    }
                    setWkRunning(true);
                  }
                }}
                className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0c2340] px-4 py-2 text-xs font-bold text-white dark:bg-sky-500 dark:text-slate-950"
              >
                {wkRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                {wkRunning ? 'Pause' : wkElapsedMs > 0 ? 'Resume' : 'Start Timer'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const totalSec = Math.max(
                    10,
                    Math.round(
                      (wkRunning
                        ? wkAccMsRef.current + (Date.now() - wkSegStartRef.current)
                        : wkElapsedMs) / 1000,
                    ) || (selectedWorkout?.kind === 'timed' ? wkCustomTargetSec : 60),
                  );
                  const sets = Math.max(1, parseInt(wkSetsCount, 10) || 1);
                  const reps = Math.max(1, parseInt(wkRepsCount, 10) || 1);
                  const cal = Math.max(
                    5,
                    Math.round(
                      selectedWorkout?.kind === 'timed'
                        ? totalSec * (selectedWorkout.caloriesPerUnit || 0.12)
                        : sets * reps * (selectedWorkout?.caloriesPerUnit || 0.4),
                    ),
                  );
                  onSaveWorkoutLog({
                    id: `wlog_${Date.now()}`,
                    workoutId: selectedWorkout?.id || 'custom',
                    workoutName: selectedWorkout?.name || 'Workout',
                    date: todayStr,
                    timestamp: Date.now(),
                    durationSec: totalSec,
                    summary:
                      selectedWorkout?.kind === 'timed'
                        ? `${sets} set · ${totalSec}s`
                        : `${sets} × ${reps} reps`,
                    calories: cal,
                  });
                  wkAccMsRef.current = 0;
                  setWkRunning(false);
                  setWkElapsedMs(0);
                }}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                Save Workout
              </button>

              <button
                type="button"
                onClick={() => {
                  wkAccMsRef.current = 0;
                  setWkRunning(false);
                  setWkElapsedMs(0);
                }}
                aria-label="Reset workout timer"
                className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Add New Workout Option */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newWkName.trim()) {
                onShowToast('Workout ka naam likho!');
                return;
              }
              const target = Math.max(1, parseInt(newWkTarget, 10) || 20);
              onAddWorkoutDef(newWkName.trim(), newWkCategory, newWkKind, target);
              setNewWkName('');
            }}
            className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
          >
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              + Naya Workout Add Karein
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newWkName}
                onChange={(e) => setNewWkName(e.target.value)}
                placeholder="Exercise (e.g. Burpees, Chin-ups, 1600m Sprint)"
                className="min-w-[160px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <select
                value={newWkCategory}
                onChange={(e) =>
                  setNewWkCategory(e.target.value as WorkoutDefinition['category'])
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="Strength">Strength</option>
                <option value="Running/Cardio">Running/Cardio</option>
                <option value="Core">Core</option>
                <option value="Mobility">Mobility</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={newWkKind}
                onChange={(e) => setNewWkKind(e.target.value as WorkoutKind)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="reps">Reps Based</option>
                <option value="timed">Timed (Seconds)</option>
              </select>
              <input
                type="number"
                min="1"
                value={newWkTarget}
                onChange={(e) => setNewWkTarget(e.target.value)}
                placeholder={newWkKind === 'timed' ? 'Seconds' : 'Target Reps'}
                className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-[#0284c7] px-3.5 py-2 text-xs font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Workout
              </button>
            </div>
          </form>

          {/* Workout Templates List with Delete */}
          <div>
            <h4 className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              All Workouts ({state.workouts.length}) — Select or Delete
            </h4>
            <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
              {state.workouts.map((wk) => (
                <div
                  key={wk.id}
                  onClick={() => setSelectedWorkoutId(wk.id)}
                  className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                    selectedWorkout?.id === wk.id
                      ? 'border-[#0284c7] bg-sky-50/70 dark:border-sky-400 dark:bg-sky-500/10'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900 dark:text-slate-100">
                      {wk.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {wk.category} ·{' '}
                      {wk.kind === 'timed' ? `${wk.targetValue}s target` : `${wk.targetValue} reps`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteWorkoutDef(wk.id);
                    }}
                    aria-label={`Delete ${wk.name}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Workout Logs with Delete */}
          <div>
            <h4 className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Completed Workouts ({state.workoutLogs.length})
            </h4>
            {state.workoutLogs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Koi workout log abhi nahi hai. Timer chalakar Save Workout dabao!
              </p>
            ) : (
              <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                {state.workoutLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                        {entry.workoutName} · {entry.summary}
                      </p>
                      <p className="font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                        {entry.date} · {formatClock(entry.durationSec * 1000)} · {entry.calories}{' '}
                        kcal
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteWorkoutLog(entry.id)}
                      aria-label={`Delete ${entry.workoutName} log`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
