package com.dailio.app.model

data class TodayItemUiState(
    val service: ServiceItem,
    val record: DeliveryRecord?,
    val effectiveStatus: String, // "delivered", "paused", "pending"
    val effectiveQuantity: Double,
    val subtotal: Double
)
