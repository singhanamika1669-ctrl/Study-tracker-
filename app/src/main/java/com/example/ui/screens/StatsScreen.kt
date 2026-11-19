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
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Upload
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.model.PadhaiDateUtils
import com.example.model.PadhaiState
import com.example.ui.components.ConfirmActionDialog
import com.example.ui.components.FighterJetVector
import com.example.ui.components.LinearProgressTrack
import com.example.ui.components.MiniStatTile
import com.example.ui.components.PadhaiCard
import com.example.ui.components.QrShareSection
import com.example.ui.theme.BannerArmy
import com.example.ui.theme.DangerRed
import com.example.ui.theme.FailBadgeBg
import com.example.ui.theme.FailBadgeText
import com.example.ui.theme.LocalPadhaiColors
import com.example.ui.theme.PassBadgeBg
import com.example.ui.theme.PassBadgeText
import com.example.ui.theme.SquadronSky
import com.example.ui.theme.WarnBadgeBg
import com.example.ui.theme.WarnBadgeText
import com.example.ui.theme.parseColorHex
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import kotlin.math.max
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StatsScreen(
  state: PadhaiState,
  onAddMockTest: (name: String, maths: Double?, gat: Double?) -> Unit,
  onDeleteMockTest: (String) -> Unit,
  onSaveSettings: (examName: String, examDate: String, dailyGoalHours: Double?) -> Unit,
  onToggleStrictMode: () -> Unit,
  onToggleAutoFocusOnStrict: () -> Unit,
  onUpdateShareUrl: (String) -> Unit,
  onNotifyToast: (String) -> Unit,
  onExportBackup: () -> Unit,
  onImportBackup: () -> Unit,
  onResetAll: () -> Unit,
) {
  val colors = LocalPadhaiColors.current

  var mockName by remember { mutableStateOf("") }
  var mockMaths by remember { mutableStateOf("") }
  var mockGat by remember { mutableStateOf("") }

  var examNameInput by remember(state.examName) { mutableStateOf(state.examName) }
  var examDateInput by remember(state.examDate) { mutableStateOf(state.examDate) }
  var dailyGoalInput by remember(state.dailyGoalHours) {
    mutableStateOf(
      if (state.dailyGoalHours % 1.0 == 0.0) state.dailyGoalHours.toInt().toString()
      else state.dailyGoalHours.toString()
    )
  }

  var showDatePicker by remember { mutableStateOf(false) }
  var showResetConfirm by remember { mutableStateOf(false) }

  val last7Days = remember(state.logs) {
    PadhaiDateUtils.last7Days().map { (dateStr, weekday) ->
      val mins = state.logs.filter { it.date == dateStr }.sumOf { it.mins }
      Triple(weekday, mins, ((mins / 60.0) * 10.0).roundToInt() / 10.0)
    }
  }
  val weekMins = remember(last7Days) { last7Days.sumOf { it.second } }
  val totalMins = remember(state.logs) { state.logs.sumOf { it.mins } }
  val totalRunKm = remember(state.ndaHabits) {
    state.ndaHabits.values.sumOf { it.runKm }
  }
  val maxChartHours = remember(last7Days, state.dailyGoalHours) {
    max(state.dailyGoalHours.takeIf { it > 0 } ?: 6.0, max(last7Days.maxOfOrNull { it.third } ?: 0.0, 1.0))
  }

  LazyColumn(
    modifier = Modifier.fillMaxSize(),
    contentPadding = PaddingValues(14.dp),
    verticalArrangement = Arrangement.spacedBy(14.dp),
  ) {
    // 1. NDA Mock Test / PYQ Tracker
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
            Image(
              painter = painterResource(id = R.drawable.airforce_wings_emblem),
              contentDescription = "IAF Wings Emblem",
              contentScale = ContentScale.Crop,
              modifier = Modifier
                .size(32.dp)
                .clip(RoundedCornerShape(8.dp)),
            )
            Text(
              text = "NDA Flying Mock / PYQ Tracker",
              style = MaterialTheme.typography.titleMedium,
              color = colors.textPrimary,
              maxLines = 1,
              overflow = TextOverflow.Ellipsis,
            )
          }
          Text(
            text = "Out of 900",
            color = colors.textMuted,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
          )
        }
        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
          value = mockName,
          onValueChange = { mockName = it },
          placeholder = { Text("Test Name (e.g. NDA 2024 Paper-1 PYQ)") },
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
        ) {
          OutlinedTextField(
            value = mockMaths,
            onValueChange = { mockMaths = it },
            label = { Text("Maths (/300)") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(
              focusedContainerColor = colors.innerBackground,
              unfocusedContainerColor = colors.innerBackground,
              focusedBorderColor = colors.primaryAccent,
              unfocusedBorderColor = colors.border,
            ),
            modifier = Modifier.weight(1f),
          )
          OutlinedTextField(
            value = mockGat,
            onValueChange = { mockGat = it },
            label = { Text("GAT (/600)") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(
              focusedContainerColor = colors.innerBackground,
              unfocusedContainerColor = colors.innerBackground,
              focusedBorderColor = colors.primaryAccent,
              unfocusedBorderColor = colors.border,
            ),
            modifier = Modifier.weight(1f),
          )
        }

        Spacer(modifier = Modifier.height(10.dp))

        Button(
          onClick = {
            val m = mockMaths.toDoubleOrNull()
            val g = mockGat.toDoubleOrNull()
            onAddMockTest(mockName, m, g)
            if (m != null && g != null && m in 0.0..300.0 && g in 0.0..600.0) {
              mockName = ""
              mockMaths = ""
              mockGat = ""
            }
          },
          shape = RoundedCornerShape(10.dp),
          colors = ButtonDefaults.buttonColors(containerColor = BannerArmy),
          modifier = Modifier
            .fillMaxWidth()
            .height(48.dp),
        ) {
          Text("+ Save Mock Score", color = Color.White, fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(8.dp))
        Text(
          text = "Note: NDA pass karne ke liye Maths (75+/300) aur GAT (150+/600) dono me kam se kam 25% aur total ~360+ score safe maana jata hai.",
          color = colors.textMuted,
          fontSize = 11.sp,
          lineHeight = 16.sp,
        )

        Spacer(modifier = Modifier.height(12.dp))

        if (state.mockTests.isEmpty()) {
          Text(
            text = "Abhi koi mock test score nahi hai. Pehla PYQ ya Mock test dekar score daalo!",
            color = colors.textMuted,
            fontSize = 13.sp,
          )
        } else {
          Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            state.mockTests.forEach { mock ->
              val totalFormatted = ((mock.total * 10.0).roundToInt() / 10.0).toString().removeSuffix(".0")
              val (badgeLabel, badgeBg, badgeText) = when {
                !mock.isMathsQualified -> Triple("Maths < 25%", FailBadgeBg, FailBadgeText)
                !mock.isGatQualified -> Triple("GAT < 25%", FailBadgeBg, FailBadgeText)
                mock.isSafeZone -> Triple("Safe Zone", PassBadgeBg, PassBadgeText)
                else -> Triple("Need 360+", WarnBadgeBg, WarnBadgeText)
              }

              Surface(
                shape = RoundedCornerShape(12.dp),
                color = colors.innerBackground,
                modifier = Modifier.fillMaxWidth(),
              ) {
                Row(
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                  verticalAlignment = Alignment.CenterVertically,
                ) {
                  Column(modifier = Modifier.weight(1f)) {
                    Row(
                      verticalAlignment = Alignment.CenterVertically,
                      horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                      Text(
                        text = "${mock.name} · $totalFormatted/900",
                        color = colors.textPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill = false),
                      )
                      Surface(
                        color = badgeBg,
                        shape = RoundedCornerShape(8.dp),
                      ) {
                        Text(
                          text = badgeLabel,
                          color = badgeText,
                          fontSize = 11.sp,
                          fontWeight = FontWeight.Bold,
                          modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        )
                      }
                    }
                    Spacer(modifier = Modifier.height(3.dp))
                    Text(
                      text = "${mock.date} · Maths: ${mock.maths}/300 · GAT: ${mock.gat}/600",
                      color = colors.textMuted,
                      fontSize = 12.sp,
                    )
                  }
                  IconButton(
                    onClick = { onDeleteMockTest(mock.id) },
                    modifier = Modifier.size(44.dp),
                  ) {
                    Icon(
                      imageVector = Icons.Filled.Close,
                      contentDescription = "Delete mock score",
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

    // 2. Settings · Strict Discipline & Exam Target
    item {
      PadhaiCard {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          Icon(
            imageVector = Icons.Filled.Security,
            contentDescription = null,
            tint = colors.primaryAccent,
            modifier = Modifier.size(20.dp),
          )
          Text(
            text = "Settings · Strict Mode & Exam Target",
            style = MaterialTheme.typography.titleMedium,
            color = colors.textPrimary,
          )
        }
        Spacer(modifier = Modifier.height(12.dp))

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
                text = "Strict Task Lock (Bhut Sakt Mode)",
                color = colors.textPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
              )
              Text(
                text = "Timer pura hue bina koi task complete nahi hoga",
                color = colors.textMuted,
                fontSize = 11.sp,
              )
            }
            Switch(
              checked = state.strictMode,
              onCheckedChange = { onToggleStrictMode() },
            )
          }
        }

        Spacer(modifier = Modifier.height(8.dp))

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
                text = "Auto Focus App Lock on Timer",
                color = colors.textPrimary,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
              )
              Text(
                text = "Strict timer chalte hi non-study apps lock ho jayenge",
                color = colors.textMuted,
                fontSize = 11.sp,
              )
            }
            Switch(
              checked = state.autoFocusOnStrict,
              onCheckedChange = { onToggleAutoFocusOnStrict() },
            )
          }
        }

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
          value = examNameInput,
          onValueChange = { examNameInput = it },
          label = { Text("Exam Target") },
          placeholder = { Text("NDA II 2027 + 11th Board") },
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
          Surface(
            shape = RoundedCornerShape(10.dp),
            color = colors.innerBackground,
            border = BorderStroke(1.dp, colors.border),
            modifier = Modifier
              .weight(1.2f)
              .height(56.dp)
              .clip(RoundedCornerShape(10.dp))
              .clickable { showDatePicker = true },
          ) {
            Row(
              modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 12.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.SpaceBetween,
            ) {
              Column {
                Text(text = "Exam Date", fontSize = 11.sp, color = colors.textMuted)
                Text(
                  text = examDateInput.ifBlank { "Select Date" },
                  fontSize = 14.sp,
                  fontWeight = FontWeight.SemiBold,
                  color = colors.textPrimary,
                )
              }
              Icon(
                imageVector = Icons.Filled.CalendarMonth,
                contentDescription = "Pick Exam Date",
                tint = colors.primaryAccent,
                modifier = Modifier.size(18.dp),
              )
            }
          }

          OutlinedTextField(
            value = dailyGoalInput,
            onValueChange = { dailyGoalInput = it },
            label = { Text("Goal (Hrs)") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            shape = RoundedCornerShape(10.dp),
            colors = OutlinedTextFieldDefaults.colors(
              focusedContainerColor = colors.innerBackground,
              unfocusedContainerColor = colors.innerBackground,
              focusedBorderColor = colors.primaryAccent,
              unfocusedBorderColor = colors.border,
            ),
            modifier = Modifier.weight(0.8f),
          )
        }

        Spacer(modifier = Modifier.height(10.dp))

        Button(
          onClick = {
            onSaveSettings(examNameInput, examDateInput, dailyGoalInput.toDoubleOrNull())
          },
          shape = RoundedCornerShape(10.dp),
          modifier = Modifier
            .fillMaxWidth()
            .height(48.dp),
        ) {
          Text("Save Settings", fontWeight = FontWeight.Bold)
        }
      }
    }

    // 3. App Download QR Code (Setting)
    item {
      PadhaiCard {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          Icon(
            imageVector = Icons.Filled.QrCode2,
            contentDescription = null,
            tint = colors.primaryAccent,
            modifier = Modifier.size(20.dp),
          )
          Text(
            text = "App Download QR Code (Setting)",
            style = MaterialTheme.typography.titleMedium,
            color = colors.textPrimary,
          )
        }
        Spacer(modifier = Modifier.height(10.dp))
        QrShareSection(
          shareUrl = state.appShareUrl,
          onUpdateShareUrl = onUpdateShareUrl,
          onCopySuccess = onNotifyToast,
        )
      }
    }

    // 4. Weekly Chart
    item {
      PadhaiCard {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          FighterJetVector(
            tint = SquadronSky,
            modifier = Modifier.size(18.dp),
          )
          Text(
            text = "Pichle 7 Din ki Sortie Hours",
            style = MaterialTheme.typography.titleMedium,
            color = colors.textPrimary,
          )
        }
        Spacer(modifier = Modifier.height(14.dp))

        Row(
          modifier = Modifier
            .fillMaxWidth()
            .height(148.dp),
          horizontalArrangement = Arrangement.spacedBy(8.dp),
          verticalAlignment = Alignment.Bottom,
        ) {
          last7Days.forEach { (weekday, _, hours) ->
            val ratio = (hours / maxChartHours).toFloat().coerceIn(0.04f, 1f)
            Column(
              modifier = Modifier
                .weight(1f)
                .fillMaxHeight(),
              horizontalAlignment = Alignment.CenterHorizontally,
              verticalArrangement = Arrangement.Bottom,
            ) {
              Text(
                text = "${hours}h",
                color = colors.textMuted,
                fontSize = 10.sp,
                maxLines = 1,
              )
              Spacer(modifier = Modifier.height(4.dp))
              Box(
                modifier = Modifier
                  .weight(1f)
                  .fillMaxWidth(),
                contentAlignment = Alignment.BottomCenter,
              ) {
                Box(
                  modifier = Modifier
                    .width(26.dp)
                    .fillMaxHeight(ratio)
                    .clip(RoundedCornerShape(topStart = 6.dp, topEnd = 6.dp, bottomStart = 2.dp, bottomEnd = 2.dp))
                    .background(colors.primaryAccent),
                )
              }
              Spacer(modifier = Modifier.height(6.dp))
              Text(
                text = weekday,
                color = colors.textMuted,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
              )
            }
          }
        }

        Spacer(modifier = Modifier.height(14.dp))

        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          MiniStatTile(
            value = PadhaiDateUtils.formatMinutes(weekMins),
            label = "Last 7 Days",
            modifier = Modifier.weight(1f),
          )
          MiniStatTile(
            value = PadhaiDateUtils.formatMinutes(totalMins),
            label = "Total Studied",
            modifier = Modifier.weight(1f),
          )
          MiniStatTile(
            value = String.format(Locale.US, "%.1f km", totalRunKm),
            label = "Total Running",
            modifier = Modifier.weight(1f),
          )
        }
      }
    }

    // 5. Subject-wise Time Breakdown
    item {
      PadhaiCard {
        Text(
          text = "Subject-wise Time",
          style = MaterialTheme.typography.titleMedium,
          color = colors.textPrimary,
        )
        Spacer(modifier = Modifier.height(10.dp))

        if (totalMins == 0) {
          Text(
            text = "Padhai log karne ke baad yahan subject breakdown dikhega.",
            color = colors.textMuted,
            fontSize = 13.sp,
          )
        } else {
          val subTotals = state.logs.groupBy { it.subjectId }.mapValues { (_, list) -> list.sumOf { it.mins } }
          Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            state.subjects.forEach { sub ->
              val mins = subTotals[sub.id] ?: 0
              val pct = ((mins.toFloat() / totalMins.toFloat()) * 100f).roundToInt().coerceIn(0, 100)
              val subColor = parseColorHex(sub.colorHex, colors.primaryAccent)
              Column {
                Row(
                  modifier = Modifier.fillMaxWidth(),
                  horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                  Text(
                    text = sub.name,
                    color = colors.textPrimary,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                  )
                  Spacer(modifier = Modifier.width(8.dp))
                  Text(
                    text = "${PadhaiDateUtils.formatMinutes(mins)} ($pct%)",
                    color = colors.textMuted,
                    fontSize = 12.sp,
                  )
                }
                Spacer(modifier = Modifier.height(4.dp))
                LinearProgressTrack(
                  progress = pct / 100f,
                  fillColor = subColor,
                  heightDp = 8,
                )
              }
            }
          }
        }
      }
    }

    // 6. Data Backup & Restore
    item {
      PadhaiCard {
        Text(
          text = "Data Backup & Restore",
          style = MaterialTheme.typography.titleMedium,
          color = colors.textPrimary,
        )
        Spacer(modifier = Modifier.height(10.dp))

        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          OutlinedButton(
            onClick = onExportBackup,
            shape = RoundedCornerShape(10.dp),
            border = BorderStroke(1.dp, colors.border),
            modifier = Modifier
              .weight(1f)
              .height(46.dp),
          ) {
            Icon(
              imageVector = Icons.Filled.Download,
              contentDescription = null,
              tint = colors.textPrimary,
              modifier = Modifier.size(16.dp),
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text("Export", color = colors.textPrimary, fontSize = 13.sp, maxLines = 1)
          }

          OutlinedButton(
            onClick = onImportBackup,
            shape = RoundedCornerShape(10.dp),
            border = BorderStroke(1.dp, colors.border),
            modifier = Modifier
              .weight(1f)
              .height(46.dp),
          ) {
            Icon(
              imageVector = Icons.Filled.Upload,
              contentDescription = null,
              tint = colors.textPrimary,
              modifier = Modifier.size(16.dp),
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text("Import", color = colors.textPrimary, fontSize = 13.sp, maxLines = 1)
          }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Button(
          onClick = { showResetConfirm = true },
          shape = RoundedCornerShape(10.dp),
          colors = ButtonDefaults.buttonColors(containerColor = DangerRed),
          modifier = Modifier
            .fillMaxWidth()
            .height(46.dp),
        ) {
          Icon(
            imageVector = Icons.Filled.DeleteForever,
            contentDescription = null,
            tint = Color.White,
            modifier = Modifier.size(18.dp),
          )
          Spacer(modifier = Modifier.width(6.dp))
          Text("Reset All Data", color = Color.White, fontWeight = FontWeight.Bold)
        }
      }
    }
  }

  if (showDatePicker) {
    val initialMillis = remember(examDateInput) {
      try {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
          timeZone = TimeZone.getTimeZone("UTC")
        }
        sdf.parse(examDateInput)?.time
      } catch (_: Exception) {
        null
      }
    }
    val pickerState = rememberDatePickerState(initialSelectedDateMillis = initialMillis)
    DatePickerDialog(
      onDismissRequest = { showDatePicker = false },
      confirmButton = {
        TextButton(
          onClick = {
            pickerState.selectedDateMillis?.let { millis ->
              val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
              }
              examDateInput = sdf.format(Date(millis))
            }
            showDatePicker = false
          },
        ) {
          Text("OK", fontWeight = FontWeight.Bold)
        }
      },
      dismissButton = {
        TextButton(onClick = { showDatePicker = false }) {
          Text("Cancel")
        }
      },
    ) {
      DatePicker(state = pickerState)
    }
  }

  if (showResetConfirm) {
    ConfirmActionDialog(
      title = "Reset All Data?",
      message = "Pakka? Isse sara study log, mock scores, aur timetable reset ho jayega!",
      confirmLabel = "Reset",
      onConfirm = {
        onResetAll()
        showResetConfirm = false
      },
      onDismiss = { showResetConfirm = false },
    )
  }
}
