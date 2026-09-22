package com.dailio.app.data

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class DatabaseHelper(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        const val DATABASE_NAME = "dailio.db"
        const val DATABASE_VERSION = 1

        const val TABLE_SERVICES = "services"
        const val COL_SERVICE_ID = "id"
        const val COL_SERVICE_NAME = "name"
        const val COL_SERVICE_TYPE = "type"
        const val COL_SERVICE_UNIT_PRICE = "unit_price"
        const val COL_SERVICE_UNIT = "unit"
        const val COL_SERVICE_DEFAULT_QTY = "default_quantity"
        const val COL_SERVICE_ACTIVE_DAYS = "active_days"
        const val COL_SERVICE_ENABLED = "enabled"

        const val TABLE_DELIVERY_RECORDS = "delivery_records"
        const val COL_RECORD_ID = "id"
        const val COL_RECORD_SERVICE_ID = "service_id"
        const val COL_RECORD_DATE = "date"
        const val COL_RECORD_STATUS = "status"
        const val COL_RECORD_QUANTITY = "quantity"
        const val COL_RECORD_NOTE = "note"
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            """
            CREATE TABLE $TABLE_SERVICES (
                $COL_SERVICE_ID TEXT PRIMARY KEY,
                $COL_SERVICE_NAME TEXT NOT NULL,
                $COL_SERVICE_TYPE TEXT NOT NULL,
                $COL_SERVICE_UNIT_PRICE REAL NOT NULL,
                $COL_SERVICE_UNIT TEXT NOT NULL,
                $COL_SERVICE_DEFAULT_QTY REAL NOT NULL,
                $COL_SERVICE_ACTIVE_DAYS TEXT NOT NULL,
                $COL_SERVICE_ENABLED INTEGER NOT NULL DEFAULT 1
            )
            """.trimIndent()
        )

        db.execSQL(
            """
            CREATE TABLE $TABLE_DELIVERY_RECORDS (
                $COL_RECORD_ID TEXT PRIMARY KEY,
                $COL_RECORD_SERVICE_ID TEXT NOT NULL,
                $COL_RECORD_DATE TEXT NOT NULL,
                $COL_RECORD_STATUS TEXT NOT NULL,
                $COL_RECORD_QUANTITY REAL NOT NULL,
                $COL_RECORD_NOTE TEXT,
                UNIQUE($COL_RECORD_SERVICE_ID, $COL_RECORD_DATE)
            )
            """.trimIndent()
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_DELIVERY_RECORDS")
        db.execSQL("DROP TABLE IF EXISTS $TABLE_SERVICES")
        onCreate(db)
    }
}
