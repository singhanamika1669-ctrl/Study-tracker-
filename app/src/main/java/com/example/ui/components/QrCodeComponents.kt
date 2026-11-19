package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.QrCode2
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.DefaultPadhaiData
import com.example.ui.theme.BannerArmy
import com.example.ui.theme.LocalPadhaiColors
import com.example.util.QrCodeGenerator

@Composable
fun QrShareSection(
  shareUrl: String,
  onUpdateShareUrl: (String) -> Unit,
  onCopySuccess: (String) -> Unit,
) {
  val colors = LocalPadhaiColors.current
  val clipboardManager = LocalClipboardManager.current
  val targetUrl = shareUrl.ifBlank { DefaultPadhaiData.DEFAULT_APP_SHARE_URL }
  var urlDraft by remember(targetUrl) { mutableStateOf(targetUrl) }

  val matrix = remember(targetUrl) {
    try {
      QrCodeGenerator.encode(targetUrl)
    } catch (_: Exception) {
      null
    }
  }

  Column(
    modifier = Modifier.fillMaxWidth(),
    verticalArrangement = Arrangement.spacedBy(12.dp),
  ) {
    Surface(
      shape = RoundedCornerShape(14.dp),
      color = colors.innerBackground,
      border = BorderStroke(1.dp, colors.border),
      modifier = Modifier.fillMaxWidth(),
    ) {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
      ) {
        if (matrix != null) {
          Box(
            modifier = Modifier
              .size(196.dp)
              .clip(RoundedCornerShape(14.dp))
              .background(Color.White)
              .padding(14.dp),
            contentAlignment = Alignment.Center,
          ) {
            Canvas(modifier = Modifier.size(168.dp)) {
              val n = matrix.size
              val modulePx = size.width / n.toFloat()
              for (r in 0 until n) {
                for (c in 0 until n) {
                  if (matrix[r][c]) {
                    drawRect(
                      color = Color(0xFF0F172A),
                      topLeft = Offset(c * modulePx, r * modulePx),
                      size = Size(modulePx + 0.5f, modulePx + 0.5f),
                    )
                  }
                }
              }
            }
          }
        } else {
          Icon(
            imageVector = Icons.Filled.QrCode2,
            contentDescription = null,
            tint = colors.primaryAccent,
            modifier = Modifier.size(80.dp),
          )
        }

        Spacer(modifier = Modifier.height(10.dp))
        Text(
          text = "Scan QR to Download / Open Study Tracker",
          color = colors.textPrimary,
          fontWeight = FontWeight.Bold,
          fontSize = 14.sp,
          textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
          text = targetUrl,
          color = colors.textMuted,
          fontSize = 11.sp,
          textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedButton(
          onClick = {
            clipboardManager.setText(AnnotatedString(targetUrl))
            onCopySuccess("App link copy ho gaya!")
          },
          shape = RoundedCornerShape(10.dp),
          border = BorderStroke(1.dp, colors.border),
        ) {
          Icon(
            imageVector = Icons.Filled.ContentCopy,
            contentDescription = null,
            tint = colors.primaryAccent,
            modifier = Modifier.size(16.dp),
          )
          Spacer(modifier = Modifier.width(6.dp))
          Text("Copy Link", color = colors.primaryAccent, fontWeight = FontWeight.Bold, fontSize = 12.sp)
        }
      }
    }

    OutlinedTextField(
      value = urlDraft,
      onValueChange = { urlDraft = it },
      label = { Text("App / APK Download Link") },
      placeholder = { Text("https://...") },
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

    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.spacedBy(8.dp),
      verticalAlignment = Alignment.CenterVertically,
    ) {
      Button(
        onClick = {
          onUpdateShareUrl(urlDraft.trim().ifBlank { DefaultPadhaiData.DEFAULT_APP_SHARE_URL })
        },
        shape = RoundedCornerShape(10.dp),
        colors = ButtonDefaults.buttonColors(containerColor = BannerArmy),
        modifier = Modifier
          .weight(1f)
          .height(44.dp),
      ) {
        Text("Update QR Link", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
      }

      IconButton(
        onClick = {
          urlDraft = DefaultPadhaiData.DEFAULT_APP_SHARE_URL
          onUpdateShareUrl(DefaultPadhaiData.DEFAULT_APP_SHARE_URL)
        },
        modifier = Modifier.size(44.dp),
      ) {
        Icon(
          imageVector = Icons.Filled.Refresh,
          contentDescription = "Reset default link",
          tint = colors.textMuted,
        )
      }
    }
  }
}
