# Volunteer Frontend - Quick Reference Guide

## 📱 Pages Overview

### 1. **Dashboard** (`/dashboard/volunteer`)
**What:** Main landing page for volunteers
**Shows:**
- Active delivery count with quick status
- Completed & failed delivery stats
- Average performance rating
- List of currently assigned deliveries
- Quick action buttons to update status

**Key Functions:**
- View active deliveries
- Update delivery status (Assigned → En Route → Picked → Delivered)
- Mark deliveries as failed

---

### 2. **All Tasks** (`/dashboard/volunteer/tasks`)
**What:** Comprehensive table view of all assignments
**Features:**
- Sortable by: Scheduled Time, Status, Recently Updated
- Expandable rows for full details
- Shows: ID, Item, Status, Scheduled time, Routes

**Expand Row to See:**
- Full pickup address
- Full drop address
- Item details (category, quantity, condition)
- Failure reasons (if failed)
- Actual pickup/delivery timestamps
- Status update buttons

---

### 3. **History** (`/dashboard/volunteer/tasks`)
**What:** Filtered view of past deliveries
**Filter Options:**
- All deliveries
- Completed only
- Failed only

**Each Card Shows:**
- Delivery ID & Status
- Item name & Category
- Scheduled pickup date

**Click to Expand:**
- Pickup location & actual pickup time
- Drop location & actual delivery time
- Item condition & usage
- Failure reasons
- All timestamps

---

## 🔄 Delivery Status Flow

```
┌─────────────────────────────────────┐
│  Status Transitions & Actions       │
├─────────────────────────────────────┤
│ Assigned                            │
│  └─→ 🚗 Mark En Route              │
│                                     │
│ En Route                            │
│  ├─→ 📦 Picked Up                  │
│  └─→ ❌ Failed                     │
│                                     │
│ Picked                              │
│  ├─→ ✅ Delivered (Complete!)     │
│  └─→ ❌ Failed                     │
│                                     │
│ Delivered / Failed → No changes    │
└─────────────────────────────────────┘
```

---

## 🎨 Color Coding

| Status | Color | Meaning |
|--------|-------|---------|
| Assigned | Yellow | Waiting for pickup |
| En Route | Blue | On the way to pickup |
| Picked | Cyan | Item picked up, going to delivery |
| Delivered | Green | Successfully completed ✅ |
| Failed | Red | Could not complete ❌ |

---

## 📊 Stats Card Meanings

| Card | What It Shows | Icon |
|------|---------------|------|
| Active Deliveries | Count of In-Progress tasks | 🚚 |
| Completed | Deliveries successfully delivered | ✅ |
| Failed | Deliveries that couldn't be completed | ❌ |
| Avg Rating | Your performance rating from receivers | ⭐ |

---

## 🎯 Common Tasks

### Update a Delivery Status
1. **Quick:** Home page → Find delivery → Click button
2. **Detailed:** Tasks page → Click row to expand → Click action button
3. **View History:** History page → Filter by status → Click to expand

### Check Specific Delivery Details
- **Dashboard:** Shows brief info
- **Tasks:** Full details when expanded
- **History:** Past delivery records with timestamps

### View Your Performance
- **Dashboard:** See average rating & completed deliveries
- **Stats:** Active/completed/failed counts

### Find Failed Deliveries
1. Go to **History**
2. Filter: **Failed**
3. Click card to expand
4. View **Failure Reason**

---

## 🔑 Key Information Fields

### Pickup Details
- Pickup Address
- Scheduled Pickup Time
- Actual Pickup Time

### Drop Details
- Drop Address
- Actual Delivery Time
- Item Received Status

### Item Information
- Item Name
- Category
- Quantity
- Condition (New/Used)
- Used Duration (if used)

### Performance
- Volunteer Code (e.g., VOL-001)
- Average Rating (⭐ out of 5)
- Completed Deliveries
- Failed Deliveries

---

## ⚠️ Important Notes

1. **Terminal States:** Once a delivery is "Delivered" or "Failed", you cannot change its status
2. **Status Validation:** You can only transition to valid next statuses
3. **Timestamps:** Auto-recorded when you update status
4. **Ratings:** Based on receiver feedback only
5. **Volunteer Code:** Unique identifier assigned to you

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't update status | Check if delivery is in correct status for transition |
| Data not loading | Refresh page or check internet connection |
| "Can't change status" error | Delivery already completed/failed - terminal state |
| Missing deliveries | Check filters or wait for new assignments |
| Wrong stats | Page caches - try refreshing |

---

## 📌 Pro Tips

1. **Use Tasks page** for detailed work - it shows everything
2. **Use Dashboard** for quick overview and active tasks
3. **Use History** to review past performance
4. **Check status colors** for quick identification
5. **Expand rows** in Tasks page for full address details
6. **Sort by "Scheduled Time"** to see urgent deliveries first

---

## 🚀 Workflow Example

1. **Start day:** Go to Dashboard → See active deliveries
2. **Start route:** Go to Tasks → Mark as "En Route"
3. **Pick up:** Once at pickup location → Mark as "Picked"
4. **On the way:** Status shows "Picked"
5. **At destination:** Mark as "Delivered"
6. **End of day:** Go to History → Review completions
7. **Check rating:** Dashboard shows your average rating

---

**Need Help?** Scroll to sidebar footer for support options
**Last Updated:** January 22, 2026
