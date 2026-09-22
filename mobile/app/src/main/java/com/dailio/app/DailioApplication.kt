package com.dailio.app

import android.app.Application
import androidx.appcompat.app.AppCompatDelegate
import com.dailio.app.data.DatabaseHelper
import com.dailio.app.data.Repository
import com.dailio.app.util.Prefs

class DailioApplication : Application() {

    lateinit var repository: Repository
        private set

    override fun onCreate() {
        super.onCreate()
        val prefs = Prefs(this)
        if (prefs.isDarkMode) {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)
        } else {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)
        }

        val dbHelper = DatabaseHelper(this)
        repository = Repository(dbHelper)
        repository.ensureDefaultDataSeeded()
    }
}
