package com.dailio.app.model

data class PaymentRecord(
    val id: String,
    val period: String, // e.g. "2026-09"
    val amount: Double,
    val date: String,   // e.g. "2026-09-15"
    val method: String, // "UPI", "Cash", "Bank"
    val note: String = ""
)
