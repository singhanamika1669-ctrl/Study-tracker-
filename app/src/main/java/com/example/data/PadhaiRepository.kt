package com.example.data

import android.content.Context
import com.example.model.DailyHabits
import com.example.model.DefaultPadhaiData
import com.example.model.FocusModeConfig
import com.example.model.MockTest
import com.example.model.OnlineClassSlot
import com.example.model.PadhaiState
import com.example.model.StrictSession
import com.example.model.StudyLog
import com.example.model.StudyReminder
import com.example.model.Subject
import com.example.model.TimetableSlot
import com.example.model.TodoItem
import java.io.File
import org.json.JSONArray
import org.json.JSONObject

object PadhaiJsonSerializer {
  fun toJson(state: PadhaiState): String {
    val root = JSONObject()
    root.put("darkMode", state.darkMode)
    root.put("dailyGoalHours", state.dailyGoalHours)
    root.put("examName", state.examName)
    root.put("examDate", state.examDate)
    root.put("strictMode", state.strictMode)
    root.put("autoFocusOnStrict", state.autoFocusOnStrict)
    root.put("defaultAlarmTone", state.defaultAlarmTone)
    root.put("appShareUrl", state.appShareUrl)

    val subjectsArr = JSONArray()
    state.subjects.forEach { s ->
      subjectsArr.put(
        JSONObject().apply {
          put("id", s.id)
          put("name", s.name)
          put("totalChapters", s.totalChapters)
          put("doneChapters", s.doneChapters)
          put("color", s.colorHex)
        }
      )
    }
    root.put("subjects", subjectsArr)

    val ttArr = JSONArray()
    state.timetable.forEach { t ->
      ttArr.put(
        JSONObject().apply {
          put("id", t.id)
          put("day", t.day)
          put("start", t.start)
          put("end", t.end)
          put("subjectId", t.subjectId)
          put("task", t.task)
        }
      )
    }
    root.put("timetable", ttArr)

    val ocArr = JSONArray()
    state.onlineClasses.forEach { c ->
      ocArr.put(
        JSONObject().apply {
          put("id", c.id)
          put("day", c.day)
          put("start", c.start)
          put("end", c.end)
          put("subjectId", c.subjectId)
          put("title", c.title)
          put("platform", c.platform)
          put("meetingUrl", c.meetingUrl)
        }
      )
    }
    root.put("onlineClasses", ocArr)

    val completedObj = JSONObject()
    state.completedSlots.forEach { (date, ids) ->
      val arr = JSONArray()
      ids.forEach { arr.put(it) }
      completedObj.put(date, arr)
    }
    root.put("completedSlots", completedObj)

    val completedClassesObj = JSONObject()
    state.completedClasses.forEach { (date, ids) ->
      val arr = JSONArray()
      ids.forEach { arr.put(it) }
      completedClassesObj.put(date, arr)
    }
    root.put("completedClasses", completedClassesObj)

    val todosObj = JSONObject()
    state.todos.forEach { (date, items) ->
      val arr = JSONArray()
      items.forEach { item ->
        arr.put(
          JSONObject().apply {
            put("id", item.id)
            put("text", item.text)
            put("done", item.done)
            put("requiredMins", item.requiredMins)
          }
        )
      }
      todosObj.put(date, arr)
    }
    root.put("todos", todosObj)

    val notesObj = JSONObject()
    state.notes.forEach { (date, text) -> notesObj.put(date, text) }
    root.put("notes", notesObj)

    val habitsObj = JSONObject()
    state.ndaHabits.forEach { (date, h) ->
      habitsObj.put(
        date,
        JSONObject().apply {
          put("ptDone", h.ptDone)
          put("vocabDone", h.vocabDone)
          put("caDone", h.caDone)
          put("pyqDone", h.pyqDone)
          put("runKm", h.runKm)
          put("pushups", h.pushups)
        },
      )
    }
    root.put("ndaHabits", habitsObj)

    val mockArr = JSONArray()
    state.mockTests.forEach { m ->
      mockArr.put(
        JSONObject().apply {
          put("id", m.id)
          put("date", m.date)
          put("name", m.name)
          put("maths", m.maths)
          put("gat", m.gat)
        }
      )
    }
    root.put("mockTests", mockArr)

    val logsArr = JSONArray()
    state.logs.forEach { l ->
      logsArr.put(
        JSONObject().apply {
          put("id", l.id)
          put("date", l.date)
          put("subjectId", l.subjectId)
          put("mins", l.mins)
          put("topic", l.topic)
          put("focus", l.focus)
          put("timestamp", l.timestamp)
        }
      )
    }
    root.put("logs", logsArr)

    val remArr = JSONArray()
    state.reminders.forEach { r ->
      remArr.put(
        JSONObject().apply {
          put("id", r.id)
          put("title", r.title)
          put("time", r.time)
          put("days", JSONArray(r.days))
          put("enabled", r.enabled)
          put("vibrate", r.vibrate)
          put("toneId", r.toneId)
        }
      )
    }
    root.put("reminders", remArr)

    root.put(
      "focusMode",
      JSONObject().apply {
        put("enabled", state.focusMode.enabled)
        put("allowedPackages", JSONArray(state.focusMode.allowedPackages))
        state.focusMode.endTimestampMs?.let { put("endTimestampMs", it) }
      },
    )

    state.activeStrictSession?.let { s ->
      root.put(
        "activeStrictSession",
        JSONObject().apply {
          put("taskId", s.taskId)
          put("taskKind", s.taskKind)
          put("title", s.title)
          put("subjectId", s.subjectId)
          put("startClock", s.startClock)
          put("endClock", s.endClock)
          put("totalDurationMs", s.totalDurationMs)
          put("startedAtMs", s.startedAtMs)
          put("unlockAtMs", s.unlockAtMs)
        },
      )
    }

    return root.toString(2)
  }

  fun fromJsonOrNull(jsonStr: String, requireCoreArrays: Boolean = false): PadhaiState? {
    return try {
      val root = JSONObject(jsonStr)
      if (requireCoreArrays && (!root.has("subjects") || !root.has("logs"))) {
        return null
      }

      val defaults = PadhaiState()
      val subjects = parseSubjects(root.optJSONArray("subjects"))
        .ifEmpty { DefaultPadhaiData.subjects }

      val timetable =
        if (root.has("timetable")) parseTimetable(root.optJSONArray("timetable"))
        else defaults.timetable

      val onlineClasses =
        if (root.has("onlineClasses")) parseOnlineClasses(root.optJSONArray("onlineClasses"))
        else defaults.onlineClasses

      val completedSlots = parseStringListMap(root.optJSONObject("completedSlots"))
      val completedClasses = parseStringListMap(root.optJSONObject("completedClasses"))
      val todos = parseTodos(root.optJSONObject("todos"))
      val notes = parseNotes(root.optJSONObject("notes"))
      val ndaHabits = parseHabits(root.optJSONObject("ndaHabits"))
      val mockTests = parseMockTests(root.optJSONArray("mockTests"))
      val logs = parseLogs(root.optJSONArray("logs"))
      val reminders =
        if (root.has("reminders")) parseReminders(root.optJSONArray("reminders"))
        else defaults.reminders
      val focusMode = parseFocusMode(root.optJSONObject("focusMode"))
      val activeStrictSession = parseStrictSession(root.optJSONObject("activeStrictSession"))

      val rawDefaultTone = root.optString("defaultAlarmTone", defaults.defaultAlarmTone)
      val defaultAlarmTone =
        if (DefaultPadhaiData.isValidToneId(rawDefaultTone)) rawDefaultTone else defaults.defaultAlarmTone

      PadhaiState(
        darkMode = root.optBoolean("darkMode", defaults.darkMode),
        dailyGoalHours = root.optDouble("dailyGoalHours", defaults.dailyGoalHours)
          .takeIf { !it.isNaN() && it > 0 } ?: defaults.dailyGoalHours,
        examName = root.optString("examName", defaults.examName),
        examDate = root.optString("examDate", defaults.examDate),
        strictMode = root.optBoolean("strictMode", defaults.strictMode),
        autoFocusOnStrict = root.optBoolean("autoFocusOnStrict", defaults.autoFocusOnStrict),
        defaultAlarmTone = defaultAlarmTone,
        appShareUrl = root.optString("appShareUrl", defaults.appShareUrl)
          .ifBlank { DefaultPadhaiData.DEFAULT_APP_SHARE_URL },
        subjects = subjects,
        timetable = timetable,
        onlineClasses = onlineClasses,
        completedSlots = completedSlots,
        completedClasses = completedClasses,
        todos = todos,
        notes = notes,
        ndaHabits = ndaHabits,
        mockTests = mockTests,
        logs = logs,
        reminders = reminders,
        focusMode = focusMode,
        activeStrictSession = activeStrictSession,
      )
    } catch (_: Exception) {
      null
    }
  }

  private fun parseSubjects(arr: JSONArray?): List<Subject> {
    if (arr == null) return emptyList()
    val list = mutableListOf<Subject>()
    for (i in 0 until arr.length()) {
      val o = arr.optJSONObject(i) ?: continue
      val id = o.optString("id").ifBlank { continue }
      val name = o.optString("name").ifBlank { continue }
      val total = o.optInt("totalChapters", 10).coerceAtLeast(1)
      val done = o.optInt("doneChapters", 0).coerceIn(0, total)
      val color = o.optString("color").ifBlank { o.optString("colorHex", "#3B5998") }
      list.add(Subject(id, name, total, done, color))
    }
    return list
  }

  private fun parseTimetable(arr: JSONArray?): List<TimetableSlot> {
    if (arr == null) return emptyList()
    val list = mutableListOf<TimetableSlot>()
    for (i in 0 until arr.length()) {
      val o = arr.optJSONObject(i) ?: continue
      val id = o.optString("id").ifBlank { "tt_$i" }
      list.add(
        TimetableSlot(
          id = id,
          day = o.optString("day", "Daily"),
          start = o.optString("start", "06:00"),
          end = o.optString("end", "07:00"),
          subjectId = o.optString("subjectId", ""),
          task = o.optString("task", "Study Session"),
        )
      )
    }
    return list
  }

  private fun parseOnlineClasses(arr: JSONArray?): List<OnlineClassSlot> {
    if (arr == null) return emptyList()
    val list = mutableListOf<OnlineClassSlot>()
    for (i in 0 until arr.length()) {
      val o = arr.optJSONObject(i) ?: continue
      val id = o.optString("id").ifBlank { "oc_$i" }
      list.add(
        OnlineClassSlot(
          id = id,
          day = o.optString("day", "Daily"),
          start = o.optString("start", "16:00"),
          end = o.optString("end", "17:30"),
          subjectId = o.optString("subjectId", ""),
          title = o.optString("title", "Online Class"),
          platform = o.optString("platform", "Online"),
          meetingUrl = o.optString("meetingUrl", ""),
        )
      )
    }
    return list
  }

  private fun parseStringListMap(obj: JSONObject?): Map<String, List<String>> {
    if (obj == null) return emptyMap()
    val map = mutableMapOf<String, List<String>>()
    val keys = obj.keys()
    while (keys.hasNext()) {
      val date = keys.next()
      val arr = obj.optJSONArray(date) ?: continue
      val ids = mutableListOf<String>()
      for (i in 0 until arr.length()) {
        val v = arr.optString(i)
        if (v.isNotBlank()) ids.add(v)
      }
      map[date] = ids
    }
    return map
  }

  private fun parseTodos(obj: JSONObject?): Map<String, List<TodoItem>> {
    if (obj == null) return emptyMap()
    val map = mutableMapOf<String, List<TodoItem>>()
    val keys = obj.keys()
    while (keys.hasNext()) {
      val date = keys.next()
      val arr = obj.optJSONArray(date) ?: continue
      val list = mutableListOf<TodoItem>()
      for (i in 0 until arr.length()) {
        val o = arr.optJSONObject(i) ?: continue
        list.add(
          TodoItem(
            id = o.optString("id", "td_$i"),
            text = o.optString("text", ""),
            done = o.optBoolean("done", false),
            requiredMins = o.optInt("requiredMins", 0).coerceAtLeast(0),
          )
        )
      }
      map[date] = list
    }
    return map
  }

  private fun parseNotes(obj: JSONObject?): Map<String, String> {
    if (obj == null) return emptyMap()
    val map = mutableMapOf<String, String>()
    val keys = obj.keys()
    while (keys.hasNext()) {
      val date = keys.next()
      map[date] = obj.optString(date, "")
    }
    return map
  }

  private fun parseHabits(obj: JSONObject?): Map<String, DailyHabits> {
    if (obj == null) return emptyMap()
    val map = mutableMapOf<String, DailyHabits>()
    val keys = obj.keys()
    while (keys.hasNext()) {
      val date = keys.next()
      val o = obj.optJSONObject(date) ?: continue
      map[date] = DailyHabits(
        ptDone = o.optBoolean("ptDone", false),
        vocabDone = o.optBoolean("vocabDone", false),
        caDone = o.optBoolean("caDone", false),
        pyqDone = o.optBoolean("pyqDone", false),
        runKm = o.optDouble("runKm", 0.0).takeIf { !it.isNaN() && it >= 0 } ?: 0.0,
        pushups = o.optInt("pushups", 0).coerceAtLeast(0),
      )
    }
    return map
  }

  private fun parseMockTests(arr: JSONArray?): List<MockTest> {
    if (arr == null) return emptyList()
    val list = mutableListOf<MockTest>()
    for (i in 0 until arr.length()) {
      val o = arr.optJSONObject(i) ?: continue
      list.add(
        MockTest(
          id = o.optString("id", "mt_$i"),
          date = o.optString("date", ""),
          name = o.optString("name", "NDA Mock"),
          maths = o.optDouble("maths", 0.0).takeIf { !it.isNaN() } ?: 0.0,
          gat = o.optDouble("gat", 0.0).takeIf { !it.isNaN() } ?: 0.0,
        )
      )
    }
    return list
  }

  private fun parseLogs(arr: JSONArray?): List<StudyLog> {
    if (arr == null) return emptyList()
    val list = mutableListOf<StudyLog>()
    for (i in 0 until arr.length()) {
      val o = arr.optJSONObject(i) ?: continue
      list.add(
        StudyLog(
          id = o.optString("id", "log_$i"),
          date = o.optString("date", ""),
          subjectId = o.optString("subjectId", ""),
          mins = o.optInt("mins", 0).coerceAtLeast(0),
          topic = o.optString("topic", "Self Study"),
          focus = o.optInt("focus", 4).coerceIn(1, 5),
          timestamp = o.optLong("timestamp", 0L),
        )
      )
    }
    return list
  }

  private fun parseReminders(arr: JSONArray?): List<StudyReminder> {
    if (arr == null) return emptyList()
    val list = mutableListOf<StudyReminder>()
    for (i in 0 until arr.length()) {
      val o = arr.optJSONObject(i) ?: continue
      val daysArr = o.optJSONArray("days")
      val days = mutableListOf<String>()
      if (daysArr != null) {
        for (j in 0 until daysArr.length()) {
          val d = daysArr.optString(j)
          if (d.isNotBlank()) days.add(d)
        }
      }
      val rawTone = o.optString("toneId", "air_raid")
      val toneId = if (DefaultPadhaiData.isValidToneId(rawTone)) rawTone else "air_raid"
      list.add(
        StudyReminder(
          id = o.optString("id", "rem_$i"),
          title = o.optString("title", "Study Alarm"),
          time = o.optString("time", "06:00"),
          days = days.ifEmpty { listOf("Daily") },
          enabled = o.optBoolean("enabled", true),
          vibrate = o.optBoolean("vibrate", true),
          toneId = toneId,
        )
      )
    }
    return list
  }

  private fun parseFocusMode(obj: JSONObject?): FocusModeConfig {
    if (obj == null) return FocusModeConfig()
    val pkgArr = obj.optJSONArray("allowedPackages")
    val pkgs = mutableListOf<String>()
    if (pkgArr != null) {
      for (i in 0 until pkgArr.length()) {
        val p = pkgArr.optString(i)
        if (p.isNotBlank()) pkgs.add(p)
      }
    }
    val endTs = if (obj.has("endTimestampMs") && !obj.isNull("endTimestampMs")) {
      obj.optLong("endTimestampMs")
    } else {
      null
    }
    return FocusModeConfig(
      enabled = obj.optBoolean("enabled", false),
      allowedPackages = pkgs,
      endTimestampMs = endTs,
    )
  }

  private fun parseStrictSession(obj: JSONObject?): StrictSession? {
    if (obj == null) return null
    val taskId = obj.optString("taskId").ifBlank { return null }
    return StrictSession(
      taskId = taskId,
      taskKind = obj.optString("taskKind", "slot"),
      title = obj.optString("title", "Study Task"),
      subjectId = obj.optString("subjectId", ""),
      startClock = obj.optString("startClock", ""),
      endClock = obj.optString("endClock", ""),
      totalDurationMs = obj.optLong("totalDurationMs", 0L).coerceAtLeast(1L),
      startedAtMs = obj.optLong("startedAtMs", 0L),
      unlockAtMs = obj.optLong("unlockAtMs", 0L),
    )
  }
}

object FocusGuardPrefs {
  private const val PREFS_NAME = "focus_guard_prefs"
  private const val KEY_ENABLED = "focus_enabled"
  private const val KEY_ALLOWED = "allowed_packages"
  private const val KEY_END_TS = "end_timestamp_ms"

  fun sync(context: Context, config: FocusModeConfig) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit()
      .putBoolean(KEY_ENABLED, config.enabled)
      .putStringSet(KEY_ALLOWED, config.allowedPackages.toSet())
      .putLong(KEY_END_TS, config.endTimestampMs ?: -1L)
      .apply()
  }

  fun read(context: Context): FocusModeConfig {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val enabled = prefs.getBoolean(KEY_ENABLED, false)
    val allowed = prefs.getStringSet(KEY_ALLOWED, emptySet()).orEmpty().toList()
    val endTs = prefs.getLong(KEY_END_TS, -1L).takeIf { it > 0L }
    return FocusModeConfig(enabled = enabled, allowedPackages = allowed, endTimestampMs = endTs)
  }
}

class PadhaiRepository(private val context: Context) {
  private val storageFile = File(context.filesDir, "padhai_pro_nda_v2.json")

  fun load(): PadhaiState {
    val state = if (!storageFile.exists()) {
      PadhaiState()
    } else {
      try {
        val text = storageFile.readText(Charsets.UTF_8)
        PadhaiJsonSerializer.fromJsonOrNull(text) ?: PadhaiState()
      } catch (_: Exception) {
        PadhaiState()
      }
    }
    FocusGuardPrefs.sync(context, state.focusMode)
    return state
  }

  fun save(state: PadhaiState) {
    FocusGuardPrefs.sync(context, state.focusMode)
    try {
      val tmpFile = File(storageFile.parentFile, "${storageFile.name}.tmp")
      tmpFile.writeText(PadhaiJsonSerializer.toJson(state), Charsets.UTF_8)
      if (!tmpFile.renameTo(storageFile)) {
        storageFile.writeText(PadhaiJsonSerializer.toJson(state), Charsets.UTF_8)
        tmpFile.delete()
      }
    } catch (_: Exception) {
      // Ignore transient disk write failure
    }
  }

  fun exportJson(state: PadhaiState): String = PadhaiJsonSerializer.toJson(state)

  fun parseBackupJson(json: String): PadhaiState? =
    PadhaiJsonSerializer.fromJsonOrNull(json, requireCoreArrays = true)
}
