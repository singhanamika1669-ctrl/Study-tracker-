package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Videocam
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
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.OnlineClassSlot
import com.example.model.PadhaiDateUtils
import com.example.model.PadhaiState
import com.example.model.TimetableSlot
import com.example.ui.components.PadhaiCard
import com.example.ui.components.SubjectDropdown
import com.example.ui.components.TimePickerChipField
import com.example.ui.theme.BannerArmy
import com.example.ui.theme.LocalPadhaiColors
import com.example.ui.theme.parseColorHex

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimetableScreen(
  state: PadhaiState,
  onAddSlot: (day: String, subjectId: String, start: String, end: String, task: String) -> Unit,
  onDeleteSlot: (String) -> Unit,
  onStartStrictSlot: (TimetableSlot) -> Unit,
  onAddOnlineClass: (
    day: String,
    subjectId: String,
    platform: String,
    title: String,
    start: String,
    end: String,
    meetingUrl: String,
  ) -> Unit,
  onDeleteOnlineClass: (String) -> Unit,
  onStartStrictOnlineClass: (OnlineClassSlot) -> Unit,
) {
  val colors = LocalPadhaiColors.current

  var sectionIndex by remember { mutableIntStateOf(0) } // 0 = Self Study, 1 = Online Classes

  val dayOptions = listOf(
    "Daily" to "Har Roz (Daily)",
    "Mon" to "Monday",
    "Tue" to "Tuesday",
    "Wed" to "Wednesday",
    "Thu" to "Thursday",
    "Fri" to "Friday",
    "Sat" to "Saturday",
    "Sun" to "Sunday (Mock Test Day)",
  )
  val platformOptions = listOf(
    "Physics Wallah",
    "YouTube Live",
    "Unacademy",
    "Zoom",
    "Google Meet",
    "School / Coaching App",
  )
  val filterOptions = listOf("All", "Daily", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")

  var selectedDay by remember { mutableStateOf("Daily") }
  var dayExpanded by remember { mutableStateOf(false) }

  var selectedSubjectId by remember(state.subjects) {
    mutableStateOf(state.subjects.firstOrNull()?.id.orEmpty())
  }
  LaunchedEffect(state.subjects) {
    if (state.subjects.none { it.id == selectedSubjectId }) {
      selectedSubjectId = state.subjects.firstOrNull()?.id.orEmpty()
    }
  }

  var startTime by remember { mutableStateOf("12:30") }
  var endTime by remember { mutableStateOf("14:30") }
  var taskText by remember { mutableStateOf("") }

  var classPlatform by remember { mutableStateOf(platformOptions.first()) }
  var platformExpanded by remember { mutableStateOf(false) }
  var classTitle by remember { mutableStateOf("") }
  var classUrl by remember { mutableStateOf("") }
  var classStart by remember { mutableStateOf("16:00") }
  var classEnd by remember { mutableStateOf("17:30") }

  var activeFilter by remember { mutableStateOf("All") }

  val filteredSlots = remember(state.timetable, activeFilter) {
    state.timetable
      .filter { activeFilter == "All" || it.day == activeFilter }
      .sortedBy { it.start }
  }

  val filteredClasses = remember(state.onlineClasses, activeFilter) {
    state.onlineClasses
      .filter { activeFilter == "All" || it.day == activeFilter }
      .sortedBy { it.start }
  }

  LazyColumn(
    modifier = Modifier.fillMaxSize(),
    contentPadding = PaddingValues(14.dp),
    verticalArrangement = Arrangement.spacedBy(14.dp),
  ) {
    // Sub-section Switcher: Self Study vs Online Classes
    item {
      Surface(
        color = colors.cardBackground,
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, colors.border),
        modifier = Modifier.fillMaxWidth(),
      ) {
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .padding(5.dp),
          horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
          Surface(
            onClick = { sectionIndex = 0 },
            shape = RoundedCornerShape(10.dp),
            color = if (sectionIndex == 0) colors.primaryAccent else Color.Transparent,
            modifier = Modifier
              .weight(1f)
              .height(42.dp),
          ) {
            Row(
              modifier = Modifier.fillMaxSize(),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.Center,
            ) {
              Icon(
                imageVector = Icons.Filled.CalendarMonth,
                contentDescription = null,
                tint = if (sectionIndex == 0) Color.White else colors.textMuted,
                modifier = Modifier.size(16.dp),
              )
              Spacer(modifier = Modifier.width(6.dp))
              Text(
                text = "Self-Study (${state.timetable.size})",
                color = if (sectionIndex == 0) Color.White else colors.textMuted,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
              )
            }
          }

          Surface(
            onClick = { sectionIndex = 1 },
            shape = RoundedCornerShape(10.dp),
            color = if (sectionIndex == 1) BannerArmy else Color.Transparent,
            modifier = Modifier
              .weight(1f)
              .height(42.dp),
          ) {
            Row(
              modifier = Modifier.fillMaxSize(),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.Center,
            ) {
              Icon(
                imageVector = Icons.Filled.Videocam,
                contentDescription = null,
                tint = if (sectionIndex == 1) Color.White else colors.textMuted,
                modifier = Modifier.size(16.dp),
              )
              Spacer(modifier = Modifier.width(6.dp))
              Text(
                text = "Online Class (${state.onlineClasses.size})",
                color = if (sectionIndex == 1) Color.White else colors.textMuted,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
              )
            }
          }
        }
      }
    }

    // Add Form (Self-Study or Online Class)
    item {
      PadhaiCard {
        Text(
          text = if (sectionIndex == 0) "Naya Study Slot Add Karein" else "Nayi Online Class Add Karein",
          style = MaterialTheme.typography.titleMedium,
          color = colors.textPrimary,
        )
        Spacer(modifier = Modifier.height(12.dp))

        ExposedDropdownMenuBox(
          expanded = dayExpanded,
          onExpandedChange = { dayExpanded = !dayExpanded },
          modifier = Modifier.fillMaxWidth(),
        ) {
          val dayLabel = dayOptions.find { it.first == selectedDay }?.second ?: selectedDay
          OutlinedTextField(
            value = dayLabel,
            onValueChange = {},
            readOnly = true,
            label = { Text("Day") },
            singleLine = true,
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = dayExpanded) },
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
            expanded = dayExpanded,
            onDismissRequest = { dayExpanded = false },
          ) {
            dayOptions.forEach { (code, label) ->
              DropdownMenuItem(
                text = { Text(label) },
                onClick = {
                  selectedDay = code
                  dayExpanded = false
                },
              )
            }
          }
        }

        Spacer(modifier = Modifier.height(8.dp))

        SubjectDropdown(
          subjects = state.subjects,
          selectedSubjectId = selectedSubjectId,
          onSelectSubject = { selectedSubjectId = it },
          label = "Subject",
        )

        Spacer(modifier = Modifier.height(8.dp))

        if (sectionIndex == 0) {
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
          ) {
            TimePickerChipField(
              label = "Start Time",
              timeValue = startTime,
              onTimeSelected = { startTime = it },
              modifier = Modifier.weight(1f),
            )
            TimePickerChipField(
              label = "End Time",
              timeValue = endTime,
              onTimeSelected = { endTime = it },
              modifier = Modifier.weight(1f),
            )
          }

          Spacer(modifier = Modifier.height(8.dp))

          OutlinedTextField(
            value = taskText,
            onValueChange = { taskText = it },
            placeholder = { Text("Kya padhna hai? (e.g. 12:30-2:30 Maths PYQ)") },
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

          Spacer(modifier = Modifier.height(10.dp))

          Button(
            onClick = {
              onAddSlot(selectedDay, selectedSubjectId, startTime, endTime, taskText)
              taskText = ""
            },
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier
              .fillMaxWidth()
              .height(48.dp),
          ) {
            Text("Add to Timetable", fontWeight = FontWeight.Bold)
          }
        } else {
          ExposedDropdownMenuBox(
            expanded = platformExpanded,
            onExpandedChange = { platformExpanded = !platformExpanded },
            modifier = Modifier.fillMaxWidth(),
          ) {
            OutlinedTextField(
              value = classPlatform,
              onValueChange = {},
              readOnly = true,
              label = { Text("Platform") },
              singleLine = true,
              trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = platformExpanded) },
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
              expanded = platformExpanded,
              onDismissRequest = { platformExpanded = false },
            ) {
              platformOptions.forEach { plat ->
                DropdownMenuItem(
                  text = { Text(plat) },
                  onClick = {
                    classPlatform = plat
                    platformExpanded = false
                  },
                )
              }
            }
          }

          Spacer(modifier = Modifier.height(8.dp))

          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
          ) {
            TimePickerChipField(
              label = "Class Start",
              timeValue = classStart,
              onTimeSelected = { classStart = it },
              modifier = Modifier.weight(1f),
            )
            TimePickerChipField(
              label = "Class End",
              timeValue = classEnd,
              onTimeSelected = { classEnd = it },
              modifier = Modifier.weight(1f),
            )
          }

          Spacer(modifier = Modifier.height(8.dp))

          OutlinedTextField(
            value = classTitle,
            onValueChange = { classTitle = it },
            placeholder = { Text("Class Title (e.g. Trigonometry Live Class)") },
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

          OutlinedTextField(
            value = classUrl,
            onValueChange = { classUrl = it },
            placeholder = { Text("Class Link optional (YouTube / Meet / PW URL)") },
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

          Spacer(modifier = Modifier.height(10.dp))

          Button(
            onClick = {
              onAddOnlineClass(
                selectedDay,
                selectedSubjectId,
                classPlatform,
                classTitle,
                classStart,
                classEnd,
                classUrl,
              )
              classTitle = ""
              classUrl = ""
            },
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.buttonColors(containerColor = BannerArmy),
            modifier = Modifier
              .fillMaxWidth()
              .height(48.dp),
          ) {
            Text("+ Add Online Class", color = Color.White, fontWeight = FontWeight.Bold)
          }
        }
      }
    }

    // Schedule List
    item {
      PadhaiCard {
        Text(
          text = if (sectionIndex == 0) "Tumhara Study Schedule" else "Online Class Schedule",
          style = MaterialTheme.typography.titleMedium,
          color = colors.textPrimary,
        )
        Spacer(modifier = Modifier.height(10.dp))

        LazyRow(
          horizontalArrangement = Arrangement.spacedBy(6.dp),
          modifier = Modifier.fillMaxWidth(),
        ) {
          items(filterOptions) { dayFilter ->
            val selected = activeFilter == dayFilter
            Surface(
              onClick = { activeFilter = dayFilter },
              shape = RoundedCornerShape(20.dp),
              color = if (selected) colors.primaryAccent else colors.innerBackground,
              border = BorderStroke(1.dp, if (selected) colors.primaryAccent else colors.border),
              modifier = Modifier.height(36.dp),
            ) {
              Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.padding(horizontal = 14.dp),
              ) {
                Text(
                  text = dayFilter,
                  color = if (selected) Color.White else colors.textMuted,
                  fontSize = 13.sp,
                  fontWeight = FontWeight.SemiBold,
                  maxLines = 1,
                )
              }
            }
          }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (sectionIndex == 0) {
          if (filteredSlots.isEmpty()) {
            Text(
              text = "Is filter mein koi slot nahi hai.",
              color = colors.textMuted,
              fontSize = 13.sp,
            )
          } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
              filteredSlots.forEach { slot ->
                val sub = state.subjects.find { it.id == slot.subjectId }
                val subColor = parseColorHex(sub?.colorHex ?: "", colors.primaryAccent)
                val durMins = PadhaiDateUtils.computeSlotDurationMins(slot.start, slot.end)
                Surface(
                  shape = RoundedCornerShape(12.dp),
                  color = colors.innerBackground,
                  modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { onStartStrictSlot(slot) },
                ) {
                  Row(
                    modifier = Modifier
                      .fillMaxWidth()
                      .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                  ) {
                    Box(
                      modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(subColor),
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                      Text(
                        text = "${sub?.name ?: "General"} — ${slot.task}",
                        color = colors.textPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                      )
                      Spacer(modifier = Modifier.height(2.dp))
                      Text(
                        text = "${slot.day} · ${slot.start} to ${slot.end} (${PadhaiDateUtils.formatMinutes(durMins)})",
                        color = colors.textMuted,
                        fontSize = 12.sp,
                      )
                    }
                    IconButton(
                      onClick = { onStartStrictSlot(slot) },
                      modifier = Modifier.size(40.dp),
                    ) {
                      Icon(
                        imageVector = Icons.Filled.PlayArrow,
                        contentDescription = "Start timer",
                        tint = colors.primaryAccent,
                      )
                    }
                    IconButton(
                      onClick = { onDeleteSlot(slot.id) },
                      modifier = Modifier.size(40.dp),
                    ) {
                      Icon(
                        imageVector = Icons.Filled.DeleteOutline,
                        contentDescription = "Delete timetable slot",
                        tint = colors.textMuted,
                      )
                    }
                  }
                }
              }
            }
          }
        } else {
          if (filteredClasses.isEmpty()) {
            Text(
              text = "Is filter mein koi online class nahi hai.",
              color = colors.textMuted,
              fontSize = 13.sp,
            )
          } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
              filteredClasses.forEach { cls ->
                val sub = state.subjects.find { it.id == cls.subjectId }
                val subColor = parseColorHex(sub?.colorHex ?: "", colors.primaryAccent)
                val durMins = PadhaiDateUtils.computeSlotDurationMins(cls.start, cls.end)
                Surface(
                  shape = RoundedCornerShape(12.dp),
                  color = colors.innerBackground,
                  modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { onStartStrictOnlineClass(cls) },
                ) {
                  Row(
                    modifier = Modifier
                      .fillMaxWidth()
                      .padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                  ) {
                    Box(
                      modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(subColor),
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                      Text(
                        text = "${cls.title} (${cls.platform})",
                        color = colors.textPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                      )
                      Spacer(modifier = Modifier.height(2.dp))
                      Text(
                        text = "${cls.day} · ${cls.start} to ${cls.end} (${PadhaiDateUtils.formatMinutes(durMins)}) · ${sub?.name ?: ""}",
                        color = colors.textMuted,
                        fontSize = 12.sp,
                      )
                    }
                    IconButton(
                      onClick = { onStartStrictOnlineClass(cls) },
                      modifier = Modifier.size(40.dp),
                    ) {
                      Icon(
                        imageVector = Icons.Filled.PlayArrow,
                        contentDescription = "Start class timer",
                        tint = BannerArmy,
                      )
                    }
                    IconButton(
                      onClick = { onDeleteOnlineClass(cls.id) },
                      modifier = Modifier.size(40.dp),
                    ) {
                      Icon(
                        imageVector = Icons.Filled.DeleteOutline,
                        contentDescription = "Delete online class",
                        tint = colors.textMuted,
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
  }
}
