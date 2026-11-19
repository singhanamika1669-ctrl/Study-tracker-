package com.example.focus

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.view.inputmethod.InputMethodManager
import com.example.data.FocusGuardPrefs

class FocusGuardAccessibilityService : AccessibilityService() {

  private var lastBlockedPkg: String? = null
  private var lastBlockedAtMs: Long = 0L

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val pkg = event.packageName?.toString()?.takeIf { it.isNotBlank() } ?: return

    val config = FocusGuardPrefs.read(this)
    if (!config.enabled) return

    val endTs = config.endTimestampMs
    if (endTs != null && System.currentTimeMillis() >= endTs) {
      FocusGuardPrefs.sync(this, config.copy(enabled = false, endTimestampMs = null))
      return
    }

    if (isAlwaysAllowedSystemPackage(pkg) || config.allowedPackages.contains(pkg)) {
      return
    }

    val now = System.currentTimeMillis()
    if (pkg == lastBlockedPkg && now - lastBlockedAtMs < 650L) {
      return
    }
    lastBlockedPkg = pkg
    lastBlockedAtMs = now

    val blockIntent = Intent(this, FocusBlockedActivity::class.java).apply {
      addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_CLEAR_TOP or
          Intent.FLAG_ACTIVITY_SINGLE_TOP
      )
      putExtra(FocusBlockedActivity.EXTRA_BLOCKED_PACKAGE, pkg)
    }
    startActivity(blockIntent)
  }

  override fun onInterrupt() {
    // No-op
  }

  private fun isAlwaysAllowedSystemPackage(pkg: String): Boolean {
    if (pkg == packageName) return true
    if (pkg == FocusAppHelper.getDefaultLauncherPackage(this)) return true
    if (SYSTEM_SAFE_PACKAGES.contains(pkg)) return true

    val imm = getSystemService(INPUT_METHOD_SERVICE) as? InputMethodManager
    val isIme = imm?.enabledInputMethodList?.any { it.packageName == pkg } == true
    return isIme
  }

  companion object {
    private val SYSTEM_SAFE_PACKAGES = setOf(
      "android",
      "com.android.systemui",
      "com.android.dialer",
      "com.google.android.dialer",
      "com.android.incallui",
      "com.samsung.android.incallui",
      "com.android.permissioncontroller",
      "com.google.android.permissioncontroller",
      "com.android.packageinstaller",
      "com.google.android.packageinstaller",
    )
  }
}
