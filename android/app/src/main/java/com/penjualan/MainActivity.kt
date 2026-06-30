package com.penjualan

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.zoontek.rnbootsplash.RNBootSplash // Titik koma sudah dihapus agar standar Kotlin

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.AppTheme) // 1. Inisialisasi splash screen di baris pertama
    super.onCreate(null) // 2. Nilai null menjaga stabilitas react-navigation saat aplikasi di-restart sistem
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Penjualan"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
