package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.DefaultPadhaiData
import com.example.model.PadhaiDateUtils
import com.example.model.PadhaiState
import com.example.model.Subject
import com.example.ui.components.ConfirmActionDialog
import com.example.ui.components.LinearProgressTrack
import com.example.ui.components.PadhaiCard
import com.example.ui.theme.LocalPadhaiColors
import com.example.ui.theme.parseColorHex
import kotlin.math.roundToInt

@Composable
fun SyllabusScreen(
  state: PadhaiState,
  onAddSubject: (name: String, totalChapters: Int?, colorHex: String) -> Unit,
  onUpdateChapters: (subjectId: String, delta: Int) -> Unit,
  onDeleteSubject: (subjectId: String) -> Unit,
  onDeleteLog: (logId: String) -> Unit,
) {
  val colors = LocalPadhaiColors.current

  var newSubName by remember { mutableStateOf("") }
  var newSubChapters by remember { mutableStateOf("") }
  var selectedColorHex by remember { mutableStateOf(DefaultPadhaiData.presetColorHexes.first()) }
  var subjectPendingDelete by remember { mutableStateOf<Subject?>(null) }

  val recentLogs = remember(state.logs) { state.logs.take(20) }

  LazyColumn(
    modifier = Modifier.fillMaxSize(),
    contentPadding = PaddingValues(14.dp),
    verticalArrangement = Arrangement.spacedBy(14.dp),
  ) {
    // 1. Add Subject Card
    item {
      PadhaiCard {
        Text(
          text = "Naya Subject Add Karein",
          style = MaterialTheme.typography.titleMedium,
          color = colors.textPrimary,
        )
        Spacer(modifier = Modifier.height(10.dp))

        OutlinedTextField(
          value = newSubName,
          onValueChange = { newSubName = it },
          placeholder = { Text("Subject Name (e.g. NDA Polity, Computer)") },
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
          value = newSubChapters,
          onValueChange = { newSubChapters = it },
          placeholder = { Text("Total Chapters (e.g. 15)") },
          singleLine = true,
          keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
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

        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          DefaultPadhaiData.presetColorHexes.forEach { hex ->
            val swatchColor = parseColorHex(hex)
            val isSelected = selectedColorHex == hex
            Box(
              modifier = Modifier
                .size(32.dp)
                .clip(CircleShape)
                .background(swatchColor)
                .border(
                  width = if (isSelected) 3.dp else 1.dp,
                  color = if (isSelected) colors.textPrimary else Color.Transparent,
                  shape = CircleShape,
                )
                .clickable { selectedColorHex = hex },
              contentAlignment = Alignment.Center,
            ) {
              if (isSelected) {
                Icon(
                  imageVector = Icons.Filled.Check,
                  contentDescription = "Selected color",
                  tint = Color.White,
                  modifier = Modifier.size(16.dp),
                )
              }
            }
          }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Button(
          onClick = {
            onAddSubject(newSubName, newSubChapters.toIntOrNull(), selectedColorHex)
            if (newSubName.isNotBlank()) {
              newSubName = ""
              newSubChapters = ""
            }
          },
          shape = RoundedCornerShape(10.dp),
          modifier = Modifier
            .fillMaxWidth()
            .height(48.dp),
        ) {
          Text("+ Add Subject", fontWeight = FontWeight.Bold)
        }
      }
    }

    // 2. UP Board 11th + NDA Syllabus
    item {
      PadhaiCard {
        Text(
          text = "UP Board 11th + NDA Syllabus",
          style = MaterialTheme.typography.titleMedium,
          color = colors.textPrimary,
        )
        Spacer(modifier = Modifier.height(12.dp))

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
          state.subjects.forEach { sub ->
            val pct = ((sub.doneChapters.toFloat() / sub.totalChapters.coerceAtLeast(1)) * 100f)
              .roundToInt()
              .coerceIn(0, 100)
            val subColor = parseColorHex(sub.colorHex, colors.primaryAccent)

            Surface(
              shape = RoundedCornerShape(12.dp),
              color = colors.innerBackground,
              modifier = Modifier.fillMaxWidth(),
            ) {
              Column(modifier = Modifier.padding(12.dp)) {
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
                    Box(
                      modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(subColor),
                    )
                    Text(
                      text = sub.name,
                      color = colors.textPrimary,
                      fontWeight = FontWeight.Bold,
                      fontSize = 14.sp,
                      maxLines = 1,
                      overflow = TextOverflow.Ellipsis,
                    )
                  }
                  Text(
                    text = "${sub.doneChapters}/${sub.totalChapters} Ch ($pct%)",
                    color = colors.textMuted,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                  )
                }

                Spacer(modifier = Modifier.height(8.dp))
                LinearProgressTrack(
                  progress = pct / 100f,
                  fillColor = subColor,
                  heightDp = 8,
                )
                Spacer(modifier = Modifier.height(10.dp))

                Row(
                  modifier = Modifier.fillMaxWidth(),
                  horizontalArrangement = Arrangement.SpaceBetween,
                  verticalAlignment = Alignment.CenterVertically,
                ) {
                  Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                      onClick = { onUpdateChapters(sub.id, -1) },
                      shape = RoundedCornerShape(8.dp),
                      border = BorderStroke(1.dp, colors.border),
                      contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    ) {
                      Text("-1 Ch", fontSize = 12.sp, color = colors.textPrimary, maxLines = 1)
                    }
                    Button(
                      onClick = { onUpdateChapters(sub.id, 1) },
                      shape = RoundedCornerShape(8.dp),
                      contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    ) {
                      Text("+1 Ch Done", fontSize = 12.sp, maxLines = 1)
                    }
                  }

                  IconButton(
                    onClick = { subjectPendingDelete = sub },
                    modifier = Modifier.size(40.dp),
                  ) {
                    Icon(
                      imageVector = Icons.Filled.DeleteOutline,
                      contentDescription = "Delete subject",
                      tint = colors.textMuted,
                      modifier = Modifier.size(19.dp),
                    )
                  }
                }
              }
            }
          }
        }
      }
    }

    // 3. Recent Study History
    item {
      PadhaiCard {
        Text(
          text = "Recent Study History",
          style = MaterialTheme.typography.titleMedium,
          color = colors.textPrimary,
        )
        Spacer(modifier = Modifier.height(10.dp))

        if (recentLogs.isEmpty()) {
          Text(
            text = "Abhi tak koi study log nahi hai.",
            color = colors.textMuted,
            fontSize = 13.sp,
          )
        } else {
          Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            recentLogs.forEach { log ->
              val sub = state.subjects.find { it.id == log.subjectId }
              val subColor = parseColorHex(sub?.colorHex ?: "", colors.primaryAccent)
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
                  Box(
                    modifier = Modifier
                      .size(10.dp)
                      .clip(CircleShape)
                      .background(subColor),
                  )
                  Spacer(modifier = Modifier.padding(start = 10.dp))
                  Column(modifier = Modifier.weight(1f)) {
                    Text(
                      text = "${sub?.name ?: "General"} · ${PadhaiDateUtils.formatMinutes(log.mins)}",
                      color = colors.textPrimary,
                      fontWeight = FontWeight.SemiBold,
                      fontSize = 14.sp,
                      maxLines = 1,
                      overflow = TextOverflow.Ellipsis,
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                      text = "${log.date} · ${log.topic} · Focus: ${log.focus}/5",
                      color = colors.textMuted,
                      fontSize = 12.sp,
                      maxLines = 2,
                      overflow = TextOverflow.Ellipsis,
                    )
                  }
                  IconButton(
                    onClick = { onDeleteLog(log.id) },
                    modifier = Modifier.size(44.dp),
                  ) {
                    Icon(
                      imageVector = Icons.Filled.Close,
                      contentDescription = "Delete study log",
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
  }

  subjectPendingDelete?.let { sub ->
    ConfirmActionDialog(
      title = "Delete Subject?",
      message = "Kya '${sub.name}' ko delete karna hai?",
      confirmLabel = "Delete",
      onConfirm = {
        onDeleteSubject(sub.id)
        subjectPendingDelete = null
      },
      onDismiss = { subjectPendingDelete = null },
    )
  }
}
