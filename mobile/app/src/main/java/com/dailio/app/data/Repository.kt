package com.dailio.app.data

import android.content.ContentValues
import com.dailio.app.model.AnalyticsSummary
import com.dailio.app.model.DeliveryRecord
import com.dailio.app.model.ItemBreakdown
import com.dailio.app.model.ServiceItem
import com.dailio.app.model.TodayItemUiState
import com.dailio.app.util.DateUtils
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.util.Calendar
import java.util.UUID

class Repository(private val dbHelper: DatabaseHelper) {

    private val gson = Gson()

    fun getAllServices(): List<ServiceItem> {
        val list = mutableListOf<ServiceItem>()
        val db = dbHelper.readableDatabase
        val cursor = db.query(
            DatabaseHelper.TABLE_SERVICES,
            null,
            null,
            null,
            null,
            null,
            "${DatabaseHelper.COL_SERVICE_NAME} ASC"
        )
        cursor.use {
            while (it.moveToNext()) {
                val id = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_SERVICE_ID))
                val name = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_SERVICE_NAME))
                val type = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_SERVICE_TYPE))
                val price = it.getDouble(it.getColumnIndexOrThrow(DatabaseHelper.COL_SERVICE_UNIT_PRICE))
                val unit = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_SERVICE_UNIT))
                val defQty = it.getDouble(it.getColumnIndexOrThrow(DatabaseHelper.COL_SERVICE_DEFAULT_QTY))
                val daysJson = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_SERVICE_ACTIVE_DAYS))
                val enabled = it.getInt(it.getColumnIndexOrThrow(DatabaseHelper.COL_SERVICE_ENABLED)) == 1

                val activeDaysType = object : TypeToken<List<Int>>() {}.type
                val activeDays: List<Int> = try {
                    gson.fromJson(daysJson, activeDaysType) ?: listOf(1, 2, 3, 4, 5, 6, 7)
                } catch (e: Exception) {
                    listOf(1, 2, 3, 4, 5, 6, 7)
                }

                list.add(ServiceItem(id, name, type, price, unit, defQty, activeDays, enabled))
            }
        }
        return list
    }

    fun insertService(service: ServiceItem) {
        val db = dbHelper.writableDatabase
        val values = ContentValues().apply {
            put(DatabaseHelper.COL_SERVICE_ID, service.id)
            put(DatabaseHelper.COL_SERVICE_NAME, service.name)
            put(DatabaseHelper.COL_SERVICE_TYPE, service.type)
            put(DatabaseHelper.COL_SERVICE_UNIT_PRICE, service.unitPrice)
            put(DatabaseHelper.COL_SERVICE_UNIT, service.unit)
            put(DatabaseHelper.COL_SERVICE_DEFAULT_QTY, service.defaultQuantity)
            put(DatabaseHelper.COL_SERVICE_ACTIVE_DAYS, gson.toJson(service.activeDays))
            put(DatabaseHelper.COL_SERVICE_ENABLED, if (service.enabled) 1 else 0)
        }
        db.insertWithOnConflict(
            DatabaseHelper.TABLE_SERVICES,
            null,
            values,
            android.database.sqlite.SQLiteDatabase.CONFLICT_REPLACE
        )
    }

    fun updateService(service: ServiceItem) {
        insertService(service)
    }

    fun deleteService(id: String) {
        val db = dbHelper.writableDatabase
        db.delete(DatabaseHelper.TABLE_SERVICES, "${DatabaseHelper.COL_SERVICE_ID} = ?", arrayOf(id))
        db.delete(DatabaseHelper.TABLE_DELIVERY_RECORDS, "${DatabaseHelper.COL_RECORD_SERVICE_ID} = ?", arrayOf(id))
    }

    fun getRecordsForDate(date: String): List<DeliveryRecord> {
        val list = mutableListOf<DeliveryRecord>()
        val db = dbHelper.readableDatabase
        val cursor = db.query(
            DatabaseHelper.TABLE_DELIVERY_RECORDS,
            null,
            "${DatabaseHelper.COL_RECORD_DATE} = ?",
            arrayOf(date),
            null,
            null,
            null
        )
        cursor.use {
            while (it.moveToNext()) {
                val id = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_ID))
                val serviceId = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_SERVICE_ID))
                val status = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_STATUS))
                val qty = it.getDouble(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_QUANTITY))
                val note = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_NOTE)) ?: ""
                list.add(DeliveryRecord(id, serviceId, date, status, qty, note))
            }
        }
        return list
    }

    fun getRecordsForMonth(year: Int, month: Int): List<DeliveryRecord> {
        val list = mutableListOf<DeliveryRecord>()
        val prefix = String.format(java.util.Locale.US, "%04d-%02d-%%", year, month + 1)
        val db = dbHelper.readableDatabase
        val cursor = db.query(
            DatabaseHelper.TABLE_DELIVERY_RECORDS,
            null,
            "${DatabaseHelper.COL_RECORD_DATE} LIKE ?",
            arrayOf(prefix),
            null,
            null,
            "${DatabaseHelper.COL_RECORD_DATE} ASC"
        )
        cursor.use {
            while (it.moveToNext()) {
                val id = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_ID))
                val serviceId = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_SERVICE_ID))
                val date = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_DATE))
                val status = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_STATUS))
                val qty = it.getDouble(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_QUANTITY))
                val note = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_NOTE)) ?: ""
                list.add(DeliveryRecord(id, serviceId, date, status, qty, note))
            }
        }
        return list
    }

    fun saveDeliveryRecord(record: DeliveryRecord) {
        val db = dbHelper.writableDatabase
        val values = ContentValues().apply {
            put(DatabaseHelper.COL_RECORD_ID, record.id)
            put(DatabaseHelper.COL_RECORD_SERVICE_ID, record.serviceId)
            put(DatabaseHelper.COL_RECORD_DATE, record.date)
            put(DatabaseHelper.COL_RECORD_STATUS, record.status)
            put(DatabaseHelper.COL_RECORD_QUANTITY, record.quantity)
            put(DatabaseHelper.COL_RECORD_NOTE, record.note)
        }
        db.insertWithOnConflict(
            DatabaseHelper.TABLE_DELIVERY_RECORDS,
            null,
            values,
            android.database.sqlite.SQLiteDatabase.CONFLICT_REPLACE
        )
    }

    fun getTodayUiStates(date: String): List<TodayItemUiState> {
        val parts = date.split("-")
        if (parts.size != 3) return emptyList()
        val year = parts[0].toInt()
        val month = parts[1].toInt() - 1
        val day = parts[2].toInt()
        val dayOfWeek = DateUtils.getDayOfWeekForDate(year, month, day)

        val services = getAllServices().filter { it.isActiveOnDay(dayOfWeek) }
        val records = getRecordsForDate(date).associateBy { it.serviceId }

        return services.map { service ->
            val record = records[service.id]
            val effectiveStatus = record?.status ?: "delivered" // default assume delivery if not marked
            val effectiveQty = record?.quantity ?: service.defaultQuantity
            val subtotal = if (effectiveStatus == "delivered") effectiveQty * service.unitPrice else 0.0

            TodayItemUiState(
                service = service,
                record = record,
                effectiveStatus = effectiveStatus,
                effectiveQuantity = effectiveQty,
                subtotal = subtotal
            )
        }
    }

    fun toggleDeliveryStatus(service: ServiceItem, date: String) {
        val records = getRecordsForDate(date).associateBy { it.serviceId }
        val current = records[service.id]
        val currentStatus = current?.status ?: "delivered"
        val nextStatus = when (currentStatus) {
            "delivered" -> "not_delivered"
            "not_delivered" -> "paused"
            else -> "delivered"
        }
        val record = DeliveryRecord(
            id = current?.id ?: UUID.randomUUID().toString(),
            serviceId = service.id,
            date = date,
            status = nextStatus,
            quantity = current?.quantity ?: service.defaultQuantity
        )
        saveDeliveryRecord(record)
    }

    fun setDeliveryStatus(service: ServiceItem, date: String, status: String, qty: Double) {
        val records = getRecordsForDate(date).associateBy { it.serviceId }
        val current = records[service.id]
        val record = DeliveryRecord(
            id = current?.id ?: UUID.randomUUID().toString(),
            serviceId = service.id,
            date = date,
            status = status,
            quantity = qty
        )
        saveDeliveryRecord(record)
    }

    fun updateQuantity(service: ServiceItem, date: String, newQty: Double) {
        if (newQty < 0) return
        val records = getRecordsForDate(date).associateBy { it.serviceId }
        val current = records[service.id]
        val record = DeliveryRecord(
            id = current?.id ?: UUID.randomUUID().toString(),
            serviceId = service.id,
            date = date,
            status = current?.status ?: "delivered",
            quantity = newQty
        )
        saveDeliveryRecord(record)
    }

    fun markAllDelivered(date: String) {
        val states = getTodayUiStates(date)
        for (item in states) {
            val record = DeliveryRecord(
                id = item.record?.id ?: UUID.randomUUID().toString(),
                serviceId = item.service.id,
                date = date,
                status = "delivered",
                quantity = item.effectiveQuantity
            )
            saveDeliveryRecord(record)
        }
    }

    fun getTodayBill(date: String): Double {
        return getTodayUiStates(date).sumOf { it.subtotal }
    }

    fun getAnalyticsSummary(year: Int, month: Int): AnalyticsSummary {
        val services = getAllServices().filter { it.enabled }
        val records = getRecordsForMonth(year, month)
        val recordsByService = records.groupBy { it.serviceId }
        val totalDaysInMonth = DateUtils.getDaysInMonth(year, month)

        val breakdowns = mutableListOf<ItemBreakdown>()
        var totalSpent = 0.0

        for (service in services) {
            val serviceRecords = recordsByService[service.id] ?: emptyList()
            var itemQty = 0.0
            var itemDays = 0

            for (r in serviceRecords) {
                if (r.status == "delivered") {
                    itemQty += r.quantity
                    itemDays += 1
                }
            }

            val itemCost = itemQty * service.unitPrice
            totalSpent += itemCost

            breakdowns.add(
                ItemBreakdown(
                    serviceId = service.id,
                    serviceName = service.name,
                    serviceType = service.type,
                    totalQuantity = itemQty,
                    unit = service.unit,
                    deliveredDaysCount = itemDays,
                    totalCost = itemCost,
                    percentageOfTotal = 0 // Calculated below
                )
            )
        }

        val updatedBreakdowns = breakdowns.map {
            val pct = if (totalSpent > 0) ((it.totalCost / totalSpent) * 100).toInt() else 0
            it.copy(percentageOfTotal = pct)
        }

        // Calculate projections
        val cal = Calendar.getInstance()
        val currentDay = if (cal.get(Calendar.YEAR) == year && cal.get(Calendar.MONTH) == month) {
            cal.get(Calendar.DAY_OF_MONTH)
        } else {
            totalDaysInMonth
        }

        val avgDailySpent = if (currentDay > 0) totalSpent / currentDay else 0.0
        val projectedTotal = avgDailySpent * totalDaysInMonth

        val totalDeliveredDays = records.filter { it.status == "delivered" }.map { it.date }.distinct().size
        val totalPausedCount = records.filter { it.status == "paused" }.size
        val deliveryRatePercent = if (currentDay > 0) {
            val scheduledDeliveries = services.sumOf { s ->
                (1..currentDay).count { d ->
                    val dow = DateUtils.getDayOfWeekForDate(year, month, d)
                    s.isActiveOnDay(dow)
                }
            }
            val actualDelivered = records.count { it.status == "delivered" }
            if (scheduledDeliveries > 0) {
                ((actualDelivered.toDouble() / scheduledDeliveries) * 100).toInt().coerceAtMost(100)
            } else 100
        } else 100

        return AnalyticsSummary(
            period = DateUtils.formatMonthYear(year, month),
            totalSpent = totalSpent,
            projectedTotal = projectedTotal,
            deliveryRatePercent = deliveryRatePercent,
            activeDaysCount = currentDay,
            totalDaysInMonth = totalDaysInMonth,
            pausedDaysCount = totalPausedCount,
            breakdownItems = updatedBreakdowns
        )
    }

    fun ensureDefaultDataSeeded() {
        val currentServices = getAllServices()
        if (currentServices.isNotEmpty()) return
        resetToDemoData()
    }

    fun resetToDemoData() {
        val db = dbHelper.writableDatabase
        db.delete(DatabaseHelper.TABLE_DELIVERY_RECORDS, null, null)
        db.delete(DatabaseHelper.TABLE_SERVICES, null, null)

        val milk = ServiceItem(
            id = "service_milk_1",
            name = "Amul Taaza Milk",
            type = "milk",
            unitPrice = 66.0,
            unit = "L",
            defaultQuantity = 1.0,
            activeDays = listOf(1, 2, 3, 4, 5, 6, 7),
            enabled = true
        )
        val newspaper = ServiceItem(
            id = "service_newspaper_1",
            name = "The Times of India",
            type = "newspaper",
            unitPrice = 5.0,
            unit = "copy",
            defaultQuantity = 1.0,
            activeDays = listOf(1, 2, 3, 4, 5, 6, 7),
            enabled = true
        )
        val bread = ServiceItem(
            id = "service_bread_1",
            name = "Harvest Brown Bread",
            type = "other",
            unitPrice = 45.0,
            unit = "pack",
            defaultQuantity = 1.0,
            activeDays = listOf(1, 3, 5), // Mon, Wed, Fri
            enabled = true
        )

        insertService(milk)
        insertService(newspaper)
        insertService(bread)

        // Seed demo deliveries for current month up to today
        val cal = Calendar.getInstance()
        val year = cal.get(Calendar.YEAR)
        val month = cal.get(Calendar.MONTH)
        val todayDay = cal.get(Calendar.DAY_OF_MONTH)

        for (day in 1..todayDay) {
            val dateKey = DateUtils.formatDateKey(year, month, day)
            val dow = DateUtils.getDayOfWeekForDate(year, month, day)

            // Milk delivered every day (with 1 paused day for realism)
            if (day == 8) {
                saveDeliveryRecord(DeliveryRecord(UUID.randomUUID().toString(), milk.id, dateKey, "paused", 0.0, "Out of station"))
            } else {
                saveDeliveryRecord(DeliveryRecord(UUID.randomUUID().toString(), milk.id, dateKey, "delivered", 1.0))
            }

            // Newspaper delivered every day
            saveDeliveryRecord(DeliveryRecord(UUID.randomUUID().toString(), newspaper.id, dateKey, "delivered", 1.0))

            // Bread delivered on active days
            if (bread.isActiveOnDay(dow)) {
                saveDeliveryRecord(DeliveryRecord(UUID.randomUUID().toString(), bread.id, dateKey, "delivered", 1.0))
            }
        }
    }
}
