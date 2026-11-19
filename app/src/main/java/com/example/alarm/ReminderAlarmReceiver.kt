package com.example.alarm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.example.R
import com.example.data.PadhaiRepository
import com.example.model.DefaultPadhaiData

class ReminderAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED -> {
        val repo = PadhaiRepository(context)
        ReminderScheduler.syncAll(context, repo.load().reminders)
      }

      ReminderScheduler.ACTION_DISMISS_ALARM -> {
        AlarmPlaybackController.stopRinging()
        val id = intent.getStringExtra(ReminderScheduler.EXTRA_REMINDER_ID) ?: return
        cancelNotification(context, id)
      }

      ReminderScheduler.ACTION_TRIGGER_ALARM -> {
        val id = intent.getStringExtra(ReminderScheduler.EXTRA_REMINDER_ID) ?: "alarm"
        val title = intent.getStringExtra(ReminderScheduler.EXTRA_REMINDER_TITLE) ?: "Study Alarm"
        val time = intent.getStringExtra(ReminderScheduler.EXTRA_REMINDER_TIME) ?: ""
        val vibrate = intent.getBooleanExtra(ReminderScheduler.EXTRA_REMINDER_VIBRATE, true)
        val toneId = intent.getStringExtra(ReminderScheduler.EXTRA_REMINDER_TONE) ?: "air_raid"

        AlarmPlaybackController.startRinging(context, id, title, time, vibrate, toneId)
        showAlarmNotification(context, id, title, time, vibrate, toneId)

        // Reschedule next recurring trigger for enabled reminders
        val repo = PadhaiRepository(context)
        repo.load().reminders.find { it.id == id && it.enabled }?.let {
          ReminderScheduler.scheduleReminder(context, it)
        }
      }
    }
  }

  private fun showAlarmNotification(
    context: Context,
    id: String,
    title: String,
    time: String,
    vibrate: Boolean,
    toneId: String,
  ) {
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        "Study Tracker Alarms",
        NotificationManager.IMPORTANCE_HIGH,
      ).apply {
        description = "Time-based study reminders and alarms"
        enableVibration(vibrate)
      }
      nm.createNotificationChannel(channel)
    }

    val ringIntent = Intent(context, AlarmRingActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
      putExtra(ReminderScheduler.EXTRA_REMINDER_ID, id)
      putExtra(ReminderScheduler.EXTRA_REMINDER_TITLE, title)
      putExtra(ReminderScheduler.EXTRA_REMINDER_TIME, time)
      putExtra(ReminderScheduler.EXTRA_REMINDER_VIBRATE, vibrate)
      putExtra(ReminderScheduler.EXTRA_REMINDER_TONE, toneId)
    }
    val ringPi = PendingIntent.getActivity(
      context,
      id.hashCode(),
      ringIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val dismissIntent = Intent(context, ReminderAlarmReceiver::class.java).apply {
      action = ReminderScheduler.ACTION_DISMISS_ALARM
      putExtra(ReminderScheduler.EXTRA_REMINDER_ID, id)
    }
    val dismissPi = PendingIntent.getBroadcast(
      context,
      (id + "_dismiss").hashCode(),
      dismissIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val toneName = DefaultPadhaiData.getToneMeta(toneId).name
    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle("IAF Scramble Alarm · $time")
      .setContentText("$title · $toneName")
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setAutoCancel(false)
      .setOngoing(true)
      .setFullScreenIntent(ringPi, true)
      .setContentIntent(ringPi)
      .addAction(0, "Dismiss Alarm", dismissPi)
      .build()

    nm.notify(id.hashCode(), notification)
  }

  private fun cancelNotification(context: Context, id: String) {
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
    nm.cancel(id.hashCode())
  }

  companion object {
    const val CHANNEL_ID = "study_tracker_alarms"
  }
}
