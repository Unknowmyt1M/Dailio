package com.dailio.app.model

data class ServiceItem(
    val id: String,
    val name: String,
    val type: String, // "milk", "newspaper", "other"
    val unitPrice: Double,
    val unit: String,
    val defaultQuantity: Double,
    val activeDays: List<Int>, // 1 = Monday ... 7 = Sunday
    val enabled: Boolean
) {
    fun isActiveOnDay(dayOfWeek: Int): Boolean {
        return enabled && activeDays.contains(dayOfWeek)
    }

    fun activeDaysString(): String {
        if (activeDays.size == 7) return "Mon-Sun"
        val dayNames = listOf("M", "Tu", "W", "Th", "F", "Sa", "Su")
        return activeDays.sorted().mapNotNull { if (it in 1..7) dayNames[it - 1] else null }.joinToString(", ")
    }
}
