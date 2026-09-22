package com.dailio.app.util

import android.content.Context
import android.content.SharedPreferences

class Prefs(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("dailio_prefs", Context.MODE_PRIVATE)

    var isDarkMode: Boolean
        get() = prefs.getBoolean("dark_mode", false)
        set(value) = prefs.edit().putBoolean("dark_mode", value).apply()

    var isSeeded: Boolean
        get() = prefs.getBoolean("is_seeded_v1", false)
        set(value) = prefs.edit().putBoolean("is_seeded_v1", value).apply()
}
