package com.example.ui

import android.app.Application
import android.os.SystemClock
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.alarm.AlarmPlaybackController
import com.example.alarm.ReminderScheduler
import com.example.data.PadhaiRepository
import com.example.focus.FocusAppHelper
import com.example.focus.InstalledAppInfo
import com.example.model.AppTab
import com.example.model.DailyHabits
import com.example.model.DefaultPadhaiData
import com.example.model.MockTest
import com.example.model.OnlineClassSlot
import com.example.model.PadhaiDateUtils
import com.example.model.PadhaiState
import com.example.model.StrictSession
import com.example.model.StudyLog
import com.example.model.StudyReminder
import com.example.model.Subject
import com.example.model.TimerMode
import com.example.model.TimetableSlot
import com.example.model.TodoItem
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class TimerUiState(
  val mode: TimerMode = TimerMode.STOPWATCH,
  val onlineClassMins: Int = 60,
  val isRunning: Boolean = false,
  val hasStarted: Boolean = false,
  val isCompleted: Boolean = false,
  val elapsedMs: Long = 0L,
  val subjectId: String = "",
  val topic: String = "",
) {
  val displayMs: Long
    get() {
      val targetMs = when (mode) {
        TimerMode.STOPWATCH -> 0L
        TimerMode.POMO_25 -> 25 * 60_000L
        TimerMode.DEEP_50 -> 50 * 60_000L
        TimerMode.ONLINE_CLASS -> onlineClassMins * 60_000L
      }
      return if (targetMs > 0L) (targetMs - elapsedMs).coerceAtLeast(0L) else elapsedMs
    }
}

class PadhaiViewModel(application: Application) : AndroidViewModel(application) {
  private val repository = PadhaiRepository(application)

  private val _state = MutableStateFlow(repository.load())
  val state: StateFlow<PadhaiState> = _state.asStateFlow()

  private val _currentTab = MutableStateFlow(AppTab.TODAY)
  val currentTab: StateFlow<AppTab> = _currentTab.asStateFlow()

  private val _timerState = MutableStateFlow(
    TimerUiState(subjectId = _state.value.subjects.firstOrNull()?.id.orEmpty())
  )
  val timerState: StateFlow<TimerUiState> = _timerState.asStateFlow()

  private val _strictRemainingMs = MutableStateFlow(
    _state.value.activeStrictSession?.let { (it.unlockAtMs - System.currentTimeMillis()).coerceAtLeast(0L) } ?: 0L
  )
  val strictRemainingMs: StateFlow<Long> = _strictRemainingMs.asStateFlow()

  private val _toastEvents = MutableSharedFlow<String>(extraBufferCapacity = 8)
  val toastEvents: SharedFlow<String> = _toastEvents.asSharedFlow()

  private val _installedApps = MutableStateFlow<List<InstalledAppInfo>>(emptyList())
  val installedApps: StateFlow<List<InstalledAppInfo>> = _installedApps.asStateFlow()

  private val _isAccessibilityEnabled = MutableStateFlow(
    FocusAppHelper.isAccessibilityServiceEnabled(application)
  )
  val isAccessibilityEnabled: StateFlow<Boolean> = _isAccessibilityEnabled.asStateFlow()

  private var timerJob: Job? = null
  private var strictWatcherJob: Job? = null
  private var accumulatedBeforeResumeMs: Long = 0L
  private var lastResumedRealtimeMs: Long = 0L

  init {
    refreshInstalledApps()
    ReminderScheduler.syncAll(application, _state.value.reminders)
    startStrictSessionWatcher()
  }

  private fun startStrictSessionWatcher() {
    strictWatcherJob?.cancel()
    strictWatcherJob = viewModelScope.launch {
      while (true) {
        val active = _state.value.activeStrictSession
        if (active != null) {
          val remaining = active.unlockAtMs - System.currentTimeMillis()
          if (remaining <= 0L) {
            completeStrictSession(active)
          } else {
            _strictRemainingMs.value = remaining
          }
        } else {
          _strictRemainingMs.value = 0L
        }
        val focusEnd = _state.value.focusMode.endTimestampMs
        if (_state.value.focusMode.enabled && focusEnd != null && System.currentTimeMillis() >= focusEnd) {
          updateAndPersist {
            it.copy(focusMode = it.focusMode.copy(enabled = false, endTimestampMs = null))
          }
        }
        delay(500L)
      }
    }
  }

  private fun completeStrictSession(session: StrictSession) {
    val today = PadhaiDateUtils.todayDateStr()
    val loggedMins = kotlin.math.round(session.totalDurationMs / 60_000.0).toInt().coerceAtLeast(1)

    updateAndPersist { current ->
      val nextCompletedSlots = if (session.taskKind == "slot") {
        val list = current.completedSlots[today].orEmpty()
        if (list.contains(session.taskId)) current.completedSlots
        else current.completedSlots + (today to (list + session.taskId))
      } else current.completedSlots

      val nextCompletedClasses = if (session.taskKind == "online_class") {
        val list = current.completedClasses[today].orEmpty()
        if (list.contains(session.taskId)) current.completedClasses
        else current.completedClasses + (today to (list + session.taskId))
      } else current.completedClasses

      val nextTodos = if (session.taskKind == "todo") {
        val list = current.todos[today].orEmpty().map {
          if (it.id == session.taskId) it.copy(done = true) else it
        }
        current.todos + (today to list)
      } else current.todos

      val newLog = StudyLog(
        id = "log_${System.currentTimeMillis()}",
        date = today,
        subjectId = session.subjectId.ifEmpty { current.subjects.firstOrNull()?.id.orEmpty() },
        mins = loggedMins,
        topic = session.title,
        focus = 5,
        timestamp = System.currentTimeMillis(),
      )

      current.copy(
        activeStrictSession = null,
        completedSlots = nextCompletedSlots,
        completedClasses = nextCompletedClasses,
        todos = nextTodos,
        logs = listOf(newLog) + current.logs,
      )
    }

    _strictRemainingMs.value = 0L
    val hhmm = SimpleDateFormat("HH:mm", Locale.US).format(Date())
    AlarmPlaybackController.startRinging(
      context = getApplication(),
      id = "strict_done_${session.taskId}",
      title = "Sortie Complete! ${session.title}",
      time = hhmm,
      vibrate = true,
      toneId = _state.value.defaultAlarmTone,
    )
    emitToast("Shabash! \"${session.title}\" complete & ${loggedMins}m log ho gaya!")
  }

  private fun launchStrictSession(session: StrictSession) {
    val currentActive = _state.value.activeStrictSession
    if (currentActive != null && currentActive.taskId != session.taskId) {
      emitToast("Pehle chal raha task \"${currentActive.title}\" pura karo!")
      _currentTab.value = AppTab.TIMER
      return
    }
    if (currentActive?.taskId == session.taskId) {
      _currentTab.value = AppTab.TIMER
      return
    }

    timerJob?.cancel()
    _timerState.update { it.copy(isRunning = false) }
    _strictRemainingMs.value = (session.unlockAtMs - System.currentTimeMillis()).coerceAtLeast(0L)

    updateAndPersist { current ->
      val nextFocus = if (current.autoFocusOnStrict && !current.focusMode.enabled) {
        current.focusMode.copy(enabled = true, endTimestampMs = session.unlockAtMs)
      } else {
        current.focusMode
      }
      current.copy(activeStrictSession = session, focusMode = nextFocus)
    }

    _currentTab.value = AppTab.TIMER
    emitToast("Strict Timer Shuru! ${session.title}")
  }

  fun startStrictSlot(slot: TimetableSlot) {
    val sub = _state.value.subjects.find { it.id == slot.subjectId }
    val title = "${sub?.name ?: "Study"} — ${slot.task.ifBlank { "Study" }}"
    val timing = PadhaiDateUtils.computeStrictUnlockTarget(slot.start, slot.end)
    launchStrictSession(
      StrictSession(
        taskId = slot.id,
        taskKind = "slot",
        title = title,
        subjectId = slot.subjectId,
        startClock = slot.start,
        endClock = slot.end,
        totalDurationMs = timing.totalDurationMs,
        startedAtMs = timing.startedAtMs,
        unlockAtMs = timing.unlockAtMs,
      )
    )
  }

  fun startStrictOnlineClass(cls: OnlineClassSlot) {
    val title = "${cls.title} (${cls.platform})"
    val timing = PadhaiDateUtils.computeStrictUnlockTarget(cls.start, cls.end)
    launchStrictSession(
      StrictSession(
        taskId = cls.id,
        taskKind = "online_class",
        title = title,
        subjectId = cls.subjectId,
        startClock = cls.start,
        endClock = cls.end,
        totalDurationMs = timing.totalDurationMs,
        startedAtMs = timing.startedAtMs,
        unlockAtMs = timing.unlockAtMs,
      )
    )
  }

  fun startStrictTodo(todo: TodoItem) {
    if (todo.requiredMins <= 0) return
    val nowMs = System.currentTimeMillis()
    val durationMs = todo.requiredMins * 60_000L
    launchStrictSession(
      StrictSession(
        taskId = todo.id,
        taskKind = "todo",
        title = todo.text,
        subjectId = _state.value.subjects.firstOrNull()?.id.orEmpty(),
        startClock = "",
        endClock = "",
        totalDurationMs = durationMs,
        startedAtMs = nowMs,
        unlockAtMs = nowMs + durationMs,
      )
    )
  }

  fun switchTab(tab: AppTab) {
    _currentTab.value = tab
  }

  fun toggleDarkMode() {
    updateAndPersist { it.copy(darkMode = !it.darkMode) }
  }

  fun updateDailyGoal(hours: Double) {
    if (hours <= 0.0 || hours > 20.0) {
      emitToast("1 se 20 ghante ke beech goal daalo!")
      return
    }
    updateAndPersist { it.copy(dailyGoalHours = hours) }
    emitToast("Daily target update ho gaya!")
  }

  fun toggleHabit(habitKey: String) {
    val today = PadhaiDateUtils.todayDateStr()
    updateAndPersist { current ->
      val existing = current.ndaHabits[today] ?: DailyHabits()
      val updated = when (habitKey) {
        "pt" -> existing.copy(ptDone = !existing.ptDone)
        "vocab" -> existing.copy(vocabDone = !existing.vocabDone)
        "ca" -> existing.copy(caDone = !existing.caDone)
        "pyq" -> existing.copy(pyqDone = !existing.pyqDone)
        else -> existing
      }
      current.copy(ndaHabits = current.ndaHabits + (today to updated))
    }
  }

  fun savePtFitness(runKm: Double, pushups: Int) {
    val today = PadhaiDateUtils.todayDateStr()
    val safeKm = runKm.coerceAtLeast(0.0)
    val safePushups = pushups.coerceAtLeast(0)
    updateAndPersist { current ->
      val existing = current.ndaHabits[today] ?: DailyHabits()
      val updated = existing.copy(
        runKm = safeKm,
        pushups = safePushups,
        ptDone = if (safeKm > 0.0 || safePushups > 0) true else existing.ptDone,
      )
      current.copy(ndaHabits = current.ndaHabits + (today to updated))
    }
    emitToast("PT Fitness record save ho gaya!")
  }

  fun toggleTodaySlot(slot: TimetableSlot) {
    val today = PadhaiDateUtils.todayDateStr()
    val isDone = _state.value.completedSlots[today].orEmpty().contains(slot.id)
    if (_state.value.strictMode && !isDone) {
      emitToast("Strict Lock! Pehle ${slot.start}–${slot.end} timer pura karo, tabhi complete hoga.")
      startStrictSlot(slot)
      return
    }
    updateAndPersist { current ->
      val list = current.completedSlots[today].orEmpty().toMutableList()
      if (list.contains(slot.id)) list.remove(slot.id) else list.add(slot.id)
      current.copy(completedSlots = current.completedSlots + (today to list))
    }
  }

  fun toggleTodayOnlineClass(cls: OnlineClassSlot) {
    val today = PadhaiDateUtils.todayDateStr()
    val isDone = _state.value.completedClasses[today].orEmpty().contains(cls.id)
    if (_state.value.strictMode && !isDone) {
      emitToast("Strict Lock! Pehle ${cls.start}–${cls.end} online class timer pura karo.")
      startStrictOnlineClass(cls)
      return
    }
    updateAndPersist { current ->
      val list = current.completedClasses[today].orEmpty().toMutableList()
      if (list.contains(cls.id)) list.remove(cls.id) else list.add(cls.id)
      current.copy(completedClasses = current.completedClasses + (today to list))
    }
  }

  fun addTodo(text: String, requiredMins: Int = 0) {
    val clean = text.trim()
    if (clean.isEmpty()) return
    val today = PadhaiDateUtils.todayDateStr()
    updateAndPersist { current ->
      val list = current.todos[today].orEmpty() + TodoItem(
        id = "td_${System.currentTimeMillis()}",
        text = clean,
        done = false,
        requiredMins = requiredMins.coerceAtLeast(0),
      )
      current.copy(todos = current.todos + (today to list))
    }
  }

  fun toggleTodo(todo: TodoItem) {
    if (_state.value.strictMode && todo.requiredMins > 0 && !todo.done) {
      emitToast("Strict Target! Pehle ${todo.requiredMins}m timer pura karo tabhi done hoga.")
      startStrictTodo(todo)
      return
    }
    val today = PadhaiDateUtils.todayDateStr()
    updateAndPersist { current ->
      val list = current.todos[today].orEmpty().map {
        if (it.id == todo.id) it.copy(done = !it.done) else it
      }
      current.copy(todos = current.todos + (today to list))
    }
  }

  fun deleteTodo(todoId: String) {
    if (_state.value.activeStrictSession?.taskId == todoId) {
      emitToast("Chal rahe strict target ko delete nahi kar sakte!")
      return
    }
    val today = PadhaiDateUtils.todayDateStr()
    updateAndPersist { current ->
      val list = current.todos[today].orEmpty().filterNot { it.id == todoId }
      current.copy(todos = current.todos + (today to list))
    }
  }

  fun saveQuickStudyLog(subjectId: String, mins: Int?, topic: String, focus: Int) {
    if (mins == null || mins <= 0) {
      emitToast("Please valid minutes daalo!")
      return
    }
    val cleanTopic = topic.trim().ifEmpty { "Self Study" }
    val newLog = StudyLog(
      id = "log_${System.currentTimeMillis()}",
      date = PadhaiDateUtils.todayDateStr(),
      subjectId = subjectId,
      mins = mins,
      topic = cleanTopic,
      focus = focus.coerceIn(1, 5),
      timestamp = System.currentTimeMillis(),
    )
    updateAndPersist { current -> current.copy(logs = listOf(newLog) + current.logs) }
    emitToast("+${mins} mins padhai add ho gayi!")
  }

  fun saveDailyNote(note: String) {
    val today = PadhaiDateUtils.todayDateStr()
    updateAndPersist { current ->
      current.copy(notes = current.notes + (today to note.trim()))
    }
    emitToast("Review note save ho gaya!")
  }

  // Timer controls
  fun setTimerMode(mode: TimerMode) {
    if (_state.value.activeStrictSession != null) {
      emitToast("Strict Lock ON hai! Current timer pura hone do.")
      return
    }
    if (_timerState.value.isRunning) {
      emitToast("Pehle timer Pause/Reset karo!")
      return
    }
    accumulatedBeforeResumeMs = 0L
    _timerState.update {
      it.copy(mode = mode, elapsedMs = 0L, hasStarted = false, isCompleted = false)
    }
  }

  fun setOnlineClassPresetMins(mins: Int) {
    if (_timerState.value.isRunning) return
    _timerState.update { it.copy(onlineClassMins = mins.coerceIn(15, 240)) }
  }

  fun setTimerSubject(subjectId: String) {
    _timerState.update { it.copy(subjectId = subjectId) }
  }

  fun setTimerTopic(topic: String) {
    _timerState.update { it.copy(topic = topic) }
  }

  fun toggleStartPauseTimer() {
    if (_state.value.activeStrictSession != null) {
      emitToast("Strict Mode me timer pause nahi kar sakte!")
      return
    }
    val current = _timerState.value
    if (current.isRunning) {
      pauseTimer()
    } else {
      startOrResumeTimer()
    }
  }

  private fun startOrResumeTimer() {
    if (_timerState.value.isCompleted) {
      accumulatedBeforeResumeMs = 0L
      _timerState.update { it.copy(elapsedMs = 0L, isCompleted = false) }
    }
    lastResumedRealtimeMs = SystemClock.elapsedRealtime()
    _timerState.update { it.copy(isRunning = true, hasStarted = true, isCompleted = false) }
    timerJob?.cancel()
    timerJob = viewModelScope.launch {
      while (_timerState.value.isRunning) {
        val now = SystemClock.elapsedRealtime()
        val total = accumulatedBeforeResumeMs + (now - lastResumedRealtimeMs)
        val snap = _timerState.value
        val targetMs = when (snap.mode) {
          TimerMode.STOPWATCH -> 0L
          TimerMode.POMO_25 -> 25 * 60_000L
          TimerMode.DEEP_50 -> 50 * 60_000L
          TimerMode.ONLINE_CLASS -> snap.onlineClassMins * 60_000L
        }

        if (targetMs > 0L && total >= targetMs) {
          accumulatedBeforeResumeMs = targetMs
          _timerState.update {
            it.copy(
              elapsedMs = targetMs,
              isRunning = false,
              isCompleted = true,
            )
          }
          emitToast(
            if (snap.mode == TimerMode.ONLINE_CLASS) "Online Class Complete! Save kar lo."
            else "Pomodoro Complete! Save kar lo."
          )
          break
        } else {
          _timerState.update { it.copy(elapsedMs = total) }
        }
        delay(250L)
      }
    }
  }

  private fun pauseTimer() {
    timerJob?.cancel()
    val now = SystemClock.elapsedRealtime()
    accumulatedBeforeResumeMs += (now - lastResumedRealtimeMs)
    _timerState.update { it.copy(isRunning = false, elapsedMs = accumulatedBeforeResumeMs) }
  }

  fun resetTimer() {
    if (_state.value.activeStrictSession != null) {
      emitToast("Strict Lock ON hai! Reset locked hai.")
      return
    }
    timerJob?.cancel()
    accumulatedBeforeResumeMs = 0L
    _timerState.update {
      it.copy(isRunning = false, hasStarted = false, isCompleted = false, elapsedMs = 0L)
    }
  }

  fun finishAndSaveTimer() {
    if (_state.value.activeStrictSession != null) {
      emitToast("Strict Lock ON hai! Timer pura hone par hi save hoga.")
      return
    }
    val wasRunning = _timerState.value.isRunning
    if (wasRunning) {
      pauseTimer()
    }
    val snap = _timerState.value
    val mins = kotlin.math.round(snap.elapsedMs / 60_000.0).toInt().coerceAtLeast(1)
    val subjectId = snap.subjectId.ifEmpty { _state.value.subjects.firstOrNull()?.id.orEmpty() }
    val topic = snap.topic.trim().ifEmpty {
      if (snap.mode == TimerMode.ONLINE_CLASS) "Online Class Session" else "Focused Study"
    }

    val newLog = StudyLog(
      id = "log_${System.currentTimeMillis()}",
      date = PadhaiDateUtils.todayDateStr(),
      subjectId = subjectId,
      mins = mins,
      topic = topic,
      focus = 5,
      timestamp = System.currentTimeMillis(),
    )

    updateAndPersist { current -> current.copy(logs = listOf(newLog) + current.logs) }
    accumulatedBeforeResumeMs = 0L
    _timerState.update {
      it.copy(
        isRunning = false,
        hasStarted = false,
        isCompleted = false,
        elapsedMs = 0L,
        topic = "",
      )
    }
    emitToast("Shabash! ${mins} mins log ho gayi!")
  }

  // Timetable & Online Class controls
  fun addTimetableSlot(day: String, subjectId: String, start: String, end: String, task: String) {
    if (start.isBlank() || end.isBlank()) {
      emitToast("Start aur End time select karo")
      return
    }
    val cleanTask = task.trim().ifEmpty { "Study Session" }
    val slot = TimetableSlot(
      id = "tt_${System.currentTimeMillis()}",
      day = day,
      start = start,
      end = end,
      subjectId = subjectId,
      task = cleanTask,
    )
    updateAndPersist { current -> current.copy(timetable = current.timetable + slot) }
    emitToast("Timetable slot add ho gaya!")
  }

  fun deleteTimetableSlot(slotId: String) {
    if (_state.value.activeStrictSession?.taskId == slotId) {
      emitToast("Chal rahe strict slot ko delete nahi kar sakte!")
      return
    }
    updateAndPersist { current ->
      current.copy(timetable = current.timetable.filterNot { it.id == slotId })
    }
  }

  fun addOnlineClass(
    day: String,
    subjectId: String,
    platform: String,
    title: String,
    start: String,
    end: String,
    meetingUrl: String,
  ) {
    if (start.isBlank() || end.isBlank()) {
      emitToast("Class Start aur End time select karo")
      return
    }
    val cls = OnlineClassSlot(
      id = "oc_${System.currentTimeMillis()}",
      day = day,
      start = start,
      end = end,
      subjectId = subjectId,
      title = title.trim().ifEmpty { "Live Study Class" },
      platform = platform.trim().ifEmpty { "Online" },
      meetingUrl = meetingUrl.trim(),
    )
    updateAndPersist { current -> current.copy(onlineClasses = current.onlineClasses + cls) }
    emitToast("Online Class timetable me add ho gayi!")
  }

  fun deleteOnlineClass(classId: String) {
    if (_state.value.activeStrictSession?.taskId == classId) {
      emitToast("Chal rahi online class ko delete nahi kar sakte!")
      return
    }
    updateAndPersist { current ->
      current.copy(onlineClasses = current.onlineClasses.filterNot { it.id == classId })
    }
  }

  // Syllabus & Logs controls
  fun addSubject(name: String, totalChapters: Int?, colorHex: String) {
    val cleanName = name.trim()
    if (cleanName.isEmpty()) {
      emitToast("Subject ka naam likho!")
      return
    }
    val chapters = (totalChapters ?: 10).coerceAtLeast(1)
    val sub = Subject(
      id = "sub_${System.currentTimeMillis()}",
      name = cleanName,
      totalChapters = chapters,
      doneChapters = 0,
      colorHex = colorHex,
    )
    updateAndPersist { current -> current.copy(subjects = current.subjects + sub) }
    emitToast("Subject add ho gaya!")
  }

  fun updateSubjectChapters(subjectId: String, delta: Int) {
    updateAndPersist { current ->
      current.copy(
        subjects = current.subjects.map { sub ->
          if (sub.id == subjectId) {
            val next = (sub.doneChapters + delta).coerceIn(0, sub.totalChapters)
            sub.copy(doneChapters = next)
          } else {
            sub
          }
        }
      )
    }
  }

  fun deleteSubject(subjectId: String) {
    if (_state.value.subjects.size <= 1) {
      emitToast("Kam se kam 1 subject hona chahiye!")
      return
    }
    updateAndPersist { current ->
      val remaining = current.subjects.filterNot { it.id == subjectId }
      current.copy(subjects = remaining)
    }
    if (_timerState.value.subjectId == subjectId) {
      _timerState.update { it.copy(subjectId = _state.value.subjects.firstOrNull()?.id.orEmpty()) }
    }
  }

  fun deleteStudyLog(logId: String) {
    updateAndPersist { current ->
      current.copy(logs = current.logs.filterNot { it.id == logId })
    }
  }

  // Mock Tests & Stats / Settings
  fun addMockTest(name: String, maths: Double?, gat: Double?) {
    if (maths == null || gat == null || maths < 0.0 || maths > 300.0 || gat < 0.0 || gat > 600.0) {
      emitToast("Valid Maths (0-300) aur GAT (0-600) marks daalo!")
      return
    }
    val cleanName = name.trim().ifEmpty { "NDA Mock #${_state.value.mockTests.size + 1}" }
    val mock = MockTest(
      id = "mt_${System.currentTimeMillis()}",
      date = PadhaiDateUtils.todayDateStr(),
      name = cleanName,
      maths = maths,
      gat = gat,
    )
    updateAndPersist { current -> current.copy(mockTests = listOf(mock) + current.mockTests) }
    emitToast("NDA Mock Score add ho gaya!")
  }

  fun deleteMockTest(mockId: String) {
    updateAndPersist { current ->
      current.copy(mockTests = current.mockTests.filterNot { it.id == mockId })
    }
  }

  fun saveSettings(examName: String, examDate: String, dailyGoalHours: Double?) {
    updateAndPersist { current ->
      current.copy(
        examName = examName.trim(),
        examDate = examDate.trim(),
        dailyGoalHours = if (dailyGoalHours != null && dailyGoalHours > 0.0 && dailyGoalHours <= 20.0) {
          dailyGoalHours
        } else {
          current.dailyGoalHours
        },
      )
    }
    emitToast("Settings save ho gayi!")
  }

  fun toggleStrictMode() {
    if (_state.value.activeStrictSession != null) {
      emitToast("Active Strict Timer ke dauran Strict Mode OFF nahi kar sakte!")
      return
    }
    updateAndPersist { current ->
      val next = !current.strictMode
      emitToast(
        if (next) "Strict Mode ON! Timer pura hone par hi task complete hoga."
        else "Strict Mode OFF ho gaya."
      )
      current.copy(strictMode = next)
    }
  }

  fun toggleAutoFocusOnStrict() {
    updateAndPersist { current -> current.copy(autoFocusOnStrict = !current.autoFocusOnStrict) }
  }

  fun updateAppShareUrl(url: String) {
    val clean = url.trim().ifBlank { DefaultPadhaiData.DEFAULT_APP_SHARE_URL }
    updateAndPersist { it.copy(appShareUrl = clean) }
    emitToast("Download QR link update ho gaya!")
  }

  fun exportBackupJson(): String = repository.exportJson(_state.value)

  fun importBackupJson(jsonText: String): Boolean {
    val imported = repository.parseBackupJson(jsonText)
    if (imported == null) {
      emitToast("Invalid backup file!")
      return false
    }
    _state.value = imported
    repository.save(imported)
    if (imported.subjects.none { it.id == _timerState.value.subjectId }) {
      _timerState.update { it.copy(subjectId = imported.subjects.firstOrNull()?.id.orEmpty()) }
    }
    emitToast("Backup restore ho gaya!")
    return true
  }

  // Reminders & Hard Military Alarms
  fun setDefaultAlarmTone(toneId: String) {
    if (!DefaultPadhaiData.isValidToneId(toneId)) return
    updateAndPersist { it.copy(defaultAlarmTone = toneId) }
    val toneName = DefaultPadhaiData.getToneMeta(toneId).name
    emitToast("Alarm Tone set: $toneName")
  }

  fun previewAlarmTone(toneId: String) {
    AlarmPlaybackController.previewTone(getApplication(), toneId)
  }

  fun addReminder(
    title: String,
    time: String,
    days: List<String>,
    toneId: String = _state.value.defaultAlarmTone,
    vibrate: Boolean = true,
  ) {
    val cleanTitle = title.trim().ifEmpty { "Padhai Scramble Alarm" }
    val safeTone = if (DefaultPadhaiData.isValidToneId(toneId)) toneId else _state.value.defaultAlarmTone
    val reminder = StudyReminder(
      id = "rem_${System.currentTimeMillis()}",
      title = cleanTitle,
      time = time,
      days = days.ifEmpty { listOf("Daily") },
      enabled = true,
      vibrate = vibrate,
      toneId = safeTone,
    )
    updateAndPersist { current -> current.copy(reminders = listOf(reminder) + current.reminders) }
    ReminderScheduler.scheduleReminder(getApplication(), reminder)
    emitToast("Hard Alarm set: $time (${DefaultPadhaiData.getToneMeta(safeTone).name})")
  }

  fun toggleReminder(reminderId: String) {
    var toggled: StudyReminder? = null
    updateAndPersist { current ->
      current.copy(
        reminders = current.reminders.map { rem ->
          if (rem.id == reminderId) {
            rem.copy(enabled = !rem.enabled).also { toggled = it }
          } else {
            rem
          }
        }
      )
    }
    toggled?.let { rem ->
      if (rem.enabled) {
        ReminderScheduler.scheduleReminder(getApplication(), rem)
        emitToast("Alarm ON · ${rem.time}")
      } else {
        ReminderScheduler.cancelReminder(getApplication(), rem.id)
        emitToast("Alarm OFF")
      }
    }
  }

  fun deleteReminder(reminderId: String) {
    ReminderScheduler.cancelReminder(getApplication(), reminderId)
    updateAndPersist { current ->
      current.copy(reminders = current.reminders.filterNot { it.id == reminderId })
    }
  }

  fun triggerTestAlarm(toneId: String = _state.value.defaultAlarmTone) {
    val safeTone = if (DefaultPadhaiData.isValidToneId(toneId)) toneId else _state.value.defaultAlarmTone
    AlarmPlaybackController.startRinging(
      context = getApplication(),
      id = "test_alarm",
      title = "IAF Scramble Test Alarm · No Snooze!",
      time = PadhaiDateUtils.todayDateStr(),
      vibrate = true,
      toneId = safeTone,
    )
  }

  fun dismissActiveAlarm() {
    AlarmPlaybackController.stopRinging()
  }

  // Focus Mode & App Whitelist
  fun refreshInstalledApps() {
    viewModelScope.launch {
      val apps = withContext(Dispatchers.IO) {
        FocusAppHelper.loadLaunchableApps(getApplication())
      }
      _installedApps.value = apps
    }
  }

  fun refreshFocusPermissionStatus() {
    val enabled = FocusAppHelper.isAccessibilityServiceEnabled(getApplication())
    _isAccessibilityEnabled.value = enabled
    val currentEnd = _state.value.focusMode.endTimestampMs
    if (_state.value.focusMode.enabled && currentEnd != null && System.currentTimeMillis() >= currentEnd) {
      updateAndPersist { it.copy(focusMode = it.focusMode.copy(enabled = false, endTimestampMs = null)) }
    }
  }

  fun toggleFocusMode(durationMinutes: Int? = null) {
    val currentlyEnabled = _state.value.focusMode.enabled
    if (currentlyEnabled && _state.value.activeStrictSession != null && _state.value.autoFocusOnStrict) {
      emitToast("Strict Lock chal raha hai! Focus Mode OFF nahi hoga.")
      return
    }
    if (!currentlyEnabled) {
      val hasPerm = FocusAppHelper.isAccessibilityServiceEnabled(getApplication())
      _isAccessibilityEnabled.value = hasPerm
      val endTs = durationMinutes?.takeIf { it > 0 }?.let { System.currentTimeMillis() + it * 60_000L }
      updateAndPersist {
        it.copy(focusMode = it.focusMode.copy(enabled = true, endTimestampMs = endTs))
      }
      if (!hasPerm) {
        emitToast("App block karne ke liye Accessibility permission ON karein!")
      } else {
        emitToast("Focus Mode ON! Keval selected study apps hi open honge.")
      }
    } else {
      updateAndPersist {
        it.copy(focusMode = it.focusMode.copy(enabled = false, endTimestampMs = null))
      }
      emitToast("Focus Mode OFF ho gaya.")
    }
  }

  fun toggleAllowedPackage(packageName: String) {
    updateAndPersist { current ->
      val set = current.focusMode.allowedPackages.toMutableSet()
      if (!set.add(packageName)) {
        set.remove(packageName)
      }
      current.copy(focusMode = current.focusMode.copy(allowedPackages = set.toList()))
    }
  }

  fun openFocusAccessibilitySettings() {
    FocusAppHelper.openAccessibilitySettings(getApplication())
  }

  fun resetAllData() {
    if (_state.value.activeStrictSession != null) {
      emitToast("Pehle chal raha strict task pura karo!")
      return
    }
    resetTimer()
    _state.value.reminders.forEach { ReminderScheduler.cancelReminder(getApplication(), it.id) }
    val fresh = PadhaiState()
    _state.value = fresh
    repository.save(fresh)
    _timerState.update { it.copy(subjectId = fresh.subjects.firstOrNull()?.id.orEmpty()) }
    emitToast("App reset ho gaya")
  }

  private fun updateAndPersist(transform: (PadhaiState) -> PadhaiState) {
    val updated = transform(_state.value)
    _state.value = updated
    repository.save(updated)
  }

  fun notifyToast(message: String) {
    emitToast(message)
  }

  private fun emitToast(message: String) {
    _toastEvents.tryEmit(message)
  }

  override fun onCleared() {
    timerJob?.cancel()
    strictWatcherJob?.cancel()
    super.onCleared()
  }
}
