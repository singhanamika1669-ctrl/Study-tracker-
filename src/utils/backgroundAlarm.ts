import {StudyReminder} from '../types';

export async function triggerBackgroundAlarmNotification(
  title: string,
  body: string,
  tag = 'study-tracker-alarm',
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg) {
        if (reg.active) {
          reg.active.postMessage({
            type: 'SHOW_ALARM_NOTIFICATION',
            title,
            body,
            tag,
          });
          return true;
        }
        await reg.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag,
          requireInteraction: true,
        });
        return true;
      }
    }
  } catch {
    // Fallback to direct Notification API
  }

  try {
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      tag,
      requireInteraction: true,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if browser supports Chrome Android experimental Notification Triggers API
 * and schedules next occurrence at OS notification level even if tab closes.
 */
export async function scheduleOSTriggerIfSupported(reminders: StudyReminder[]): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;
  const hasTrigger = 'showTrigger' in Notification.prototype && 'TimestampTrigger' in window;
  if (!hasTrigger || Notification.permission !== 'granted') return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const TriggerCtor = (window as unknown as {TimestampTrigger: new (ts: number) => unknown})
      .TimestampTrigger;
    const now = new Date();

    for (const rem of reminders.filter((r) => r.enabled)) {
      const [hhStr, mmStr] = rem.time.split(':');
      const hh = Number.parseInt(hhStr || '0', 10);
      const mm = Number.parseInt(mmStr || '0', 10);
      const target = new Date(now);
      target.setHours(hh, mm, 0, 0);
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      await reg.showNotification(`Study Tracker Alarm · ${rem.time}`, {
        body: `${rem.title} — Utho aur padhai shuru karo!`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `scheduled_${rem.id}`,
        requireInteraction: true,
        showTrigger: new TriggerCtor(target.getTime()),
      } as NotificationOptions);
    }
    return true;
  } catch {
    return false;
  }
}

const ICS_DAY_MAP: Record<string, string> = {
  Sun: 'SU',
  Mon: 'MO',
  Tue: 'TU',
  Wed: 'WE',
  Thu: 'TH',
  Fri: 'FR',
  Sat: 'SA',
};

/**
 * Generates an .ics calendar file with native OS VALARM (-PT0M) so the phone's
 * native Calendar/Clock app rings even when browser is closed or phone is locked.
 */
export function downloadReminderAsCalendarAlarm(reminder: StudyReminder): void {
  const [hhStr, mmStr] = reminder.time.split(':');
  const hh = String(Number.parseInt(hhStr || '6', 10)).padStart(2, '0');
  const mm = String(Number.parseInt(mmStr || '0', 10)).padStart(2, '0');

  const now = new Date();
  const yyyy = now.getFullYear();
  const mon = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dtStart = `${yyyy}${mon}${dd}T${hh}${mm}00`;

  const byDays = reminder.days
    .filter((d) => d !== 'Daily' && ICS_DAY_MAP[d])
    .map((d) => ICS_DAY_MAP[d]);
  const rrule =
    reminder.days.includes('Daily') || byDays.length === 0
      ? 'RRULE:FREQ=DAILY'
      : `RRULE:FREQ=WEEKLY;BYDAY=${byDays.join(',')}`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Study Tracker by Atharv Singh//Alarm//EN',
    'BEGIN:VEVENT',
    `UID:study-tracker-${reminder.id}@atharvsingh.app`,
    `DTSTAMP:${yyyy}${mon}${dd}T000000Z`,
    `DTSTART:${dtStart}`,
    'DURATION:PT15M',
    rrule,
    `SUMMARY:Study Tracker: ${reminder.title}`,
    'DESCRIPTION:Study Tracker Alarm (Designed by Atharv Singh)',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${reminder.title}`,
    'TRIGGER:-PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], {type: 'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `StudyTracker-Alarm-${hh}${mm}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function acquireScreenWakeLock(): Promise<{
  sentinel: WakeLockSentinel | null;
  supported: boolean;
}> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return {sentinel: null, supported: false};
  }
  try {
    const sentinel = await navigator.wakeLock.request('screen');
    return {sentinel, supported: true};
  } catch {
    return {sentinel: null, supported: true};
  }
}
