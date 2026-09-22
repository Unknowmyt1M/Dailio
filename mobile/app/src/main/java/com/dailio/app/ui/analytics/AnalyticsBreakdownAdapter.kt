package com.dailio.app.ui.analytics

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.dailio.app.databinding.ItemAnalyticsBreakdownBinding
import com.dailio.app.model.ItemBreakdown
import com.dailio.app.util.DateUtils

class AnalyticsBreakdownAdapter :
    RecyclerView.Adapter<AnalyticsBreakdownAdapter.BreakdownViewHolder>() {

    private val items = mutableListOf<ItemBreakdown>()

    fun submitItems(newItems: List<ItemBreakdown>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): BreakdownViewHolder {
        val binding = ItemAnalyticsBreakdownBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return BreakdownViewHolder(binding)
    }

    override fun onBindViewHolder(holder: BreakdownViewHolder, position: Int) {
        holder.bind(items[position])
    }

    override fun getItemCount(): Int = items.size

    inner class BreakdownViewHolder(private val binding: ItemAnalyticsBreakdownBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(item: ItemBreakdown) {
            binding.tvItemName.text = item.serviceName
            binding.tvItemCost.text = DateUtils.formatCurrency(item.totalCost)

            val qtyStr = if (item.totalQuantity % 1.0 == 0.0) {
                "${item.totalQuantity.toInt()} ${item.unit}"
            } else {
                "${item.totalQuantity} ${item.unit}"
            }
            binding.tvItemQtySummary.text = "$qtyStr delivered (${item.deliveredDaysCount} days)"
            binding.tvItemPercent.text = "${item.percentageOfTotal}%"
            binding.progressItemCost.progress = item.percentageOfTotal
        }
    }
}
