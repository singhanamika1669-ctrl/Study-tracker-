package com.example.alarm

import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.model.DefaultPadhaiData
import com.example.ui.components.FighterJetVector
import com.example.ui.theme.AfterburnerAmber
import com.example.ui.theme.BannerNavy
import com.example.ui.theme.PadhaiProTheme
import com.example.ui.theme.SquadronSky

class AlarmRingActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
          WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
      )
    }
    enableEdgeToEdge()

    val id = intent.getStringExtra(ReminderScheduler.EXTRA_REMINDER_ID) ?: "alarm"
    val title = intent.getStringExtra(ReminderScheduler.EXTRA_REMINDER_TITLE) ?: "Mission Sortie Time!"
    val time = intent.getStringExtra(ReminderScheduler.EXTRA_REMINDER_TIME) ?: ""
    val toneId = intent.getStringExtra(ReminderScheduler.EXTRA_REMINDER_TONE) ?: "air_raid"
    val toneMeta = DefaultPadhaiData.getToneMeta(toneId)

    setContent {
      PadhaiProTheme(darkTheme = true) {
        Box(
          modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF08101C)),
          contentAlignment = Alignment.Center,
        ) {
          Image(
            painter = painterResource(id = R.drawable.fighter_stratosphere_focus),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            alpha = 0.48f,
            modifier = Modifier.fillMaxSize(),
          )
          Box(
            modifier = Modifier
              .fillMaxSize()
              .background(
                Brush.verticalGradient(
                  listOf(
                    Color(0xCC08101C),
                    Color(0x990C2340),
                    Color(0xEE08101C),
                  )
                )
              )
          )

          Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
              .fillMaxWidth()
              .padding(24.dp),
          ) {
            Box(
              modifier = Modifier
                .size(92.dp)
                .clip(CircleShape)
                .background(SquadronSky.copy(alpha = 0.22f)),
              contentAlignment = Alignment.Center,
            ) {
              FighterJetVector(
                tint = Color.White,
                modifier = Modifier.size(48.dp),
              )
            }
            Spacer(modifier = Modifier.height(18.dp))
            Text(
              text = "IAF SCRAMBLE ALERT · NO SNOOZE",
              color = AfterburnerAmber,
              fontSize = 12.sp,
              fontWeight = FontWeight.ExtraBold,
              letterSpacing = 1.6.sp,
            )
            if (time.isNotBlank()) {
              Spacer(modifier = Modifier.height(8.dp))
              Text(
                text = time,
                color = Color.White,
                fontFamily = FontFamily.Monospace,
                fontSize = 52.sp,
                fontWeight = FontWeight.ExtraBold,
              )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
              text = title,
              color = Color.White,
              fontSize = 23.sp,
              fontWeight = FontWeight.Bold,
              textAlign = TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(12.dp))
            Surface(
              color = Color(0x660F1B2D),
              shape = RoundedCornerShape(10.dp),
              border = BorderStroke(1.dp, SquadronSky.copy(alpha = 0.45f)),
            ) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
              ) {
                Text(
                  text = "${toneMeta.name} (${toneMeta.intensity})",
                  color = Color(0xFFBAE6FD),
                  fontSize = 12.sp,
                  fontWeight = FontWeight.Bold,
                )
              }
            }
            Spacer(modifier = Modifier.height(36.dp))
            Button(
              onClick = {
                AlarmPlaybackController.stopRinging()
                cancelNotification(id)
                finish()
              },
              shape = RoundedCornerShape(14.dp),
              colors = ButtonDefaults.buttonColors(containerColor = Color.White),
              modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            ) {
              Spacer(modifier = Modifier.width(4.dp))
              Text(
                text = "Dismiss Alarm",
                color = BannerNavy,
                fontSize = 16.sp,
                fontWeight = FontWeight.ExtraBold,
              )
            }
          }
        }
      }
    }
  }

  private fun cancelNotification(id: String) {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
    nm?.cancel(id.hashCode())
  }
}
