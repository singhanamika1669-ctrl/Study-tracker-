package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.focus.InstalledAppInfo
import com.example.model.DefaultPadhaiData
import com.example.model.FocusModeConfig
import com.example.model.OnlineClassSlot
import com.example.model.PadhaiDateUtils
import com.example.model.StrictSession
import com.example.model.StudyReminder
import com.example.model.Subject
import com.example.model.TimerMode
import com.example.ui.TimerUiState
import com.example.ui.components.FighterJetVector
import com.example.ui.components.LinearProgressTrack
import com.example.ui.components.PadhaiCard
import com.example.ui.components.SubjectDropdown
import com.example.ui.components.TimePickerChipField
import com.example.ui.theme.AfterburnerAmber
import com.example.ui.theme.BannerArmy
import com.example.ui.theme.BannerNavy
import com.example.ui.theme.LocalPadhaiColors
import com.example.ui.theme.SquadronSky
import com.example.ui.theme.SuccessGreen

@Composable
fun TimerScreen(
  subjects: List<Subject>,
  onlineClasses: List<OnlineClassSlot>,
  strictMode: Boolean,
  activeStrictSession: StrictSession?,
  strictRemainingMs: Long,
  timerState: TimerUiState,
  focusMode: FocusModeConfig,
  installedApps: List<InstalledAppInfo>,
  isAccessibilityEnabled: Boolean,
  reminders: List<StudyReminder>,
  defaultAlarmTone: String,
  onSelectMode: (TimerMode) -> Unit,
  onSelectOnlineClassPresetMins: (Int) -> Unit,
  onSelectSubject: (String) -> Unit,
  onChangeTopic: (String) -> Unit,
  onToggleStartPause: () -> Unit,
  onFinishAndSave: () -> Unit,
  onReset: () -> Unit,
  onStartStrictOnlineClass: (OnlineClassSlot) -> Unit,
  onToggleFocusMode: (Int?) -> Unit,
  onToggleAllowedPackage: (String) -> Unit,
  onOpenAccessibilitySettings: () -> Unit,
  onSelectDefaultTone: (String) -> Unit,
  onPreviewTone: (String) -> Unit,
  onAddReminder: (title: String, time: String, days: List<String>, toneId: String) -> Unit,
  onToggleReminder: (String) -> Unit,
  onDeleteReminder: (String) -> Unit,
  onTestAlarm: (String) -> Unit,
) {
  val colors = LocalPadhaiColors.current

  var appSearch by remember { mutableStateOf("") }
  var selectedDurationMins by remember { mutableIntStateOf(0) } // 0 = Until turned off

  var alarmTitle by remember { mutableStateOf("") }
  var alarmTime by remember { mutableStateOf("06:00") }
  var alarmDay by remember { mutableStateOf("Daily") }
  var selectedToneId by remember(defaultAlarmTone) { mutableStateOf(defaultAlarmTone) }

  val durationOptions = listOf(
    0 to "Until Off",
    25 to "25 min",
    50 to "50 min",
    90 to "90 min",
  )

  val classPresetOptions = listOf(45, 60, 90, 120)
  val dayOptions = listOf("Daily", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")

  val filteredApps = remember(installedApps, appSearch, focusMode.allowedPackages) {
    val q = appSearch.trim().lowercase()
    installedApps
      .filter { q.isEmpty() || it.label.lowercase().contains(q) || it.packageName.lowercase().contains(q) }
      .sortedWith(
        compareByDescending<InstalledAppInfo> { focusMode.allowedPackages.contains(it.packageName) }
          .thenBy { it.label.lowercase() }
      )
  }

  val statusText = when {
    timerState.isCompleted -> "Sortie Complete! Finish & Save dabao."
    timerState.isRunning -> if (timerState.mode == TimerMode.ONLINE_CLASS) {
      "Online Class Sortie ON... Focus maintain rakho!"
    } else {
      "Afterburner Focus ON... Lage raho Pilot!"
    }
    timerState.hasStarted -> "Paused. Resume ya Save karo."
    timerState.mode == TimerMode.ONLINE_CLASS -> "Online Class select karo ya duration chuno."
    else -> "Cockpit Ready! Start sortie dabao."
  }

  LazyColumn(
    modifier = Modifier.fillMaxSize(),
    contentPadding = PaddingValues(14.dp),
    verticalArrangement = Arrangement.spacedBy(14.dp),
  ) {
    // 1. Fighter Cockpit HUD Study / Strict Lock / Online Class Timer
    item {
      PadhaiCard {
        if (activeStrictSession != null) {
          val totalMs = activeStrictSession.totalDurationMs.coerceAtLeast(1L)
          val progressRatio = ((totalMs - strictRemainingMs).toFloat() / totalMs.toFloat()).coerceIn(0f, 1f)
          val progressPct = (progressRatio * 100f).toInt().coerceIn(0, 100)

          Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
          ) {
            Surface(
              color = Color(0xFFFEF3C7),
              shape = RoundedCornerShape(10.dp),
            ) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
              ) {
                Icon(
                  imageVector = Icons.Filled.Lock,
                  contentDescription = null,
                  tint = Color(0xFFB45309),
                  modifier = Modifier.size(16.dp),
                )
                Text(
                  text = if (activeStrictSession.taskKind == "online_class") {
                    "STRICT ONLINE CLASS SORTIE LOCK"
                  } else {
                    "STRICT MISSION SORTIE LOCKED"
                  },
                  color = Color(0xFF92400E),
                  fontSize = 11.sp,
                  fontWeight = FontWeight.ExtraBold,
                )
              }
            }

            Spacer(modifier = Modifier.height(12.dp))
            Text(
              text = activeStrictSession.title,
              style = MaterialTheme.typography.titleMedium,
              fontWeight = FontWeight.ExtraBold,
              color = colors.textPrimary,
              textAlign = TextAlign.Center,
            )
            if (activeStrictSession.startClock.isNotBlank() && activeStrictSession.endClock.isNotBlank()) {
              Spacer(modifier = Modifier.height(4.dp))
              Text(
                text = "Slot: ${activeStrictSession.startClock} – ${activeStrictSession.endClock} · Pura hone par hi complete hoga",
                color = colors.textMuted,
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
              )
            }

            Spacer(modifier = Modifier.height(14.dp))
            Box(
              modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(BannerNavy),
              contentAlignment = Alignment.Center,
            ) {
              Image(
                painter = painterResource(id = R.drawable.fighter_stratosphere_focus),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                alpha = 0.55f,
                modifier = Modifier.matchParentSize(),
              )
              Box(
                modifier = Modifier
                  .matchParentSize()
                  .background(
                    Brush.verticalGradient(
                      listOf(Color(0x9908101C), Color(0xDD08101C))
                    )
                  ),
              )
              Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(vertical = 20.dp, horizontal = 12.dp),
              ) {
                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                  FighterJetVector(tint = AfterburnerAmber, modifier = Modifier.size(16.dp))
                  Text(
                    text = "AFTERBURNER LOCK COUNTDOWN",
                    color = AfterburnerAmber,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 1.4.sp,
                  )
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                  text = PadhaiDateUtils.formatCountdownClockMs(strictRemainingMs),
                  style = TextStyle(
                    fontFamily = FontFamily.Monospace,
                    fontFeatureSettings = "tnum",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 44.sp,
                    letterSpacing = 2.sp,
                    color = Color.White,
                  ),
                )
              }
            }

            Spacer(modifier = Modifier.height(14.dp))
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
            ) {
              Text("Sortie Progress", fontSize = 12.sp, color = colors.textMuted)
              Text("$progressPct%", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = colors.primaryAccent)
            }
            Spacer(modifier = Modifier.height(6.dp))
            LinearProgressTrack(progress = progressRatio, fillColor = SquadronSky, heightDp = 10)

            Spacer(modifier = Modifier.height(14.dp))
            Surface(
              color = Color(0xFFFFFBEB),
              shape = RoundedCornerShape(10.dp),
              border = BorderStroke(1.dp, Color(0xFFFDE68A)),
              modifier = Modifier.fillMaxWidth(),
            ) {
              Text(
                text = "Strict Mode ON hai: Jab tak timer 00:00:00 na ho jaye tab tak Pause, Reset, ya Manual Complete locked hai!",
                color = Color(0xFF92400E),
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(12.dp),
              )
            }
          }
        } else {
          LazyRow(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier.fillMaxWidth(),
          ) {
            items(TimerMode.entries) { mode ->
              val selected = timerState.mode == mode
              Surface(
                onClick = { onSelectMode(mode) },
                shape = RoundedCornerShape(10.dp),
                color = if (selected) colors.primaryAccent else colors.innerBackground,
                border = BorderStroke(1.dp, if (selected) colors.primaryAccent else colors.border),
                modifier = Modifier.height(40.dp),
              ) {
                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.Center,
                  modifier = Modifier.padding(horizontal = 12.dp),
                ) {
                  Text(
                    text = mode.label,
                    color = if (selected) Color.White else colors.textMuted,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                  )
                }
              }
            }
          }

          Spacer(modifier = Modifier.height(14.dp))

          SubjectDropdown(
            subjects = subjects,
            selectedSubjectId = timerState.subjectId,
            onSelectSubject = onSelectSubject,
            label = "Subject",
          )

          Spacer(modifier = Modifier.height(10.dp))

          OutlinedTextField(
            value = timerState.topic,
            onValueChange = onChangeTopic,
            placeholder = {
              Text(
                if (timerState.mode == TimerMode.ONLINE_CLASS) "Kaunsi Online Class chal rahi hai?"
                else "Abhi kaunsa chapter padh rahe ho?"
              )
            },
            singleLine = true,
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(
              focusedContainerColor = colors.innerBackground,
              unfocusedContainerColor = colors.innerBackground,
              focusedBorderColor = colors.primaryAccent,
              unfocusedBorderColor = colors.border,
            ),
            modifier = Modifier.fillMaxWidth(),
          )

          if (timerState.mode == TimerMode.ONLINE_CLASS) {
            Spacer(modifier = Modifier.height(10.dp))
            LazyRow(
              horizontalArrangement = Arrangement.spacedBy(6.dp),
              modifier = Modifier.fillMaxWidth(),
            ) {
              items(classPresetOptions) { mins ->
                val selected = timerState.onlineClassMins == mins
                Surface(
                  onClick = { onSelectOnlineClassPresetMins(mins) },
                  shape = RoundedCornerShape(8.dp),
                  color = if (selected) BannerArmy else colors.innerBackground,
                  border = BorderStroke(1.dp, if (selected) BannerArmy else colors.border),
                  modifier = Modifier.height(34.dp),
                ) {
                  Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(horizontal = 12.dp),
                  ) {
                    Text(
                      text = PadhaiDateUtils.formatMinutes(mins),
                      color = if (selected) Color.White else colors.textMuted,
                      fontSize = 12.sp,
                      fontWeight = FontWeight.Bold,
                    )
                  }
                }
              }
            }

            if (onlineClasses.isNotEmpty()) {
              Spacer(modifier = Modifier.height(10.dp))
              Surface(
                color = colors.innerBackground,
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, colors.border),
                modifier = Modifier.fillMaxWidth(),
              ) {
                Column(
                  modifier = Modifier.padding(10.dp),
                  verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                  Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                  ) {
                    Icon(
                      imageVector = Icons.Filled.Videocam,
                      contentDescription = null,
                      tint = BannerArmy,
                      modifier = Modifier.size(16.dp),
                    )
                    Text(
                      text = "Saved Online Classes (Tap to Start)",
                      fontSize = 11.sp,
                      fontWeight = FontWeight.Bold,
                      color = colors.textMuted,
                    )
                  }
                  onlineClasses.forEach { cls ->
                    Surface(
                      onClick = { onStartStrictOnlineClass(cls) },
                      color = colors.cardBackground,
                      shape = RoundedCornerShape(8.dp),
                      border = BorderStroke(1.dp, colors.border),
                      modifier = Modifier.fillMaxWidth(),
                    ) {
                      Row(
                        modifier = Modifier
                          .fillMaxWidth()
                          .padding(horizontal = 10.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                      ) {
                        Text(
                          text = "${cls.title} (${cls.platform})",
                          fontSize = 12.sp,
                          fontWeight = FontWeight.SemiBold,
                          color = colors.textPrimary,
                          maxLines = 1,
                          overflow = TextOverflow.Ellipsis,
                          modifier = Modifier.weight(1f),
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                          text = "${cls.start}–${cls.end}",
                          fontSize = 11.sp,
                          fontWeight = FontWeight.Bold,
                          color = BannerArmy,
                        )
                      }
                    }
                  }
                }
              }
            }
          }

          Spacer(modifier = Modifier.height(16.dp))

          // Stratosphere Fighter Cockpit Clock Panel
          Box(
            modifier = Modifier
              .fillMaxWidth()
              .clip(RoundedCornerShape(14.dp))
              .background(BannerNavy),
            contentAlignment = Alignment.Center,
          ) {
            Image(
              painter = painterResource(id = R.drawable.fighter_stratosphere_focus),
              contentDescription = null,
              contentScale = ContentScale.Crop,
              alpha = 0.55f,
              modifier = Modifier.matchParentSize(),
            )
            Box(
              modifier = Modifier
                .matchParentSize()
                .background(
                  Brush.verticalGradient(
                    listOf(Color(0x9908101C), Color(0xDC08101C))
                  )
                ),
            )
            Column(
              modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 22.dp, horizontal = 14.dp),
              horizontalAlignment = Alignment.CenterHorizontally,
            ) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
              ) {
                FighterJetVector(tint = Color(0xFF7DD3FC), modifier = Modifier.size(16.dp))
                Text(
                  text = "COCKPIT SORTIE HUD",
                  color = Color(0xFFBAE6FD),
                  fontSize = 10.sp,
                  fontWeight = FontWeight.ExtraBold,
                  letterSpacing = 1.4.sp,
                )
              }
              Spacer(modifier = Modifier.height(6.dp))
              Text(
                text = PadhaiDateUtils.formatClockMs(timerState.displayMs),
                style = TextStyle(
                  fontFamily = FontFamily.Monospace,
                  fontFeatureSettings = "tnum",
                  fontWeight = FontWeight.ExtraBold,
                  fontSize = 46.sp,
                  letterSpacing = 2.sp,
                  color = Color.White,
                ),
              )
              Spacer(modifier = Modifier.height(6.dp))
              Text(
                text = statusText,
                color = Color(0xFFCBD5E1),
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
              )
            }
          }

          Spacer(modifier = Modifier.height(16.dp))

          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
          ) {
            Button(
              onClick = onToggleStartPause,
              shape = RoundedCornerShape(10.dp),
              modifier = Modifier.height(48.dp),
            ) {
              Icon(
                imageVector = if (timerState.isRunning) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                contentDescription = null,
                modifier = Modifier.size(18.dp),
              )
              Spacer(modifier = Modifier.width(6.dp))
              Text(
                text = when {
                  timerState.isRunning -> "Pause"
                  timerState.hasStarted && !timerState.isCompleted -> "Resume"
                  else -> "Start Sortie"
                },
                fontWeight = FontWeight.Bold,
                maxLines = 1,
              )
            }

            if (timerState.hasStarted && (!strictMode || timerState.mode == TimerMode.STOPWATCH || timerState.isCompleted)) {
              Button(
                onClick = onFinishAndSave,
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
                modifier = Modifier.height(48.dp),
              ) {
                Icon(
                  imageVector = Icons.Filled.Save,
                  contentDescription = null,
                  tint = Color.White,
                  modifier = Modifier.size(18.dp),
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text("Finish & Save", color = Color.White, fontWeight = FontWeight.Bold, maxLines = 1)
              }
            }

            if (!strictMode || !timerState.isRunning) {
              OutlinedButton(
                onClick = onReset,
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, colors.border),
                modifier = Modifier.height(48.dp),
              ) {
                Icon(
                  imageVector = Icons.Filled.Refresh,
                  contentDescription = null,
                  tint = colors.textPrimary,
                  modifier = Modifier.size(18.dp),
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text("Reset", color = colors.textPrimary, maxLines = 1)
              }
            }
          }
        }
      }
    }

    // 2. Focus Mode — Allowed Apps Only
    item {
      PadhaiCard {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.weight(1f),
          ) {
            Icon(
              imageVector = Icons.Filled.Lock,
              contentDescription = null,
              tint = if (focusMode.enabled) BannerArmy else colors.primaryAccent,
              modifier = Modifier.size(20.dp),
            )
            Column {
              Text(
                text = "Focus Mode (App Lock)",
                style = MaterialTheme.typography.titleMedium,
                color = colors.textPrimary,
              )
              Text(
                text = if (focusMode.enabled) {
                  "Active · ${focusMode.allowedPackages.size} allowed apps"
                } else {
                  "Select kiye hue apps ke alawa sab block honge"
                },
                color = if (focusMode.enabled) colors.armyAccent else colors.textMuted,
                fontSize = 12.sp,
                fontWeight = if (focusMode.enabled) FontWeight.SemiBold else FontWeight.Normal,
              )
            }
          }

          Switch(
            checked = focusMode.enabled,
            onCheckedChange = {
              onToggleFocusMode(if (!focusMode.enabled && selectedDurationMins > 0) selectedDurationMins else null)
            },
          )
        }

        if (!isAccessibilityEnabled) {
          Spacer(modifier = Modifier.height(10.dp))
          Surface(
            color = colors.innerBackground,
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, colors.border),
            modifier = Modifier.fillMaxWidth(),
          ) {
            Column(modifier = Modifier.padding(12.dp)) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
              ) {
                Icon(
                  imageVector = Icons.Filled.Security,
                  contentDescription = null,
                  tint = colors.primaryAccent,
                  modifier = Modifier.size(18.dp),
                )
                Text(
                  text = "Phone app blocking ke liye Study Tracker Accessibility Service ON karein.",
                  color = colors.textPrimary,
                  fontSize = 12.sp,
                  lineHeight = 17.sp,
                  modifier = Modifier.weight(1f),
                )
              }
              Spacer(modifier = Modifier.height(8.dp))
              OutlinedButton(
                onClick = onOpenAccessibilitySettings,
                shape = RoundedCornerShape(8.dp),
                border = BorderStroke(1.dp, colors.primaryAccent),
                modifier = Modifier.fillMaxWidth(),
              ) {
                Text(
                  text = "Enable App Blocker Permission",
                  color = colors.primaryAccent,
                  fontWeight = FontWeight.Bold,
                  fontSize = 12.sp,
                )
              }
            }
          }
        }

        Spacer(modifier = Modifier.height(12.dp))
        Text(
          text = "Focus Duration",
          color = colors.textMuted,
          fontSize = 12.sp,
          fontWeight = FontWeight.SemiBold,
        )
        Spacer(modifier = Modifier.height(6.dp))
        LazyRow(
          horizontalArrangement = Arrangement.spacedBy(6.dp),
          modifier = Modifier.fillMaxWidth(),
        ) {
          items(durationOptions) { (mins, label) ->
            val selected = selectedDurationMins == mins
            Surface(
              onClick = { selectedDurationMins = mins },
              shape = RoundedCornerShape(10.dp),
              color = if (selected) BannerArmy else colors.innerBackground,
              border = BorderStroke(1.dp, if (selected) BannerArmy else colors.border),
              modifier = Modifier.height(36.dp),
            ) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(horizontal = 12.dp),
              ) {
                Text(
                  text = label,
                  color = if (selected) Color.White else colors.textMuted,
                  fontSize = 12.sp,
                  fontWeight = FontWeight.SemiBold,
                  maxLines = 1,
                )
              }
            }
          }
        }

        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
          value = appSearch,
          onValueChange = { appSearch = it },
          leadingIcon = {
            Icon(imageVector = Icons.Filled.Search, contentDescription = null, modifier = Modifier.size(18.dp))
          },
          placeholder = { Text("Allowed study apps search & select karein...") },
          singleLine = true,
          shape = RoundedCornerShape(10.dp),
          colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = colors.innerBackground,
            unfocusedContainerColor = colors.innerBackground,
            focusedBorderColor = colors.primaryAccent,
            unfocusedBorderColor = colors.border,
          ),
          modifier = Modifier.fillMaxWidth(),
        )

        Spacer(modifier = Modifier.height(8.dp))
        if (filteredApps.isEmpty()) {
          Text(
            text = "Koi installed app nahi mila.",
            color = colors.textMuted,
            fontSize = 12.sp,
          )
        } else {
          LazyColumn(
            modifier = Modifier
              .fillMaxWidth()
              .heightIn(max = 220.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
          ) {
            items(filteredApps, key = { it.packageName }) { app ->
              val isAllowed = focusMode.allowedPackages.contains(app.packageName)
              Surface(
                shape = RoundedCornerShape(10.dp),
                color = if (isAllowed) colors.armyContainer else colors.innerBackground,
                border = BorderStroke(1.dp, if (isAllowed) colors.armyAccent else colors.border),
                modifier = Modifier
                  .fillMaxWidth()
                  .clip(RoundedCornerShape(10.dp))
                  .clickable { onToggleAllowedPackage(app.packageName) },
              ) {
                Row(
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 4.dp),
                  verticalAlignment = Alignment.CenterVertically,
                ) {
                  Checkbox(
                    checked = isAllowed,
                    onCheckedChange = { onToggleAllowedPackage(app.packageName) },
                  )
                  Column(modifier = Modifier.weight(1f)) {
                    Text(
                      text = app.label,
                      color = colors.textPrimary,
                      fontWeight = FontWeight.SemiBold,
                      fontSize = 13.sp,
                      maxLines = 1,
                      overflow = TextOverflow.Ellipsis,
                    )
                    Text(
                      text = app.packageName,
                      color = colors.textMuted,
                      fontSize = 11.sp,
                      maxLines = 1,
                      overflow = TextOverflow.Ellipsis,
                    )
                  }
                  if (isAllowed) {
                    Icon(
                      imageVector = Icons.Filled.Check,
                      contentDescription = "Allowed",
                      tint = colors.armyAccent,
                      modifier = Modifier.size(16.dp),
                    )
                  }
                }
              }
            }
          }
        }
      }
    }

    // 3. Hard Military & IAF Alarms (No Snooze Allowed + 6 Tones)
    item {
      PadhaiCard {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.weight(1f),
          ) {
            Icon(
              imageVector = Icons.Filled.Alarm,
              contentDescription = null,
              tint = colors.primaryAccent,
              modifier = Modifier.size(20.dp),
            )
            Column {
              Text(
                text = "Study Alarm & Hard Tones",
                style = MaterialTheme.typography.titleMedium,
                color = colors.textPrimary,
              )
              Text(
                text = "No Snooze Allowed · 6 Military & IAF Tones",
                color = colors.textMuted,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
              )
            }
          }
          OutlinedButton(
            onClick = { onTestAlarm(selectedToneId) },
            shape = RoundedCornerShape(8.dp),
            border = BorderStroke(1.dp, colors.border),
            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
          ) {
            Icon(
              imageVector = Icons.Filled.NotificationsActive,
              contentDescription = null,
              modifier = Modifier.size(14.dp),
              tint = colors.primaryAccent,
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text("Test Ring", fontSize = 12.sp, color = colors.textPrimary)
          }
        }

        Spacer(modifier = Modifier.height(12.dp))
        Text(
          text = "Select Hard Alarm Tone (Tap Sound Icon to Preview)",
          color = colors.textMuted,
          fontSize = 12.sp,
          fontWeight = FontWeight.SemiBold,
        )
        Spacer(modifier = Modifier.height(6.dp))

        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
          DefaultPadhaiData.alarmTones.forEach { tone ->
            val selected = selectedToneId == tone.id
            Surface(
              shape = RoundedCornerShape(10.dp),
              color = if (selected) colors.armyContainer else colors.innerBackground,
              border = BorderStroke(1.dp, if (selected) SquadronSky else colors.border),
              modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .clickable {
                  selectedToneId = tone.id
                  onSelectDefaultTone(tone.id)
                },
            ) {
              Row(
                modifier = Modifier
                  .fillMaxWidth()
                  .padding(start = 12.dp, end = 6.dp, top = 8.dp, bottom = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
              ) {
                Column(modifier = Modifier.weight(1f)) {
                  Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                  ) {
                    Text(
                      text = tone.name,
                      color = colors.textPrimary,
                      fontWeight = FontWeight.Bold,
                      fontSize = 13.sp,
                      maxLines = 1,
                      overflow = TextOverflow.Ellipsis,
                    )
                    Surface(
                      color = if (selected) SquadronSky else colors.border.copy(alpha = 0.45f),
                      shape = RoundedCornerShape(5.dp),
                    ) {
                      Text(
                        text = tone.intensity,
                        color = if (selected) Color.White else colors.textPrimary,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 5.dp, vertical = 1.dp),
                      )
                    }
                  }
                  Text(
                    text = tone.description,
                    color = colors.textMuted,
                    fontSize = 11.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                  )
                }
                IconButton(
                  onClick = { onPreviewTone(tone.id) },
                  modifier = Modifier.size(40.dp),
                ) {
                  Icon(
                    imageVector = Icons.Filled.VolumeUp,
                    contentDescription = "Preview ${tone.name}",
                    tint = colors.primaryAccent,
                    modifier = Modifier.size(19.dp),
                  )
                }
              }
            }
          }
        }

        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
          value = alarmTitle,
          onValueChange = { alarmTitle = it },
          placeholder = { Text("Alarm label (e.g. Morning PT + Maths Revision)") },
          singleLine = true,
          shape = RoundedCornerShape(10.dp),
          colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = colors.innerBackground,
            unfocusedContainerColor = colors.innerBackground,
            focusedBorderColor = colors.primaryAccent,
            unfocusedBorderColor = colors.border,
          ),
          modifier = Modifier.fillMaxWidth(),
        )

        Spacer(modifier = Modifier.height(8.dp))
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(8.dp),
          verticalAlignment = Alignment.CenterVertically,
        ) {
          TimePickerChipField(
            label = "Alarm Time",
            timeValue = alarmTime,
            onTimeSelected = { alarmTime = it },
            modifier = Modifier.weight(1f),
          )
          Button(
            onClick = {
              onAddReminder(alarmTitle, alarmTime, listOf(alarmDay), selectedToneId)
              alarmTitle = ""
            },
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
              .weight(1f)
              .height(52.dp),
          ) {
            Text("+ Set Alarm", fontWeight = FontWeight.Bold, maxLines = 1)
          }
        }

        Spacer(modifier = Modifier.height(8.dp))
        LazyRow(
          horizontalArrangement = Arrangement.spacedBy(6.dp),
          modifier = Modifier.fillMaxWidth(),
        ) {
          items(dayOptions) { day ->
            val selected = alarmDay == day
            Surface(
              onClick = { alarmDay = day },
              shape = RoundedCornerShape(16.dp),
              color = if (selected) colors.primaryAccent else colors.innerBackground,
              border = BorderStroke(1.dp, if (selected) colors.primaryAccent else colors.border),
              modifier = Modifier.height(34.dp),
            ) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(horizontal = 12.dp),
              ) {
                Text(
                  text = day,
                  color = if (selected) Color.White else colors.textMuted,
                  fontSize = 12.sp,
                  fontWeight = FontWeight.SemiBold,
                )
              }
            }
          }
        }

        Spacer(modifier = Modifier.height(12.dp))
        if (reminders.isEmpty()) {
          Text(
            text = "Abhi koi alarm set nahi hai. Tone choose karke Set Alarm dabao!",
            color = colors.textMuted,
            fontSize = 13.sp,
          )
        } else {
          Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            reminders.forEach { rem ->
              val toneMeta = DefaultPadhaiData.getToneMeta(rem.toneId)
              Surface(
                shape = RoundedCornerShape(12.dp),
                color = colors.innerBackground,
                modifier = Modifier.fillMaxWidth(),
              ) {
                Row(
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                  verticalAlignment = Alignment.CenterVertically,
                ) {
                  Column(modifier = Modifier.weight(1f)) {
                    Text(
                      text = rem.time,
                      color = if (rem.enabled) colors.primaryAccent else colors.textMuted,
                      fontWeight = FontWeight.ExtraBold,
                      fontSize = 18.sp,
                    )
                    Text(
                      text = "${rem.title} · ${rem.days.joinToString(", ")}",
                      color = colors.textPrimary,
                      fontSize = 13.sp,
                      maxLines = 1,
                      overflow = TextOverflow.Ellipsis,
                    )
                    Text(
                      text = "Tone: ${toneMeta.name} (${toneMeta.intensity}) · No Snooze",
                      color = colors.textMuted,
                      fontSize = 11.sp,
                      maxLines = 1,
                      overflow = TextOverflow.Ellipsis,
                    )
                  }
                  Switch(
                    checked = rem.enabled,
                    onCheckedChange = { onToggleReminder(rem.id) },
                  )
                  IconButton(
                    onClick = { onDeleteReminder(rem.id) },
                    modifier = Modifier.size(40.dp),
                  ) {
                    Icon(
                      imageVector = Icons.Filled.Close,
                      contentDescription = "Delete alarm",
                      tint = colors.textMuted,
                      modifier = Modifier.size(18.dp),
                    )
                  }
                }
              }
            }
          }
        }
      }
    }

    // 4. NDA Air Force Discipline Rule
    item {
      PadhaiCard {
        Text(
          text = "IAF Flying Squadron Discipline Rule",
          style = MaterialTheme.typography.titleMedium,
          color = colors.textPrimary,
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
          text = "• Zero-Cheat Lock: Timetable slot (e.g. 12:30–2:30 Maths) ya Online Class par tap karte hi countdown lock shuru hota hai — pura time complete hone par hi task Done hoga.",
          color = colors.textMuted,
          fontSize = 13.sp,
          lineHeight = 20.sp,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
          text = "• Zero Snooze Protocol: Military & IAF alarm bajne par snooze nahi milega — seedha Dismiss karke sortie par baitho!",
          color = colors.textMuted,
          fontSize = 13.sp,
          lineHeight = 20.sp,
        )
      }
    }
  }
}
