package com.example

import com.example.alarm.AlarmPlaybackController
import com.example.alarm.ReminderScheduler
import com.example.data.PadhaiJsonSerializer
import com.example.model.DailyHabits
import com.example.model.DefaultPadhaiData
import com.example.model.FocusModeConfig
import com.example.model.MockTest
import com.example.model.OnlineClassSlot
import com.example.model.PadhaiDateUtils
import com.example.model.PadhaiState
import com.example.model.StrictSession
import com.example.model.StudyLog
import com.example.model.StudyReminder
import com.example.model.TodoItem
import com.example.util.QrCodeGenerator
import java.util.Calendar
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class PadhaiLogicTest {

  @Test
  fun streakCalculation_countsConsecutiveDaysFromTodayOrYesterday() {
    val cal = Calendar.getInstance().apply { set(2026, Calendar.NOVEMBER, 18, 12, 0, 0) }
    val d0 = "2026-11-18"
    val d1 = "2026-11-17"
    val d2 = "2026-11-16"

    val logs = listOf(
      StudyLog("1", d1, "sub_maths", 45, "Trig", 5, 1L),
      StudyLog("2", d2, "sub_phy", 30, "Motion", 4, 2L),
    )
    assertEquals(2, PadhaiDateUtils.calculateStreak(logs, cal))

    val logsWithToday = logs + StudyLog("3", d0, "sub_gat", 20, "Polity", 4, 3L)
    assertEquals(3, PadhaiDateUtils.calculateStreak(logsWithToday, cal))
  }

  @Test
  fun mockTestQualification_validatesSectionalCutoffsAndSafeZone() {
    val safeMock = MockTest("1", "2026-11-18", "PYQ 1", maths = 130.0, gat = 260.0)
    assertTrue(safeMock.isMathsQualified)
    assertTrue(safeMock.isGatQualified)
    assertTrue(safeMock.isSafeZone)

    val mathsFail = MockTest("2", "2026-11-18", "PYQ 2", maths = 70.0, gat = 350.0)
    assertFalse(mathsFail.isMathsQualified)
    assertFalse(mathsFail.isSafeZone)

    val gatFail = MockTest("3", "2026-11-18", "PYQ 3", maths = 180.0, gat = 140.0)
    assertFalse(gatFail.isGatQualified)
    assertFalse(gatFail.isSafeZone)

    val borderline = MockTest("4", "2026-11-18", "PYQ 4", maths = 100.0, gat = 200.0)
    assertTrue(borderline.isMathsQualified)
    assertTrue(borderline.isGatQualified)
    assertFalse(borderline.isSafeZone)
  }

  @Test
  fun jsonSerializer_roundTripsFullStateAndRejectsInvalidBackup() {
    val state = PadhaiState(
      darkMode = true,
      dailyGoalHours = 7.5,
      examName = "NDA II 2027",
      examDate = "2027-09-05",
      strictMode = true,
      autoFocusOnStrict = false,
      defaultAlarmTone = "radar_scramble",
      appShareUrl = "https://example.com/study-tracker.apk",
      onlineClasses = listOf(
        OnlineClassSlot("oc1", "Mon", "16:00", "17:30", "sub_maths", "NDA Live", "Physics Wallah", "https://pw.live"),
      ),
      completedSlots = mapOf("2026-11-18" to listOf("tt1", "tt2")),
      completedClasses = mapOf("2026-11-18" to listOf("oc1")),
      todos = mapOf("2026-11-18" to listOf(TodoItem("td1", "Sets Ex 1.1", true, requiredMins = 60))),
      notes = mapOf("2026-11-18" to "Revise Trigonometry formulas"),
      ndaHabits = mapOf("2026-11-18" to DailyHabits(ptDone = true, runKm = 2.4, pushups = 30)),
      mockTests = listOf(MockTest("mt1", "2026-11-18", "NDA Mock 1", 125.5, 280.0)),
      logs = listOf(StudyLog("l1", "2026-11-18", "sub_maths", 60, "Sets", 5, 123456L)),
      reminders = listOf(
        StudyReminder("r1", "Maths Alarm", "16:30", listOf("Mon", "Wed"), true, true, "cockpit_red_alert")
      ),
      focusMode = FocusModeConfig(enabled = true, allowedPackages = listOf("com.android.calculator2"), endTimestampMs = 999999999L),
      activeStrictSession = StrictSession(
        taskId = "tt2",
        taskKind = "slot",
        title = "Maths — PYQ",
        subjectId = "sub_maths",
        startClock = "12:30",
        endClock = "14:30",
        totalDurationMs = 7_200_000L,
        startedAtMs = 1_000L,
        unlockAtMs = 7_201_000L,
      ),
    )

    val json = PadhaiJsonSerializer.toJson(state)
    val decoded = PadhaiJsonSerializer.fromJsonOrNull(json, requireCoreArrays = true)
    assertNotNull(decoded)
    assertEquals(state, decoded)

    val invalid = PadhaiJsonSerializer.fromJsonOrNull("""{"foo":"bar"}""", requireCoreArrays = true)
    assertNull(invalid)
  }

  @Test
  fun reminderScheduler_computesNextFutureTrigger() {
    val now = Calendar.getInstance().apply {
      set(2026, Calendar.NOVEMBER, 18, 10, 0, 0) // Wednesday 10:00
      set(Calendar.MILLISECOND, 0)
    }
    val sameDay = StudyReminder("r1", "Evening", "16:30", listOf("Daily"), true)
    val nextMs = ReminderScheduler.computeNextTriggerMillis(sameDay, now)
    assertNotNull(nextMs)
    val nextCal = Calendar.getInstance().apply { timeInMillis = nextMs!! }
    assertEquals(18, nextCal.get(Calendar.DAY_OF_MONTH))
    assertEquals(16, nextCal.get(Calendar.HOUR_OF_DAY))
    assertEquals(30, nextCal.get(Calendar.MINUTE))

    val nextWeek = StudyReminder("r2", "Morning", "08:00", listOf("Wed"), true)
    val nextWedMs = ReminderScheduler.computeNextTriggerMillis(nextWeek, now)
    assertNotNull(nextWedMs)
    val nextWedCal = Calendar.getInstance().apply { timeInMillis = nextWedMs!! }
    assertEquals(25, nextWedCal.get(Calendar.DAY_OF_MONTH))
  }

  @Test
  fun strictTiming_computesFullDurationAndInWindowEndClock() {
    assertEquals(120, PadhaiDateUtils.computeSlotDurationMins("12:30", "14:30"))

    // Inside 12:30 - 14:30 at 13:00 -> 90m remaining until 14:30
    val inside = Calendar.getInstance().apply {
      set(2026, Calendar.NOVEMBER, 18, 13, 0, 0)
      set(Calendar.MILLISECOND, 0)
    }
    val insideTiming = PadhaiDateUtils.computeStrictUnlockTarget("12:30", "14:30", inside)
    assertTrue(insideTiming.endsAtClock)
    assertEquals(90 * 60_000L, insideTiming.totalDurationMs)

    // Outside 12:30 - 14:30 at 10:00 -> full 120m duration
    val outside = Calendar.getInstance().apply {
      set(2026, Calendar.NOVEMBER, 18, 10, 0, 0)
      set(Calendar.MILLISECOND, 0)
    }
    val outsideTiming = PadhaiDateUtils.computeStrictUnlockTarget("12:30", "14:30", outside)
    assertFalse(outsideTiming.endsAtClock)
    assertEquals(120 * 60_000L, outsideTiming.totalDurationMs)
  }

  @Test
  fun qrCodeGenerator_producesValidSquareMatrixWithFinderPatterns() {
    val matrix = QrCodeGenerator.encode("https://ais-pre-z5ftxyececum6xkkxh757w-435085567542.asia-northeast1.run.app")
    assertTrue(matrix.isNotEmpty())
    val n = matrix.size
    assertTrue(n >= 21 && (n - 21) % 4 == 0)
    assertEquals(n, matrix[0].size)
    // Top-left finder center (3, 3) and corners must be dark
    assertTrue(matrix[0][0])
    assertTrue(matrix[3][3])
    assertTrue(matrix[6][6])
    // Fixed dark module at (n - 8, 8)
    assertTrue(matrix[n - 8][8])
  }

  @Test
  fun formattingHelpers_produceExpectedOutputs() {
    assertEquals("45m", PadhaiDateUtils.formatMinutes(45))
    assertEquals("1h 30m", PadhaiDateUtils.formatMinutes(90))
    assertEquals("00:25:05", PadhaiDateUtils.formatClockMs(1_505_000L))
    assertEquals("00:00:05", PadhaiDateUtils.formatCountdownClockMs(4_200L))
  }

  @Test
  fun alarmPlaybackController_generatesDistinctNonSilentWaveformsForAll6Tones() {
    assertEquals(6, DefaultPadhaiData.alarmTones.size)
    val signatures = mutableSetOf<Long>()
    DefaultPadhaiData.alarmTones.forEach { tone ->
      val pcm = AlarmPlaybackController.generateTonePcm(tone.id, sampleRate = 22050)
      assertTrue("PCM buffer too small for ${tone.id}", pcm.size >= 22050)
      val peak = pcm.maxOf { kotlin.math.abs(it.toInt()) }
      assertTrue("PCM peak too quiet for ${tone.id}: $peak", peak > 10_000)
      val checksum = pcm.take(2000).fold(0L) { acc, sample -> acc * 31L + sample }
      signatures.add(checksum)
    }
    assertEquals(6, signatures.size)
  }
}
