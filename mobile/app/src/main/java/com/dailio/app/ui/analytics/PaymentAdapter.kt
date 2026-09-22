package com.dailio.app.ui.analytics

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.dailio.app.databinding.ItemPaymentBinding
import com.dailio.app.model.PaymentRecord
import com.dailio.app.util.DateUtils

class PaymentAdapter(
    private val onDeletePayment: (PaymentRecord) -> Unit
) : RecyclerView.Adapter<PaymentAdapter.PaymentViewHolder>() {

    private val items = mutableListOf<PaymentRecord>()

    fun submitPayments(newItems: List<PaymentRecord>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PaymentViewHolder {
        val binding = ItemPaymentBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return PaymentViewHolder(binding)
    }

    override fun onBindViewHolder(holder: PaymentViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class PaymentViewHolder(private val binding: ItemPaymentBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(payment: PaymentRecord) {
            binding.tvPaymentTitle.text = "Paid ${DateUtils.formatCurrency(payment.amount)} via ${payment.method}"
            val subtitle = if (payment.note.isNotEmpty()) {
                "${DateUtils.formatDisplayDate(payment.date)} • ${payment.note}"
            } else {
                DateUtils.formatDisplayDate(payment.date)
            }
            binding.tvPaymentDateNote.text = subtitle

            binding.btnDeletePayment.setOnClickListener {
                onDeletePayment(payment)
            }
        }
    }
}
