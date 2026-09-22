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
import com.google.android.material.chip.Chip
import java.util.Locale

class TodayAdapter(
    private val onQuantityChanged: (TodayItemUiState, Double) -> Unit,
    private val onToggleDelivered: (TodayItemUiState) -> Unit,
    private val onToggleMissed: (TodayItemUiState) -> Unit
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
            binding.tvPriceRate.text = "Default: ${DateUtils.formatQty(service.defaultQuantity, service.unit)} @ ${DateUtils.formatCurrency(service.unitPrice)}/${service.unit} • Subtotal: ${DateUtils.formatCurrency(item.subtotal)}"

            // Icon according to type
            when (service.type.lowercase(Locale.US)) {
                "milk" -> binding.ivIcon.setImageResource(R.drawable.ic_milk)
                "newspaper" -> binding.ivIcon.setImageResource(R.drawable.ic_newspaper)
                else -> binding.ivIcon.setImageResource(R.drawable.ic_package)
            }

            // Current Quantity display
            val qtyStr = DateUtils.formatQty(item.effectiveQuantity, service.unit)
            binding.tvQuantity.text = qtyStr

            // Status Badge & Action Buttons
            when (item.effectiveStatus) {
                "delivered" -> {
                    binding.tvStatusBadge.text = "DELIVERED"
                    binding.tvStatusBadge.setTextColor(ContextCompat.getColor(context, R.color.status_delivered))
                    binding.tvStatusBadge.backgroundTintList = ColorStateList.valueOf(
                        ContextCompat.getColor(context, R.color.status_delivered_bg)
                    )
                    
                    // Main button shows delivered state
                    binding.btnToggleDeliver.text = "$qtyStr Delivered"
                    binding.btnToggleDeliver.setBackgroundColor(ContextCompat.getColor(context, R.color.status_delivered))
                    binding.btnToggleDeliver.setIconResource(R.drawable.ic_check)

                    // Missed button
                    binding.btnMissed.setBackgroundColor(ContextCompat.getColor(context, R.color.surface_variant))
                    binding.btnMissed.setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
                }
                "not_delivered", "paused" -> {
                    val label = if (item.effectiveStatus == "paused") "PAUSED" else "MISSED"
                    binding.tvStatusBadge.text = label
                    binding.tvStatusBadge.setTextColor(ContextCompat.getColor(context, R.color.status_missed))
                    binding.tvStatusBadge.backgroundTintList = ColorStateList.valueOf(
                        ContextCompat.getColor(context, R.color.status_missed_bg)
                    )

                    // Main button
                    binding.btnToggleDeliver.text = "Mark Delivered (${DateUtils.formatQty(service.defaultQuantity, service.unit)})"
                    binding.btnToggleDeliver.setBackgroundColor(ContextCompat.getColor(context, R.color.primary))
                    binding.btnToggleDeliver.setIconResource(R.drawable.ic_check)

                    // Missed button active
                    binding.btnMissed.setBackgroundColor(ContextCompat.getColor(context, R.color.status_missed))
                    binding.btnMissed.setTextColor(ContextCompat.getColor(context, R.color.white))
                }
                else -> {
                    binding.tvStatusBadge.text = "PENDING"
                    binding.tvStatusBadge.setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
                    binding.tvStatusBadge.backgroundTintList = ColorStateList.valueOf(
                        ContextCompat.getColor(context, R.color.surface_variant)
                    )

                    // Main button
                    binding.btnToggleDeliver.text = "Mark Delivered (${DateUtils.formatQty(service.defaultQuantity, service.unit)})"
                    binding.btnToggleDeliver.setBackgroundColor(ContextCompat.getColor(context, R.color.primary))
                    binding.btnToggleDeliver.setIconResource(R.drawable.ic_check)

                    // Missed button
                    binding.btnMissed.setBackgroundColor(ContextCompat.getColor(context, R.color.surface_variant))
                    binding.btnMissed.setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
                }
            }

            // Quick Quantity Chips
            binding.chipGroupQty.removeAllViews()
            val qtyOptions = if (service.type.equals("milk", ignoreCase = true)) {
                listOf(0.5, 1.0, service.defaultQuantity, 2.0).distinct().sorted()
            } else {
                listOf(1.0, service.defaultQuantity, 2.0).distinct().sorted()
            }

            for (qty in qtyOptions) {
                val chip = Chip(context).apply {
                    text = DateUtils.formatQty(qty, service.unit)
                    isCheckable = false
                    textSize = 11f
                    ensureAccessibleTouchTarget(0)
                    val isSelected = item.effectiveQuantity == qty && item.effectiveStatus == "delivered"
                    if (isSelected) {
                        setChipBackgroundColorResource(R.color.primary)
                        setTextColor(ContextCompat.getColor(context, R.color.white))
                    } else {
                        setChipBackgroundColorResource(R.color.surface_variant)
                        setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
                    }
                    setOnClickListener {
                        onQuantityChanged(item, qty)
                    }
                }
                binding.chipGroupQty.addView(chip)
            }

            // Fine tuning +/-
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

            binding.btnMissed.setOnClickListener {
                onToggleMissed(item)
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
