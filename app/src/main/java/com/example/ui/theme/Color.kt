package com.example.ui.theme

import androidx.compose.ui.graphics.Color

// Light Mode Palette (Indian Air Force Squadron Sky + Cockpit Crisp White)
val LightBg = Color(0xFFF0F5FB)
val LightSurface = Color(0xFFFFFFFF)
val LightSurfaceAlt = Color(0xFFE6EEF8)
val LightText = Color(0xFF0F172A)
val LightMuted = Color(0xFF475569)
val LightPrimary = Color(0xFF0C2340) // IAF Squadron Navy
val LightArmy = Color(0xFF0284C7) // IAF Sky Blue accent
val LightArmyContainer = Color(0xFFE0F2FE)
val LightBorder = Color(0xFFCBD5E1)

// Dark Mode Palette (Night Fighter Cockpit)
val DarkBg = Color(0xFF08101C)
val DarkSurface = Color(0xFF0F1B2D)
val DarkSurfaceAlt = Color(0xFF0B1422)
val DarkText = Color(0xFFF1F5F9)
val DarkMuted = Color(0xFF94A3B8)
val DarkPrimary = Color(0xFF38BDF8)
val DarkArmy = Color(0xFF38BDF8)
val DarkArmyContainer = Color(0x2438BDF8)
val DarkBorder = Color(0xFF1E293B)

// Shared Semantic Tokens
val BannerNavy = Color(0xFF0C2340)
val BannerArmy = Color(0xFF0284C7) // IAF Squadron Sky Blue
val SquadronSky = Color(0xFF0284C7)
val AfterburnerAmber = Color(0xFFF59E0B)
val BrandBlue = Color(0xFF0C2340)
val SuccessGreen = Color(0xFF10B981)
val WarningAmber = Color(0xFFF59E0B)
val DangerRed = Color(0xFFEF4444)
val StreakOrange = Color(0xFFEA580C)
val StreakLightBg = Color(0xFFFFF7ED)
val StreakLightBorder = Color(0xFFFED7AA)
val StreakDarkBg = Color(0x33EA580C)
val StreakDarkBorder = Color(0x66EA580C)

val PassBadgeBg = Color(0xFFD1FAE5)
val PassBadgeText = Color(0xFF065F46)
val WarnBadgeBg = Color(0xFFFEF3C7)
val WarnBadgeText = Color(0xFF92400E)
val FailBadgeBg = Color(0xFFFEE2E2)
val FailBadgeText = Color(0xFF991B1B)

fun parseColorHex(hex: String, fallback: Color = LightPrimary): Color {
  return try {
    val clean = hex.trim().removePrefix("#")
    val parsed = clean.toLong(16)
    when (clean.length) {
      6 -> Color(0xFF000000L or parsed)
      8 -> Color(parsed)
      else -> fallback
    }
  } catch (_: Exception) {
    fallback
  }
}
