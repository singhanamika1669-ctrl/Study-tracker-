package com.example

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.MilitaryTech
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.alarm.AlarmPlaybackController
import com.example.model.AppTab
import com.example.model.DefaultPadhaiData
import com.example.model.PadhaiDateUtils
import com.example.ui.PadhaiViewModel
import com.example.ui.components.PadhaiTopBar
import com.example.ui.components.QrShareSection
import com.example.ui.screens.StatsScreen
import com.example.ui.screens.SyllabusScreen
import com.example.ui.screens.TimerScreen
import com.example.ui.screens.TimetableScreen
import com.example.ui.screens.TodayScreen
import com.example.ui.theme.BannerNavy
import com.example.ui.theme.LocalPadhaiColors
import com.example.ui.theme.PadhaiProTheme
import kotlinx.coroutines.flow.collectLatest

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      PadhaiProApp()
    }
  }
}

@Composable
fun PadhaiProApp(viewModel: PadhaiViewModel = viewModel()) {
  val state by viewModel.state.collectAsStateWithLifecycle()
  val currentTab by viewModel.currentTab.collectAsStateWithLifecycle()
  val timerState by viewModel.timerState.collectAsStateWithLifecycle()
  val strictRemainingMs by viewModel.strictRemainingMs.collectAsStateWithLifecycle()
  val installedApps by viewModel.installedApps.collectAsStateWithLifecycle()
  val isAccessibilityEnabled by viewModel.isAccessibilityEnabled.collectAsStateWithLifecycle()
  val ringingAlarm by AlarmPlaybackController.ringingAlarm.collectAsStateWithLifecycle()

  var showSettingsDialog by remember { mutableStateOf(false) }

  val snackbarHostState = remember { SnackbarHostState() }
  val context = LocalContext.current
  val view = LocalView.current
  val lifecycleOwner = LocalLifecycleOwner.current

  DisposableEffect(lifecycleOwner) {
    val observer = LifecycleEventObserver { _, event ->
      if (event == Lifecycle.Event.ON_RESUME) {
        viewModel.refreshFocusPermissionStatus()
        viewModel.refreshInstalledApps()
      }
    }
    lifecycleOwner.lifecycle.addObserver(observer)
    onDispose {
      lifecycleOwner.lifecycle.removeObserver(observer)
    }
  }

  if (!view.isInEditMode) {
    SideEffect {
      val window = (view.context as? Activity)?.window ?: return@SideEffect
      val controller = WindowCompat.getInsetsController(window, view)
      controller.isAppearanceLightStatusBars = !state.darkMode
      controller.isAppearanceLightNavigationBars = !state.darkMode
    }
  }

  LaunchedEffect(Unit) {
    viewModel.toastEvents.collectLatest { message ->
      snackbarHostState.currentSnackbarData?.dismiss()
      snackbarHostState.showSnackbar(message)
    }
  }

  val notifPermLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.RequestPermission(),
  ) { /* User responded to notification permission */ }

  val ensureNotificationPermission: () -> Unit = {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      val granted = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.POST_NOTIFICATIONS,
      ) == PackageManager.PERMISSION_GRANTED
      if (!granted) {
        notifPermLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
      }
    }
  }

  val exportLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.CreateDocument("application/json"),
  ) { uri ->
    if (uri != null) {
      try {
        context.contentResolver.openOutputStream(uri)?.use { out ->
          out.write(viewModel.exportBackupJson().toByteArray(Charsets.UTF_8))
        }
        viewModel.notifyToast("Backup save ho gaya!")
      } catch (_: Exception) {
        viewModel.notifyToast("Backup export failed!")
      }
    }
  }

  val importLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.OpenDocument(),
  ) { uri ->
    if (uri != null) {
      try {
        val json = context.contentResolver.openInputStream(uri)?.bufferedReader(Charsets.UTF_8)?.use {
          it.readText()
        }
        if (json != null) {
          viewModel.importBackupJson(json)
        } else {
          viewModel.notifyToast("Invalid backup file!")
        }
      } catch (_: Exception) {
        viewModel.notifyToast("Backup import failed!")
      }
    }
  }

  PadhaiProTheme(darkTheme = state.darkMode) {
    val colors = LocalPadhaiColors.current
    val streakDays = remember(state.logs) { PadhaiDateUtils.calculateStreak(state.logs) }
    val headerDate = remember { PadhaiDateUtils.formatDisplayHeaderDate() }

    Scaffold(
      containerColor = colors.innerBackground,
      snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
      topBar = {
        Column {
          PadhaiTopBar(
            dateSubtitle = headerDate,
            streakDays = streakDays,
            isDarkMode = state.darkMode,
            onToggleTheme = { viewModel.toggleDarkMode() },
            onOpenSettings = { showSettingsDialog = true },
          )
          state.activeStrictSession?.let { activeStrict ->
            Surface(
              color = Color(0xFFB45309),
              modifier = Modifier
                .fillMaxWidth()
                .clickable { viewModel.switchTab(AppTab.TIMER) },
            ) {
              Row(
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(horizontal = 14.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
              ) {
                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  modifier = Modifier.weight(1f),
                ) {
                  Icon(
                    imageVector = Icons.Filled.Lock,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(16.dp),
                  )
                  Spacer(modifier = Modifier.width(6.dp))
                  Text(
                    text = "STRICT LOCK · ${activeStrict.title}",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                  )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                  text = "${PadhaiDateUtils.formatCountdownClockMs(strictRemainingMs)} left",
                  color = Color(0xFFFEF3C7),
                  fontWeight = FontWeight.ExtraBold,
                  fontSize = 12.sp,
                )
              }
            }
          }
          ringingAlarm?.let { active ->
            val toneMeta = DefaultPadhaiData.getToneMeta(active.toneId)
            Surface(
              color = BannerNavy,
              modifier = Modifier.fillMaxWidth(),
            ) {
              Row(
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
              ) {
                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  modifier = Modifier.weight(1f),
                ) {
                  Icon(
                    imageVector = Icons.Filled.Alarm,
                    contentDescription = null,
                    tint = Color(0xFFFBBF24),
                    modifier = Modifier.size(20.dp),
                  )
                  Spacer(modifier = Modifier.width(8.dp))
                  Column {
                    Text(
                      text = active.title,
                      color = Color.White,
                      fontWeight = FontWeight.Bold,
                      fontSize = 13.sp,
                      maxLines = 1,
                      overflow = TextOverflow.Ellipsis,
                    )
                    Text(
                      text = "${toneMeta.name} · No Snooze",
                      color = Color(0xFFBAE6FD),
                      fontSize = 11.sp,
                      fontWeight = FontWeight.SemiBold,
                      maxLines = 1,
                      overflow = TextOverflow.Ellipsis,
                    )
                  }
                }
                Spacer(modifier = Modifier.width(8.dp))
                Button(
                  onClick = { viewModel.dismissActiveAlarm() },
                  shape = RoundedCornerShape(8.dp),
                  colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                ) {
                  Text("Dismiss", color = BannerNavy, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp)
                }
              }
            }
          }
        }
      },
      bottomBar = {
        Box {
          HorizontalDivider(thickness = 1.dp, color = colors.border)
          NavigationBar(
            containerColor = colors.cardBackground,
            tonalElevation = 0.dp,
          ) {
            AppTab.entries.forEach { tab ->
              val selected = currentTab == tab
              NavigationBarItem(
                selected = selected,
                onClick = { viewModel.switchTab(tab) },
                icon = {
                  Icon(
                    imageVector = tabIcon(tab),
                    contentDescription = tab.label,
                  )
                },
                label = {
                  Text(
                    text = tab.label,
                    fontSize = 11.sp,
                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                  )
                },
                colors = NavigationBarItemDefaults.colors(
                  selectedIconColor = colors.primaryAccent,
                  selectedTextColor = colors.primaryAccent,
                  unselectedIconColor = colors.textMuted,
                  unselectedTextColor = colors.textMuted,
                  indicatorColor = colors.primaryAccent.copy(alpha = 0.12f),
                ),
              )
            }
          }
        }
      },
    ) { innerPadding ->
      Box(
        modifier = Modifier
          .fillMaxSize()
          .padding(innerPadding),
      ) {
        when (currentTab) {
          AppTab.TODAY -> TodayScreen(
            state = state,
            strictRemainingMs = strictRemainingMs,
            onNavigateTab = { viewModel.switchTab(it) },
            onUpdateDailyGoal = { viewModel.updateDailyGoal(it) },
            onToggleHabit = { viewModel.toggleHabit(it) },
            onSavePt = { km, pushups -> viewModel.savePtFitness(km, pushups) },
            onToggleSlot = { viewModel.toggleTodaySlot(it) },
            onStartStrictSlot = { viewModel.startStrictSlot(it) },
            onToggleOnlineClass = { viewModel.toggleTodayOnlineClass(it) },
            onStartStrictOnlineClass = { viewModel.startStrictOnlineClass(it) },
            onAddTodo = { text, mins -> viewModel.addTodo(text, mins) },
            onToggleTodo = { viewModel.toggleTodo(it) },
            onStartStrictTodo = { viewModel.startStrictTodo(it) },
            onDeleteTodo = { viewModel.deleteTodo(it) },
            onSaveQuickLog = { subId, mins, topic, focus ->
              viewModel.saveQuickStudyLog(subId, mins, topic, focus)
            },
            onSaveDailyNote = { viewModel.saveDailyNote(it) },
          )

          AppTab.TIMER -> TimerScreen(
            subjects = state.subjects,
            onlineClasses = state.onlineClasses,
            strictMode = state.strictMode,
            activeStrictSession = state.activeStrictSession,
            strictRemainingMs = strictRemainingMs,
            timerState = timerState,
            focusMode = state.focusMode,
            installedApps = installedApps,
            isAccessibilityEnabled = isAccessibilityEnabled,
            reminders = state.reminders,
            defaultAlarmTone = state.defaultAlarmTone,
            onSelectMode = { viewModel.setTimerMode(it) },
            onSelectOnlineClassPresetMins = { viewModel.setOnlineClassPresetMins(it) },
            onSelectSubject = { viewModel.setTimerSubject(it) },
            onChangeTopic = { viewModel.setTimerTopic(it) },
            onToggleStartPause = { viewModel.toggleStartPauseTimer() },
            onFinishAndSave = { viewModel.finishAndSaveTimer() },
            onReset = { viewModel.resetTimer() },
            onStartStrictOnlineClass = { viewModel.startStrictOnlineClass(it) },
            onToggleFocusMode = { mins -> viewModel.toggleFocusMode(mins) },
            onToggleAllowedPackage = { pkg -> viewModel.toggleAllowedPackage(pkg) },
            onOpenAccessibilitySettings = { viewModel.openFocusAccessibilitySettings() },
            onSelectDefaultTone = { toneId -> viewModel.setDefaultAlarmTone(toneId) },
            onPreviewTone = { toneId -> viewModel.previewAlarmTone(toneId) },
            onAddReminder = { title, time, days, toneId ->
              ensureNotificationPermission()
              viewModel.addReminder(title, time, days, toneId)
            },
            onToggleReminder = { id ->
              ensureNotificationPermission()
              viewModel.toggleReminder(id)
            },
            onDeleteReminder = { viewModel.deleteReminder(it) },
            onTestAlarm = { toneId -> viewModel.triggerTestAlarm(toneId) },
          )

          AppTab.TIMETABLE -> TimetableScreen(
            state = state,
            onAddSlot = { day, subId, start, end, task ->
              viewModel.addTimetableSlot(day, subId, start, end, task)
            },
            onDeleteSlot = { viewModel.deleteTimetableSlot(it) },
            onStartStrictSlot = { viewModel.startStrictSlot(it) },
            onAddOnlineClass = { day, subId, platform, title, start, end, meetingUrl ->
              viewModel.addOnlineClass(day, subId, platform, title, start, end, meetingUrl)
            },
            onDeleteOnlineClass = { viewModel.deleteOnlineClass(it) },
            onStartStrictOnlineClass = { viewModel.startStrictOnlineClass(it) },
          )

          AppTab.SYLLABUS -> SyllabusScreen(
            state = state,
            onAddSubject = { name, chapters, colorHex ->
              viewModel.addSubject(name, chapters, colorHex)
            },
            onUpdateChapters = { subId, delta -> viewModel.updateSubjectChapters(subId, delta) },
            onDeleteSubject = { viewModel.deleteSubject(it) },
            onDeleteLog = { viewModel.deleteStudyLog(it) },
          )

          AppTab.STATS -> StatsScreen(
            state = state,
            onAddMockTest = { name, maths, gat -> viewModel.addMockTest(name, maths, gat) },
            onDeleteMockTest = { viewModel.deleteMockTest(it) },
            onSaveSettings = { examName, examDate, goal ->
              viewModel.saveSettings(examName, examDate, goal)
            },
            onToggleStrictMode = { viewModel.toggleStrictMode() },
            onToggleAutoFocusOnStrict = { viewModel.toggleAutoFocusOnStrict() },
            onUpdateShareUrl = { viewModel.updateAppShareUrl(it) },
            onNotifyToast = { viewModel.notifyToast(it) },
            onExportBackup = {
              exportLauncher.launch("StudyTracker-Backup-${PadhaiDateUtils.todayDateStr()}.json")
            },
            onImportBackup = {
              importLauncher.launch(arrayOf("application/json", "*/*"))
            },
            onResetAll = { viewModel.resetAllData() },
          )
        }
      }
    }

    if (showSettingsDialog) {
      AlertDialog(
        onDismissRequest = { showSettingsDialog = false },
        title = {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
          ) {
            Icon(
              imageVector = Icons.Filled.QrCode2,
              contentDescription = null,
              tint = colors.primaryAccent,
            )
            Text("Settings & App Download QR", fontWeight = FontWeight.Bold, fontSize = 16.sp)
          }
        },
        text = {
          Column(
            modifier = Modifier
              .fillMaxWidth()
              .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(10.dp),
          ) {
            Surface(
              shape = RoundedCornerShape(12.dp),
              color = colors.innerBackground,
              border = BorderStroke(1.dp, colors.border),
              modifier = Modifier.fillMaxWidth(),
            ) {
              Row(
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
              ) {
                Column(modifier = Modifier.weight(1f)) {
                  Text(
                    text = "Strict Task Lock",
                    color = colors.textPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                  )
                  Text(
                    text = "Timer pura hue bina task complete nahi hoga",
                    color = colors.textMuted,
                    fontSize = 11.sp,
                  )
                }
                Switch(
                  checked = state.strictMode,
                  onCheckedChange = { viewModel.toggleStrictMode() },
                )
              }
            }

            Surface(
              shape = RoundedCornerShape(12.dp),
              color = colors.innerBackground,
              border = BorderStroke(1.dp, colors.border),
              modifier = Modifier.fillMaxWidth(),
            ) {
              Row(
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
              ) {
                Column(modifier = Modifier.weight(1f)) {
                  Text(
                    text = "Auto Focus App Lock",
                    color = colors.textPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                  )
                  Text(
                    text = "Strict timer pe distracted apps lock ho jayenge",
                    color = colors.textMuted,
                    fontSize = 11.sp,
                  )
                }
                Switch(
                  checked = state.autoFocusOnStrict,
                  onCheckedChange = { viewModel.toggleAutoFocusOnStrict() },
                )
              }
            }

            Spacer(modifier = Modifier.height(2.dp))
            QrShareSection(
              shareUrl = state.appShareUrl,
              onUpdateShareUrl = { viewModel.updateAppShareUrl(it) },
              onCopySuccess = { viewModel.notifyToast(it) },
            )
          }
        },
        confirmButton = {
          TextButton(onClick = { showSettingsDialog = false }) {
            Text("Close", fontWeight = FontWeight.Bold)
          }
        },
      )
    }
  }
}

private fun tabIcon(tab: AppTab): ImageVector {
  return when (tab) {
    AppTab.TODAY -> Icons.Filled.Home
    AppTab.TIMER -> Icons.Filled.Timer
    AppTab.TIMETABLE -> Icons.Filled.CalendarMonth
    AppTab.SYLLABUS -> Icons.Filled.MenuBook
    AppTab.STATS -> Icons.Filled.MilitaryTech
  }
}
