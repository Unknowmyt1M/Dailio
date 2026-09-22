<div align="center">

# 🥛 Dailio — Daily Routine & Delivery Tracker

**The modern, offline-first household hisaab and daily subscription tracker for Milk, Newspapers, and recurring deliveries.**

[![Vercel Live](https://img.shields.io/badge/Vercel-Live%20Demo-black?style=for-the-badge&logo=vercel)](https://dailio-umber.vercel.app)
[![Android APK](https://img.shields.io/badge/Android-Download%20APK%20(v1.1.0)-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Unknowmyt1M/Dailio/releases/latest)
[![Kotlin](https://img.shields.io/badge/Kotlin-Native%202.0-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white)](https://kotlinlang.org)
[![React](https://img.shields.io/badge/React-18%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br />

<p align="center">
  <a href="https://dailio-umber.vercel.app"><b>🌐 Open Web App</b></a> •
  <a href="https://github.com/Unknowmyt1M/Dailio/releases/latest"><b>📱 Download Android APK</b></a> •
  <a href="#-key-features"><b>✨ Features</b></a> •
  <a href="#-tech-stack"><b>🛠️ Tech Stack</b></a> •
  <a href="#-getting-started"><b>🚀 Quickstart</b></a>
</p>

</div>

---

## 📖 Overview

Managing daily household subscriptions like **Milk (दूध)**, **Newspapers (अखबार)**, bread, and water jars using paper calendars or manual diaries is messy and prone to end-of-month billing disputes. 

**Dailio** solves this by providing a unified, lightning-fast digital ledger built for Indian households:
- **1-Tap Daily Quick Logging**: Mark delivered with custom or default quantities (`0.5L`, `1L`, `1.5L`, `2L`).
- **100% Offline-First**: Built with local SQLite on Android and IndexedDB/LocalStore on Web — zero internet needed.
- **WhatsApp Hisaab Sharing**: Generate clean billing breakdowns and send them to your milkman/vendor in 1 tap.
- **Vacation & Bulk Logging**: Pause deliveries during holidays or bulk-update date ranges effortlessly.

---

## ✨ Key Features

### 🥛 1-Click Today Dashboard
- **Lightning Fast Logging**: 1 tap to mark items as *Delivered* or *Missed*.
- **Smart Quantity Chips**: Tap `0.5L`, `1L`, `1.5L`, or `2L` to instantly update and deliver today's milk without opening menus.
- **Interactive "This Week" Strip**: Mon–Sun at-a-glance tracker with status dots and current-day indicator.
- **Today's Running Bill**: Real-time calculated day cost and delivery ratio.

### 📅 Full Monthly Calendar & Retroactive Edits
- **Month Grid View**: Visual status dots (🟢 Delivered, 🔴 Missed, 🟠 Paused) across the month.
- **Retroactive Adjustments**: Forgot to log 3 days ago? Tap any past date to adjust quantities or statuses retrospectively.
- **Multi-Service Day View**: View exact breakdowns for all active subscriptions on any selected date.

### 💰 Complete Payment Ledger & Balance Due
- **3-Column Financial Ledger**: `TOTAL BILL` | `PAID` (Green) | `BALANCE DUE` (Red).
- **`+ Record Payment`**: Log advance or partial payments with amount, payment mode (`UPI / GPay`, `Cash`, `Bank Transfer`), and notes.
- **Payment History**: Track every transaction made during the billing cycle with 1-tap delete/manage options.

### 📱 1-Tap WhatsApp Hisaab Sharing
Generates a crisp, copy-pasteable breakdown ready for WhatsApp:
```text
🥛 *Dailio Monthly Delivery Hisaab*
🏠 Household: *Darko's Household*
📅 Billing Month: *September 2026*
────────────────────────
🥛 *Amul Taaza Milk*: 45.0 L (30 days) = *₹2,970.00*
📰 *The Times of India*: 30.0 copy (30 days) = *₹150.00*
────────────────────────
💰 *Total Bill:* ₹3,120.00
✅ *Total Paid:* ₹2,000.00
⚠️ *Balance Due:* *₹1,120.00*
────────────────────────
Shared via Dailio App
```

### 🏖️ Vacation & Delivery Pause System
- Headed out of town? Schedule a pause range (e.g., Oct 5 – Oct 12) with a reason like *"Out of station"* or *"Festival"*.
- Automatically marks scheduled deliveries as paused, omitting them from billable quantities.

### ⚡ Bulk Range Logging
- Update an entire date range (e.g., 1st to 15th) as Delivered, Missed, or Paused in a single click.

### 🌟 3-Step Interactive Onboarding
- First-time setup wizard:
  1. **Household Profile**: Customize household name & contact.
  2. **Milk Routine**: Configure brand, default quantity, and rate per liter.
  3. **Newspaper Routine**: Choose publication name and daily price.

### 💾 Backup & Restore (JSON)
- **Export Backup**: Save all your services, delivery records, payments, and pauses into a portable `.json` file.
- **Import Backup**: Restore your complete data on any device instantly.

### 🌓 Material 3 Dark / Light Mode
- True system-aware dynamic theming with high-contrast text and sleek surface cards.

---

## 🛠️ Tech Stack

### 📱 Android Native App (`mobile/`)
| Component | Technology |
|---|---|
| **Language** | Kotlin 2.0.21 |
| **UI Framework** | Material Components 3 (M3) + ViewBinding |
| **Local Database** | Native Android SQLite (`SQLiteOpenHelper`) — 100% Offline |
| **Target SDK** | Android 15 (API 35), Min SDK 24 (Android 7.0+) |
| **Binary Size** | ~6.7 MB (Ultra-lightweight, 0 React Native / C++ overhead) |
| **Build Tool** | Gradle 8.13 + AGP 8.7.3 |

### 🌐 Web Application (`src/`)
| Component | Technology |
|---|---|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 8.3 (Fast HMR & Optimized Chunks) |
| **Styling** | Tailwind CSS + Plus Jakarta Sans typography |
| **Icons** | Lucide React Icons |
| **Deployment** | Vercel Serverless Edge Platform |

---

## 📁 Repository Structure

```text
Dailio/
├── dist/                      # Production compiled web build
├── mobile/                    # 100% Native Kotlin Android Project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/dailio/app/
│   │   │   │   ├── data/       # SQLite DatabaseHelper & Repository
│   │   │   │   ├── model/      # ServiceItem, DeliveryRecord, Payment, Pause
│   │   │   │   ├── ui/         # Activities & Fragments
│   │   │   │   │   ├── onboarding/  # 3-Step Setup Flow
│   │   │   │   │   ├── today/       # Quick Log & 7-Day Strip
│   │   │   │   │   ├── calendar/    # Monthly Grid, Bulk Log, Vacation
│   │   │   │   │   ├── analytics/   # Payment Ledger & WhatsApp Share
│   │   │   │   │   └── settings/    # Products CRUD & JSON Backup
│   │   │   │   └── util/       # DateUtils & Prefs
│   │   │   └── res/            # Material 3 layouts, drawables & themes
│   │   └── build.gradle.kts
│   ├── gradlew.bat
│   └── settings.gradle
├── src/                       # React + TypeScript Web Application
│   ├── components/            # HomeDashboard, Calendar, Hisaab, Settings
│   ├── store/                 # Zustand offline state store
│   └── lib/                   # Billing algorithms & date calculations
├── package.json
└── README.md
```

---

## 🚀 Quickstart & Local Setup

### 🌐 Running Web Locally

```bash
# 1. Clone the repository
git clone https://github.com/Unknowmyt1M/Dailio.git
cd Dailio

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
```

### 📱 Building Android APK Locally

```bash
# Navigate to mobile directory
cd mobile

# Compile debug APK
./gradlew assembleDebug

# Output APK path:
# mobile/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📥 Releases & Downloads

Pre-built APK binaries are automatically compiled and published on GitHub Releases:

👉 **[Download Latest APK (v1.1.0)](https://github.com/Unknowmyt1M/Dailio/releases/latest)**

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

<div align="center">
  <sub>Built with ❤️ for hassle-free daily household management.</sub>
</div>
