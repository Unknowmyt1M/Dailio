# Dailio — Product Requirements Document

**Status:** Draft for implementation  
**Version:** 1.0  
**Product:** Dailio  
**Repository:** `Unknowmyt1M/Dailio`  
**Primary document:** `docs/PRD.md`

---

## 1. Product Summary

Dailio is a calendar-first household delivery tracker for recording daily milk and newspaper deliveries and automatically turning those records into a clear monthly hisaab (quantity, days, amount, paid, and due).

The product is intentionally narrow. It is **not** a milkman CRM, newspaper-agent management system, marketplace, accounting suite, or generic expense tracker. The core experience is:

> **Open Dailio → see the calendar → tap a day → record what arrived → get the monthly hisaab.**

The initial target market is Indian households that receive recurring physical deliveries such as milk and newspapers and currently track them mentally, on paper, in WhatsApp, or through generic ledger apps.

### One-line description

> **Dailio — Your simple daily calendar for tracking milk, newspaper, and monthly household deliveries.**

---

## 2. Research-Driven Product Context

The category is validated by existing Indian products. Milk-focused apps already provide daily calendars, quantities, monthly calculations, reports, and payment tracking. Newspaper products commonly provide delivery status, pause/resume, subscriptions, and billing. Broader household-ledger products combine recurring services such as milk and newspaper.

The opportunity is therefore **not** to invent the problem. It is to provide a significantly simpler consumer experience centered on a visual daily calendar rather than vendor management or a generic ledger.

Research also surfaced recurring UX needs worth treating as first-class requirements:

- Fast daily entry with minimal taps.
- Easy correction of missed historical days.
- Bulk/date-range entry instead of editing every day individually.
- Morning/evening or multiple milk deliveries for households that need them.
- Pause/vacation periods.
- Monthly bill calculation and payment/due tracking.
- Shareable monthly hisaab.
- Indian household terminology, currency, date conventions, and optional Hindi/Hinglish-friendly copy.
- Offline resilience for the core record-taking workflow.

The product should learn from these validated workflows without copying competitor interfaces or expanding into their business-management scope.

---

## 3. Vision

Make recurring household delivery tracking so effortless that recording a delivery is easier than remembering it.

### Product principles

1. **Calendar first.** The month is the primary mental model.
2. **One-tap whenever possible.** Daily tracking must be faster than writing it on paper.
3. **Hisaab is automatic.** Users record events; Dailio performs calculations.
4. **Household-friendly.** Clear language, large touch targets, simple status indicators.
5. **Offline-first for core data.** A temporary network outage must not prevent a user from recording today's delivery.
6. **Private by default.** Household delivery history is personal data and should not require unnecessary collection.
7. **Focused scope.** Do fewer things exceptionally well before adding more delivery categories.

---

## 4. Problem Statement

Households often receive milk and newspapers every day but the actual delivered quantity/days can vary. People need to remember missed deliveries, holidays, quantity changes, and payments. Existing solutions can be overly generic, vendor-oriented, or cumbersome for the simple task of recording a delivery.

Dailio solves this by combining:

- a monthly calendar;
- simple delivery status and quantity entry;
- bulk correction;
- automatic monthly calculations;
- payment tracking; and
- a concise monthly summary/share flow.

### Jobs to be Done

**JTBD-1:** When a delivery arrives, I want to record it in seconds so I don't have to remember it later.

**JTBD-2:** When I check my month, I want to immediately see which days milk/newspaper were delivered or missed.

**JTBD-3:** When the month ends, I want Dailio to calculate what I owe without manually counting days or litres.

**JTBD-4:** When I forgot to record several days, I want to correct them in bulk rather than opening each date individually.

**JTBD-5:** When I go on vacation or pause a service, I want Dailio to represent that period clearly without falsely treating it as a missed delivery.

**JTBD-6:** When I need to settle the bill, I want a simple shareable summary of quantity/days, rate, total, paid, and due.

---

## 5. Target Users

### Primary persona — Household Tracker

An Indian household member who receives milk and newspaper and currently uses memory, paper, calculator, WhatsApp, or a simple ledger.

**Needs:** speed, clarity, reliable monthly total, easy corrections.

**Pain points:** forgetting deliveries, manual counting, unclear missed-day treatment, repetitive entry.

### Secondary persona — Family Member

A second person in the household who may record deliveries or review the monthly hisaab.

**Needs:** obvious status, no complicated onboarding, shared understanding of the current month.

### Future persona — Older/low-tech user

A user who prefers large controls, simple terminology, and possibly Hindi/Hinglish or voice input.

This persona informs accessibility and localization, but should not force unnecessary complexity into MVP.

---

## 6. Goals

### MVP goals

- Record milk delivery quantity/status for any date.
- Record newspaper delivered/not delivered for any date.
- Display both records in a monthly calendar.
- Make today's recording extremely fast.
- Support bulk date-range updates.
- Support pause/vacation periods.
- Calculate monthly totals from configurable rates.
- Track paid and due amounts.
- Provide a concise monthly summary.
- Allow export/share of the monthly summary.
- Work reliably offline for core tracking.
- Provide responsive mobile-first web UX.

### Success metrics

- **Daily entry completion:** >90% of active users can record a normal day's deliveries in <=10 seconds after onboarding.
- **Correction success:** users can correct a 7-day historical range in <=30 seconds.
- **Monthly calculation accuracy:** 100% of tested calculation cases match expected totals.
- **Core offline reliability:** records created offline are retained and recoverable after app restart.
- **Activation:** user creates at least one delivery/service and records at least one day during the first session.
- **Retention signal:** users return to Dailio during a second week/monthly billing cycle.
- **Share/export usage:** measure the proportion of active users generating a monthly summary.

Metrics are directional targets for product validation, not guarantees.

---

## 7. Non-Goals

The following are explicitly out of MVP scope:

- Vendor marketplace.
- Delivery-agent route management.
- Customer CRM for milkmen/newspaper agents.
- Online milk/newspaper ordering.
- Payment gateway/UPI settlement.
- Inventory management.
- Staff management.
- Route optimization.
- Full accounting/bookkeeping.
- AI chatbot.
- Social/community features.
- Large analytics dashboards.
- Multiple arbitrary household services at launch.

Future services such as water, eggs, bread, tiffin, or maid tracking may be considered only after the milk + newspaper experience proves useful.

---

## 8. MVP Feature Specification

### 8.1 Household setup

User can create a local household profile without mandatory account creation.

Minimum setup:

- Household/display name (optional).
- Milk service enabled/disabled.
- Newspaper service enabled/disabled.
- Milk default quantity.
- Milk unit: litre/ml as appropriate.
- Milk rate.
- Newspaper rate per delivery/day.
- Default newspaper delivery days.
- Currency: INR for MVP.

**Requirement:** onboarding must be skippable where safe, with sensible defaults.

### 8.2 Calendar

The calendar is the primary screen.

Each day should visually communicate:

- milk status/quantity;
- newspaper status;
- pause/vacation state;
- missing/unrecorded state where relevant.

Example conceptual cell:

```text
21
🥛 1L
📰 ✓
```

Calendar controls:

- previous month;
- next month;
- jump to today;
- current month/year;
- optional compact/list alternative for accessibility.

The calendar must support dates across month boundaries without losing records.

### 8.3 Today's quick entry

Today's delivery should be recordable without navigating through multiple screens.

Milk quick actions:

- Not received;
- default quantity;
- common quantity presets;
- custom quantity.

Newspaper quick actions:

- Delivered;
- Not delivered;
- optionally not scheduled.

A successful save should provide immediate visual confirmation and update totals.

### 8.4 Date detail/editor

Selecting a date opens an editor for that date.

Fields:

- milk status;
- milk quantity;
- optional multiple delivery slots (architecture should permit this, even if MVP UI starts with one default slot);
- newspaper status;
- note (optional, e.g. “vendor missed delivery”);
- date.

Actions:

- Save;
- Clear/reset record;
- Delete/revert where applicable.

### 8.5 Bulk entry

Users can apply a delivery state across a date range.

Example:

```text
From: 01 Sep
To:   20 Sep
Milk: 1 L
Newspaper: Delivered
[Apply]
```

Bulk entry must provide a confirmation summary before destructive overwrites when existing records are affected.

Supported behavior:

- date range;
- selected service(s);
- quantity/status;
- selected weekdays only;
- overwrite existing vs only fill empty records.

### 8.6 Pause/vacation

User can mark a date range as paused for one or both services.

A paused date must be distinct from “not delivered.”

Example states:

- Delivered;
- Not delivered;
- Paused;
- Not scheduled;
- Unrecorded.

Pause behavior must be configurable so a paused day is excluded from expected delivery counts and billing where appropriate.

### 8.7 Monthly hisaab

For each service, calculate:

**Milk**

`billable quantity × applicable rate = milk subtotal`

**Newspaper**

`billable delivery days × applicable rate = newspaper subtotal`

Summary:

- service subtotal;
- total;
- amount paid;
- amount due;
- billing period.

Example:

```text
September 2026

🥛 Milk
24.5 L × ₹60 = ₹1,470

📰 Newspaper
26 days × ₹8 = ₹208

Total: ₹1,678
Paid:  ₹1,000
Due:   ₹678
```

### 8.8 Payment tracking

MVP should track payment state locally.

Minimum:

- total bill;
- paid amount;
- due amount;
- payment date(s) optionally recorded;
- payment note optionally recorded.

No payment processing is required.

If partial payments are supported, the data model must preserve payment entries rather than only storing a mutable paid total.

### 8.9 Monthly summary/share

Generate a concise human-readable summary suitable for WhatsApp or copying as text.

Suggested format:

```text
Dailio — September 2026

Milk: 24.5 L × ₹60 = ₹1,470
Newspaper: 26 days × ₹8 = ₹208

Total: ₹1,678
Paid: ₹1,000
Due: ₹678
```

Optional later formats:

- PDF;
- image card;
- CSV.

### 8.10 Export/backup

MVP should support at least one portable export mechanism, preferably JSON or CSV.

Export must contain enough data to restore delivery history and settings.

### 8.11 Notifications/reminders

Not required for the first MVP. Architecture may expose a future reminder capability.

Potential future reminders:

- “You haven't recorded today's milk.”
- “September bill is ready.”
- “Newspaper pause ends tomorrow.”

Notifications must be opt-in.

---

## 9. Information Architecture

```text
Dailio
├── Calendar / Home
│   ├── Today quick entry
│   ├── Month navigation
│   └── Day detail
├── Hisaab
│   ├── Current month
│   ├── Previous months
│   └── Payment history
├── Bulk Entry
├── Pause / Vacation
├── Export / Share
└── Settings
    ├── Services
    ├── Rates
    ├── Defaults
    ├── Language
    ├── Data / Backup
    └── About
```

Navigation should remain shallow. The calendar and today's entry are the dominant actions.

---

## 10. UX Requirements

### Mobile-first

The primary interaction target is a phone. Desktop/tablet layouts should be responsive but must not drive the information architecture.

### Touch targets

Interactive controls should use comfortable touch targets (minimum approximately 44×44 CSS px where practical).

### Visual hierarchy

The user should understand, in order:

1. What day/month am I viewing?
2. What was delivered?
3. What is today's state?
4. What is this month's quantity/cost?
5. What amount is due?

### Status semantics

Do not rely on color alone. Every status should have a text/icon/accessible label.

Suggested status vocabulary:

- Delivered;
- Not delivered;
- Paused;
- Not scheduled;
- Unrecorded.

### Empty states

The first-use calendar should explain the next action instead of showing a dead dashboard.

Example:

> “Start by adding your milk or newspaper service, then tap today's date to record a delivery.”

### Error prevention

- Confirm bulk overwrites.
- Clearly distinguish zero quantity from missing data.
- Clearly distinguish “not delivered” from “paused.”
- Warn when rate changes could affect future billing.

---

## 11. Business Rules & Calculation Engine

The calculation engine must be deterministic and independently testable.

### Date model

Use calendar dates rather than timestamps for delivery records. Store a timezone separately for any timestamped metadata.

### Rate model

Rates must be versioned/effective-dated so changing a rate does not silently rewrite historical bills.

Example:

```text
Milk rate
₹60/L effective until 30 Sep
₹65/L effective from 01 Oct
```

Historical records continue using the applicable rate.

### Milk billing

Default formula:

`sum(billable milk quantities × applicable rate)`

Support fractional quantities.

### Newspaper billing

Default formula:

`count(billable delivered newspaper days × applicable rate)`

The implementation must support custom scheduled weekdays so a newspaper delivered only Monday–Saturday does not accidentally charge Sunday.

### Paused days

Paused dates are excluded from billable expected deliveries unless the user explicitly configures otherwise.

### Unrecorded days

Unrecorded is not automatically equal to “not delivered.” The UI should make the distinction clear. Billing policy for unrecorded days must be configurable or explicitly defined before final release.

### Payment

`due = max(total - sum(valid payments), 0)`

Overpayment should be represented separately as credit rather than producing a negative due amount.

### Rounding

Money must be represented using integer minor units (paise) or a decimal-safe money library. Do not use binary floating-point for financial totals.

---

## 12. Data Model

Suggested relational/domain model:

### Household

- `id`
- `name`
- `currency`
- `timezone`
- `locale`
- `createdAt`
- `updatedAt`

### Service

- `id`
- `householdId`
- `type` (`milk` | `newspaper`)
- `name`
- `enabled`
- `defaultQuantity`
- `unit`
- `billingModel`
- `createdAt`
- `updatedAt`

### Rate

- `id`
- `serviceId`
- `amountMinor`
- `unitBasis`
- `effectiveFrom`
- `effectiveTo`
- `createdAt`

### DeliveryRecord

- `id`
- `householdId`
- `serviceId`
- `date`
- `status`
- `quantity`
- `unit`
- `note`
- `source` (`manual` | `bulk` | `voice` | `import`)
- `createdAt`
- `updatedAt`

Unique constraint recommendation: `(serviceId, date, deliverySlot)`.

### PausePeriod

- `id`
- `householdId`
- `serviceId`
- `startDate`
- `endDate`
- `reason`
- `createdAt`

### Payment

- `id`
- `householdId`
- `billingPeriod`
- `amountMinor`
- `paidAt`
- `note`
- `createdAt`

### BillingPeriod

May be derived initially rather than persisted. If persisted:

- `id`
- `householdId`
- `startDate`
- `endDate`
- `status`
- `calculatedTotalMinor`
- `paidMinor`
- `dueMinor`
- `generatedAt`

---

## 13. Architecture Direction

The implementation should be selected based on the repository's existing stack if one exists. The PRD is intentionally technology-agnostic at the product level.

### Recommended architecture principles

- Mobile-first responsive PWA.
- Local-first persistence for delivery records.
- Service/domain layer separated from UI.
- Pure calculation functions with comprehensive tests.
- Optional backend synchronization rather than making the network mandatory for basic tracking.
- Portable export/import format.
- No sensitive data sent to third parties without explicit need.

### Suggested web architecture

```text
UI
 ↓
Application services / state
 ↓
Domain model + calculation engine
 ↓
Local persistence
 ↓
Optional sync/API
```

If authentication/cloud sync is introduced, synchronization must be conflict-aware and should not make the app unusable offline.

---

## 14. Privacy & Security

Dailio should follow data minimization.

MVP should not require:

- contacts permission;
- location permission;
- microphone permission unless voice entry is explicitly enabled;
- access to messages;
- payment credentials.

If cloud sync is introduced:

- encrypt data in transit;
- use secure authentication;
- minimize server-side personal information;
- provide data export/delete controls;
- avoid selling or using household data for advertising without explicit consent.

No payment card/UPI credentials should be stored by Dailio in MVP.

---

## 15. Localization

### MVP

- INR (₹).
- Indian date conventions.
- English UI.

### Planned

- Hindi.
- Hinglish-friendly voice commands.
- Additional Indian languages based on demand.

Avoid hardcoding English strings into business logic. Use an i18n layer from the start.

---

## 16. Accessibility

Minimum requirements:

- semantic controls;
- keyboard navigation on web;
- visible focus states;
- screen-reader labels for calendar cells;
- no color-only status encoding;
- sufficient contrast;
- scalable text;
- touch-friendly controls;
- reduced-motion support;
- accessible confirmation/error messages.

Calendar cells must expose a useful accessible description, e.g.:

> “September 21, milk 1 litre delivered, newspaper delivered.”

---

## 17. Analytics

Analytics should be privacy-conscious and optional.

Recommended product events:

- `onboarding_completed`
- `service_created`
- `delivery_recorded`
- `delivery_updated`
- `bulk_entry_applied`
- `pause_period_created`
- `month_viewed`
- `billing_summary_viewed`
- `payment_recorded`
- `summary_shared`
- `export_created`
- `import_completed`
- `voice_entry_used` (future)

Do not collect delivery content or household financial details as event metadata unless strictly necessary.

---

## 18. Edge Cases

The implementation must explicitly test:

1. Month with 28/29/30/31 days.
2. Leap years.
3. Month navigation around year boundaries.
4. Rate change in the middle of a billing period.
5. Fractional milk quantities.
6. Zero quantity.
7. Missed delivery.
8. Paused delivery.
9. Unscheduled newspaper day.
10. Bulk update overlapping existing records.
11. Partial payment.
12. Payment greater than bill.
13. Deleting a service with historical records.
14. Offline record followed by app restart.
15. Importing malformed/duplicate records.
16. Device timezone changes.
17. Duplicate taps causing duplicate records.
18. Multiple delivery slots in one day if enabled later.
19. Changing default quantity without rewriting historical quantities.
20. Changing billing settings without rewriting historical bills.

---

## 19. Testing Strategy

### Unit tests

- billing calculations;
- rate selection;
- date-range logic;
- scheduled weekday logic;
- pause handling;
- payment/due calculations;
- rounding;
- import/export validation.

### Component tests

- calendar cell states;
- day editor;
- bulk editor;
- monthly summary;
- payment form.

### E2E tests

Critical flows:

1. First launch → configure milk → record today → verify calendar and bill.
2. Configure newspaper → record delivery → verify monthly count.
3. Edit a historical day.
4. Bulk update a date range.
5. Pause a range and verify billing.
6. Change rate effective next month and verify historical bill remains unchanged.
7. Record partial payment and verify due.
8. Export and import data.
9. Record while offline and reopen the app.

### Acceptance quality bar

No release should ship with unresolved correctness issues in billing calculations or data persistence.

---

## 20. MVP Acceptance Criteria

### Calendar

- [ ] Current month opens by default.
- [ ] Previous/next month navigation works.
- [ ] Every date can display milk and newspaper state.
- [ ] Today is visually identifiable without relying only on color.

### Milk

- [ ] User can configure a default quantity and rate.
- [ ] User can mark delivered/not delivered.
- [ ] User can enter a custom quantity.
- [ ] Historical records can be edited.

### Newspaper

- [ ] User can configure rate and scheduled weekdays.
- [ ] User can mark delivered/not delivered.
- [ ] Non-delivery and pause are distinct.

### Bulk entry

- [ ] User can select a date range.
- [ ] User can choose whether to overwrite existing records.
- [ ] User receives confirmation for affected existing records.

### Billing

- [ ] Monthly milk total is accurate.
- [ ] Monthly newspaper total is accurate.
- [ ] Total, paid, and due are accurate.
- [ ] Historical rates remain stable.

### Data

- [ ] Core records persist after reload/restart.
- [ ] Export can recreate the user's records.
- [ ] Invalid imports are rejected safely.

### UX

- [ ] Normal daily entry can be completed rapidly.
- [ ] Core workflow works without network access.
- [ ] Mobile layout is usable at common phone widths.

---

## 21. Roadmap

### Phase 0 — Foundation

- Repository setup.
- Design system/tokens.
- Domain model.
- Calculation engine.
- Local persistence.
- Test harness.

### Phase 1 — MVP

- Onboarding.
- Milk service.
- Newspaper service.
- Calendar.
- Day editor.
- Bulk entry.
- Pause/vacation.
- Monthly hisaab.
- Payment tracking.
- Share/export.
- Offline PWA behavior.

### Phase 2 — Convenience

- Hindi localization.
- PDF/image summary.
- Cloud backup.
- Multi-device sync.
- Better reminders.
- Multiple household members.

### Phase 3 — Smart input

- Hindi/Hinglish voice entry.
- Natural-language corrections.
- Smart detection of recurring patterns.

### Phase 4 — Expansion

Only after validation:

- Water.
- Eggs.
- Bread.
- Tiffin.
- Other recurring household deliveries.

Expansion should preserve the calendar-first interaction instead of turning Dailio into a generic accounting product.

---

## 22. Monetization Exploration

Monetization should not compromise the simple core experience.

Potential future models:

### Free core + optional Pro

Free:
- milk + newspaper;
- calendar;
- basic hisaab;
- local storage.

Pro:
- cloud sync;
- advanced export;
- multiple households;
- advanced history;
- family sharing;
- premium themes.

### One-time upgrade

A one-time purchase may fit a utility product better than an aggressive subscription, especially if the app remains lightweight.

### Ads

Avoid intrusive ads in the calendar or billing flow. If monetization is needed, evaluate whether ads damage the product's core trust and simplicity.

Monetization is **not an MVP requirement**.

---

## 23. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Market already has milk trackers | Medium | Differentiate through calendar-first simplicity and faster UX |
| Generic ledger apps can add same features | Medium | Focus on polished recurring-delivery workflow |
| Users forget to record deliveries | High | Fast entry, optional reminders, bulk correction |
| Billing disputes | High | Transparent per-day/per-litre history and stable rate versions |
| Offline data loss | High | Durable local storage, transactional writes, export/backup |
| Feature creep | High | Keep milk + newspaper as the launch boundary |
| Older users struggle with UI | Medium | Large controls, simple labels, accessible calendar |
| Privacy concerns with cloud sync | Medium | Local-first and data minimization |

---

## 24. Product Differentiation

Dailio should compete on **interaction quality**, not feature count.

### Core differentiator

> **The calendar is the product.**

A user should be able to glance at one screen and answer:

- Did milk come today?
- How much?
- Did the newspaper come?
- Which days were missed?
- How much has this month cost?
- How much is due?

The app should answer these without making the user navigate through a CRM-style dashboard.

---

## 25. Open Product Decisions Before Implementation

These decisions should be finalized during UX/technical specification:

1. Accountless-only MVP vs optional account.
2. Exact offline persistence technology based on selected stack.
3. Whether unrecorded days are excluded or assumed delivered for billing.
4. Whether milk supports morning/evening in MVP UI or only in the domain model.
5. Exact newspaper scheduling UX.
6. Whether payments are single monthly amount or multiple payment entries in MVP.
7. Whether share produces text only or text + image card.
8. Exact localization launch languages.
9. Backup/import format and versioning.
10. Whether cloud sync is part of MVP or Phase 2.

These are product decisions, not reasons to block the architecture; defaults should be chosen during implementation planning with explicit documentation.

---

## 26. Definition of Done — MVP

Dailio MVP is complete when:

- the core calendar workflow is implemented;
- milk and newspaper can be configured and recorded;
- historical and bulk edits work correctly;
- pause/vacation works correctly;
- monthly billing is deterministic and tested;
- payments and due amounts are accurate;
- data survives reload/restart;
- export/import works;
- the core experience works offline;
- mobile UX is polished;
- accessibility basics are implemented;
- critical E2E flows pass;
- no known critical/high-severity data-loss or billing bugs remain;
- documentation explains setup, architecture, domain rules, and test commands.

---

## 27. Implementation Rule

This PRD is the product source of truth. Implementation agents should read it before making product decisions.

When a feature request conflicts with this document, do not silently change product behavior. Update the relevant product specification first, record the decision, then implement against the updated specification.

The intended implementation sequence is:

**Idea validation → PRD → feature specification → UX/UI specification + design system → architecture → technical specification → data model/API specification → security → testing plan → roadmap → agent setup → implementation → testing/audit → release.**

---

## 28. Research Notes / References

The competitive research informing this PRD covered Indian milk-tracking, newspaper-delivery, and household-ledger products, including Milk Diary, Digital Doodh Diary, HouseBook, Daily Book, Paperwala, and delivery-agent software such as DailyTx/Pathrika. Public product pages and store listings were used to identify existing capabilities and recurring workflow patterns. Competitor functionality is treated as market evidence, not as a requirement to copy.

Research should be refreshed before launch because app features, pricing, store ratings, and competitor positioning can change.

---

**Document owner:** Dailio project  
**Version:** 1.0  
**Last updated:** 2026-09-21
