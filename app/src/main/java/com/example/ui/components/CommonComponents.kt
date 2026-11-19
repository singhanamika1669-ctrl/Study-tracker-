package com.example.ui.components

import android.app.TimePickerDialog
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material3.AlertDialog
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
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.offset
import androidx.compose.ui.graphics.Path
import com.example.model.Subject
import com.example.ui.theme.BannerArmy
import com.example.ui.theme.BannerNavy
import com.example.ui.theme.LocalPadhaiColors
import com.example.ui.theme.SquadronSky
import com.example.ui.theme.SuccessGreen
import com.example.ui.theme.parseColorHex
import java.util.Locale

@Composable
fun FighterJetVector(
  tint: Color = Color.White,
  modifier: Modifier = Modifier,
) {
  Canvas(modifier = modifier) {
    val w = size.width
    val h = size.height
    val jet = Path().apply {
      // Fuselage & nose pointing right
      moveTo(w * 0.96f, h * 0.50f)
      lineTo(w * 0.64f, h * 0.42f)
      lineTo(w * 0.34f, h * 0.10f)
      lineTo(w * 0.22f, h * 0.10f)
      lineTo(w * 0.38f, h * 0.42f)
      lineTo(w * 0.16f, h * 0.43f)
      lineTo(w * 0.06f, h * 0.28f)
      lineTo(w * 0.02f, h * 0.28f)
      lineTo(w * 0.09f, h * 0.50f)
      lineTo(w * 0.02f, h * 0.72f)
      lineTo(w * 0.06f, h * 0.72f)
      lineTo(w * 0.16f, h * 0.57f)
      lineTo(w * 0.38f, h * 0.58f)
      lineTo(w * 0.22f, h * 0.90f)
      lineTo(w * 0.34f, h * 0.90f)
      lineTo(w * 0.64f, h * 0.58f)
      close()
    }
    drawPath(path = jet, color = tint)
  }
}

@Composable
fun PadhaiTopBar(
  dateSubtitle: String,
  streakDays: Int,
  isDarkMode: Boolean,
  onToggleTheme: () -> Unit,
  onOpenSettings: () -> Unit,
) {
  val colors = LocalPadhaiColors.current
  Surface(
    color = colors.cardBackground,
    tonalElevation = 0.dp,
    modifier = Modifier.fillMaxWidth(),
  ) {
    Column {
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .statusBarsPadding()
          .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
      ) {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          modifier = Modifier.weight(1f),
        ) {
          Box(
            modifier = Modifier
              .size(40.dp)
              .clip(RoundedCornerShape(10.dp))
              .background(Brush.linearGradient(listOf(BannerNavy, SquadronSky))),
            contentAlignment = Alignment.Center,
          ) {
            FighterJetVector(
              tint = Color.White,
              modifier = Modifier.size(22.dp),
            )
          }
          Spacer(modifier = Modifier.width(10.dp))
          Column(modifier = Modifier.weight(1f)) {
            Text(
              text = "Study Tracker",
              style = MaterialTheme.typography.titleMedium,
              color = colors.textPrimary,
              maxLines = 1,
              overflow = TextOverflow.Ellipsis,
            )
            Text(
              text = "$dateSubtitle · IAF Squadron Prep",
              style = MaterialTheme.typography.bodySmall,
              color = colors.textMuted,
              maxLines = 1,
              overflow = TextOverflow.Ellipsis,
            )
          }
        }

        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          Surface(
            color = colors.streakBg,
            shape = RoundedCornerShape(20.dp),
            border = BorderStroke(1.dp, colors.streakBorder),
          ) {
            Row(
              modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
              Icon(
                imageVector = Icons.Filled.LocalFireDepartment,
                contentDescription = "Streak",
                tint = colors.streakText,
                modifier = Modifier.size(16.dp),
              )
              Text(
                text = "${streakDays}d",
                color = colors.streakText,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
              )
            }
          }

          Surface(
            color = colors.innerBackground,
            shape = RoundedCornerShape(10.dp),
            border = BorderStroke(1.dp, colors.border),
          ) {
            IconButton(
              onClick = onOpenSettings,
              modifier = Modifier.size(38.dp),
            ) {
              Icon(
                imageVector = Icons.Filled.QrCode2,
                contentDescription = "Settings & App QR Code",
                tint = colors.primaryAccent,
                modifier = Modifier.size(19.dp),
              )
            }
          }

          Surface(
            color = colors.innerBackground,
            shape = RoundedCornerShape(10.dp),
            border = BorderStroke(1.dp, colors.border),
          ) {
            IconButton(
              onClick = onToggleTheme,
              modifier = Modifier.size(38.dp),
            ) {
              Icon(
                imageVector = if (isDarkMode) Icons.Filled.LightMode else Icons.Filled.DarkMode,
                contentDescription = "Toggle Dark/Light Theme",
                tint = colors.textPrimary,
                modifier = Modifier.size(18.dp),
              )
            }
          }
        }
      }
      Box(
        modifier = Modifier
          .fillMaxWidth()
          .height(1.dp)
          .background(colors.border)
      )
    }
  }
}

@Composable
fun PadhaiCard(
  modifier: Modifier = Modifier,
  content: @Composable ColumnScope.() -> Unit,
) {
  val colors = LocalPadhaiColors.current
  Surface(
    modifier = modifier.fillMaxWidth(),
    shape = RoundedCornerShape(16.dp),
    color = colors.cardBackground,
    border = BorderStroke(1.dp, colors.border),
  ) {
    Column(
      modifier = Modifier.padding(16.dp),
      content = content,
    )
  }
}

@Composable
fun LinearProgressTrack(
  progress: Float,
  fillColor: Color,
  modifier: Modifier = Modifier,
  heightDp: Int = 10,
) {
  val colors = LocalPadhaiColors.current
  val animated by animateFloatAsState(
    targetValue = progress.coerceIn(0f, 1f),
    animationSpec = tween(durationMillis = 350),
    label = "progress",
  )
  Box(
    modifier = modifier
      .fillMaxWidth()
      .height(heightDp.dp)
      .clip(RoundedCornerShape(999.dp))
      .background(colors.innerBackground),
  ) {
    Box(
      modifier = Modifier
        .fillMaxWidth(animated)
        .fillMaxHeight()
        .clip(RoundedCornerShape(999.dp))
        .background(fillColor),
    )
  }
}

@Composable
fun RunwayProgressTrack(
  progress: Float,
  fillColor: Color,
  modifier: Modifier = Modifier,
) {
  val colors = LocalPadhaiColors.current
  val animated by animateFloatAsState(
    targetValue = progress.coerceIn(0f, 1f),
    animationSpec = tween(durationMillis = 400),
    label = "runway_progress",
  )
  BoxWithConstraints(
    modifier = modifier
      .fillMaxWidth()
      .height(24.dp),
    contentAlignment = Alignment.CenterStart,
  ) {
    val jetSize = 20.dp
    val maxOffset = (maxWidth - jetSize).coerceAtLeast(0.dp)
    val jetOffset = maxOffset * animated.coerceIn(0.03f, 0.98f)

    Box(
      modifier = Modifier
        .fillMaxWidth()
        .height(10.dp)
        .clip(RoundedCornerShape(999.dp))
        .background(colors.innerBackground),
    ) {
      Box(
        modifier = Modifier
          .fillMaxWidth(animated)
          .fillMaxHeight()
          .clip(RoundedCornerShape(999.dp))
          .background(Brush.horizontalGradient(listOf(BannerNavy, fillColor))),
      )
    }

    FighterJetVector(
      tint = fillColor,
      modifier = Modifier
        .offset(x = jetOffset)
        .size(jetSize),
    )
  }
}

@Composable
fun MiniStatTile(
  value: String,
  label: String,
  modifier: Modifier = Modifier,
) {
  val colors = LocalPadhaiColors.current
  Surface(
    modifier = modifier,
    shape = RoundedCornerShape(12.dp),
    color = colors.innerBackground,
  ) {
    Column(
      modifier = Modifier.padding(vertical = 10.dp, horizontal = 8.dp),
      horizontalAlignment = Alignment.CenterHorizontally,
    ) {
      Text(
        text = value,
        color = colors.primaryAccent,
        fontWeight = FontWeight.Bold,
        fontSize = 16.sp,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
      )
      Spacer(modifier = Modifier.height(2.dp))
      Text(
        text = label,
        color = colors.textMuted,
        fontSize = 11.sp,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
      )
    }
  }
}

@Composable
fun CheckToggleBox(
  checked: Boolean,
  onToggle: () -> Unit,
  contentDescription: String,
  locked: Boolean = false,
) {
  val colors = LocalPadhaiColors.current
  val borderColor = when {
    checked -> SuccessGreen
    locked -> Color(0xFFD97706)
    else -> colors.primaryAccent
  }
  val bgColor = when {
    checked -> SuccessGreen
    locked -> Color(0xFFFEF3C7)
    else -> Color.Transparent
  }
  Box(
    modifier = Modifier
      .size(44.dp)
      .clip(RoundedCornerShape(10.dp))
      .clickable(onClick = onToggle),
    contentAlignment = Alignment.Center,
  ) {
    Box(
      modifier = Modifier
        .size(24.dp)
        .clip(RoundedCornerShape(7.dp))
        .background(bgColor)
        .border(
          width = 2.dp,
          color = borderColor,
          shape = RoundedCornerShape(7.dp),
        ),
      contentAlignment = Alignment.Center,
    ) {
      if (checked) {
        Icon(
          imageVector = Icons.Filled.Check,
          contentDescription = contentDescription,
          tint = Color.White,
          modifier = Modifier.size(16.dp),
        )
      } else if (locked) {
        Icon(
          imageVector = Icons.Filled.Lock,
          contentDescription = contentDescription,
          tint = Color(0xFFB45309),
          modifier = Modifier.size(14.dp),
        )
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubjectDropdown(
  subjects: List<Subject>,
  selectedSubjectId: String,
  onSelectSubject: (String) -> Unit,
  label: String = "Subject",
  modifier: Modifier = Modifier,
) {
  val colors = LocalPadhaiColors.current
  var expanded by remember { mutableStateOf(false) }
  val selected = subjects.find { it.id == selectedSubjectId } ?: subjects.firstOrNull()

  ExposedDropdownMenuBox(
    expanded = expanded,
    onExpandedChange = { expanded = !expanded },
    modifier = modifier.fillMaxWidth(),
  ) {
    OutlinedTextField(
      value = selected?.name ?: "Select Subject",
      onValueChange = {},
      readOnly = true,
      label = { Text(label) },
      leadingIcon = selected?.let {
        {
          Box(
            modifier = Modifier
              .size(10.dp)
              .clip(CircleShape)
              .background(parseColorHex(it.colorHex, colors.primaryAccent)),
          )
        }
      },
      trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
      singleLine = true,
      shape = RoundedCornerShape(10.dp),
      colors = OutlinedTextFieldDefaults.colors(
        focusedContainerColor = colors.innerBackground,
        unfocusedContainerColor = colors.innerBackground,
        focusedBorderColor = colors.primaryAccent,
        unfocusedBorderColor = colors.border,
        focusedTextColor = colors.textPrimary,
        unfocusedTextColor = colors.textPrimary,
      ),
      modifier = Modifier
        .fillMaxWidth()
        .menuAnchor(MenuAnchorType.PrimaryNotEditable),
    )

    ExposedDropdownMenu(
      expanded = expanded,
      onDismissRequest = { expanded = false },
    ) {
      subjects.forEach { subject ->
        DropdownMenuItem(
          text = {
            Row(
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
              Box(
                modifier = Modifier
                  .size(10.dp)
                  .clip(CircleShape)
                  .background(parseColorHex(subject.colorHex, colors.primaryAccent)),
              )
              Text(subject.name, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
          },
          onClick = {
            onSelectSubject(subject.id)
            expanded = false
          },
        )
      }
    }
  }
}

@Composable
fun TimePickerChipField(
  label: String,
  timeValue: String,
  onTimeSelected: (String) -> Unit,
  modifier: Modifier = Modifier,
) {
  val colors = LocalPadhaiColors.current
  val context = LocalContext.current
  val parts = timeValue.split(":")
  val initialHour = parts.getOrNull(0)?.toIntOrNull()?.coerceIn(0, 23) ?: 6
  val initialMin = parts.getOrNull(1)?.toIntOrNull()?.coerceIn(0, 59) ?: 0

  Surface(
    modifier = modifier
      .clip(RoundedCornerShape(10.dp))
      .clickable {
        TimePickerDialog(
          context,
          { _, h, m ->
            onTimeSelected(String.format(Locale.US, "%02d:%02d", h, m))
          },
          initialHour,
          initialMin,
          true,
        ).show()
      },
    shape = RoundedCornerShape(10.dp),
    color = colors.innerBackground,
    border = BorderStroke(1.dp, colors.border),
  ) {
    Column(
      modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
    ) {
      Text(
        text = label,
        color = colors.textMuted,
        fontSize = 11.sp,
      )
      Spacer(modifier = Modifier.height(2.dp))
      Text(
        text = timeValue,
        color = colors.textPrimary,
        fontWeight = FontWeight.SemiBold,
        fontSize = 15.sp,
      )
    }
  }
}

@Composable
fun ConfirmActionDialog(
  title: String,
  message: String,
  confirmLabel: String,
  onConfirm: () -> Unit,
  onDismiss: () -> Unit,
) {
  AlertDialog(
    onDismissRequest = onDismiss,
    title = { Text(title, fontWeight = FontWeight.Bold) },
    text = { Text(message) },
    confirmButton = {
      TextButton(onClick = onConfirm) {
        Text(confirmLabel, color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold)
      }
    },
    dismissButton = {
      TextButton(onClick = onDismiss) {
        Text("Cancel")
      }
    },
  )
}
