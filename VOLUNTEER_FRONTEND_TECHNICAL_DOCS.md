# Volunteer Frontend - Technical Documentation

## Architecture Overview

```
VolunteerLayout (Main Container)
├── Sidebar Navigation
│   ├── Dashboard link → VolunteerHome
│   ├── All Tasks link → VolunteerTasks
│   └── History link → VolunteerHistory
└── Main Content Area (Outlet)
    ├── VolunteerHome (Dashboard)
    ├── VolunteerTasks (Task Management)
    └── VolunteerHistory (History & Analytics)
```

## Component Structure

### **VolunteerLayout.jsx**
**Purpose:** Main layout wrapper with sidebar navigation
**Props:** None
**State:** None (uses React Router useLocation hook)
**Features:**
- Responsive sidebar with icon navigation
- Active link highlighting based on current route
- Sticky sidebar on desktop
- Collapsible on mobile

**Key Functions:**
- `isActive(path)` - Determines if a nav link is active

---

### **VolunteerHome.jsx**
**Purpose:** Dashboard with stats and active deliveries
**Props:** None
**State:**
```javascript
{
  stats: {
    activeDeliveries: number,
    completedDeliveries: number,
    failedDeliveries: number,
    averageRating: number
  },
  activeDeliveries: array,
  volunteerInfo: object,
  loading: boolean
}
```

**API Calls:**
- `GET /api/delivery/volunteer/deliveries/` - Fetch all deliveries
- `GET /api/delivery/volunteer/ratings/` - Fetch volunteer ratings

**Key Functions:**
- `fetchDashboardData()` - Load data on component mount
- `handleStatusUpdate(deliveryId, newStatus)` - Update delivery status

**Features:**
- Auto-refresh data on component load
- Status transition with error handling
- Quick action navigation

---

### **VolunteerTasks.jsx**
**Purpose:** Comprehensive task table with expandable details
**Props:** None
**State:**
```javascript
{
  allDeliveries: array,
  loading: boolean,
  expandedId: number,
  sortBy: 'scheduled' | 'status' | 'recent',
  sortedDeliveries: array
}
```

**API Calls:**
- `GET /api/delivery/volunteer/deliveries/` - Fetch deliveries
- `PATCH /api/delivery/deliveries/{id}/status/` - Update status

**Key Functions:**
- `fetchAllTasks()` - Load all deliveries
- `applySort()` - Sort deliveries based on selected criteria
- `handleStatusUpdate()` - Update delivery status
- `getStatusActions(status)` - Get available actions for status

**Features:**
- Three sort options (Scheduled, Status, Recently Updated)
- Expandable rows with full details
- Context-aware action buttons
- Task summary statistics

**Sorting Logic:**
```javascript
// Scheduled: by scheduled_pickup date
// Status: Assigned → En Route → Picked → Delivered → Failed
// Recent: by updated_at timestamp (newest first)
```

---

### **VolunteerHistory.jsx**
**Purpose:** Filtered history view of all deliveries
**Props:** None
**State:**
```javascript
{
  deliveries: array,
  filteredDeliveries: array,
  filter: 'all' | 'completed' | 'failed',
  loading: boolean,
  selectedDelivery: object
}
```

**API Calls:**
- `GET /api/delivery/volunteer/deliveries/` - Fetch all deliveries

**Key Functions:**
- `fetchDeliveryHistory()` - Load history on mount
- `applyFilter()` - Filter deliveries based on status
- `getDeliveryTimeline(delivery)` - Generate timeline for delivery

**Features:**
- Three filter options (All, Completed, Failed)
- Expandable delivery cards
- Timeline generation
- Failure reason display

---

## API Integration

### Base API Configuration
```javascript
// api.js - Axios instance
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// Auto-attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Available Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/delivery/volunteer/deliveries/` | List all deliveries for volunteer | Required |
| PATCH | `/delivery/deliveries/{id}/status/` | Update delivery status | Required |
| GET | `/delivery/volunteer/ratings/` | Get volunteer ratings/performance | Required |

### Response Formats

**Get Deliveries Response:**
```json
[
  {
    "id": 1,
    "status": "assigned",
    "donation": {
      "id": 1,
      "item_name": "Books",
      "category": "Education",
      "quantity": 5,
      "condition": "new",
      "used_duration_months": null
    },
    "pickup_address": "123 Main St",
    "drop_address": "456 Oak Ave",
    "scheduled_pickup": "2026-01-22T10:00:00Z",
    "actual_pickup": null,
    "actual_delivery": null,
    "created_at": "2026-01-22T08:00:00Z",
    "updated_at": "2026-01-22T08:00:00Z"
  }
]
```

**Update Status Response:**
```json
{
  "id": 1,
  "status": "en_route",
  "updated_at": "2026-01-22T09:00:00Z"
}
```

**Get Ratings Response:**
```json
{
  "average_rating": 4.5,
  "total_ratings": 10,
  "volunteer_id": 1,
  "volunteer_code": "VOL-001"
}
```

---

## Status Transition Logic

### Allowed Transitions

```
Backend Validation (ALLOWED_STATUS_TRANSITIONS):
{
  'assigned': ['en_route'],
  'en_route': ['picked', 'failed'],
  'picked': ['delivered', 'failed'],
  'delivered': [],
  'failed': []
}
```

### Error Handling

**Error Scenarios:**
1. **Terminal State Update:** Trying to change from 'delivered' or 'failed'
   - Response: 400 Bad Request
   - Message: "Delivery already [status]. Status cannot be changed."

2. **Invalid Transition:** Trying to transition to non-allowed status
   - Response: 400 Bad Request
   - Message: "Invalid status transition from '[current]' to '[new]'"

3. **Duplicate Status:** Updating to same status
   - Response: 400 Bad Request
   - Message: "Delivery is already in this status"

**Frontend Error Handling:**
```javascript
catch (error) {
  console.error("Failed to update status:", error);
  alert("Error: " + (error.response?.data?.error || "Could not update status"));
}
```

---

## Styling Architecture

### CSS Variables & Theme
```css
Primary Colors:
  - Purple/Blue Gradient: #667eea → #764ba2
  - Success Green: #43e97b → #38f9d7
  - Danger Red: #f5576c → #fd549f
  - Info Blue: #4facfe → #00f2fe

Neutral Colors:
  - Dark Text: #2c3e50
  - Medium Text: #555
  - Light Text: #7f8c8d
  - Background: #f5f6fa
  - Card Background: white
  - Border: #e9ecef

Status Colors:
  - Assigned: #fff3cd (Yellow)
  - En Route: #cce5ff (Blue)
  - Picked: #d1ecf1 (Cyan)
  - Delivered: #d4edda (Green)
  - Failed: #f8d7da (Red)
```

### Responsive Breakpoints
```css
Mobile: max-width: 480px
Tablet: max-width: 768px
Desktop: max-width: 1024px+

Sidebar Behavior:
- Desktop: Fixed 250px sidebar, main content flexes
- Mobile: Full-width layout, sidebar above content
```

---

## Performance Optimizations

1. **Data Fetching:**
   - Single API call on component mount
   - Manual refresh only on user action

2. **Rendering:**
   - React.Fragment for efficient list rendering
   - Conditional rendering for expanded rows
   - Memoization for status translation

3. **Sorting:**
   - Client-side sorting (no additional API calls)
   - Efficient array operations

---

## Security Considerations

1. **Authentication:**
   - JWT token stored in localStorage
   - Auto-attached to all API requests
   - Protected routes with role verification

2. **Authorization:**
   - Backend enforces volunteer-only access
   - `IsVolunteerAndAssigned` permission class
   - Users can only see their own deliveries

3. **Data Validation:**
   - Status transition validation on backend
   - Error messages don't expose sensitive info

---

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

---

## Accessibility Features

1. **Semantic HTML:** Proper heading hierarchy
2. **Color Contrast:** WCAG AA compliant
3. **Navigation:** Keyboard accessible nav links
4. **Buttons:** Clear button labels and states
5. **Forms:** Proper labeling and feedback

---

## Development Guidelines

### Adding New Features

1. **New Component:**
   - Create .jsx file in appropriate directory
   - Create corresponding .css file
   - Import and add route in App.jsx
   - Use existing patterns for consistency

2. **New API Endpoint:**
   - Use existing `api` instance from api.js
   - Handle errors gracefully
   - Update API documentation

3. **Styling:**
   - Follow existing color scheme
   - Use gradient backgrounds for primary actions
   - Mobile-first responsive design

### Code Style
- Use React hooks (useState, useEffect)
- Arrow functions for handlers
- Destructuring for props
- Comments for complex logic

---

## Testing Checklist

- [ ] All routes accessible and display correctly
- [ ] Sidebar navigation works on mobile
- [ ] Status updates refresh data correctly
- [ ] Error messages display on failed updates
- [ ] Expandable rows expand/collapse smoothly
- [ ] Sorting works for all options
- [ ] Filters work correctly
- [ ] Responsive design on 480px, 768px, 1024px widths
- [ ] Loading states appear while fetching
- [ ] Empty states display when no data
- [ ] Page refresh maintains scroll position
- [ ] Token included in all API requests

---

## Future Enhancements

1. **Real-time Updates:**
   - WebSocket integration for live delivery updates
   - Push notifications for new assignments

2. **Advanced Features:**
   - GPS tracking on map
   - Proof of delivery with photos
   - Route optimization suggestions
   - Offline delivery sync

3. **Analytics:**
   - Performance trends over time
   - Delivery time analytics
   - Income/incentive tracking

4. **User Experience:**
   - Dark mode support
   - Keyboard shortcuts
   - Progressive Web App (PWA)
   - Multi-language support

---

**Documentation Created:** January 22, 2026
**Version:** 1.0
**Status:** Complete
