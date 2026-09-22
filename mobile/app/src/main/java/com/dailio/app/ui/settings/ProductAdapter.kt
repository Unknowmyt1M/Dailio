package com.dailio.app.ui.settings

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.dailio.app.R
import com.dailio.app.databinding.ItemProductBinding
import com.dailio.app.model.ServiceItem
import com.dailio.app.util.DateUtils
import java.util.Locale

class ProductAdapter(
    private val onEditClicked: (ServiceItem) -> Unit,
    private val onDeleteClicked: (ServiceItem) -> Unit
) : ListAdapter<ServiceItem, ProductAdapter.ProductViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ProductViewHolder {
        val binding = ItemProductBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ProductViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ProductViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ProductViewHolder(private val binding: ItemProductBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(item: ServiceItem) {
            binding.tvProductName.text = item.name

            val priceStr = DateUtils.formatCurrency(item.unitPrice)
            binding.tvProductDetails.text = "$priceStr / ${item.unit} • Default: ${item.defaultQuantity} ${item.unit} • ${item.activeDaysString()}"

            when (item.type.lowercase(Locale.US)) {
                "milk" -> binding.ivProductIcon.setImageResource(R.drawable.ic_milk)
                "newspaper" -> binding.ivProductIcon.setImageResource(R.drawable.ic_newspaper)
                else -> binding.ivProductIcon.setImageResource(R.drawable.ic_package)
            }

            binding.btnEditProduct.setOnClickListener {
                onEditClicked(item)
            }

            binding.btnDeleteProduct.setOnClickListener {
                onDeleteClicked(item)
            }
        }
    }

    companion object DiffCallback : DiffUtil.ItemCallback<ServiceItem>() {
        override fun areItemsTheSame(oldItem: ServiceItem, newItem: ServiceItem): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: ServiceItem, newItem: ServiceItem): Boolean {
            return oldItem == newItem
        }
    }
}
