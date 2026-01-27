# Quick Start Guide - Profile Components

## Setup Steps

### 1. File Locations
All components are located in: `src/pages/profile/`

```
✓ Profile.jsx                      (Main component)
✓ ProfileCard.jsx                  (Presentational)
✓ AadhaarVerification.jsx          (New - Reusable)
✓ DonorProfile.jsx                 (Updated)
✓ ReceiverProfile.jsx              (Updated)
✓ VolunteerProfile.jsx             (Updated)
✓ AdminProfile.jsx                 (No changes needed)
✓ Profile.css                      (Updated with new styles)
```

### 2. Import in Your Router
```javascript
// App.jsx or routes file
import Profile from './pages/profile/Profile';

// Add to your Routes
<Route path="/profile" element={<Profile />} />
```

### 3. Verify API Configuration
Check that `src/api/api.js` is properly configured:
```javascript
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// JWT token should be attached from localStorage with key "access"
```

---

## How It Works

### Flow 1: User Views Their Profile
1. User navigates to `/profile`
2. `Profile.jsx` fetches `/api/users/profile/`
3. Based on `role`, displays appropriate component:
   - `donor` → `DonorProfile`
   - `receiver` → `ReceiverProfile`
   - `volunteer` → `VolunteerProfile`
   - `admin` → `AdminProfile`
4. Each role component shows:
   - `ProfileCard` (user info)
   - Additional contact info
   - `AadhaarVerification` (if not verified)
   - Role-specific dashboard

### Flow 2: Verify Aadhaar
1. User enters last 4 digits of Aadhaar
2. Clicks "Send OTP"
3. `AadhaarVerification` calls `POST /users/aadhaar/generate-otp/`
4. User enters received OTP
5. Clicks "Verify OTP"
6. `AadhaarVerification` calls `POST /users/aadhaar/verify-otp/`
7. On success, calls `onVerified()` callback
8. `refreshProfile()` is called, updating the profile
9. Aadhaar section now shows verified badge

### Flow 3: Edit Profile
1. User clicks "Edit Profile" on ProfileCard
2. Form appears with current values
3. User updates fields and/or uploads new picture
4. Clicks "Save Changes"
5. `Profile.jsx` sends `PUT /api/users/profile/` with multipart/form-data
6. Profile updates and edit mode closes

---

## API Contracts

### Profile Endpoints
```javascript
// Fetch profile
GET /api/users/profile/
Response: {
  id, username, email, first_name, last_name,
  role, date_of_birth, volunteer_code, address,
  phone_number, profile_picture, rating, aadhaar_verified, aadhaar_last4
}

// Update profile
PUT /api/users/profile/
Body: FormData {
  first_name, last_name, phone_number, address,
  date_of_birth, profile_picture (optional)
}
Response: Same as GET
```

### Aadhaar Endpoints
```javascript
// Generate OTP
POST /api/users/aadhaar/generate-otp/
Body: { aadhaar_last4: "1234" }
Response: { message: "OTP sent successfully" }

// Verify OTP
POST /api/users/aadhaar/verify-otp/
Body: { otp: "123456" }
Response: { message: "Verified successfully" }
```

### Role-Specific Endpoints
```javascript
// Donor
GET /api/donations/my-donations/
Response: [{ id, item_name, category, quantity, condition, status, created_at, ... }]

// Receiver
GET /api/receiver/requests/
Response: [{ id, item_name, category, quantity, condition, status, created_at, ... }]
GET /api/receiver/orders/
Response: [{ id, status, created_at, ... }]

// Volunteer
GET /api/delivery/my-tasks/
Response: [{ id, pickup_location, delivery_location, status, created_at, ... }]
```

---

## Component Props Reference

### Profile
No props (standalone component)

### ProfileCard
```javascript
{
  profile: {
    id: number,
    username: string,
    email: string,
    first_name: string,
    last_name: string,
    role: string,
    profile_picture: string | null,
    rating: number,
    aadhaar_verified: boolean,
    aadhaar_last4: string | null,
    volunteer_code: string | null
  },
  onEditClick: () => void  // Optional
}
```

### DonorProfile / ReceiverProfile / VolunteerProfile
```javascript
{
  profile: {/* same as ProfileCard */},
  refreshProfile: () => Promise<void>
}
```

### AadhaarVerification
```javascript
{
  profile: {
    aadhaar_verified: boolean,
    aadhaar_last4: string | null
  },
  onVerified: () => void  // Called after successful verification
}
```

---

## Key Features

✅ **Multi-role Support**
- Automatic role detection and component rendering
- Role-specific data and dashboards

✅ **JWT Authentication**
- Automatic token attachment to requests
- No manual header handling needed

✅ **Profile Editing**
- Inline form with preview
- Profile picture upload support
- Multipart form data handling

✅ **Aadhaar Verification**
- Two-step OTP verification
- Real-time error feedback
- Graceful state management

✅ **Error Handling**
- User-friendly error messages
- Server error display
- Loading states

✅ **Responsive Design**
- Mobile-friendly layouts
- Flexible grid system
- Touch-friendly controls

---

## Styling

### Color Scheme
- Primary: `#667eea` to `#764ba2` (gradient)
- Success: `#28a745`, `#d4edda`
- Error: `#dc3545`, `#f8d7da`
- Neutral: `#2c3e50` (text), `#e0e0e0` (borders)

### Key CSS Classes
- `.profile-container` - Main wrapper
- `.profile-card` - User info card
- `.role-profile` - Role-specific section
- `.stats-grid` - Statistics layout
- `.aadhaar-section` - Aadhaar verification section
- `.btn-primary` - Primary buttons
- `.btn-secondary` - Secondary buttons
- `.error-message` - Error display

All styles are in `Profile.css` - no external CSS libraries needed.

---

## Debugging Tips

### 1. Token Not Sent
- Check localStorage has key `"access"` with JWT token
- Verify `src/api/api.js` has correct interceptor setup

### 2. Profile Not Loading
- Check network tab for `/api/users/profile/` response
- Verify backend returns all required fields
- Check console for auth errors

### 3. Aadhaar Verification Fails
- Verify OTP endpoint is `/api/users/aadhaar/verify-otp/`
- Check backend generates and validates OTP correctly
- Check error messages from backend for specifics

### 4. Styles Not Applied
- Verify `Profile.css` is imported in `Profile.jsx`
- Check CSS class names match JSX classNames
- Clear browser cache

### 5. Role Component Not Showing
- Verify `profile.role` has correct value
- Check role matches conditional (donor/receiver/volunteer/admin)
- Verify role component file exists and is imported

---

## Testing the Components

### Manual Testing Steps

1. **View Profile**
   - Navigate to `/profile`
   - Should see profile card with user info
   - Should see role-specific dashboard

2. **Edit Profile**
   - Click "Edit Profile"
   - Change a field value
   - Upload a profile picture
   - Click "Save Changes"
   - Changes should persist

3. **Verify Aadhaar (if not verified)**
   - Scroll to Aadhaar section
   - Enter last 4 digits: `1234`
   - Click "Send OTP"
   - Should see OTP input
   - Enter OTP: `123456` (adjust per your backend)
   - Click "Verify OTP"
   - Should show success badge

4. **Check Role-Specific Data**
   - Verify donation/request/task list loads
   - Verify statistics calculate correctly
   - Verify empty states show when no data

---

## Performance Considerations

✅ **Optimized Re-renders**
- `useCallback` prevents unnecessary function recreations
- Proper dependency arrays in `useEffect`

✅ **Lazy Loading**
- Role-specific data only fetched in respective components
- No unnecessary API calls

✅ **File Size**
- Reusable components reduce duplication
- Single CSS file for all profiles

---

## Future Enhancements

- Add image compression for profile pictures
- Implement profile update notifications
- Add activity history
- Add profile completion percentage
- Add role change requests
- Add backup Aadhaar verification methods

---

## Support & Troubleshooting

For issues, check:
1. Browser console for errors
2. Network tab for API responses
3. Backend logs for server errors
4. JWT token validity
5. CORS configuration
6. API endpoint paths

All components follow React best practices and should work seamlessly with a compliant Django REST backend.
