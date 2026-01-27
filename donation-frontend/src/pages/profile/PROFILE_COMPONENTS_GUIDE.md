# React Profile Components - Complete Implementation Guide

## Overview
A complete React frontend implementation for user profile management with JWT authentication, role-based dashboards, and Aadhaar verification.

---

## Components Created/Updated

### 1. **Profile.jsx** (Main Container)
**Location:** `src/pages/profile/Profile.jsx`

**Responsibilities:**
- Fetches user profile from `/api/users/profile/`
- Manages profile editing with multipart form data
- Displays role-based sub-components
- Contains shared Aadhaar verification UI

**Key Features:**
- Profile data caching in state
- Profile picture upload handling
- Edit mode toggle
- `fetchProfile` callback exported to child components
- Error and loading states

**Props:** None (uses React Context/localStorage for auth)

**Child Components:**
- `ProfileCard` - Display user info
- Role-specific components: `DonorProfile`, `ReceiverProfile`, `VolunteerProfile`, `AdminProfile`
- `AadhaarVerification` - Aadhaar verification UI

---

### 2. **ProfileCard.jsx** (Pure Presentational)
**Location:** `src/pages/profile/ProfileCard.jsx`

**Responsibilities:**
- Display user profile information in card format
- Show profile picture with role emoji fallback
- Display name, email, role, and rating

**Props:**
```javascript
{
  profile: {
    id, username, email, first_name, last_name,
    role, date_of_birth, volunteer_code, address,
    phone_number, profile_picture, rating, aadhaar_verified, aadhaar_last4
  },
  onEditClick: function
}
```

**Features:**
- Role-based emoji display
- Star rating visualization
- Conditional fields rendering
- Edit button callback

---

### 3. **AadhaarVerification.jsx** (Reusable)
**Location:** `src/pages/profile/AadhaarVerification.jsx`

**Responsibilities:**
- Handle Aadhaar verification workflow
- Manage OTP generation and verification
- Provide error handling and validation

**Props:**
```javascript
{
  profile: {
    aadhaar_verified: boolean,
    aadhaar_last4: string | null
  },
  onVerified: function (callback after successful verification)
}
```

**Workflow:**
1. If verified → Show success badge with Aadhaar last 4 digits
2. If not verified → Show Aadhaar input
3. After OTP send → Show OTP input
4. On successful verification → Call `onVerified()` callback

**API Calls:**
- `POST /users/aadhaar/generate-otp/` - Send OTP
- `POST /users/aadhaar/verify-otp/` - Verify OTP

**Validation:**
- Aadhaar: Only 4 digits
- OTP: Only 6 digits
- Real-time error messages from backend

---

### 4. **DonorProfile.jsx** (Role-Specific)
**Location:** `src/pages/profile/DonorProfile.jsx`

**Responsibilities:**
- Display donor-specific dashboard
- Show donation statistics and history
- Include profile info and Aadhaar verification

**Props:**
```javascript
{
  profile: {...},
  refreshProfile: function
}
```

**Features:**
- Profile card display
- Additional contact info (phone, address)
- Aadhaar verification component
- Donation statistics grid (Total, Pending, Verified, Delivered)
- Recent donations list (last 5)

**API Integration:**
- `GET /donations/my-donations/` - Fetch donations

---

### 5. **ReceiverProfile.jsx** (Role-Specific)
**Location:** `src/pages/profile/ReceiverProfile.jsx`

**Responsibilities:**
- Display receiver-specific dashboard
- Show item requests and orders
- Include profile info and Aadhaar verification

**Props:**
```javascript
{
  profile: {...},
  refreshProfile: function
}
```

**Features:**
- Profile card display
- Additional contact info (phone, address)
- Aadhaar verification component
- Request statistics grid (Total, Approved, Completed, Items Received)
- Recent requests list
- Orders section

**API Integration:**
- `GET /receiver/requests/` - Fetch requests
- `GET /receiver/orders/` - Fetch orders

---

### 6. **VolunteerProfile.jsx** (Role-Specific)
**Location:** `src/pages/profile/VolunteerProfile.jsx`

**Responsibilities:**
- Display volunteer-specific dashboard
- Show delivery tasks and rating
- Display volunteer code

**Props:**
```javascript
{
  profile: {...},
  refreshProfile: function
}
```

**Features:**
- Profile card display
- Additional contact info (phone, address)
- Aadhaar verification component
- Volunteer code display
- Task statistics grid (Total, Completed, Pending, Rating)
- Delivery tasks list

**API Integration:**
- `GET /delivery/my-tasks/` - Fetch assigned tasks

---

### 7. **ProfileCard.jsx** (Already Existed)
**Location:** `src/pages/profile/ProfileCard.jsx`

No changes needed - component already implements all requirements:
- Pure presentational component
- Displays profile picture with fallback emoji
- Shows name, email, role, rating
- Conditional rendering of optional fields

---

## Complete Data Flow

```
┌─────────────────┐
│  Profile.jsx    │ ← Fetches from /api/users/profile/
└────────┬────────┘
         │
         ├─→ ProfileCard (displays user info)
         │
         ├─→ Role-Specific Component (choose based on role)
         │   ├─ DonorProfile
         │   ├─ ReceiverProfile
         │   ├─ VolunteerProfile
         │   └─ AdminProfile
         │
         └─→ AadhaarVerification (within Profile + Role component)
             ├─ POST /users/aadhaar/generate-otp/
             └─ POST /users/aadhaar/verify-otp/
```

---

## API Endpoints Used

### User Profile
- `GET /api/users/profile/` - Fetch current user profile
- `PUT /api/users/profile/` - Update profile (multipart/form-data)

### Aadhaar Verification
- `POST /api/users/aadhaar/generate-otp/` - Generate OTP
  - Body: `{ aadhaar_last4: string }`
- `POST /api/users/aadhaar/verify-otp/` - Verify OTP
  - Body: `{ otp: string }`

### Role-Specific (Donor)
- `GET /api/donations/my-donations/` - Fetch user's donations

### Role-Specific (Receiver)
- `GET /api/receiver/requests/` - Fetch item requests
- `GET /api/receiver/orders/` - Fetch orders

### Role-Specific (Volunteer)
- `GET /api/delivery/my-tasks/` - Fetch assigned tasks

---

## CSS Classes & Styling

### Core Classes
- `.profile-container` - Main container
- `.profile-card` - Profile card wrapper
- `.role-profile` - Role-specific section
- `.aadhaar-section` - Aadhaar verification section
- `.stats-grid` - Statistics grid layout
- `.form-group` - Form field wrapper
- `.btn-primary`, `.btn-secondary` - Button styles

### New Classes Added
- `.profile-card-section` - Card section in role profiles
- `.donor-info`, `.receiver-info`, `.volunteer-info-section` - Additional info sections
- `.info-item` - Individual info item
- `.aadhaar-verified-badge` - Verified Aadhaar display
- `.input-wrapper` - Input group wrapper
- `.otp-hint` - OTP hint text
- `.btn-secondary-small` - Small secondary button
- `.error-message.error-inline` - Inline error message

---

## State Management

### Profile.jsx State
```javascript
profile              // User profile object
loading              // Loading state
error                // Error message
isEditing            // Edit mode toggle
isSaving             // Saving status
formData             // Edit form data
profilePicture       // File for upload
```

### AadhaarVerification.jsx State
```javascript
aadhaarLast4         // Last 4 digits input
otpSent              // OTP sent flag
otp                  // OTP input
loading              // Loading state
error                // Error message
```

### DonorProfile/ReceiverProfile/VolunteerProfile State
```javascript
[donations/requests/tasks]  // Data from API
stats                       // Calculated statistics
loading                     // Loading state
```

---

## Best Practices Implemented

✅ **React Hooks**
- `useState` for local state
- `useEffect` for side effects
- `useCallback` for memoized callbacks

✅ **Clean Architecture**
- Separated concerns (presentation vs. logic)
- Reusable `AadhaarVerification` component
- Pure presentational `ProfileCard`

✅ **API Integration**
- Centralized axios instance with JWT
- No hardcoded URLs
- Error handling with user feedback

✅ **No Unnecessary Re-renders**
- `useCallback` for `fetchProfile`
- Proper dependency arrays in `useEffect`

✅ **Input Validation**
- Client-side validation before API calls
- Server error message display
- Digit-only input filtering

✅ **Error Handling**
- Try-catch blocks with meaningful messages
- User-friendly error display
- Loading states during API calls

✅ **UI/UX**
- Clear visual feedback
- Disabled states on buttons
- Loading indicators
- Success/error messages
- Responsive design

---

## Usage Example

```jsx
// In your routing setup
import Profile from './pages/profile/Profile';

// Routes
<Route path="/profile" element={<Profile />} />

// The Profile component handles everything:
// 1. Fetches current user profile
// 2. Displays role-appropriate dashboard
// 3. Allows profile editing
// 4. Provides Aadhaar verification
```

---

## Testing Checklist

- [ ] Profile loads and displays correct role
- [ ] Edit profile updates all fields
- [ ] Profile picture upload works
- [ ] Aadhaar OTP generation succeeds
- [ ] OTP verification updates profile
- [ ] Error messages display correctly
- [ ] Loading states appear/disappear
- [ ] Role-specific data (donations/requests/tasks) loads
- [ ] Mobile responsive layout works
- [ ] JWT token is sent with all requests

---

## Notes

1. **JWT Authentication:** Token from localStorage is automatically attached to all requests via axios interceptor
2. **Profile Picture:** Uploaded as multipart/form-data
3. **Aadhaar Verification:** Two-step process (OTP generation → OTP verification)
4. **Role-Based Rendering:** Automatic based on user.role
5. **Refresh Callback:** `refreshProfile` passed to role components to refresh after Aadhaar verification
