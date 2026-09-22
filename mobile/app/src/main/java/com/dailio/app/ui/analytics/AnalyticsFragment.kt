package com.dailio.app.ui.analytics

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.dailio.app.DailioApplication
import com.dailio.app.databinding.DialogAddPaymentBinding
import com.dailio.app.databinding.FragmentAnalyticsBinding
import com.dailio.app.model.AnalyticsSummary
import com.dailio.app.model.PaymentRecord
import com.dailio.app.util.DateUtils
import com.dailio.app.util.Prefs
import java.util.Calendar
import java.util.UUID

class AnalyticsFragment : Fragment() {

    private var _binding: FragmentAnalyticsBinding? = null
    private val binding get() = _binding!!

    private lateinit var breakdownAdapter: AnalyticsBreakdownAdapter
    private lateinit var paymentAdapter: PaymentAdapter
    private val repository get() = (requireActivity().application as DailioApplication).repository

    private var currentYear: Int = 0
    private var currentMonth: Int = 0
    private var currentSummary: AnalyticsSummary? = null

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

        val cal = Calendar.getInstance()
        currentYear = cal.get(Calendar.YEAR)
        currentMonth = cal.get(Calendar.MONTH)

        setupRecyclerViews()
        setupListeners()
        loadAnalytics()
    }

    override fun onResume() {
        super.onResume()
        loadAnalytics()
    }

    private fun setupRecyclerViews() {
        breakdownAdapter = AnalyticsBreakdownAdapter()
        binding.rvAnalyticsBreakdown.layoutManager = LinearLayoutManager(requireContext())
        binding.rvAnalyticsBreakdown.adapter = breakdownAdapter

        paymentAdapter = PaymentAdapter(
            onDeletePayment = { payment ->
                repository.deletePayment(payment.id)
                loadAnalytics()
                Toast.makeText(requireContext(), "Payment removed", Toast.LENGTH_SHORT).show()
            }
        )
        binding.rvPayments.layoutManager = LinearLayoutManager(requireContext())
        binding.rvPayments.adapter = paymentAdapter
    }

    private fun setupListeners() {
        binding.btnPrevMonthAnalytics.setOnClickListener {
            if (currentMonth == 0) {
                currentMonth = 11
                currentYear -= 1
            } else {
                currentMonth -= 1
            }
            loadAnalytics()
        }

        binding.btnNextMonthAnalytics.setOnClickListener {
            if (currentMonth == 11) {
                currentMonth = 0
                currentYear += 1
            } else {
                currentMonth += 1
            }
            loadAnalytics()
        }

        binding.btnAddPayment.setOnClickListener {
            showAddPaymentDialog()
        }

        binding.btnShareHisaab.setOnClickListener {
            shareHisaabWhatsApp()
        }
    }

    private fun loadAnalytics() {
        val summary = repository.getAnalyticsSummary(currentYear, currentMonth)
        currentSummary = summary

        binding.tvAnalyticsPeriod.text = summary.period
        binding.tvTotalSpent.text = DateUtils.formatCurrency(summary.totalSpent)
        binding.tvTotalPaid.text = DateUtils.formatCurrency(summary.totalPaid)
        binding.tvBalanceDue.text = DateUtils.formatCurrency(summary.balanceDue)
        binding.tvProjectedTotal.text = "Full Month Projected: ${DateUtils.formatCurrency(summary.projectedTotal)}"
        binding.tvDeliveryRate.text = "${summary.deliveryRatePercent}% On Schedule"
        binding.tvActiveDaysCount.text = "${summary.activeDaysCount} / ${summary.totalDaysInMonth} days"
        binding.tvPausedCount.text = "${summary.pausedDaysCount} days"

        breakdownAdapter.submitItems(summary.breakdownItems)
        paymentAdapter.submitPayments(summary.payments)

        if (summary.payments.isEmpty()) {
            binding.tvEmptyPayments.visibility = View.VISIBLE
            binding.rvPayments.visibility = View.GONE
        } else {
            binding.tvEmptyPayments.visibility = View.GONE
            binding.rvPayments.visibility = View.VISIBLE
        }
    }

    private fun showAddPaymentDialog() {
        val dialogBinding = DialogAddPaymentBinding.inflate(layoutInflater)
        val periodKey = String.format(java.util.Locale.US, "%04d-%02d", currentYear, currentMonth + 1)

        AlertDialog.Builder(requireContext())
            .setView(dialogBinding.root)
            .setPositiveButton("Save Payment") { _, _ ->
                val amtStr = dialogBinding.etPaymentAmount.text?.toString()?.trim() ?: ""
                val amount = amtStr.toDoubleOrNull()
                if (amount == null || amount <= 0) {
                    Toast.makeText(requireContext(), "Please enter a valid amount", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                val method = when (dialogBinding.rgPaymentMethod.checkedRadioButtonId) {
                    dialogBinding.rbCash.id -> "Cash"
                    dialogBinding.rbBank.id -> "Bank"
                    else -> "UPI"
                }
                val note = dialogBinding.etPaymentNote.text?.toString()?.trim() ?: ""

                val payment = PaymentRecord(
                    id = UUID.randomUUID().toString(),
                    period = periodKey,
                    amount = amount,
                    date = DateUtils.todayKey(),
                    method = method,
                    note = note
                )
                repository.savePayment(payment)
                loadAnalytics()
                Toast.makeText(requireContext(), "Payment of ${DateUtils.formatCurrency(amount)} recorded!", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun shareHisaabWhatsApp() {
        val summary = currentSummary ?: return
        val prefs = Prefs(requireContext())
        val householdName = prefs.householdName

        val sb = StringBuilder()
        sb.append("🥛 *Dailio Monthly Delivery Hisaab*\n")
        sb.append("🏠 Household: *$householdName*\n")
        sb.append("📅 Billing Month: *${summary.period}*\n")
        sb.append("────────────────────────\n")

        for (item in summary.breakdownItems) {
            val icon = if (item.serviceType.equals("milk", true)) "🥛" else if (item.serviceType.equals("newspaper", true)) "📰" else "📦"
            val qty = DateUtils.formatQty(item.totalQuantity, item.unit)
            sb.append("$icon *${item.serviceName}*: $qty (${item.deliveredDaysCount} days) = *${DateUtils.formatCurrency(item.totalCost)}*\n")
        }

        sb.append("────────────────────────\n")
        sb.append("💰 *Total Bill:* ${DateUtils.formatCurrency(summary.totalSpent)}\n")
        sb.append("✅ *Total Paid:* ${DateUtils.formatCurrency(summary.totalPaid)}\n")
        if (summary.balanceDue > 0) {
            sb.append("⚠️ *Balance Due:* *${DateUtils.formatCurrency(summary.balanceDue)}*\n")
        } else {
            sb.append("🎉 *Account Settled (₹0 Due)*\n")
        }
        sb.append("────────────────────────\n")
        sb.append("Shared via Dailio App\n")

        val sendIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, sb.toString())
            type = "text/plain"
        }
        val shareIntent = Intent.createChooser(sendIntent, "Share Monthly Hisaab via")
        startActivity(shareIntent)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
