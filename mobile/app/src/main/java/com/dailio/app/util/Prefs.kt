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

    var householdName: String
        get() = prefs.getString("household_name", "Darko's Household") ?: "Darko's Household"
        set(value) = prefs.edit().putString("household_name", value).apply()

    var vendorContact: String
        get() = prefs.getString("vendor_contact", "") ?: ""
        set(value) = prefs.edit().putString("vendor_contact", value).apply()

    var isOnboarded: Boolean
        get() = prefs.getBoolean("is_onboarded", false)
        set(value) = prefs.edit().putBoolean("is_onboarded", value).apply()
}
