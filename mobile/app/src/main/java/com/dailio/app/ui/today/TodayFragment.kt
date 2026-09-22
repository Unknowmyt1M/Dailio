package com.dailio.app.ui.today

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.dailio.app.DailioApplication
import com.dailio.app.databinding.FragmentTodayBinding
import com.dailio.app.util.DateUtils
import java.util.Calendar

class TodayFragment : Fragment() {

    private var _binding: FragmentTodayBinding? = null
    private val binding get() = _binding!!

    private lateinit var adapter: TodayAdapter
    private val repository get() = (requireActivity().application as DailioApplication).repository

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
                repository.updateQuantity(item.service, DateUtils.todayKey(), newQty)
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
            onTogglePaused = { item ->
                val nextStatus = if (item.effectiveStatus == "paused") "delivered" else "paused"
                repository.setDeliveryStatus(
                    item.service,
                    DateUtils.todayKey(),
                    nextStatus,
                    item.effectiveQuantity
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
    }

    private fun loadTodayData() {
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
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
