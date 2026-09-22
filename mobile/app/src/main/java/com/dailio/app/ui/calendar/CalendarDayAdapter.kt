package com.dailio.app.ui.calendar

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.dailio.app.R
import com.dailio.app.databinding.ItemCalendarDayBinding

data class CalendarDayModel(
    val dayNumber: Int, // 0 for empty offset
    val isToday: Boolean,
    val isSelected: Boolean,
    val hasDelivered: Boolean,
    val hasPaused: Boolean
)

class CalendarDayAdapter(
    private val onDayClicked: (Int) -> Unit
) : RecyclerView.Adapter<CalendarDayAdapter.DayViewHolder>() {

    private val days = mutableListOf<CalendarDayModel>()

    fun submitDays(newDays: List<CalendarDayModel>) {
        days.clear()
        days.addAll(newDays)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DayViewHolder {
        val binding = ItemCalendarDayBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return DayViewHolder(binding)
    }

    override fun onBindViewHolder(holder: DayViewHolder, position: Int) {
        holder.bind(days[position])
    }

    override fun getItemCount(): Int = days.size

    inner class DayViewHolder(private val binding: ItemCalendarDayBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(item: CalendarDayModel) {
            val context = binding.root.context

            if (item.dayNumber == 0) {
                binding.tvDayNumber.text = ""
                binding.tvDayNumber.background = null
                binding.dotsContainer.visibility = View.GONE
                binding.root.setOnClickListener(null)
                return
            }

            binding.tvDayNumber.text = item.dayNumber.toString()
            binding.dotsContainer.visibility = View.VISIBLE

            // Status dots
            binding.dotDelivered.visibility = if (item.hasDelivered) View.VISIBLE else View.GONE
            binding.dotPaused.visibility = if (item.hasPaused) View.VISIBLE else View.GONE

            when {
                item.isSelected -> {
                    binding.tvDayNumber.setBackgroundResource(R.drawable.bg_calendar_selected)
                    binding.tvDayNumber.setTextColor(ContextCompat.getColor(context, R.color.white))
                }
                item.isToday -> {
                    binding.tvDayNumber.setBackgroundResource(R.drawable.bg_calendar_today)
                    binding.tvDayNumber.setTextColor(ContextCompat.getColor(context, R.color.primary))
                }
                else -> {
                    binding.tvDayNumber.background = null
                    binding.tvDayNumber.setTextColor(ContextCompat.getColor(context, R.color.text_primary))
                }
            }

            binding.root.setOnClickListener {
                onDayClicked(item.dayNumber)
            }
        }
    }
}
