package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Newspaper
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.model.AppTab
import com.example.model.DailyHabits
import com.example.model.OnlineClassSlot
import com.example.model.PadhaiDateUtils
import com.example.model.PadhaiState
import com.example.model.TimetableSlot
import com.example.model.TodoItem
import com.example.ui.components.CheckToggleBox
import com.example.ui.components.MiniStatTile
import com.example.ui.components.PadhaiCard
import com.example.ui.components.RunwayProgressTrack
import com.example.ui.components.SubjectDropdown
import com.example.ui.theme.AfterburnerAmber
import com.example.ui.theme.BannerArmy
import com.example.ui.theme.BannerNavy
import com.example.ui.theme.LocalPadhaiColors
import com.example.ui.theme.SquadronSky
import com.example.ui.theme.SuccessGreen
import com.example.ui.theme.parseColorHex
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TodayScreen(
  state: PadhaiState,
  strictRemainingMs: Long,
  onNavigateTab: (AppTab) -> Unit,
  onUpdateDailyGoal: (Double) -> Unit,
  onToggleHabit: (String) -> Unit,
  onSavePt: (Double, Int) -> Unit,
  onToggleSlot: (TimetableSlot) -> Unit,
  onStartStrictSlot: (TimetableSlot) -> Unit,
  onToggleOnlineClass: (OnlineClassSlot) -> Unit,
  onStartStrictOnlineClass: (OnlineClassSlot) -> Unit,
  onAddTodo: (String, Int) -> Unit,
  onToggleTodo: (TodoItem) -> Unit,
  onStartStrictTodo: (TodoItem) -> Unit,
  onDeleteTodo: (String) -> Unit,
  onSaveQuickLog: (String, Int?, String, Int) -> Unit,
  onSaveDailyNote: (String) -> Unit,
) {
  val colors = LocalPadhaiColors.current
  val context = LocalContext.current
  val todayStr = PadhaiDateUtils.todayDateStr()
  val todayWeekday = PadhaiDateUtils.todayWeekdayAbbr()

  val todayLogs = remember(state.logs, todayStr) { state.logs.filter { it.date == todayStr } }
  val todayMins = remember(todayLogs) { todayLogs.sumOf { it.mins } }
  val goalMins = ((state.dailyGoalHours.takeIf { it > 0 } ?: 6.0) * 60.0).coerceAtLeast(1.0)
  val progressPct = ((todayMins / goalMins) * 100.0).roundToInt().coerceIn(0, 100)

  val todaySlots = remember(state.timetable, todayWeekday) {
    state.timetable
      .filter { it.day == "Daily" || it.day == todayWeekday }
      .sortedBy { it.start }
  }
  val completedSlotIds = state.completedSlots[todayStr].orEmpty()
  val doneSlotsCount = todaySlots.count { completedSlotIds.contains(it.id) }

  val todayClasses = remember(state.onlineClasses, todayWeekday) {
    state.onlineClasses
      .filter { it.day == "Daily" || it.day == todayWeekday }
      .sortedBy { it.start }
  }
  val completedClassIds = state.completedClasses[todayStr].orEmpty()
  val doneClassesCount = todayClasses.count { completedClassIds.contains(it.id) }

  val todos = state.todos[todayStr].orEmpty()
  val doneTodosCount = todos.count { it.done }

  val todayHabits = state.ndaHabits[todayStr] ?: DailyHabits()
  val doneHabitsCount = listOf(
    todayHabits.ptDone,
    todayHabits.vocabDone,
    todayHabits.caDone,
    todayHabits.pyqDone,
  ).count { it }

  var showGoalDialog by remember { mutableStateOf(false) }
  var ptRunText by remember(todayStr, todayHabits.runKm) {
    mutableStateOf(if (todayHabits.runKm > 0.0) todayHabits.runKm.toString() else "")
  }
  var ptPushupsText by remember(todayStr, todayHabits.pushups) {
    mutableStateOf(if (todayHabits.pushups > 0) todayHabits.pushups.toString() else "")
  }
  var todoInput by remember { mutableStateOf("") }
  var todoLockMins by remember(state.strictMode) { mutableIntStateOf(if (state.strictMode) 60 else 0) }

  var quickSubId by remember(state.subjects) {
    mutableStateOf(state.subjects.firstOrNull()?.id.orEmpty())
  }
  LaunchedEffect(state.subjects) {
    if (state.subjects.none { it.id == quickSubId }) {
      quickSubId = state.subjects.firstOrNull()?.id.orEmpty()
    }
  }
  var quickMinsText by remember { mutableStateOf("") }
  var quickTopicText by remember { mutableStateOf("") }
  var quickFocus by remember { mutableIntStateOf(4) }
  var focusExpanded by remember { mutableStateOf(false) }

  val savedNote = state.notes[todayStr].orEmpty()
  var noteText by remember(todayStr, savedNote) { mutableStateOf(savedNote) }

  val focusOptions = listOf(
    5 to "Focus: 5/5 (Cadet Level)",
    4 to "Focus: 4/5 (Accha)",
    3 to "Focus: 3/5 (Theek-thaak)",
    2 to "Focus: 2/5 (Distracted)",
  )
  val activeStrict = state.activeStrictSession

  LazyColumn(
    modifier = Modifier.fillMaxSize(),
    contentPadding = PaddingValues(14.dp),
    verticalArrangement = Arrangement.spacedBy(14.dp),
  ) {
    // 1. NDA Mission Banner
    item {
      val daysLeft = remember(state.examDate, todayStr) {
        PadhaiDateUtils.daysBetweenTodayAnd(state.examDate)
      }
      val countdownCopy = when {
        state.examName.isBlank() || state.examDate.isBlank() ->
          "Goal dabake apni exam date set karo"
        daysLeft == null ->
          "Goal dabake valid exam date set karo"
        daysLeft > 0 ->
          "$daysLeft din baaki hain · Roz thoda aur behtar bano"
        daysLeft == 0 ->
          "Aaj Exam Day hai · Best of luck Cadet!"
        else ->
          "Target date complete"
      }

      Box(
        modifier = Modifier
          .fillMaxWidth()
          .clip(RoundedCornerShape(16.dp))
          .background(BannerNavy),
      ) {
        Image(
          painter = painterResource(id = R.drawable.iaf_fighter_hero),
          contentDescription = "Indian Air Force Fighter Jet",
          contentScale = ContentScale.Crop,
          modifier = Modifier.matchParentSize(),
        )
        Box(
          modifier = Modifier
            .matchParentSize()
            .background(
              Brush.horizontalGradient(
                listOf(
                  Color(0xEC08101C),
                  Color(0xC80C2340),
                  Color(0x700284C7),
                )
              )
            ),
        )
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.SpaceBetween,
        ) {
          Row(
            modifier = Modifier.weight(1f),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
          ) {
            Image(
              painter = painterResource(id = R.drawable.airforce_wings_emblem),
              contentDescription = "IAF Wings Emblem",
              contentScale = ContentScale.Crop,
              modifier = Modifier
                .size(46.dp)
                .clip(RoundedCornerShape(12.dp))
                .border(1.dp, SquadronSky.copy(alpha = 0.6f), RoundedCornerShape(12.dp)),
            )
            Column(modifier = Modifier.weight(1f)) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
              ) {
                Text(
                  text = "Jai Hind, Future Pilot!",
                  color = Color(0xFFBAE6FD),
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold,
                )
                if (state.strictMode) {
                  Surface(
                    color = AfterburnerAmber.copy(alpha = 0.22f),
                    shape = RoundedCornerShape(6.dp),
                  ) {
                    Text(
                      text = "Strict ON",
                      color = Color(0xFFFDE68A),
                      fontSize = 10.sp,
                      fontWeight = FontWeight.Bold,
                      modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                    )
                  }
                }
              }
              Spacer(modifier = Modifier.height(2.dp))
              Text(
                text = state.examName.ifBlank { "NDA Air Force Flying + 11th Board" },
                color = Color.White,
                fontSize = 17.sp,
                fontWeight = FontWeight.ExtraBold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
              )
              Spacer(modifier = Modifier.height(4.dp))
              Text(
                text = countdownCopy,
                color = Color.White.copy(alpha = 0.92f),
                fontSize = 12.sp,
              )
            }
          }
          Spacer(modifier = Modifier.width(8.dp))
          Surface(
            color = Color.White.copy(alpha = 0.18f),
            shape = RoundedCornerShape(10.dp),
            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.3f)),
            modifier = Modifier.clickable { onNavigateTab(AppTab.STATS) },
          ) {
            Text(
              text = "Goal",
              color = Color.White,
              fontWeight = FontWeight.Bold,
              fontSize = 13.sp,
              modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            )
          }
        }
      }
    }

    // 2. Daily Study Progress
    item {
      PadhaiCard {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          Text(
            text = "Aaj ki Sortie (Study Progress)",
            style = MaterialTheme.typography.titleMedium,
            color = colors.textPrimary,
          )
          OutlinedButton(
            onClick = { showGoalDialog = true },
            shape = RoundedCornerShape(8.dp),
            border = BorderStroke(1.dp, colors.border),
            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
          ) {
            Icon(
              imageVector = Icons.Filled.Edit,
              contentDescription = null,
              modifier = Modifier.size(14.dp),
              tint = colors.textPrimary,
            )
            Spacer(modifier = Modifier.width(4.dp))
            val goalDisplay = if (state.dailyGoalHours % 1.0 == 0.0) {
              state.dailyGoalHours.toInt().toString()
            } else {
              state.dailyGoalHours.toString()
            }
            Text(
              text = "Target: ${goalDisplay}h",
              fontSize = 12.sp,
              color = colors.textPrimary,
              maxLines = 1,
            )
          }
        }

        Spacer(modifier = Modifier.height(8.dp))
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
        ) {
          Text(
            text = "${PadhaiDateUtils.formatMinutes(todayMins)} completed",
            fontSize = 13.sp,
            color = colors.textMuted,
          )
          Text(
            text = "$progressPct%",
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            color = colors.primaryAccent,
          )
        }
        Spacer(modifier = Modifier.height(6.dp))
        RunwayProgressTrack(
          progress = (todayMins / goalMins).toFloat(),
          fillColor = if (progressPct >= 100) SuccessGreen else SquadronSky,
        )
        Spacer(modifier = Modifier.height(12.dp))
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          MiniStatTile(
            value = todayLogs.size.toString(),
            label = "Sessions",
            modifier = Modifier.weight(1f),
          )
          MiniStatTile(
            value = "$doneSlotsCount/${todaySlots.size}",
            label = "Timetable",
            modifier = Modifier.weight(1f),
          )
          MiniStatTile(
            value = "$doneClassesCount/${todayClasses.size}",
            label = "Classes",
            modifier = Modifier.weight(1f),
          )
          MiniStatTile(
            value = "$doneTodosCount/${todos.size}",
            label = "To-Do",
            modifier = Modifier.weight(1f),
          )
        }
      }
    }

    // 3. Today's Online Classes
    item {
      PadhaiCard {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
          ) {
            Icon(
              imageVector = Icons.Filled.Videocam,
              contentDescription = null,
              tint = colors.primaryAccent,
              modifier = Modifier.size(18.dp),
            )
            Text(
              text = "Aaj ki Online Classes",
              style = MaterialTheme.typography.titleMedium,
              color = colors.textPrimary,
            )
          }
          OutlinedButton(
            onClick = { onNavigateTab(AppTab.TIMETABLE) },
            shape = RoundedCornerShape(8.dp),
            border = BorderStroke(1.dp, colors.border),
            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
          ) {
            Text("+ Class", fontSize = 12.sp, color = colors.textPrimary)
          }
        }
        Spacer(modifier = Modifier.height(10.dp))

        if (todayClasses.isEmpty()) {
          Text(
            text = "Aaj ke liye koi online class add nahi hai.",
            color = colors.textMuted,
            fontSize = 13.sp,
          )
        } else {
          Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            todayClasses.forEach { cls ->
              val sub = state.subjects.find { it.id == cls.subjectId }
              val isDone = completedClassIds.contains(cls.id)
              val isRunningThis = activeStrict?.taskKind == "online_class" && activeStrict.taskId == cls.id
              val subColor = parseColorHex(sub?.colorHex ?: "", colors.primaryAccent)
              val durMins = PadhaiDateUtils.computeSlotDurationMins(cls.start, cls.end)

              Surface(
                shape = RoundedCornerShape(12.dp),
                color = colors.innerBackground,
                border = if (isRunningThis) BorderStroke(1.5.dp, colors.primaryAccent) else null,
                modifier = Modifier
                  .fillMaxWidth()
                  .clip(RoundedCornerShape(12.dp))
                  .clickable(enabled = !isDone) { onStartStrictOnlineClass(cls) }
                  .alpha(if (isDone) 0.65f else 1f),
              ) {
                Row(
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 6.dp, vertical = 8.dp),
                  verticalAlignment = Alignment.CenterVertically,
                ) {
                  CheckToggleBox(
                    checked = isDone,
                    locked = state.strictMode && !isDone,
                    onToggle = { onToggleOnlineClass(cls) },
                    contentDescription = "Online class status",
                  )
                  Spacer(modifier = Modifier.width(4.dp))
                  Column(modifier = Modifier.weight(1f)) {
                    Row(
                      verticalAlignment = Alignment.CenterVertically,
                      horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                      Box(
                        modifier = Modifier
                          .size(8.dp)
                          .clip(CircleShape)
                          .background(if (isDone) SuccessGreen else subColor),
                      )
                      Text(
                        text = cls.title,
                        color = colors.textPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        textDecoration = if (isDone) TextDecoration.LineThrough else TextDecoration.None,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                      )
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                      text = "${cls.start} – ${cls.end} (${PadhaiDateUtils.formatMinutes(durMins)}) · ${cls.platform}",
                      color = colors.textMuted,
                      fontSize = 12.sp,
                    )
                    if (isRunningThis) {
                      Text(
                        text = "Live Class Timer · ${PadhaiDateUtils.formatCountdownClockMs(strictRemainingMs)} left",
                        color = colors.primaryAccent,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                      )
                    }
                  }
                  if (cls.meetingUrl.isNotBlank()) {
                    IconButton(
                      onClick = {
                        try {
                          context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(cls.meetingUrl)))
                        } catch (_: Exception) {
                        }
                      },
                      modifier = Modifier.size(40.dp),
                    ) {
                      Icon(
                        imageVector = Icons.Filled.OpenInNew,
                        contentDescription = "Open class link",
                        tint = colors.textMuted,
                        modifier = Modifier.size(18.dp),
                      )
                    }
                  }
                  if (!isDone) {
                    IconButton(
                      onClick = { onStartStrictOnlineClass(cls) },
                      modifier = Modifier.size(44.dp),
                    ) {
                      Icon(
                        imageVector = Icons.Filled.PlayArrow,
                        contentDescription = "Start class timer",
                        tint = colors.primaryAccent,
                      )
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // 4. NDA Daily Routine & PT Fitness
    item {
      PadhaiCard {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          Text(
            text = "NDA Daily Routine & PT",
            style = MaterialTheme.typography.titleMedium,
            color = colors.textPrimary,
          )
          Text(
            text = "$doneHabitsCount/4 Done",
            fontSize = 13.sp,
            color = colors.textMuted,
            fontWeight = FontWeight.SemiBold,
          )
        }
        Spacer(modifier = Modifier.height(12.dp))

        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          HabitToggleChip(
            label = "Morning PT",
            icon = Icons.Filled.DirectionsRun,
            active = todayHabits.ptDone,
            onClick = { onToggleHabit("pt") },
            modifier = Modifier.weight(1f),
          )
          HabitToggleChip(
            label = "10 Vocab Words",
            icon = Icons.Filled.MenuBook,
            active = todayHabits.vocabDone,
            onClick = { onToggleHabit("vocab") },
            modifier = Modifier.weight(1f),
          )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          HabitToggleChip(
            label = "Current Affairs",
            icon = Icons.Filled.Newspaper,
            active = todayHabits.caDone,
            onClick = { onToggleHabit("ca") },
            modifier = Modifier.weight(1f),
          )
          HabitToggleChip(
            label = "20+ Maths PYQ",
            icon = Icons.Filled.Calculate,
            active = todayHabits.pyqDone,
            onClick = { onToggleHabit("pyq") },
            modifier = Modifier.weight(1f),
          )
        }

        Spacer(modifier = Modifier.height(12.dp))
        Surface(
          color = colors.innerBackground,
          shape = RoundedCornerShape(12.dp),
        ) {
          Row(
            modifier = Modifier
              .fillMaxWidth()
              .padding(10.dp),
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
          ) {
            OutlinedTextField(
              value = ptRunText,
              onValueChange = { ptRunText = it },
              label = { Text("Run (km)", fontSize = 12.sp) },
              placeholder = { Text("2.4") },
              singleLine = true,
              keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
              shape = RoundedCornerShape(10.dp),
              modifier = Modifier.weight(1f),
            )
            OutlinedTextField(
              value = ptPushupsText,
              onValueChange = { ptPushupsText = it },
              label = { Text("Push-ups", fontSize = 12.sp) },
              placeholder = { Text("30") },
              singleLine = true,
              keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
              shape = RoundedCornerShape(10.dp),
              modifier = Modifier.weight(1f),
            )
            Button(
              onClick = {
                onSavePt(
                  ptRunText.toDoubleOrNull() ?: 0.0,
                  ptPushupsText.toIntOrNull() ?: 0,
                )
              },
              shape = RoundedCornerShape(10.dp),
              colors = ButtonDefaults.buttonColors(containerColor = BannerArmy),
              modifier = Modifier.height(52.dp),
            ) {
              Icon(
                imageVector = Icons.Filled.FitnessCenter,
                contentDescription = null,
                modifier = Modifier.size(16.dp),
              )
              Spacer(modifier = Modifier.width(4.dp))
              Text("Save", color = Color.White, maxLines = 1)
            }
          }
        }
      }
    }

    // 5. Today's Timetable (Strict Task Lock)
    item {
      PadhaiCard {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          Text(
            text = "Aaj ka Timetable",
            style = MaterialTheme.typography.titleMedium,
            color = colors.textPrimary,
          )
          OutlinedButton(
            onClick = { onNavigateTab(AppTab.TIMETABLE) },
            shape = RoundedCornerShape(8.dp),
            border = BorderStroke(1.dp, colors.border),
            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
          ) {
            Text("+ Manage", fontSize = 12.sp, color = colors.textPrimary)
          }
        }
        if (state.strictMode) {
          Spacer(modifier = Modifier.height(4.dp))
          Text(
            text = "Strict Rule: Task pe click karte hi timer shuru hoga — pura time hone par hi Done hoga.",
            color = Color(0xFFB45309),
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
          )
        }
        Spacer(modifier = Modifier.height(10.dp))

        if (todaySlots.isEmpty()) {
          Text(
            text = "Aaj ke liye koi timetable slot nahi hai.",
            color = colors.textMuted,
            fontSize = 13.sp,
          )
        } else {
          Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            todaySlots.forEach { slot ->
              val sub = state.subjects.find { it.id == slot.subjectId }
              val isDone = completedSlotIds.contains(slot.id)
              val isRunningThis = activeStrict?.taskKind == "slot" && activeStrict.taskId == slot.id
              val subColor = parseColorHex(sub?.colorHex ?: "", colors.primaryAccent)
              val durMins = PadhaiDateUtils.computeSlotDurationMins(slot.start, slot.end)

              Surface(
                shape = RoundedCornerShape(12.dp),
                color = colors.innerBackground,
                border = if (isRunningThis) BorderStroke(1.5.dp, colors.primaryAccent) else null,
                modifier = Modifier
                  .fillMaxWidth()
                  .clip(RoundedCornerShape(12.dp))
                  .clickable(enabled = !isDone) { onStartStrictSlot(slot) }
                  .alpha(if (isDone) 0.65f else 1f),
              ) {
                Row(
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 6.dp, vertical = 8.dp),
                  verticalAlignment = Alignment.CenterVertically,
                ) {
                  CheckToggleBox(
                    checked = isDone,
                    locked = state.strictMode && !isDone,
                    onToggle = { onToggleSlot(slot) },
                    contentDescription = "Mark slot complete",
                  )
                  Spacer(modifier = Modifier.width(4.dp))
                  Column(modifier = Modifier.weight(1f)) {
                    Row(
                      verticalAlignment = Alignment.CenterVertically,
                      horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                      Box(
                        modifier = Modifier
                          .size(8.dp)
                          .clip(CircleShape)
                          .background(if (isDone) SuccessGreen else subColor),
                      )
                      Text(
                        text = "${sub?.name ?: "General"} — ${slot.task.ifBlank { "Study" }}",
                        color = colors.textPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        textDecoration = if (isDone) TextDecoration.LineThrough else TextDecoration.None,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                      )
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                      text = "${slot.start} – ${slot.end} (${PadhaiDateUtils.formatMinutes(durMins)}) · ${slot.day}",
                      color = colors.textMuted,
                      fontSize = 12.sp,
                    )
                    if (isRunningThis) {
                      Text(
                        text = "Locked Timer ON · ${PadhaiDateUtils.formatCountdownClockMs(strictRemainingMs)} left",
                        color = colors.primaryAccent,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                      )
                    }
                  }
                  if (!isDone) {
                    IconButton(
                      onClick = { onStartStrictSlot(slot) },
                      modifier = Modifier.size(44.dp),
                    ) {
                      Icon(
                        imageVector = Icons.Filled.PlayArrow,
                        contentDescription = "Start strict timer for slot",
                        tint = colors.primaryAccent,
                      )
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // 6. Daily To-Do List (with Optional Strict Lock Duration)
    item {
      PadhaiCard {
        Text(
          text = "Aaj ke Targets (11th + NDA)",
          style = MaterialTheme.typography.titleMedium,
          color = colors.textPrimary,
        )
        Spacer(modifier = Modifier.height(10.dp))
        Row(
          modifier = Modifier.fillMaxWidth(),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          OutlinedTextField(
            value = todoInput,
            onValueChange = { todoInput = it },
            placeholder = { Text("Trigonometry 30 sawal + Hindi", maxLines = 1, overflow = TextOverflow.Ellipsis) },
            singleLine = true,
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.weight(1f),
          )
          Button(
            onClick = {
              if (todoInput.isNotBlank()) {
                onAddTodo(todoInput, todoLockMins)
                todoInput = ""
              }
            },
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.height(52.dp),
          ) {
            Icon(imageVector = Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(2.dp))
            Text("Add", maxLines = 1)
          }
        }

        Spacer(modifier = Modifier.height(8.dp))
        LazyRow(
          horizontalArrangement = Arrangement.spacedBy(6.dp),
          modifier = Modifier.fillMaxWidth(),
        ) {
          items(listOf(0, 30, 60, 90, 120)) { mins ->
            val selected = todoLockMins == mins
            Surface(
              onClick = { todoLockMins = mins },
              shape = RoundedCornerShape(8.dp),
              color = if (selected) colors.primaryAccent else colors.innerBackground,
              border = BorderStroke(1.dp, if (selected) colors.primaryAccent else colors.border),
              modifier = Modifier.height(32.dp),
            ) {
              Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.padding(horizontal = 10.dp),
              ) {
                Text(
                  text = if (mins == 0) "Free" else PadhaiDateUtils.formatMinutes(mins),
                  color = if (selected) Color.White else colors.textMuted,
                  fontSize = 11.sp,
                  fontWeight = FontWeight.Bold,
                )
              }
            }
          }
        }

        Spacer(modifier = Modifier.height(10.dp))
        if (todos.isEmpty()) {
          Text(
            text = "Aaj ke targets add karo (e.g. Sets Ex 1.2 + 20 PYQs).",
            color = colors.textMuted,
            fontSize = 13.sp,
          )
        } else {
          Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            todos.forEach { todo ->
              val hasTimer = todo.requiredMins > 0
              val isRunningThis = activeStrict?.taskKind == "todo" && activeStrict.taskId == todo.id
              Surface(
                shape = RoundedCornerShape(12.dp),
                color = colors.innerBackground,
                modifier = Modifier
                  .fillMaxWidth()
                  .clip(RoundedCornerShape(12.dp))
                  .clickable(enabled = hasTimer && !todo.done) { onStartStrictTodo(todo) }
                  .alpha(if (todo.done) 0.65f else 1f),
              ) {
                Row(
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 6.dp, vertical = 6.dp),
                  verticalAlignment = Alignment.CenterVertically,
                ) {
                  CheckToggleBox(
                    checked = todo.done,
                    locked = state.strictMode && hasTimer && !todo.done,
                    onToggle = { onToggleTodo(todo) },
                    contentDescription = "Toggle target",
                  )
                  Column(modifier = Modifier.weight(1f)) {
                    Text(
                      text = todo.text,
                      color = colors.textPrimary,
                      fontSize = 14.sp,
                      fontWeight = FontWeight.Medium,
                      textDecoration = if (todo.done) TextDecoration.LineThrough else TextDecoration.None,
                    )
                    if (hasTimer) {
                      Text(
                        text = if (isRunningThis) {
                          "Timer ON · ${PadhaiDateUtils.formatCountdownClockMs(strictRemainingMs)} left"
                        } else {
                          "Required Timer: ${PadhaiDateUtils.formatMinutes(todo.requiredMins)}"
                        },
                        color = if (isRunningThis) colors.primaryAccent else colors.textMuted,
                        fontSize = 11.sp,
                        fontWeight = if (isRunningThis) FontWeight.Bold else FontWeight.Normal,
                      )
                    }
                  }
                  if (hasTimer && !todo.done) {
                    IconButton(
                      onClick = { onStartStrictTodo(todo) },
                      modifier = Modifier.size(40.dp),
                    ) {
                      Icon(
                        imageVector = Icons.Filled.PlayArrow,
                        contentDescription = "Start target timer",
                        tint = colors.primaryAccent,
                      )
                    }
                  }
                  IconButton(
                    onClick = { onDeleteTodo(todo.id) },
                    modifier = Modifier.size(44.dp),
                  ) {
                    Icon(
                      imageVector = Icons.Filled.Close,
                      contentDescription = "Delete target",
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

    // 7. Quick Study Log
    item {
      PadhaiCard {
        Text(
          text = "Quick Study Log",
          style = MaterialTheme.typography.titleMedium,
          color = colors.textPrimary,
        )
        Spacer(modifier = Modifier.height(10.dp))

        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          SubjectDropdown(
            subjects = state.subjects,
            selectedSubjectId = quickSubId,
            onSelectSubject = { quickSubId = it },
            label = "Subject",
            modifier = Modifier.weight(1.4f),
          )
          OutlinedTextField(
            value = quickMinsText,
            onValueChange = { quickMinsText = it },
            label = { Text("Mins") },
            placeholder = { Text("45") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(
              focusedContainerColor = colors.innerBackground,
              unfocusedContainerColor = colors.innerBackground,
              focusedBorderColor = colors.primaryAccent,
              unfocusedBorderColor = colors.border,
            ),
            modifier = Modifier.weight(0.9f),
          )
        }

        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
          value = quickTopicText,
          onValueChange = { quickTopicText = it },
          placeholder = { Text("Chapter / Topic kya padha?") },
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
          ExposedDropdownMenuBox(
            expanded = focusExpanded,
            onExpandedChange = { focusExpanded = !focusExpanded },
            modifier = Modifier.weight(1f),
          ) {
            val focusLabel = focusOptions.find { it.first == quickFocus }?.second ?: "Focus: 4/5"
            OutlinedTextField(
              value = focusLabel,
              onValueChange = {},
              readOnly = true,
              singleLine = true,
              trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = focusExpanded) },
              shape = RoundedCornerShape(10.dp),
              colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = colors.innerBackground,
                unfocusedContainerColor = colors.innerBackground,
                focusedBorderColor = colors.primaryAccent,
                unfocusedBorderColor = colors.border,
              ),
              modifier = Modifier
                .fillMaxWidth()
                .menuAnchor(MenuAnchorType.PrimaryNotEditable),
            )
            ExposedDropdownMenu(
              expanded = focusExpanded,
              onDismissRequest = { focusExpanded = false },
            ) {
              focusOptions.forEach { (score, label) ->
                DropdownMenuItem(
                  text = { Text(label) },
                  onClick = {
                    quickFocus = score
                    focusExpanded = false
                  },
                )
              }
            }
          }

          Button(
            onClick = {
              val mins = quickMinsText.toIntOrNull()
              onSaveQuickLog(quickSubId, mins, quickTopicText, quickFocus)
              if (mins != null && mins > 0) {
                quickMinsText = ""
                quickTopicText = ""
              }
            },
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.buttonColors(containerColor = SuccessGreen),
            modifier = Modifier.height(52.dp),
          ) {
            Text("+ Save", color = Color.White, fontWeight = FontWeight.Bold, maxLines = 1)
          }
        }
      }
    }

    // 8. Daily Review & Weak Topics
    item {
      PadhaiCard {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          Text(
            text = "Aaj ka Review & Weak Topics",
            style = MaterialTheme.typography.titleMedium,
            color = colors.textPrimary,
          )
          Button(
            onClick = { onSaveDailyNote(noteText) },
            shape = RoundedCornerShape(8.dp),
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
          ) {
            Text("Save Note", fontSize = 12.sp, maxLines = 1)
          }
        }
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedTextField(
          value = noteText,
          onValueChange = { noteText = it },
          placeholder = {
            Text("Aaj kaunsa topic strong hua? Kal Maths ya GAT me kya revise karna hai?")
          },
          minLines = 3,
          maxLines = 6,
          shape = RoundedCornerShape(10.dp),
          colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = colors.innerBackground,
            unfocusedContainerColor = colors.innerBackground,
            focusedBorderColor = colors.primaryAccent,
            unfocusedBorderColor = colors.border,
          ),
          modifier = Modifier.fillMaxWidth(),
        )
      }
    }
  }

  if (showGoalDialog) {
    var goalText by remember(state.dailyGoalHours) {
      mutableStateOf(
        if (state.dailyGoalHours % 1.0 == 0.0) state.dailyGoalHours.toInt().toString()
        else state.dailyGoalHours.toString()
      )
    }
    AlertDialog(
      onDismissRequest = { showGoalDialog = false },
      title = { Text("Daily Study Target", fontWeight = FontWeight.Bold) },
      text = {
        Column {
          Text(
            text = "Roz kitne ghante padhne ka target rakhna hai? (School ke alawa)",
            fontSize = 13.sp,
            color = colors.textMuted,
          )
          Spacer(modifier = Modifier.height(10.dp))
          OutlinedTextField(
            value = goalText,
            onValueChange = { goalText = it },
            label = { Text("Hours / Day") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
          )
        }
      },
      confirmButton = {
        TextButton(
          onClick = {
            val num = goalText.toDoubleOrNull()
            if (num != null) onUpdateDailyGoal(num)
            showGoalDialog = false
          },
        ) {
          Text("Save", fontWeight = FontWeight.Bold)
        }
      },
      dismissButton = {
        TextButton(onClick = { showGoalDialog = false }) {
          Text("Cancel")
        }
      },
    )
  }
}

@Composable
private fun HabitToggleChip(
  label: String,
  icon: ImageVector,
  active: Boolean,
  onClick: () -> Unit,
  modifier: Modifier = Modifier,
) {
  val colors = LocalPadhaiColors.current
  Surface(
    modifier = modifier
      .height(48.dp)
      .clip(RoundedCornerShape(12.dp))
      .clickable(onClick = onClick),
    shape = RoundedCornerShape(12.dp),
    color = if (active) colors.armyContainer else colors.innerBackground,
    border = BorderStroke(1.dp, if (active) colors.armyAccent else colors.border),
  ) {
    Row(
      modifier = Modifier
        .fillMaxSize()
        .padding(horizontal = 10.dp),
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
      Icon(
        imageVector = icon,
        contentDescription = null,
        tint = if (active) colors.armyAccent else colors.textMuted,
        modifier = Modifier.size(17.dp),
      )
      Text(
        text = label,
        color = if (active) colors.armyAccent else colors.textPrimary,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
      )
    }
  }
}
