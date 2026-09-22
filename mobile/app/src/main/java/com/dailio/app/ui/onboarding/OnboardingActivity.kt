package com.dailio.app.ui.onboarding

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.dailio.app.DailioApplication
import com.dailio.app.databinding.ActivityOnboardingBinding
import com.dailio.app.model.DeliveryRecord
import com.dailio.app.model.ServiceItem
import com.dailio.app.ui.MainActivity
import com.dailio.app.util.DateUtils
import com.dailio.app.util.Prefs
import java.util.Calendar
import java.util.UUID

class OnboardingActivity : AppCompatActivity() {

    private lateinit var binding: ActivityOnboardingBinding
    private val repository get() = (application as DailioApplication).repository
    private lateinit var prefs: Prefs

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityOnboardingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = Prefs(this)

        binding.switchEnableMilk.setOnCheckedChangeListener { _, isChecked ->
            binding.layoutMilkDetails.visibility = if (isChecked) View.VISIBLE else View.GONE
        }

        binding.switchEnablePaper.setOnCheckedChangeListener { _, isChecked ->
            binding.layoutPaperDetails.visibility = if (isChecked) View.VISIBLE else View.GONE
        }

        binding.btnFinishOnboarding.setOnClickListener {
            completeOnboarding()
        }
    }

    private fun completeOnboarding() {
        val householdName = binding.etOnboardingHousehold.text?.toString()?.trim() ?: "Darko's Household"
        prefs.householdName = householdName.ifEmpty { "Darko's Household" }

        // Clear any old data
        val db = (application as DailioApplication).repository
        
        if (binding.switchEnableMilk.isChecked) {
            val milkName = binding.etOnboardingMilkName.text?.toString()?.trim() ?: "Amul Taaza Milk"
            val milkQty = binding.etOnboardingMilkQty.text?.toString()?.toDoubleOrNull() ?: 1.5
            val milkPrice = binding.etOnboardingMilkPrice.text?.toString()?.toDoubleOrNull() ?: 66.0

            val milkService = ServiceItem(
                id = "service_milk_1",
                name = milkName.ifEmpty { "Milk" },
                type = "milk",
                unitPrice = milkPrice,
                unit = "L",
                defaultQuantity = milkQty,
                activeDays = listOf(1, 2, 3, 4, 5, 6, 7),
                enabled = true
            )
            repository.insertService(milkService)
        }

        if (binding.switchEnablePaper.isChecked) {
            val paperName = binding.etOnboardingPaperName.text?.toString()?.trim() ?: "The Times of India"
            val paperPrice = binding.etOnboardingPaperPrice.text?.toString()?.toDoubleOrNull() ?: 5.0

            val paperService = ServiceItem(
                id = "service_newspaper_1",
                name = paperName.ifEmpty { "Newspaper" },
                type = "newspaper",
                unitPrice = paperPrice,
                unit = "copy",
                defaultQuantity = 1.0,
                activeDays = listOf(1, 2, 3, 4, 5, 6, 7),
                enabled = true
            )
            repository.insertService(paperService)
        }

        // Mark today's initial records
        val cal = Calendar.getInstance()
        val year = cal.get(Calendar.YEAR)
        val month = cal.get(Calendar.MONTH)
        val day = cal.get(Calendar.DAY_OF_MONTH)
        val todayKey = DateUtils.todayKey()

        for (d in 1..day) {
            val dateKey = DateUtils.formatDateKey(year, month, d)
            if (binding.switchEnableMilk.isChecked) {
                repository.saveDeliveryRecord(
                    DeliveryRecord(UUID.randomUUID().toString(), "service_milk_1", dateKey, "delivered", 1.5)
                )
            }
            if (binding.switchEnablePaper.isChecked) {
                repository.saveDeliveryRecord(
                    DeliveryRecord(UUID.randomUUID().toString(), "service_newspaper_1", dateKey, "delivered", 1.0)
                )
            }
        }

        prefs.isOnboarded = true
        Toast.makeText(this, "Welcome to Dailio, $householdName!", Toast.LENGTH_SHORT).show()

        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
