package com.dailio.app.ui.today

import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.dailio.app.DailioApplication
import com.dailio.app.R
import com.dailio.app.databinding.FragmentTodayBinding
import com.dailio.app.ui.MainActivity
import com.dailio.app.util.DateUtils
import com.dailio.app.util.Prefs
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class TodayFragment : Fragment() {

    private var _binding: FragmentTodayBinding? = null
    private val binding get() = _binding!!

    private lateinit var adapter: TodayAdapter
    private val repository get() = (requireActivity().application as DailioApplication).repository
    private lateinit var prefs: Prefs

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentTodayBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        prefs = Prefs(requireContext())

        setupRecyclerView()
        setupListeners()
        loadTodayData()
    }

    override fun onResume() {
        super.onResume()
        loadTodayData()
    }

    private fun setupRecyclerView() {
        adapter = TodayAdapter(
            onQuantityChanged = { item, newQty ->
                repository.setDeliveryStatus(
                    item.service,
                    DateUtils.todayKey(),
                    "delivered",
                    newQty
                )
                loadTodayData()
            },
            onToggleDelivered = { item ->
                val nextStatus = if (item.effectiveStatus == "delivered") "not_delivered" else "delivered"
                repository.setDeliveryStatus(
                    item.service,
                    DateUtils.todayKey(),
                    nextStatus,
                    item.effectiveQuantity
                )
                loadTodayData()
            },
            onToggleMissed = { item ->
                val nextStatus = if (item.effectiveStatus == "not_delivered") "delivered" else "not_delivered"
                repository.setDeliveryStatus(
                    item.service,
                    DateUtils.todayKey(),
                    nextStatus,
                    0.0
                )
                loadTodayData()
            }
        )

        binding.rvTodaySubscriptions.layoutManager = LinearLayoutManager(requireContext())
        binding.rvTodaySubscriptions.adapter = adapter
    }

    private fun setupListeners() {
        binding.btnMarkAllDelivered.setOnClickListener {
            repository.markAllDelivered(DateUtils.todayKey())
            loadTodayData()
        }

        binding.btnViewFullCalendar.setOnClickListener {
            (activity as? MainActivity)?.openCalendarTab()
        }
    }

    private fun loadTodayData() {
        binding.tvHouseholdName.text = prefs.householdName

        val todayKey = DateUtils.todayKey()
        binding.tvCurrentDate.text = DateUtils.formatDisplayDate(todayKey)

        val cal = Calendar.getInstance()
        val year = cal.get(Calendar.YEAR)
        val month = cal.get(Calendar.MONTH)
        binding.tvMonthBadge.text = DateUtils.formatMonthYear(year, month)

        val items = repository.getTodayUiStates(todayKey)
        adapter.submitList(items)

        if (items.isEmpty()) {
            binding.layoutEmptyToday.visibility = View.VISIBLE
            binding.rvTodaySubscriptions.visibility = View.GONE
        } else {
            binding.layoutEmptyToday.visibility = View.GONE
            binding.rvTodaySubscriptions.visibility = View.VISIBLE
        }

        // Calculate today's stats
        val todayBill = items.sumOf { it.subtotal }
        binding.tvTodayBill.text = DateUtils.formatCurrency(todayBill)

        val deliveredCount = items.count { it.effectiveStatus == "delivered" }
        binding.tvDeliveredRatio.text = "$deliveredCount/${items.size} Delivered"

        // Monthly stats
        val analytics = repository.getAnalyticsSummary(year, month)
        binding.tvMonthSpent.text = DateUtils.formatCurrency(analytics.totalSpent)
        binding.tvMonthProjection.text = "Est. ${DateUtils.formatCurrency(analytics.projectedTotal)}"

        renderWeekStrip()
    }

    private fun renderWeekStrip() {
        val strip = binding.layoutWeekStrip
        strip.removeAllViews()

        val cal = Calendar.getInstance()
        val todayDay = cal.get(Calendar.DAY_OF_MONTH)
        val todayMonth = cal.get(Calendar.MONTH)
        val todayYear = cal.get(Calendar.YEAR)

        val dayFormat = SimpleDateFormat("EE", Locale.US)
        val records = repository.getRecordsForMonth(todayYear, todayMonth).associateBy { it.date }

        // Last 6 days + today = 7 days
        val tempCal = Calendar.getInstance()
        tempCal.add(Calendar.DAY_OF_MONTH, -6)

        for (i in 0..6) {
            val d = tempCal.get(Calendar.DAY_OF_MONTH)
            val m = tempCal.get(Calendar.MONTH)
            val y = tempCal.get(Calendar.YEAR)
            val dateKey = DateUtils.formatDateKey(y, m, d)
            val isToday = (d == todayDay && m == todayMonth && y == todayYear)

            val rec = records[dateKey]
            val isDelivered = rec?.status == "delivered"
            val isMissed = rec?.status == "not_delivered"

            val dayView = LinearLayout(requireContext()).apply {
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                    setMargins(4, 0, 4, 0)
                }
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                setPadding(6, 12, 6, 12)
                setBackgroundResource(
                    if (isToday) R.drawable.bg_calendar_today
                    else if (isDelivered) R.drawable.bg_badge
                    else R.drawable.bg_circle
                )
                setOnClickListener {
                    (activity as? MainActivity)?.openCalendarTab()
                }
            }

            val tvDayLetter = TextView(requireContext()).apply {
                text = dayFormat.format(tempCal.time).take(2)
                textSize = 10f
                gravity = Gravity.CENTER
                setTypeface(null, Typeface.BOLD)
                setTextColor(
                    if (isToday) ContextCompat.getColor(context, R.color.primary)
                    else ContextCompat.getColor(context, R.color.text_secondary)
                )
            }

            val tvDayNum = TextView(requireContext()).apply {
                text = d.toString()
                textSize = 13f
                gravity = Gravity.CENTER
                setTypeface(null, Typeface.BOLD)
                setTextColor(
                    if (isToday) ContextCompat.getColor(context, R.color.primary)
                    else if (isDelivered) ContextCompat.getColor(context, R.color.status_delivered)
                    else ContextCompat.getColor(context, R.color.text_primary)
                )
            }

            dayView.addView(tvDayLetter)
            dayView.addView(tvDayNum)
            strip.addView(dayView)

            tempCal.add(Calendar.DAY_OF_MONTH, 1)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
