package com.dailio.app.util

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

object DateUtils {

    private val dateKeyFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    private val displayDateFormat = SimpleDateFormat("EEEE, d MMM yyyy", Locale.US)
    private val monthYearFormat = SimpleDateFormat("MMMM yyyy", Locale.US)

    fun todayKey(): String {
        return dateKeyFormat.format(Date())
    }

    fun formatDateKey(year: Int, month: Int, day: Int): String {
        return String.format(Locale.US, "%04d-%02d-%02d", year, month + 1, day)
    }

    fun formatDisplayDate(dateKey: String): String {
        return try {
            val date = dateKeyFormat.parse(dateKey)
            if (date != null) displayDateFormat.format(date) else dateKey
        } catch (e: Exception) {
            dateKey
        }
    }

    fun formatMonthYear(year: Int, month: Int): String {
        val cal = Calendar.getInstance()
        cal.set(Calendar.YEAR, year)
        cal.set(Calendar.MONTH, month)
        cal.set(Calendar.DAY_OF_MONTH, 1)
        return monthYearFormat.format(cal.time)
    }

    fun getDaysInMonth(year: Int, month: Int): Int {
        val cal = Calendar.getInstance()
        cal.set(Calendar.YEAR, year)
        cal.set(Calendar.MONTH, month)
        cal.set(Calendar.DAY_OF_MONTH, 1)
        return cal.getActualMaximum(Calendar.DAY_OF_MONTH)
    }

    /**
     * Returns 0 for Monday, 1 for Tuesday ... 6 for Sunday
     */
    fun getFirstDayOfWeekOffset(year: Int, month: Int): Int {
        val cal = Calendar.getInstance()
        cal.set(Calendar.YEAR, year)
        cal.set(Calendar.MONTH, month)
        cal.set(Calendar.DAY_OF_MONTH, 1)
        val dayOfWeek = cal.get(Calendar.DAY_OF_WEEK) // 1 is Sunday, 2 is Monday
        return (dayOfWeek + 5) % 7
    }

    /**
     * Returns 1 for Monday .. 7 for Sunday
     */
    fun getDayOfWeekForDate(year: Int, month: Int, day: Int): Int {
        val cal = Calendar.getInstance()
        cal.set(Calendar.YEAR, year)
        cal.set(Calendar.MONTH, month)
        cal.set(Calendar.DAY_OF_MONTH, day)
        val dow = cal.get(Calendar.DAY_OF_WEEK) // 1=Sunday, 2=Monday, ..., 7=Saturday
        return if (dow == Calendar.SUNDAY) 7 else dow - 1
    }

    fun formatCurrency(amount: Double): String {
        return if (amount % 1.0 == 0.0) {
            String.format(Locale.US, "₹%,d", amount.toLong())
        } else {
            String.format(Locale.US, "₹%,.2f", amount)
        }
    }
}
