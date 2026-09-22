package com.dailio.app.data

import android.content.ContentValues
import com.dailio.app.model.AnalyticsSummary
import com.dailio.app.model.DeliveryRecord
import com.dailio.app.model.ItemBreakdown
import com.dailio.app.model.PauseRecord
import com.dailio.app.model.PaymentRecord
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

        // Payments calculation
        val periodKey = String.format(java.util.Locale.US, "%04d-%02d", year, month + 1)
        val payments = getPaymentsForPeriod(periodKey)
        val totalPaid = payments.sumOf { it.amount }
        val balanceDue = (totalSpent - totalPaid).coerceAtLeast(0.0)

        return AnalyticsSummary(
            period = DateUtils.formatMonthYear(year, month),
            totalSpent = totalSpent,
            projectedTotal = projectedTotal,
            totalPaid = totalPaid,
            balanceDue = balanceDue,
            deliveryRatePercent = deliveryRatePercent,
            activeDaysCount = currentDay,
            totalDaysInMonth = totalDaysInMonth,
            pausedDaysCount = totalPausedCount,
            breakdownItems = updatedBreakdowns,
            payments = payments
        )
    }

    // --- PAYMENTS MANAGEMENT ---
    fun getPaymentsForPeriod(period: String): List<PaymentRecord> {
        val list = mutableListOf<PaymentRecord>()
        val db = dbHelper.readableDatabase
        val cursor = db.query(
            DatabaseHelper.TABLE_PAYMENTS,
            null,
            "${DatabaseHelper.COL_PAYMENT_PERIOD} = ?",
            arrayOf(period),
            null,
            null,
            "${DatabaseHelper.COL_PAYMENT_DATE} DESC"
        )
        cursor.use {
            while (it.moveToNext()) {
                val id = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAYMENT_ID))
                val p = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAYMENT_PERIOD))
                val amount = it.getDouble(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAYMENT_AMOUNT))
                val date = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAYMENT_DATE))
                val method = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAYMENT_METHOD))
                val note = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAYMENT_NOTE)) ?: ""
                list.add(PaymentRecord(id, p, amount, date, method, note))
            }
        }
        return list
    }

    fun savePayment(payment: PaymentRecord) {
        val db = dbHelper.writableDatabase
        val values = ContentValues().apply {
            put(DatabaseHelper.COL_PAYMENT_ID, payment.id)
            put(DatabaseHelper.COL_PAYMENT_PERIOD, payment.period)
            put(DatabaseHelper.COL_PAYMENT_AMOUNT, payment.amount)
            put(DatabaseHelper.COL_PAYMENT_DATE, payment.date)
            put(DatabaseHelper.COL_PAYMENT_METHOD, payment.method)
            put(DatabaseHelper.COL_PAYMENT_NOTE, payment.note)
        }
        db.insertWithOnConflict(
            DatabaseHelper.TABLE_PAYMENTS,
            null,
            values,
            android.database.sqlite.SQLiteDatabase.CONFLICT_REPLACE
        )
    }

    fun deletePayment(paymentId: String) {
        val db = dbHelper.writableDatabase
        db.delete(DatabaseHelper.TABLE_PAYMENTS, "${DatabaseHelper.COL_PAYMENT_ID} = ?", arrayOf(paymentId))
    }

    // --- PAUSES & VACATION MANAGEMENT ---
    fun getAllPauses(): List<PauseRecord> {
        val list = mutableListOf<PauseRecord>()
        val db = dbHelper.readableDatabase
        val cursor = db.query(
            DatabaseHelper.TABLE_PAUSES,
            null,
            null,
            null,
            null,
            null,
            "${DatabaseHelper.COL_PAUSE_START_DATE} DESC"
        )
        cursor.use {
            while (it.moveToNext()) {
                val id = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAUSE_ID))
                val serviceId = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAUSE_SERVICE_ID))
                val start = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAUSE_START_DATE))
                val end = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAUSE_END_DATE))
                val reason = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAUSE_REASON)) ?: ""
                list.add(PauseRecord(id, serviceId, start, end, reason))
            }
        }
        return list
    }

    fun savePause(pause: PauseRecord) {
        val db = dbHelper.writableDatabase
        val values = ContentValues().apply {
            put(DatabaseHelper.COL_PAUSE_ID, pause.id)
            put(DatabaseHelper.COL_PAUSE_SERVICE_ID, pause.serviceId)
            put(DatabaseHelper.COL_PAUSE_START_DATE, pause.startDate)
            put(DatabaseHelper.COL_PAUSE_END_DATE, pause.endDate)
            put(DatabaseHelper.COL_PAUSE_REASON, pause.reason)
        }
        db.insertWithOnConflict(
            DatabaseHelper.TABLE_PAUSES,
            null,
            values,
            android.database.sqlite.SQLiteDatabase.CONFLICT_REPLACE
        )

        // Apply paused status to records in this range
        val targetServices = if (pause.serviceId == "all") getAllServices() else getAllServices().filter { it.id == pause.serviceId }
        val startParts = pause.startDate.split("-").map { it.toInt() }
        val endParts = pause.endDate.split("-").map { it.toInt() }

        val startCal = Calendar.getInstance().apply {
            set(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0)
        }
        val endCal = Calendar.getInstance().apply {
            set(endParts[0], endParts[1] - 1, endParts[2], 0, 0, 0)
        }

        while (!startCal.after(endCal)) {
            val dateKey = DateUtils.formatDateKey(
                startCal.get(Calendar.YEAR),
                startCal.get(Calendar.MONTH),
                startCal.get(Calendar.DAY_OF_MONTH)
            )
            for (service in targetServices) {
                saveDeliveryRecord(
                    DeliveryRecord(
                        id = UUID.randomUUID().toString(),
                        serviceId = service.id,
                        date = dateKey,
                        status = "paused",
                        quantity = 0.0,
                        note = if (pause.reason.isEmpty()) "Vacation" else pause.reason
                    )
                )
            }
            startCal.add(Calendar.DAY_OF_MONTH, 1)
        }
    }

    fun deletePause(pauseId: String) {
        val db = dbHelper.writableDatabase
        db.delete(DatabaseHelper.TABLE_PAUSES, "${DatabaseHelper.COL_PAUSE_ID} = ?", arrayOf(pauseId))
    }

    // --- BULK LOGGING ---
    fun bulkUpdateRecords(startDate: String, endDate: String, targetServiceId: String?, status: String, qty: Double) {
        val targetServices = if (targetServiceId == null || targetServiceId == "all") {
            getAllServices()
        } else {
            getAllServices().filter { it.id == targetServiceId }
        }

        val startParts = startDate.split("-").map { it.toInt() }
        val endParts = endDate.split("-").map { it.toInt() }

        val startCal = Calendar.getInstance().apply {
            set(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0)
        }
        val endCal = Calendar.getInstance().apply {
            set(endParts[0], endParts[1] - 1, endParts[2], 0, 0, 0)
        }

        while (!startCal.after(endCal)) {
            val dateKey = DateUtils.formatDateKey(
                startCal.get(Calendar.YEAR),
                startCal.get(Calendar.MONTH),
                startCal.get(Calendar.DAY_OF_MONTH)
            )
            val dow = DateUtils.getDayOfWeekForDate(
                startCal.get(Calendar.YEAR),
                startCal.get(Calendar.MONTH),
                startCal.get(Calendar.DAY_OF_MONTH)
            )

            for (service in targetServices) {
                if (service.isActiveOnDay(dow)) {
                    val finalQty = if (status == "delivered") {
                        if (qty > 0) qty else service.defaultQuantity
                    } else 0.0

                    saveDeliveryRecord(
                        DeliveryRecord(
                            id = UUID.randomUUID().toString(),
                            serviceId = service.id,
                            date = dateKey,
                            status = status,
                            quantity = finalQty
                        )
                    )
                }
            }
            startCal.add(Calendar.DAY_OF_MONTH, 1)
        }
    }

    // --- DATA BACKUP / EXPORT & RESTORE ---
    data class BackupData(
        val services: List<ServiceItem>,
        val records: List<DeliveryRecord>,
        val payments: List<PaymentRecord>,
        val pauses: List<PauseRecord>
    )

    fun exportBackupJson(): String {
        val allServices = getAllServices()
        val allRecords = mutableListOf<DeliveryRecord>()
        val db = dbHelper.readableDatabase
        val cursor = db.query(DatabaseHelper.TABLE_DELIVERY_RECORDS, null, null, null, null, null, null)
        cursor.use {
            while (it.moveToNext()) {
                allRecords.add(
                    DeliveryRecord(
                        id = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_ID)),
                        serviceId = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_SERVICE_ID)),
                        date = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_DATE)),
                        status = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_STATUS)),
                        quantity = it.getDouble(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_QUANTITY)),
                        note = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_RECORD_NOTE)) ?: ""
                    )
                )
            }
        }
        val allPayments = mutableListOf<PaymentRecord>()
        val payCursor = db.query(DatabaseHelper.TABLE_PAYMENTS, null, null, null, null, null, null)
        payCursor.use {
            while (it.moveToNext()) {
                allPayments.add(
                    PaymentRecord(
                        id = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAYMENT_ID)),
                        period = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAYMENT_PERIOD)),
                        amount = it.getDouble(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAYMENT_AMOUNT)),
                        date = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAYMENT_DATE)),
                        method = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAYMENT_METHOD)),
                        note = it.getString(it.getColumnIndexOrThrow(DatabaseHelper.COL_PAYMENT_NOTE)) ?: ""
                    )
                )
            }
        }
        val allPauses = getAllPauses()

        val backup = BackupData(allServices, allRecords, allPayments, allPauses)
        return gson.toJson(backup)
    }

    fun importBackupJson(jsonStr: String): Boolean {
        return try {
            val backup = gson.fromJson(jsonStr, BackupData::class.java) ?: return false
            val db = dbHelper.writableDatabase
            db.delete(DatabaseHelper.TABLE_DELIVERY_RECORDS, null, null)
            db.delete(DatabaseHelper.TABLE_SERVICES, null, null)
            db.delete(DatabaseHelper.TABLE_PAYMENTS, null, null)
            db.delete(DatabaseHelper.TABLE_PAUSES, null, null)

            backup.services.forEach { insertService(it) }
            backup.records.forEach { saveDeliveryRecord(it) }
            backup.payments.forEach { savePayment(it) }
            backup.pauses.forEach { savePause(it) }
            true
        } catch (e: Exception) {
            false
        }
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
        db.delete(DatabaseHelper.TABLE_PAYMENTS, null, null)
        db.delete(DatabaseHelper.TABLE_PAUSES, null, null)

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

            if (day == 8) {
                saveDeliveryRecord(DeliveryRecord(UUID.randomUUID().toString(), milk.id, dateKey, "paused", 0.0, "Out of station"))
            } else {
                saveDeliveryRecord(DeliveryRecord(UUID.randomUUID().toString(), milk.id, dateKey, "delivered", 1.0))
            }

            saveDeliveryRecord(DeliveryRecord(UUID.randomUUID().toString(), newspaper.id, dateKey, "delivered", 1.0))

            if (bread.isActiveOnDay(dow)) {
                saveDeliveryRecord(DeliveryRecord(UUID.randomUUID().toString(), bread.id, dateKey, "delivered", 1.0))
            }
        }

        // Seed a sample payment
        val periodKey = String.format(java.util.Locale.US, "%04d-%02d", year, month + 1)
        savePayment(
            PaymentRecord(
                id = UUID.randomUUID().toString(),
                period = periodKey,
                amount = 1000.0,
                date = DateUtils.formatDateKey(year, month, 15),
                method = "UPI",
                note = "Advance via GPay"
            )
        )
    }
}
