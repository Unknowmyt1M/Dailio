package com.dailio.app.ui.analytics

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.dailio.app.DailioApplication
import com.dailio.app.databinding.FragmentAnalyticsBinding
import com.dailio.app.util.DateUtils
import java.util.Calendar

class AnalyticsFragment : Fragment() {

    private var _binding: FragmentAnalyticsBinding? = null
    private val binding get() = _binding!!

    private lateinit var breakdownAdapter: AnalyticsBreakdownAdapter
    private val repository get() = (requireActivity().application as DailioApplication).repository

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentAnalyticsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        loadAnalytics()
    }

    override fun onResume() {
        super.onResume()
        loadAnalytics()
    }

    private fun setupRecyclerView() {
        breakdownAdapter = AnalyticsBreakdownAdapter()
        binding.rvAnalyticsBreakdown.layoutManager = LinearLayoutManager(requireContext())
        binding.rvAnalyticsBreakdown.adapter = breakdownAdapter
    }

    private fun loadAnalytics() {
        val cal = Calendar.getInstance()
        val year = cal.get(Calendar.YEAR)
        val month = cal.get(Calendar.MONTH)

        val summary = repository.getAnalyticsSummary(year, month)

        binding.tvAnalyticsPeriod.text = summary.period
        binding.tvTotalSpent.text = DateUtils.formatCurrency(summary.totalSpent)
        binding.tvProjectedTotal.text = DateUtils.formatCurrency(summary.projectedTotal)
        binding.tvDeliveryRate.text = "${summary.deliveryRatePercent}%"
        binding.tvActiveDaysCount.text = "${summary.activeDaysCount} / ${summary.totalDaysInMonth} days"
        binding.tvPausedCount.text = "${summary.pausedDaysCount} days"

        breakdownAdapter.submitItems(summary.breakdownItems)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
