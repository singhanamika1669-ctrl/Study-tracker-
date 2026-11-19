package com.example.alarm

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.example.model.DefaultPadhaiData
import kotlin.math.PI
import kotlin.math.sin
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class RingingAlarmInfo(
  val id: String,
  val title: String,
  val time: String,
  val toneId: String = "air_raid",
)

object AlarmPlaybackController {
  private const val SAMPLE_RATE = 22050

  private var activeAudioTrack: AudioTrack? = null
  private var activeRingtone: Ringtone? = null
  private var activeVibrator: Vibrator? = null
  private var previewThread: Thread? = null

  private val _ringingAlarm = MutableStateFlow<RingingAlarmInfo?>(null)
  val ringingAlarm: StateFlow<RingingAlarmInfo?> = _ringingAlarm.asStateFlow()

  @Synchronized
  fun startRinging(
    context: Context,
    id: String,
    title: String,
    time: String,
    vibrate: Boolean,
    toneId: String = "air_raid",
  ) {
    stopRinging()
    val safeTone = if (DefaultPadhaiData.isValidToneId(toneId)) toneId else "air_raid"
    _ringingAlarm.value = RingingAlarmInfo(
      id = id,
      title = title,
      time = time,
      toneId = safeTone,
    )

    val playedSynth = playSynthesizedAudio(safeTone, looping = true)
    if (!playedSynth) {
      playFallbackRingtone(context)
    }

    if (vibrate) {
      startVibration(context)
    }
  }

  @Synchronized
  fun previewTone(context: Context, toneId: String) {
    // Only stop preview / previous track without clearing an active ringing alarm if none, or stop all
    stopRinging()
    val safeTone = if (DefaultPadhaiData.isValidToneId(toneId)) toneId else "air_raid"
    val playedSynth = playSynthesizedAudio(safeTone, looping = false)
    if (!playedSynth) {
      playFallbackRingtone(context)
    }
  }

  @Synchronized
  fun stopRinging() {
    previewThread?.interrupt()
    previewThread = null

    try {
      activeAudioTrack?.let { track ->
        if (track.playState == AudioTrack.PLAYSTATE_PLAYING) {
          track.pause()
        }
        track.flush()
        track.stop()
        track.release()
      }
    } catch (_: Exception) {
    }
    activeAudioTrack = null

    try {
      activeRingtone?.stop()
    } catch (_: Exception) {
    }
    activeRingtone = null

    try {
      activeVibrator?.cancel()
    } catch (_: Exception) {
    }
    activeVibrator = null
    _ringingAlarm.value = null
  }

  private fun playSynthesizedAudio(toneId: String, looping: Boolean): Boolean {
    return try {
      val samples = generateTonePcm(toneId, SAMPLE_RATE)
      val byteCount = samples.size * 2
      val track = AudioTrack.Builder()
        .setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        )
        .setAudioFormat(
          AudioFormat.Builder()
            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
            .setSampleRate(SAMPLE_RATE)
            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
            .build()
        )
        .setBufferSizeInBytes(byteCount)
        .setTransferMode(AudioTrack.MODE_STATIC)
        .build()

      val written = track.write(samples, 0, samples.size)
      if (written <= 0) {
        track.release()
        return false
      }
      if (looping) {
        track.setLoopPoints(0, samples.size, -1)
      }
      track.play()
      activeAudioTrack = track

      if (!looping) {
        val durationMs = ((samples.size.toDouble() / SAMPLE_RATE) * 1000.0).toLong() + 120L
        previewThread = Thread {
          try {
            Thread.sleep(durationMs)
            synchronized(this@AlarmPlaybackController) {
              if (activeAudioTrack === track) {
                try {
                  track.stop()
                  track.release()
                } catch (_: Exception) {
                }
                activeAudioTrack = null
              }
            }
          } catch (_: InterruptedException) {
          }
        }.apply { isDaemon = true; start() }
      }
      true
    } catch (_: Exception) {
      false
    }
  }

  private fun playFallbackRingtone(context: Context) {
    try {
      val alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
        ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
      val ringtone = RingtoneManager.getRingtone(context.applicationContext, alarmUri)
      if (ringtone != null) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
          ringtone.audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
          ringtone.isLooping = true
        }
        ringtone.play()
        activeRingtone = ringtone
      }
    } catch (_: Exception) {
    }
  }

  private fun startVibration(context: Context) {
    try {
      val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
        vm?.defaultVibrator
      } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
      }
      if (vibrator != null && vibrator.hasVibrator()) {
        val pattern = longArrayOf(0L, 650L, 250L, 650L, 250L, 800L, 300L)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0))
        } else {
          @Suppress("DEPRECATION")
          vibrator.vibrate(pattern, 0)
        }
        activeVibrator = vibrator
      }
    } catch (_: Exception) {
    }
  }

  /**
   * Generates a 16-bit mono PCM waveform for each of the 6 hard military & Air Force tones.
   * Exposed publicly so JVM unit tests verify every tone produces crisp non-silent audio.
   */
  fun generateTonePcm(toneId: String, sampleRate: Int = SAMPLE_RATE): ShortArray {
    val durationSec = when (toneId) {
      "air_raid" -> 2.0
      "squadron_bugle" -> 1.8
      "cockpit_red_alert" -> 1.6
      "radar_scramble" -> 1.6
      "commando_whistle" -> 1.5
      "missile_lock" -> 1.5
      else -> 1.8
    }
    val totalSamples = (durationSec * sampleRate).toInt().coerceAtLeast(1)
    val buffer = ShortArray(totalSamples)
    val twoPi = 2.0 * PI

    var phase1 = 0.0
    var phase2 = 0.0

    for (i in 0 until totalSamples) {
      val t = i.toDouble() / sampleRate
      val progress = t / durationSec

      // Soft loop seam envelope (5ms fade in & fade out)
      val edgeFade = when {
        i < sampleRate / 200 -> i.toDouble() / (sampleRate / 200)
        i > totalSamples - sampleRate / 200 -> (totalSamples - i).toDouble() / (sampleRate / 200)
        else -> 1.0
      }

      val sampleNorm: Double = when (toneId) {
        "air_raid" -> {
          // IAF Air-Raid Siren: Wail sweep up 460 -> 1120 -> 460 Hz
          val sweep = if (progress < 0.5) progress * 2.0 else (1.0 - progress) * 2.0
          val freq = 460.0 + sweep * 660.0
          phase1 += twoPi * freq / sampleRate
          phase2 += twoPi * (freq * 2.0) / sampleRate
          val fundamental = sawFromPhase(phase1) * 0.65
          val harmonic = sin(phase2) * 0.35
          (fundamental + harmonic) * 0.85
        }

        "squadron_bugle" -> {
          // Crisp military brass bugle call: C5-E5-G5-C6-G5-C6
          val noteIdx = (progress * 6.0).toInt().coerceIn(0, 5)
          val noteLocal = (progress * 6.0) - noteIdx
          val freqs = doubleArrayOf(523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50)
          val freq = freqs[noteIdx]
          phase1 += twoPi * freq / sampleRate
          phase2 += twoPi * (freq * 2.0) / sampleRate
          val gate = if (noteLocal > 0.86) (1.0 - noteLocal) / 0.14 else 1.0
          val brass = sawFromPhase(phase1) * 0.60 + squareFromPhase(phase2) * 0.30
          brass * gate * 0.85
        }

        "cockpit_red_alert" -> {
          // Cockpit Master Alert: Urgent twin-tone fighter warning strobe
          val step = (progress * 8.0).toInt()
          val stepLocal = (progress * 8.0) - step
          val freq = if (step % 2 == 0) 940.0 else 1420.0
          phase1 += twoPi * freq / sampleRate
          phase2 += twoPi * (freq * 1.5) / sampleRate
          val gate = if (stepLocal < 0.78) 1.0 else 0.12
          val wave = squareFromPhase(phase1) * 0.55 + sin(phase2) * 0.35
          wave * gate * 0.85
        }

        "radar_scramble" -> {
          // Heavy Scramble Hangar Klaxon
          val sub = (progress * 4.0) - (progress * 4.0).toInt()
          val gate = if (sub < 0.72) 1.0 else 0.08
          phase1 += twoPi * 290.0 / sampleRate
          phase2 += twoPi * 580.0 / sampleRate
          val horn = sawFromPhase(phase1) * 0.58 + squareFromPhase(phase2) * 0.34
          horn * gate * 0.88
        }

        "commando_whistle" -> {
          // Sharp Commando Drill Pea Whistle with fast 26 Hz trill
          val sub = (progress * 3.0) - (progress * 3.0).toInt()
          val gate = if (sub < 0.76) 1.0 else 0.05
          val trillHz = 2650.0 + sin(twoPi * 26.0 * t) * 260.0
          phase1 += twoPi * trillHz / sampleRate
          val whistle = (sin(phase1) * 0.70 + squareFromPhase(phase1) * 0.25)
          whistle * gate * 0.82
        }

        "missile_lock" -> {
          // Target Lock Beep: Rapid accelerating fighter HUD pulses
          val rate = 6.0 + progress * 4.0
          val cycle = (t * rate) % 1.0
          val gate = if (cycle < 0.52) 1.0 else 0.05
          val freq = 1850.0 + (cycle * 240.0)
          phase1 += twoPi * freq / sampleRate
          val pulse = (squareFromPhase(phase1) * 0.65 + sin(phase1) * 0.35)
          pulse * gate * 0.85
        }

        else -> {
          phase1 += twoPi * 880.0 / sampleRate
          squareFromPhase(phase1) * 0.8
        }
      }

      val clamped = (sampleNorm * edgeFade).coerceIn(-0.98, 0.98)
      buffer[i] = (clamped * Short.MAX_VALUE).toInt().toShort()
    }
    return buffer
  }

  private fun sawFromPhase(phase: Double): Double {
    val norm = ((phase / (2.0 * PI)) % 1.0 + 1.0) % 1.0
    return norm * 2.0 - 1.0
  }

  private fun squareFromPhase(phase: Double): Double {
    return if (sin(phase) >= 0.0) 1.0 else -1.0
  }
}
