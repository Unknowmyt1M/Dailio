package com.dailio.app.ui.today

import android.content.res.ColorStateList
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.dailio.app.R
import com.dailio.app.databinding.ItemTodaySubscriptionBinding
import com.dailio.app.model.TodayItemUiState
import com.dailio.app.util.DateUtils
import java.util.Locale

class TodayAdapter(
    private val onQuantityChanged: (TodayItemUiState, Double) -> Unit,
    private val onToggleDelivered: (TodayItemUiState) -> Unit,
    private val onTogglePaused: (TodayItemUiState) -> Unit
) : ListAdapter<TodayItemUiState, TodayAdapter.TodayViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TodayViewHolder {
        val binding = ItemTodaySubscriptionBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return TodayViewHolder(binding)
    }

    override fun onBindViewHolder(holder: TodayViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class TodayViewHolder(private val binding: ItemTodaySubscriptionBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(item: TodayItemUiState) {
            val context = binding.root.context
            val service = item.service

            binding.tvName.text = service.name
            binding.tvPriceRate.text = "${DateUtils.formatCurrency(service.unitPrice)} / ${service.unit} • Subtotal: ${DateUtils.formatCurrency(item.subtotal)}"

            // Icon according to type
            when (service.type.lowercase(Locale.US)) {
                "milk" -> binding.ivIcon.setImageResource(R.drawable.ic_milk)
                "newspaper" -> binding.ivIcon.setImageResource(R.drawable.ic_newspaper)
                else -> binding.ivIcon.setImageResource(R.drawable.ic_package)
            }

            // Quantity
            val qtyStr = if (item.effectiveQuantity % 1.0 == 0.0) {
                "${item.effectiveQuantity.toInt()} ${service.unit}"
            } else {
                "${item.effectiveQuantity} ${service.unit}"
            }
            binding.tvQuantity.text = qtyStr

            // Status Styling
            when (item.effectiveStatus) {
                "delivered" -> {
                    binding.tvStatusBadge.text = "DELIVERED"
                    binding.tvStatusBadge.setTextColor(ContextCompat.getColor(context, R.color.status_delivered))
                    binding.tvStatusBadge.backgroundTintList = ColorStateList.valueOf(
                        ContextCompat.getColor(context, R.color.status_delivered_bg)
                    )
                    binding.btnToggleDeliver.text = "Delivered"
                    binding.btnToggleDeliver.setIconResource(R.drawable.ic_check)
                }
                "paused" -> {
                    binding.tvStatusBadge.text = "PAUSED"
                    binding.tvStatusBadge.setTextColor(ContextCompat.getColor(context, R.color.status_paused))
                    binding.tvStatusBadge.backgroundTintList = ColorStateList.valueOf(
                        ContextCompat.getColor(context, R.color.status_paused_bg)
                    )
                    binding.btnToggleDeliver.text = "Mark Delivered"
                    binding.btnToggleDeliver.setIconResource(R.drawable.ic_check)
                }
                else -> {
                    binding.tvStatusBadge.text = "NOT DELIVERED"
                    binding.tvStatusBadge.setTextColor(ContextCompat.getColor(context, R.color.status_missed))
                    binding.tvStatusBadge.backgroundTintList = ColorStateList.valueOf(
                        ContextCompat.getColor(context, R.color.status_missed_bg)
                    )
                    binding.btnToggleDeliver.text = "Mark Delivered"
                    binding.btnToggleDeliver.setIconResource(R.drawable.ic_check)
                }
            }

            // Quantity Buttons
            binding.btnMinus.setOnClickListener {
                val step = if (service.unit.equals("L", ignoreCase = true)) 0.5 else 1.0
                val newQty = (item.effectiveQuantity - step).coerceAtLeast(0.0)
                onQuantityChanged(item, newQty)
            }

            binding.btnPlus.setOnClickListener {
                val step = if (service.unit.equals("L", ignoreCase = true)) 0.5 else 1.0
                val newQty = item.effectiveQuantity + step
                onQuantityChanged(item, newQty)
            }

            binding.btnToggleDeliver.setOnClickListener {
                onToggleDelivered(item)
            }

            binding.btnPause.setOnClickListener {
                onTogglePaused(item)
            }
        }
    }

    companion object DiffCallback : DiffUtil.ItemCallback<TodayItemUiState>() {
        override fun areItemsTheSame(oldItem: TodayItemUiState, newItem: TodayItemUiState): Boolean {
            return oldItem.service.id == newItem.service.id
        }

        override fun areContentsTheSame(oldItem: TodayItemUiState, newItem: TodayItemUiState): Boolean {
            return oldItem == newItem
        }
    }
}
