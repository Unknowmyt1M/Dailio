package com.dailio.app.model

data class DeliveryRecord(
    val id: String,
    val serviceId: String,
    val date: String, // "YYYY-MM-DD"
    val status: String, // "delivered", "not_delivered", "paused"
    val quantity: Double,
    val note: String = ""
)
