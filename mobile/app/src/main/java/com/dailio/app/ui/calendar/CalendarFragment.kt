package com.dailio.app.ui.calendar

import android.content.res.ColorStateList
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.GridLayoutManager
import com.dailio.app.DailioApplication
import com.dailio.app.R
import com.dailio.app.databinding.DialogBulkEntryBinding
import com.dailio.app.databinding.DialogRetroDeliveryBinding
import com.dailio.app.databinding.DialogVacationPauseBinding
import com.dailio.app.databinding.FragmentCalendarBinding
import com.dailio.app.databinding.ItemCalendarDayEntryBinding
import com.dailio.app.model.DeliveryRecord
import com.dailio.app.model.PauseRecord
import com.dailio.app.model.ServiceItem
import com.dailio.app.util.DateUtils
import android.widget.Toast
import java.util.Calendar
import java.util.Locale
import java.util.UUID

class CalendarFragment : Fragment() {

    private var _binding: FragmentCalendarBinding? = null
    private val binding get() = _binding!!

    private lateinit var dayAdapter: CalendarDayAdapter
    private val repository get() = (requireActivity().application as DailioApplication).repository

    private var currentYear: Int = 0
    private var currentMonth: Int = 0
    private var selectedDay: Int = 1

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCalendarBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val cal = Calendar.getInstance()
        currentYear = cal.get(Calendar.YEAR)
        currentMonth = cal.get(Calendar.MONTH)
        selectedDay = cal.get(Calendar.DAY_OF_MONTH)

        setupCalendarGrid()
        setupListeners()
        renderCalendar()
    }

    override fun onResume() {
        super.onResume()
        renderCalendar()
    }

    private fun setupCalendarGrid() {
        dayAdapter = CalendarDayAdapter { day ->
            selectedDay = day
            renderCalendar()
        }
        binding.rvCalendarGrid.layoutManager = GridLayoutManager(requireContext(), 7)
        binding.rvCalendarGrid.adapter = dayAdapter
    }

    private fun setupListeners() {
        binding.btnPrevMonth.setOnClickListener {
            if (currentMonth == 0) {
                currentMonth = 11
                currentYear -= 1
            } else {
                currentMonth -= 1
            }
            selectedDay = 1
            renderCalendar()
        }

        binding.btnNextMonth.setOnClickListener {
            if (currentMonth == 11) {
                currentMonth = 0
                currentYear += 1
            } else {
                currentMonth += 1
            }
            selectedDay = 1
            renderCalendar()
        }

        binding.btnEditDayRetro.setOnClickListener {
            showRetroactiveEditDialog()
        }

        binding.btnBulkLog.setOnClickListener {
            showBulkLogDialog()
        }

        binding.btnVacationPause.setOnClickListener {
            showVacationPauseDialog()
        }
    }

    private fun showBulkLogDialog() {
        val dialogBinding = DialogBulkEntryBinding.inflate(layoutInflater)
        dialogBinding.etBulkStartDay.setText("1")
        dialogBinding.etBulkEndDay.setText(selectedDay.toString())

        val daysInMonth = DateUtils.getDaysInMonth(currentYear, currentMonth)

        AlertDialog.Builder(requireContext())
            .setView(dialogBinding.root)
            .setPositiveButton("Apply") { _, _ ->
                val start = dialogBinding.etBulkStartDay.text?.toString()?.toIntOrNull() ?: 1
                val end = dialogBinding.etBulkEndDay.text?.toString()?.toIntOrNull() ?: selectedDay

                val validStart = start.coerceIn(1, daysInMonth)
                val validEnd = end.coerceIn(validStart, daysInMonth)

                val status = when (dialogBinding.rgBulkStatus.checkedRadioButtonId) {
                    dialogBinding.rbBulkMissed.id -> "not_delivered"
                    dialogBinding.rbBulkPaused.id -> "paused"
                    else -> "delivered"
                }

                val startDateKey = DateUtils.formatDateKey(currentYear, currentMonth, validStart)
                val endDateKey = DateUtils.formatDateKey(currentYear, currentMonth, validEnd)

                repository.bulkUpdateRecords(startDateKey, endDateKey, "all", status, 0.0)
                renderCalendar()
                Toast.makeText(requireContext(), "Bulk update applied ($validStart to $validEnd)!", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showVacationPauseDialog() {
        val dialogBinding = DialogVacationPauseBinding.inflate(layoutInflater)
        val daysInMonth = DateUtils.getDaysInMonth(currentYear, currentMonth)

        dialogBinding.etPauseStartDay.setText(selectedDay.toString())
        dialogBinding.etPauseEndDay.setText((selectedDay + 2).coerceAtMost(daysInMonth).toString())

        AlertDialog.Builder(requireContext())
            .setView(dialogBinding.root)
            .setPositiveButton("Schedule Pause") { _, _ ->
                val start = dialogBinding.etPauseStartDay.text?.toString()?.toIntOrNull() ?: selectedDay
                val end = dialogBinding.etPauseEndDay.text?.toString()?.toIntOrNull() ?: (selectedDay + 2)

                val validStart = start.coerceIn(1, daysInMonth)
                val validEnd = end.coerceIn(validStart, daysInMonth)
                val reason = dialogBinding.etPauseReason.text?.toString()?.trim() ?: "Vacation"

                val startDateKey = DateUtils.formatDateKey(currentYear, currentMonth, validStart)
                val endDateKey = DateUtils.formatDateKey(currentYear, currentMonth, validEnd)

                val pause = PauseRecord(
                    id = UUID.randomUUID().toString(),
                    serviceId = "all",
                    startDate = startDateKey,
                    endDate = endDateKey,
                    reason = reason
                )
                repository.savePause(pause)
                renderCalendar()
                Toast.makeText(requireContext(), "Deliveries paused for $reason ($validStart to $validEnd)", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun renderCalendar() {
        binding.tvCalendarMonthYear.text = DateUtils.formatMonthYear(currentYear, currentMonth)

        val daysInMonth = DateUtils.getDaysInMonth(currentYear, currentMonth)
        val offset = DateUtils.getFirstDayOfWeekOffset(currentYear, currentMonth)

        val cal = Calendar.getInstance()
        val isCurrentYearAndMonth = (cal.get(Calendar.YEAR) == currentYear && cal.get(Calendar.MONTH) == currentMonth)
        val todayNum = if (isCurrentYearAndMonth) cal.get(Calendar.DAY_OF_MONTH) else -1

        val records = repository.getRecordsForMonth(currentYear, currentMonth)
        val recordsByDay = records.groupBy {
            val parts = it.date.split("-")
            if (parts.size == 3) parts[2].toInt() else 0
        }

        val dayList = mutableListOf<CalendarDayModel>()

        // Leading empty padding
        for (i in 0 until offset) {
            dayList.add(CalendarDayModel(0, isToday = false, isSelected = false, hasDelivered = false, hasPaused = false))
        }

        // Real days
        for (d in 1..daysInMonth) {
            val dayRecords = recordsByDay[d] ?: emptyList()
            val hasDelivered = dayRecords.any { it.status == "delivered" }
            val hasPaused = dayRecords.any { it.status == "paused" }
            val isToday = (d == todayNum)
            val isSelected = (d == selectedDay)

            dayList.add(CalendarDayModel(d, isToday, isSelected, hasDelivered, hasPaused))
        }

        dayAdapter.submitDays(dayList)
        renderSelectedDayDetails()
    }

    private fun renderSelectedDayDetails() {
        val selectedDateKey = DateUtils.formatDateKey(currentYear, currentMonth, selectedDay)
        binding.tvSelectedDateTitle.text = DateUtils.formatDisplayDate(selectedDateKey)

        val dow = DateUtils.getDayOfWeekForDate(currentYear, currentMonth, selectedDay)
        val activeServices = repository.getAllServices().filter { it.isActiveOnDay(dow) }
        val records = repository.getRecordsForDate(selectedDateKey).associateBy { it.serviceId }

        binding.layoutSelectedDayEntries.removeAllViews()

        var dayTotal = 0.0

        for (service in activeServices) {
            val record = records[service.id]
            val effectiveStatus = record?.status ?: "delivered"
            val qty = record?.quantity ?: service.defaultQuantity
            val cost = if (effectiveStatus == "delivered") qty * service.unitPrice else 0.0
            dayTotal += cost

            val entryBinding = ItemCalendarDayEntryBinding.inflate(
                LayoutInflater.from(requireContext()),
                binding.layoutSelectedDayEntries,
                false
            )

            entryBinding.tvEntryName.text = service.name
            entryBinding.tvEntryQtyPrice.text = "$qty ${service.unit} • ${DateUtils.formatCurrency(cost)}"

            when (service.type.lowercase(Locale.US)) {
                "milk" -> entryBinding.ivEntryIcon.setImageResource(R.drawable.ic_milk)
                "newspaper" -> entryBinding.ivEntryIcon.setImageResource(R.drawable.ic_newspaper)
                else -> entryBinding.ivEntryIcon.setImageResource(R.drawable.ic_package)
            }

            when (effectiveStatus) {
                "delivered" -> {
                    entryBinding.btnEntryStatus.text = "Delivered"
                    entryBinding.btnEntryStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_delivered))
                    entryBinding.btnEntryStatus.backgroundTintList = ColorStateList.valueOf(
                        ContextCompat.getColor(requireContext(), R.color.status_delivered_bg)
                    )
                }
                "paused" -> {
                    entryBinding.btnEntryStatus.text = "Paused"
                    entryBinding.btnEntryStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_paused))
                    entryBinding.btnEntryStatus.backgroundTintList = ColorStateList.valueOf(
                        ContextCompat.getColor(requireContext(), R.color.status_paused_bg)
                    )
                }
                else -> {
                    entryBinding.btnEntryStatus.text = "Not Delivered"
                    entryBinding.btnEntryStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.status_missed))
                    entryBinding.btnEntryStatus.backgroundTintList = ColorStateList.valueOf(
                        ContextCompat.getColor(requireContext(), R.color.status_missed_bg)
                    )
                }
            }

            // Clicking toggles directly
            entryBinding.btnEntryStatus.setOnClickListener {
                val nextStatus = when (effectiveStatus) {
                    "delivered" -> "not_delivered"
                    "not_delivered" -> "paused"
                    else -> "delivered"
                }
                repository.setDeliveryStatus(service, selectedDateKey, nextStatus, qty)
                renderCalendar()
            }

            binding.layoutSelectedDayEntries.addView(entryBinding.root)
        }

        binding.tvSelectedDayTotal.text = "Day Total: ${DateUtils.formatCurrency(dayTotal)}"
    }

    private fun showRetroactiveEditDialog() {
        val selectedDateKey = DateUtils.formatDateKey(currentYear, currentMonth, selectedDay)
        val dow = DateUtils.getDayOfWeekForDate(currentYear, currentMonth, selectedDay)
        val activeServices = repository.getAllServices().filter { it.isActiveOnDay(dow) }

        if (activeServices.isEmpty()) return

        val primaryService = activeServices.first()
        val records = repository.getRecordsForDate(selectedDateKey).associateBy { it.serviceId }
        val currentRecord = records[primaryService.id]

        val dialogBinding = DialogRetroDeliveryBinding.inflate(layoutInflater)
        dialogBinding.tvRetroTitle.text = "Update for ${primaryService.name}"
        dialogBinding.tvRetroSubtitle.text = DateUtils.formatDisplayDate(selectedDateKey)

        val currentStatus = currentRecord?.status ?: "delivered"
        when (currentStatus) {
            "delivered" -> dialogBinding.rbDelivered.isChecked = true
            "paused" -> dialogBinding.rbPaused.isChecked = true
            else -> dialogBinding.rbNotDelivered.isChecked = true
        }

        val currentQty = currentRecord?.quantity ?: primaryService.defaultQuantity
        dialogBinding.etRetroQty.setText(currentQty.toString())

        AlertDialog.Builder(requireContext())
            .setView(dialogBinding.root)
            .setPositiveButton("Save") { _, _ ->
                val chosenStatus = when {
                    dialogBinding.rbDelivered.isChecked -> "delivered"
                    dialogBinding.rbPaused.isChecked -> "paused"
                    else -> "not_delivered"
                }
                val qty = dialogBinding.etRetroQty.text.toString().toDoubleOrNull() ?: primaryService.defaultQuantity
                repository.setDeliveryStatus(primaryService, selectedDateKey, chosenStatus, qty)
                renderCalendar()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
