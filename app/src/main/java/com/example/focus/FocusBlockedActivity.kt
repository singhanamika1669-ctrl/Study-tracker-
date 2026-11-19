package com.example.focus

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.MainActivity
import com.example.data.FocusGuardPrefs
import com.example.ui.theme.BannerArmy
import com.example.ui.theme.BannerNavy
import com.example.ui.theme.PadhaiProTheme

class FocusBlockedActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    val blockedPkg = intent.getStringExtra(EXTRA_BLOCKED_PACKAGE).orEmpty()
    val blockedLabel = if (blockedPkg.isNotBlank()) {
      FocusAppHelper.getAppLabel(this, blockedPkg)
    } else {
      "Distracting App"
    }
    val config = FocusGuardPrefs.read(this)
    val allowedApps = config.allowedPackages.map { pkg ->
      InstalledAppInfo(packageName = pkg, label = FocusAppHelper.getAppLabel(this, pkg))
    }

    setContent {
      PadhaiProTheme(darkTheme = true) {
        Box(
          modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(BannerNavy, Color(0xFF0F172A))))
            .padding(24.dp),
        ) {
          Column(
            modifier = Modifier
              .fillMaxSize()
              .padding(top = 40.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
          ) {
            Box(
              modifier = Modifier
                .size(76.dp)
                .clip(CircleShape)
                .background(BannerArmy.copy(alpha = 0.35f)),
              contentAlignment = Alignment.Center,
            ) {
              Icon(
                imageVector = Icons.Filled.Lock,
                contentDescription = "Focus Shield Active",
                tint = Color.White,
                modifier = Modifier.size(38.dp),
              )
            }

            Spacer(modifier = Modifier.height(18.dp))

            Text(
              text = "Focus Mode ON",
              color = Color.White.copy(alpha = 0.85f),
              fontSize = 14.sp,
              fontWeight = FontWeight.SemiBold,
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
              text = "$blockedLabel Blocked Hai",
              color = Color.White,
              fontSize = 24.sp,
              fontWeight = FontWeight.ExtraBold,
              textAlign = TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
              text = "Distraction se bachne ke liye abhi keval aapke select kiye hue study apps hi open ho sakte hain.",
              color = Color.White.copy(alpha = 0.8f),
              fontSize = 14.sp,
              textAlign = TextAlign.Center,
              lineHeight = 20.sp,
            )

            Spacer(modifier = Modifier.height(24.dp))

            if (allowedApps.isNotEmpty()) {
              Text(
                text = "Allowed Study Apps",
                color = Color.White.copy(alpha = 0.9f),
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.fillMaxWidth(),
              )
              Spacer(modifier = Modifier.height(10.dp))
              LazyColumn(
                modifier = Modifier
                  .weight(1f, fill = false)
                  .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp),
              ) {
                items(allowedApps) { app ->
                  Surface(
                    onClick = {
                      if (FocusAppHelper.launchApp(this@FocusBlockedActivity, app.packageName)) {
                        finish()
                      }
                    },
                    shape = RoundedCornerShape(12.dp),
                    color = Color.White.copy(alpha = 0.1f),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f)),
                    modifier = Modifier.fillMaxWidth(),
                  ) {
                    Row(
                      modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                      verticalAlignment = Alignment.CenterVertically,
                      horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                      Text(
                        text = app.label,
                        color = Color.White,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 15.sp,
                      )
                      Icon(
                        imageVector = Icons.Filled.OpenInNew,
                        contentDescription = "Open ${app.label}",
                        tint = Color.White.copy(alpha = 0.85f),
                        modifier = Modifier.size(18.dp),
                      )
                    }
                  }
                }
              }
              Spacer(modifier = Modifier.height(16.dp))
            } else {
              Spacer(modifier = Modifier.weight(1f))
            }

            Button(
              onClick = {
                val mainIntent = Intent(this@FocusBlockedActivity, MainActivity::class.java).apply {
                  addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                startActivity(mainIntent)
                finish()
              },
              shape = RoundedCornerShape(14.dp),
              colors = ButtonDefaults.buttonColors(containerColor = BannerArmy),
              modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            ) {
              Text("Open Study Tracker", color = Color.White, fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedButton(
              onClick = {
                val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                  addCategory(Intent.CATEGORY_HOME)
                  flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                startActivity(homeIntent)
                finish()
              },
              shape = RoundedCornerShape(14.dp),
              border = BorderStroke(1.dp, Color.White.copy(alpha = 0.35f)),
              modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            ) {
              Spacer(modifier = Modifier.width(4.dp))
              Text("Go to Home Screen", color = Color.White, fontWeight = FontWeight.SemiBold)
            }
          }
        }
      }
    }
  }

  companion object {
    const val EXTRA_BLOCKED_PACKAGE = "extra_blocked_package"
  }
}
