package com.dailio.app.model

data class PauseRecord(
    val id: String,
    val serviceId: String, // "all" or service id
    val startDate: String, // "yyyy-MM-dd"
    val endDate: String,   // "yyyy-MM-dd"
    val reason: String = ""
)
