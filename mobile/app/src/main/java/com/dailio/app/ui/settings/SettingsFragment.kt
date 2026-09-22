package com.dailio.app.ui.settings

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatDelegate
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.dailio.app.DailioApplication
import com.dailio.app.databinding.DialogEditProductBinding
import com.dailio.app.databinding.FragmentSettingsBinding
import com.dailio.app.model.ServiceItem
import com.dailio.app.util.Prefs
import java.util.UUID

class SettingsFragment : Fragment() {

    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!

    private lateinit var productAdapter: ProductAdapter
    private val repository get() = (requireActivity().application as DailioApplication).repository
    private lateinit var prefs: Prefs

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSettingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        prefs = Prefs(requireContext())

        setupProfile()
        setupRecyclerView()
        setupThemeSwitch()
        setupListeners()
        loadProducts()
    }

    private fun setupProfile() {
        binding.etHouseholdName.setText(prefs.householdName)
        binding.etVendorContact.setText(prefs.vendorContact)

        binding.btnSaveProfile.setOnClickListener {
            val name = binding.etHouseholdName.text?.toString()?.trim() ?: "Darko's Household"
            val contact = binding.etVendorContact.text?.toString()?.trim() ?: ""
            prefs.householdName = name.ifEmpty { "Darko's Household" }
            prefs.vendorContact = contact
            Toast.makeText(requireContext(), "Household profile saved!", Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupRecyclerView() {
        productAdapter = ProductAdapter(
            onEditClicked = { service -> showProductDialog(service) },
            onDeleteClicked = { service -> confirmDeleteProduct(service) }
        )
        binding.rvProducts.layoutManager = LinearLayoutManager(requireContext())
        binding.rvProducts.adapter = productAdapter
    }

    private fun setupThemeSwitch() {
        binding.switchDarkMode.isChecked = prefs.isDarkMode
        binding.switchDarkMode.setOnCheckedChangeListener { _, isChecked ->
            prefs.isDarkMode = isChecked
            if (isChecked) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)
            } else {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
            }
        }
    }

    private fun setupListeners() {
        binding.btnAddProduct.setOnClickListener {
            showProductDialog(null)
        }

        binding.btnExportBackup.setOnClickListener {
            exportBackup()
        }

        binding.btnImportBackup.setOnClickListener {
            importBackup()
        }

        binding.btnResetData.setOnClickListener {
            AlertDialog.Builder(requireContext())
                .setTitle("Reset Data")
                .setMessage("Are you sure you want to reset all items and delivery records to sample demo data?")
                .setPositiveButton("Reset") { _, _ ->
                    repository.resetToDemoData()
                    loadProducts()
                    Toast.makeText(requireContext(), "Reset to demo data completed", Toast.LENGTH_SHORT).show()
                }
                .setNegativeButton("Cancel", null)
                .show()
        }
    }

    private fun exportBackup() {
        val json = repository.exportBackupJson()
        val sendIntent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, json)
            type = "text/plain"
        }
        startActivity(Intent.createChooser(sendIntent, "Share or Save Dailio Backup"))
    }

    private fun importBackup() {
        val input = EditText(requireContext()).apply {
            hint = "Paste Dailio JSON Backup here"
            minLines = 4
        }
        AlertDialog.Builder(requireContext())
            .setTitle("Import Data Backup")
            .setView(input)
            .setPositiveButton("Restore") { _, _ ->
                val json = input.text.toString().trim()
                if (json.isEmpty()) {
                    Toast.makeText(requireContext(), "Empty backup provided", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }
                val success = repository.importBackupJson(json)
                if (success) {
                    loadProducts()
                    Toast.makeText(requireContext(), "Data restored successfully!", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(requireContext(), "Failed to parse backup JSON", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun loadProducts() {
        val services = repository.getAllServices()
        productAdapter.submitList(services)
    }

    private fun showProductDialog(existingItem: ServiceItem?) {
        val dialogBinding = DialogEditProductBinding.inflate(layoutInflater)
        dialogBinding.tvDialogTitle.text = if (existingItem == null) "Add New Subscription" else "Edit Subscription"

        if (existingItem != null) {
            dialogBinding.etProductName.setText(existingItem.name)
            dialogBinding.etUnitPrice.setText(existingItem.unitPrice.toString())
            dialogBinding.etUnit.setText(existingItem.unit)
            dialogBinding.etDefaultQty.setText(existingItem.defaultQuantity.toString())

            dialogBinding.etCategory.setText(existingItem.type)

            dialogBinding.cbMon.isChecked = existingItem.activeDays.contains(1)
            dialogBinding.cbTue.isChecked = existingItem.activeDays.contains(2)
            dialogBinding.cbWed.isChecked = existingItem.activeDays.contains(3)
            dialogBinding.cbThu.isChecked = existingItem.activeDays.contains(4)
            dialogBinding.cbFri.isChecked = existingItem.activeDays.contains(5)
            dialogBinding.cbSat.isChecked = existingItem.activeDays.contains(6)
            dialogBinding.cbSun.isChecked = existingItem.activeDays.contains(7)
        }

        AlertDialog.Builder(requireContext())
            .setView(dialogBinding.root)
            .setPositiveButton(if (existingItem == null) "Add" else "Save") { _, _ ->
                val name = dialogBinding.etProductName.text.toString().trim()
                val price = dialogBinding.etUnitPrice.text.toString().toDoubleOrNull() ?: 0.0
                val unit = dialogBinding.etUnit.text.toString().trim()
                val defQty = dialogBinding.etDefaultQty.text.toString().toDoubleOrNull() ?: 1.0

                if (name.isEmpty() || price <= 0 || unit.isEmpty()) {
                    Toast.makeText(requireContext(), "Please fill in all required fields", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                val type = dialogBinding.etCategory.text?.toString()?.trim()?.ifEmpty { "other" } ?: "other"

                val activeDays = mutableListOf<Int>()
                if (dialogBinding.cbMon.isChecked) activeDays.add(1)
                if (dialogBinding.cbTue.isChecked) activeDays.add(2)
                if (dialogBinding.cbWed.isChecked) activeDays.add(3)
                if (dialogBinding.cbThu.isChecked) activeDays.add(4)
                if (dialogBinding.cbFri.isChecked) activeDays.add(5)
                if (dialogBinding.cbSat.isChecked) activeDays.add(6)
                if (dialogBinding.cbSun.isChecked) activeDays.add(7)

                val itemToSave = ServiceItem(
                    id = existingItem?.id ?: UUID.randomUUID().toString(),
                    name = name,
                    type = type,
                    unitPrice = price,
                    unit = unit,
                    defaultQuantity = defQty,
                    activeDays = if (activeDays.isEmpty()) listOf(1, 2, 3, 4, 5, 6, 7) else activeDays,
                    enabled = true
                )

                if (existingItem == null) {
                    repository.insertService(itemToSave)
                } else {
                    repository.updateService(itemToSave)
                }

                loadProducts()
                Toast.makeText(requireContext(), "Subscription saved", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun confirmDeleteProduct(service: ServiceItem) {
        AlertDialog.Builder(requireContext())
            .setTitle("Delete ${service.name}?")
            .setMessage("All related past delivery records will also be permanently deleted.")
            .setPositiveButton("Delete") { _, _ ->
                repository.deleteService(service.id)
                loadProducts()
                Toast.makeText(requireContext(), "${service.name} deleted", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
