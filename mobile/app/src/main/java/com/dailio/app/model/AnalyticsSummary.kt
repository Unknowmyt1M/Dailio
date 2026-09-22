package com.dailio.app.model

data class ItemBreakdown(
    val serviceId: String,
    val serviceName: String,
    val serviceType: String,
    val totalQuantity: Double,
    val unit: String,
    val deliveredDaysCount: Int,
    val totalCost: Double,
    val percentageOfTotal: Int
)

data class AnalyticsSummary(
    val period: String,
    val totalSpent: Double,
    val projectedTotal: Double,
    val deliveryRatePercent: Int,
    val activeDaysCount: Int,
    val totalDaysInMonth: Int,
    val pausedDaysCount: Int,
    val breakdownItems: List<ItemBreakdown>
)
