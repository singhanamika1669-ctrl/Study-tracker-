package com.example.focus

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.text.TextUtils

data class InstalledAppInfo(
  val packageName: String,
  val label: String,
)

object FocusAppHelper {
  fun loadLaunchableApps(context: Context): List<InstalledAppInfo> {
    val pm = context.packageManager
    val launcherIntent = Intent(Intent.ACTION_MAIN).apply {
      addCategory(Intent.CATEGORY_LAUNCHER)
    }
    val resolveInfos = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      pm.queryIntentActivities(launcherIntent, PackageManager.ResolveInfoFlags.of(0L))
    } else {
      @Suppress("DEPRECATION")
      pm.queryIntentActivities(launcherIntent, 0)
    }

    val homePkg = getDefaultLauncherPackage(context)
    val seen = HashSet<String>()
    val apps = mutableListOf<InstalledAppInfo>()

    for (info in resolveInfos) {
      val pkg = info.activityInfo?.packageName ?: continue
      if (pkg == context.packageName || pkg == homePkg || !seen.add(pkg)) continue
      val label = info.loadLabel(pm)?.toString()?.trim().takeUnless { it.isNullOrEmpty() } ?: pkg
      apps.add(InstalledAppInfo(packageName = pkg, label = label))
    }

    return apps.sortedBy { it.label.lowercase() }
  }

  fun getAppLabel(context: Context, packageName: String): String {
    return try {
      val pm = context.packageManager
      val appInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        pm.getApplicationInfo(packageName, PackageManager.ApplicationInfoFlags.of(0L))
      } else {
        @Suppress("DEPRECATION")
        pm.getApplicationInfo(packageName, 0)
      }
      pm.getApplicationLabel(appInfo).toString()
    } catch (_: Exception) {
      packageName
    }
  }

  fun getDefaultLauncherPackage(context: Context): String? {
    val homeIntent = Intent(Intent.ACTION_MAIN).apply {
      addCategory(Intent.CATEGORY_HOME)
    }
    val res = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.packageManager.resolveActivity(homeIntent, PackageManager.ResolveInfoFlags.of(0L))
    } else {
      @Suppress("DEPRECATION")
      context.packageManager.resolveActivity(homeIntent, 0)
    }
    return res?.activityInfo?.packageName
  }

  fun isAccessibilityServiceEnabled(context: Context): Boolean {
    val expected = ComponentName(context, FocusGuardAccessibilityService::class.java).flattenToString()
    val enabledServices = Settings.Secure.getString(
      context.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
    ) ?: return false

    val splitter = TextUtils.SimpleStringSplitter(':')
    splitter.setString(enabledServices)
    while (splitter.hasNext()) {
      if (splitter.next().equals(expected, ignoreCase = true)) {
        return true
      }
    }
    return false
  }

  fun openAccessibilitySettings(context: Context) {
    val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    context.startActivity(intent)
  }

  fun launchApp(context: Context, packageName: String): Boolean {
    val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName) ?: return false
    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
    context.startActivity(launchIntent)
    return true
  }
}
