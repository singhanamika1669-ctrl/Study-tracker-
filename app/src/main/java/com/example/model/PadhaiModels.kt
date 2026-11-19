package com.example.model

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

enum class AppTab(val label: String) {
  TODAY("Today"),
  TIMER("Focus"),
  TIMETABLE("Timetable"),
  SYLLABUS("Syllabus"),
  STATS("Stats & QR"),
}

enum class TimerMode(val label: String, val durationMinutes: Int) {
  STOPWATCH("Stopwatch", 0),
  POMO_25("Pomodoro 25m", 25),
  DEEP_50("Deep 50m", 50),
  ONLINE_CLASS("Online Class", 60),
}

data class AlarmToneOption(
  val id: String,
  val name: String,
  val tag: String,
  val intensity: String,
  val description: String,
)

data class StudyReminder(
  val id: String,
  val title: String,
  val time: String, // HH:mm
  val days: List<String> = listOf("Daily"),
  val enabled: Boolean = true,
  val vibrate: Boolean = true,
  val toneId: String = "air_raid",
)

data class FocusModeConfig(
  val enabled: Boolean = false,
  val allowedPackages: List<String> = emptyList(),
  val endTimestampMs: Long? = null,
)

data class Subject(
  val id: String,
  val name: String,
  val totalChapters: Int,
  val doneChapters: Int,
  val colorHex: String,
)

data class TimetableSlot(
  val id: String,
  val day: String,
  val start: String,
  val end: String,
  val subjectId: String,
  val task: String,
)

data class OnlineClassSlot(
  val id: String,
  val day: String,
  val start: String,
  val end: String,
  val subjectId: String,
  val title: String,
  val platform: String,
  val meetingUrl: String = "",
)

data class StrictSession(
  val taskId: String,
  val taskKind: String, // "slot" | "online_class" | "todo" | "custom"
  val title: String,
  val subjectId: String,
  val startClock: String,
  val endClock: String,
  val totalDurationMs: Long,
  val startedAtMs: Long,
  val unlockAtMs: Long,
)

data class TodoItem(
  val id: String,
  val text: String,
  val done: Boolean,
  val requiredMins: Int = 0,
)

data class DailyHabits(
  val ptDone: Boolean = false,
  val vocabDone: Boolean = false,
  val caDone: Boolean = false,
  val pyqDone: Boolean = false,
  val runKm: Double = 0.0,
  val pushups: Int = 0,
)

data class MockTest(
  val id: String,
  val date: String,
  val name: String,
  val maths: Double,
  val gat: Double,
) {
  val total: Double
    get() = maths + gat

  val isMathsQualified: Boolean
    get() = maths >= 75.0

  val isGatQualified: Boolean
    get() = gat >= 150.0

  val isSafeZone: Boolean
    get() = isMathsQualified && isGatQualified && total >= 360.0
}

data class StudyLog(
  val id: String,
  val date: String,
  val subjectId: String,
  val mins: Int,
  val topic: String,
  val focus: Int,
  val timestamp: Long,
)

data class PadhaiState(
  val darkMode: Boolean = false,
  val dailyGoalHours: Double = 6.0,
  val examName: String = "NDA Air Force Flying + 11th Board",
  val examDate: String = "2027-09-05",
  val strictMode: Boolean = true,
  val autoFocusOnStrict: Boolean = true,
  val defaultAlarmTone: String = "air_raid",
  val appShareUrl: String = DefaultPadhaiData.DEFAULT_APP_SHARE_URL,
  val subjects: List<Subject> = DefaultPadhaiData.subjects,
  val timetable: List<TimetableSlot> = DefaultPadhaiData.timetable,
  val onlineClasses: List<OnlineClassSlot> = DefaultPadhaiData.onlineClasses,
  val completedSlots: Map<String, List<String>> = emptyMap(),
  val completedClasses: Map<String, List<String>> = emptyMap(),
  val todos: Map<String, List<TodoItem>> = emptyMap(),
  val notes: Map<String, String> = emptyMap(),
  val ndaHabits: Map<String, DailyHabits> = emptyMap(),
  val mockTests: List<MockTest> = emptyList(),
  val logs: List<StudyLog> = emptyList(),
  val reminders: List<StudyReminder> = DefaultPadhaiData.reminders,
  val focusMode: FocusModeConfig = FocusModeConfig(),
  val activeStrictSession: StrictSession? = null,
)

object DefaultPadhaiData {
  const val DEFAULT_APP_SHARE_URL =
    "https://ais-pre-z5ftxyececum6xkkxh757w-435085567542.asia-northeast1.run.app"

  val weekdays = listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")

  val alarmTones = listOf(
    AlarmToneOption(
      id = "air_raid",
      name = "IAF Air-Raid Siren",
      tag = "Wail",
      intensity = "Extreme",
      description = "High-decibel fighter base sweep siren",
    ),
    AlarmToneOption(
      id = "squadron_bugle",
      name = "Squadron Dawn Bugle",
      tag = "Fanfare",
      intensity = "Hard",
      description = "Crisp military brass bugle call — no sleeping in",
    ),
    AlarmToneOption(
      id = "cockpit_red_alert",
      name = "Cockpit Master Alert",
      tag = "Strobe",
      intensity = "Extreme",
      description = "Twin-tone supersonic cockpit master warning",
    ),
    AlarmToneOption(
      id = "radar_scramble",
      name = "Scramble Hangar Horn",
      tag = "Klaxon",
      intensity = "Max",
      description = "Heavy twin-frequency airbase scramble klaxon",
    ),
    AlarmToneOption(
      id = "commando_whistle",
      name = "Commando Drill Whistle",
      tag = "Drill",
      intensity = "Sharp",
      description = "Trilled instructor whistle for rapid PT & study",
    ),
    AlarmToneOption(
      id = "missile_lock",
      name = "Target Lock Beep",
      tag = "Pulse",
      intensity = "High",
      description = "Rapid fighter HUD lock-on urgent beacon",
    ),
  )

  fun isValidToneId(toneId: String): Boolean = alarmTones.any { it.id == toneId }

  fun getToneMeta(toneId: String): AlarmToneOption =
    alarmTones.find { it.id == toneId } ?: alarmTones.first()

  val subjects = listOf(
    Subject("sub_maths", "Maths (11th + NDA)", 16, 0, "#0284C7"),
    Subject("sub_phy", "Physics (11th + NDA)", 15, 0, "#7C3AED"),
    Subject("sub_chem", "Chemistry (11th + NDA)", 14, 0, "#059669"),
    Subject("sub_eng", "English & Vocab (NDA)", 12, 0, "#D97706"),
    Subject("sub_gat", "GAT (GS: History/Geo/Polity)", 15, 0, "#DC2626"),
    Subject("sub_hin", "Hindi (UP Board 11th)", 12, 0, "#0891B2"),
  )

  val timetable = listOf(
    TimetableSlot("tt1", "Daily", "05:30", "06:30", "sub_eng", "Morning PT + 10 Vocab Words"),
    TimetableSlot("tt2", "Daily", "12:30", "14:30", "sub_maths", "Maths 11th Concept + NDA PYQ Practice"),
    TimetableSlot("tt3", "Daily", "18:00", "19:30", "sub_phy", "UP Board Physics / Chemistry"),
    TimetableSlot("tt4", "Daily", "20:30", "21:30", "sub_gat", "NDA GAT (GK + Current Affairs)"),
    TimetableSlot("tt5", "Sun", "10:00", "12:30", "sub_maths", "NDA Maths Mock Test + Analysis"),
  )

  val onlineClasses = listOf(
    OnlineClassSlot(
      id = "oc1",
      day = "Daily",
      start = "16:00",
      end = "17:30",
      subjectId = "sub_maths",
      title = "NDA Maths Live Class (Sets & Trig)",
      platform = "Physics Wallah",
      meetingUrl = "",
    ),
    OnlineClassSlot(
      id = "oc2",
      day = "Daily",
      start = "19:30",
      end = "20:30",
      subjectId = "sub_phy",
      title = "Class 11th Physics Live Lecture",
      platform = "YouTube Live",
      meetingUrl = "",
    ),
  )

  val reminders = listOf(
    StudyReminder(
      id = "rem1",
      title = "Morning PT + Vocab Alarm",
      time = "05:30",
      days = listOf("Daily"),
      enabled = false,
      vibrate = true,
      toneId = "squadron_bugle",
    ),
    StudyReminder(
      id = "rem2",
      title = "Maths 11th + NDA PYQ Alarm",
      time = "12:30",
      days = listOf("Daily"),
      enabled = false,
      vibrate = true,
      toneId = "air_raid",
    ),
  )

  val presetColorHexes = listOf(
    "#0284C7",
    "#0C2340",
    "#7C3AED",
    "#059669",
    "#D97706",
    "#DC2626",
    "#0891B2",
    "#DB2777",
  )
}

data class StrictUnlockTiming(
  val totalDurationMs: Long,
  val startedAtMs: Long,
  val unlockAtMs: Long,
  val endsAtClock: Boolean,
)

object PadhaiDateUtils {
  private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
  private val displayDateFormat = SimpleDateFormat("EEE, d MMM", Locale("en", "IN"))

  fun todayDateStr(calendar: Calendar = Calendar.getInstance()): String {
    return synchronized(dateFormat) { dateFormat.format(calendar.time) }
  }

  fun formatDisplayHeaderDate(date: Date = Date()): String {
    return synchronized(displayDateFormat) { displayDateFormat.format(date) }
  }

  fun todayWeekdayAbbr(calendar: Calendar = Calendar.getInstance()): String {
    val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK) // 1 = Sun .. 7 = Sat
    return DefaultPadhaiData.weekdays[(dayOfWeek - 1).coerceIn(0, 6)]
  }

  fun parseClockMinutes(hhmm: String): Int {
    val parts = hhmm.split(":")
    val h = parts.getOrNull(0)?.toIntOrNull()?.coerceIn(0, 23) ?: 0
    val m = parts.getOrNull(1)?.toIntOrNull()?.coerceIn(0, 59) ?: 0
    return h * 60 + m
  }

  fun computeSlotDurationMins(start: String, end: String): Int {
    val startM = parseClockMinutes(start)
    val endM = parseClockMinutes(end)
    return when {
      endM > startM -> endM - startM
      endM < startM -> (24 * 60 - startM) + endM
      else -> 60
    }
  }

  fun computeStrictUnlockTarget(
    start: String,
    end: String,
    nowCalendar: Calendar = Calendar.getInstance(),
  ): StrictUnlockTiming {
    val nowMs = nowCalendar.timeInMillis
    val fullMins = computeSlotDurationMins(start, end)
    val fullDurationMs = (fullMins * 60_000L).coerceAtLeast(60_000L)

    val startM = parseClockMinutes(start)
    val endM = parseClockMinutes(end)
    val nowM = nowCalendar.get(Calendar.HOUR_OF_DAY) * 60 + nowCalendar.get(Calendar.MINUTE)

    if (endM > startM && nowM in startM until endM) {
      val endCal = Calendar.getInstance().apply {
        timeInMillis = nowMs
        set(Calendar.HOUR_OF_DAY, endM / 60)
        set(Calendar.MINUTE, endM % 60)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }
      val remainingMs = (endCal.timeInMillis - nowMs).coerceAtLeast(60_000L)
      return StrictUnlockTiming(
        totalDurationMs = remainingMs,
        startedAtMs = nowMs,
        unlockAtMs = nowMs + remainingMs,
        endsAtClock = true,
      )
    }

    return StrictUnlockTiming(
      totalDurationMs = fullDurationMs,
      startedAtMs = nowMs,
      unlockAtMs = nowMs + fullDurationMs,
      endsAtClock = false,
    )
  }

  fun daysBetweenTodayAnd(targetDateStr: String, todayCalendar: Calendar = Calendar.getInstance()): Int? {
    if (targetDateStr.isBlank()) return null
    return try {
      val parsed = synchronized(dateFormat) {
        dateFormat.isLenient = false
        dateFormat.parse(targetDateStr.trim())
      } ?: return null

      val startCal = Calendar.getInstance().apply {
        timeInMillis = todayCalendar.timeInMillis
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }
      val targetCal = Calendar.getInstance().apply {
        time = parsed
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
      }
      val diffMs = targetCal.timeInMillis - startCal.timeInMillis
      kotlin.math.ceil(diffMs / 86_400_000.0).toInt()
    } catch (_: Exception) {
      null
    }
  }

  fun last7Days(todayCalendar: Calendar = Calendar.getInstance()): List<Pair<String, String>> {
    val result = mutableListOf<Pair<String, String>>()
    for (offset in 6 downTo 0) {
      val c = Calendar.getInstance().apply {
        timeInMillis = todayCalendar.timeInMillis
        add(Calendar.DAY_OF_YEAR, -offset)
      }
      result.add(todayDateStr(c) to todayWeekdayAbbr(c))
    }
    return result
  }

  fun calculateStreak(logs: List<StudyLog>, todayCalendar: Calendar = Calendar.getInstance()): Int {
    val activeDates = logs.filter { it.mins > 0 }.map { it.date }.toHashSet()
    if (activeDates.isEmpty()) return 0

    val cursor = Calendar.getInstance().apply { timeInMillis = todayCalendar.timeInMillis }
    if (!activeDates.contains(todayDateStr(cursor))) {
      cursor.add(Calendar.DAY_OF_YEAR, -1)
    }

    var streak = 0
    while (activeDates.contains(todayDateStr(cursor))) {
      streak++
      cursor.add(Calendar.DAY_OF_YEAR, -1)
    }
    return streak
  }

  fun formatMinutes(totalMins: Int): String {
    val safeMins = totalMins.coerceAtLeast(0)
    val h = safeMins / 60
    val m = safeMins % 60
    return if (h == 0) "${m}m" else "${h}h ${m}m"
  }

  fun formatClockMs(ms: Long): String {
    val totalSec = (ms.coerceAtLeast(0L) / 1000L).toInt()
    val h = totalSec / 3600
    val m = (totalSec % 3600) / 60
    val s = totalSec % 60
    return String.format(Locale.US, "%02d:%02d:%02d", h, m, s)
  }

  fun formatCountdownClockMs(ms: Long): String {
    val safeMs = ms.coerceAtLeast(0L)
    val totalSec = kotlin.math.ceil(safeMs / 1000.0).toInt()
    val h = totalSec / 3600
    val m = (totalSec % 3600) / 60
    val s = totalSec % 60
    return String.format(Locale.US, "%02d:%02d:%02d", h, m, s)
  }
}
