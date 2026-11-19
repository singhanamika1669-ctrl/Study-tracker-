package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

@Immutable
data class PadhaiExtendedColors(
  val isDark: Boolean,
  val cardBackground: Color,
  val innerBackground: Color,
  val textPrimary: Color,
  val textMuted: Color,
  val primaryAccent: Color,
  val armyAccent: Color,
  val armyContainer: Color,
  val border: Color,
  val streakBg: Color,
  val streakBorder: Color,
  val streakText: Color,
)

val LocalPadhaiColors = staticCompositionLocalOf {
  PadhaiExtendedColors(
    isDark = false,
    cardBackground = LightSurface,
    innerBackground = LightBg,
    textPrimary = LightText,
    textMuted = LightMuted,
    primaryAccent = LightPrimary,
    armyAccent = LightArmy,
    armyContainer = LightArmyContainer,
    border = LightBorder,
    streakBg = StreakLightBg,
    streakBorder = StreakLightBorder,
    streakText = StreakOrange,
  )
}

private val LightColorScheme = lightColorScheme(
  primary = LightPrimary,
  onPrimary = Color.White,
  secondary = LightArmy,
  onSecondary = Color.White,
  tertiary = WarningAmber,
  background = LightBg,
  onBackground = LightText,
  surface = LightSurface,
  onSurface = LightText,
  surfaceVariant = LightSurfaceAlt,
  onSurfaceVariant = LightMuted,
  outline = LightBorder,
  error = DangerRed,
  onError = Color.White,
)

private val DarkColorScheme = darkColorScheme(
  primary = DarkPrimary,
  onPrimary = DarkBg,
  secondary = DarkArmy,
  onSecondary = DarkBg,
  tertiary = WarningAmber,
  background = DarkBg,
  onBackground = DarkText,
  surface = DarkSurface,
  onSurface = DarkText,
  surfaceVariant = DarkSurfaceAlt,
  onSurfaceVariant = DarkMuted,
  outline = DarkBorder,
  error = DangerRed,
  onError = Color.White,
)

@Composable
fun PadhaiProTheme(
  darkTheme: Boolean,
  content: @Composable () -> Unit,
) {
  val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
  val extendedColors = if (darkTheme) {
    PadhaiExtendedColors(
      isDark = true,
      cardBackground = DarkSurface,
      innerBackground = DarkBg,
      textPrimary = DarkText,
      textMuted = DarkMuted,
      primaryAccent = DarkPrimary,
      armyAccent = DarkArmy,
      armyContainer = DarkArmyContainer,
      border = DarkBorder,
      streakBg = StreakDarkBg,
      streakBorder = StreakDarkBorder,
      streakText = StreakOrange,
    )
  } else {
    PadhaiExtendedColors(
      isDark = false,
      cardBackground = LightSurface,
      innerBackground = LightBg,
      textPrimary = LightText,
      textMuted = LightMuted,
      primaryAccent = LightPrimary,
      armyAccent = LightArmy,
      armyContainer = LightArmyContainer,
      border = LightBorder,
      streakBg = StreakLightBg,
      streakBorder = StreakLightBorder,
      streakText = StreakOrange,
    )
  }

  CompositionLocalProvider(LocalPadhaiColors provides extendedColors) {
    MaterialTheme(
      colorScheme = colorScheme,
      typography = Typography,
      content = content,
    )
  }
}
