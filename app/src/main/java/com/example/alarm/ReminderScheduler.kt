package com.example.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.example.model.DefaultPadhaiData
import com.example.model.StudyReminder
import java.util.Calendar

object ReminderScheduler {
  const val ACTION_TRIGGER_ALARM = "com.example.studytracker.ACTION_TRIGGER_ALARM"
  const val ACTION_DISMISS_ALARM = "com.example.studytracker.ACTION_DISMISS_ALARM"

  const val EXTRA_REMINDER_ID = "extra_reminder_id"
  const val EXTRA_REMINDER_TITLE = "extra_reminder_title"
  const val EXTRA_REMINDER_TIME = "extra_reminder_time"
  const val EXTRA_REMINDER_VIBRATE = "extra_reminder_vibrate"
  const val EXTRA_REMINDER_TONE = "extra_reminder_tone"

  fun syncAll(context: Context, reminders: List<StudyReminder>) {
    reminders.forEach { reminder ->
      if (reminder.enabled) {
        scheduleReminder(context, reminder)
      } else {
        cancelReminder(context, reminder.id)
      }
    }
  }

  fun scheduleReminder(context: Context, reminder: StudyReminder) {
    val triggerAtMillis = computeNextTriggerMillis(reminder) ?: return
    val intent = Intent(context, ReminderAlarmReceiver::class.java).apply {
      action = ACTION_TRIGGER_ALARM
      putExtra(EXTRA_REMINDER_ID, reminder.id)
      putExtra(EXTRA_REMINDER_TITLE, reminder.title)
      putExtra(EXTRA_REMINDER_TIME, reminder.time)
      putExtra(EXTRA_REMINDER_VIBRATE, reminder.vibrate)
      putExtra(EXTRA_REMINDER_TONE, reminder.toneId)
    }
    val pi = PendingIntent.getBroadcast(
      context,
      reminder.id.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    scheduleExactCompat(context, triggerAtMillis, pi)
  }

  fun cancelReminder(context: Context, reminderId: String) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    val intent = Intent(context, ReminderAlarmReceiver::class.java).apply {
      action = ACTION_TRIGGER_ALARM
    }
    val pi = PendingIntent.getBroadcast(
      context,
      reminderId.hashCode(),
      intent,
      PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE,
    )
    if (pi != null) {
      alarmManager.cancel(pi)
      pi.cancel()
    }
  }

  private fun scheduleExactCompat(context: Context, triggerAtMillis: Long, pi: PendingIntent) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        if (alarmManager.canScheduleExactAlarms()) {
          alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi)
        } else {
          alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi)
        }
      } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi)
      } else {
        alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi)
      }
    } catch (_: SecurityException) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi)
      } else {
        alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi)
      }
    }
  }

  fun computeNextTriggerMillis(
    reminder: StudyReminder,
    now: Calendar = Calendar.getInstance(),
  ): Long? {
    val parts = reminder.time.split(":")
    val hour = parts.getOrNull(0)?.toIntOrNull()?.coerceIn(0, 23) ?: return null
    val minute = parts.getOrNull(1)?.toIntOrNull()?.coerceIn(0, 59) ?: return null

    val isDaily = reminder.days.isEmpty() || reminder.days.contains("Daily")
    for (dayOffset in 0..7) {
      val candidate = Calendar.getInstance().apply {
        timeInMillis = now.timeInMillis
        add(Calendar.DAY_OF_YEAR, dayOffset)
        set(Calendar.HOUR_OF_DAY, hour)
        set(Calendar.MINUTE, minute)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }
      if (candidate.timeInMillis <= now.timeInMillis) continue
      val abbr = DefaultPadhaiData.weekdays[(candidate.get(Calendar.DAY_OF_WEEK) - 1).coerceIn(0, 6)]
      if (isDaily || reminder.days.contains(abbr)) {
        return candidate.timeInMillis
      }
    }
    return null
  }
}
