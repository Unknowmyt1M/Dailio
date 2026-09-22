package com.dailio.app.ui

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.dailio.app.R
import com.dailio.app.databinding.ActivityMainBinding
import com.dailio.app.ui.analytics.AnalyticsFragment
import com.dailio.app.ui.calendar.CalendarFragment
import com.dailio.app.ui.settings.SettingsFragment
import com.dailio.app.ui.today.TodayFragment

import android.content.Intent
import com.dailio.app.ui.onboarding.OnboardingActivity
import com.dailio.app.util.Prefs

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    private val todayFragment = TodayFragment()
    private val calendarFragment = CalendarFragment()
    private val analyticsFragment = AnalyticsFragment()
    private val settingsFragment = SettingsFragment()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val prefs = Prefs(this)
        if (!prefs.isOnboarded) {
            startActivity(Intent(this, OnboardingActivity::class.java))
            finish()
            return
        }

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        if (savedInstanceState == null) {
            loadFragment(todayFragment)
        }

        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_today -> {
                    loadFragment(todayFragment)
                    true
                }
                R.id.nav_calendar -> {
                    loadFragment(calendarFragment)
                    true
                }
                R.id.nav_analytics -> {
                    loadFragment(analyticsFragment)
                    true
                }
                R.id.nav_settings -> {
                    loadFragment(settingsFragment)
                    true
                }
                else -> false
            }
        }
    }

    private fun loadFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, fragment)
            .commit()
    }

    fun openCalendarTab() {
        binding.bottomNavigation.selectedItemId = R.id.nav_calendar
    }
}
