# React Profile Components - Visual Reference

## Component Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Profile.jsx                              │
│                   (Main Container)                              │
│                                                                 │
│  • Fetches: GET /api/users/profile/                             │
│  • Updates: PUT /api/users/profile/                             │
│  • State: profile, loading, error, formData, isEditing          │
│  • Callback: fetchProfile (useCallback)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌────────────┐  ┌────────────────┐  ┌──────────────────┐
    │ProfileCard │  │Role Component  │  │AadhaarVerif.     │
    │            │  │Conditional     │  │(Profile Level)   │
    │• Picture   │  │Render          │  │                  │
    │• Name      │  │(Donor/Rec/Vol) │  │• OTP Generation  │
    │• Email     │  │                │  │• OTP Verification│
    │• Role      │  └────────────────┘  │• Verified Badge  │
    │• Rating    │         │             └──────────────────┘
    └────────────┘         │
                           │
        ┌──────────────────┼──────────────────┬──────────────┐
        │                  │                  │              │
        ▼                  ▼                  ▼              ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐
    │DonorProfile  │  │ReceiverProfile│  │VolunteerProf.│  │AdminProfile
    │              │  │               │  │              │  │
    │• ProfileCard │  │• ProfileCard  │  │• ProfileCard │  │• Stats
    │• Contact     │  │• Contact Info │  │• Contact Info│  │• Users
    │• Aadhaar     │  │• Aadhaar      │  │• Aadhaar     │  │
    │• Donations   │  │• Requests     │  │• Tasks       │  │
    │• Statistics  │  │• Orders       │  │• Statistics  │  │
    └──────────────┘  └──────────────┘  └──────────────┘  └───────────┘
```

---

## Data Flow Diagram

```
User Login
    │
    └─► JWT Token (localStorage: "access")
         │
         └─► Profile.jsx
              │
              ├─► fetch GET /api/users/profile/
              │    │
              │    └─► setProfile(data)
              │
              ├─► Determine Role
              │    ├─ "donor" → render DonorProfile
              │    ├─ "receiver" → render ReceiverProfile
              │    ├─ "volunteer" → render VolunteerProfile
              │    └─ "admin" → render AdminProfile
              │
              ├─► Pass Props:
              │    ├─ profile: {...}
              │    └─ refreshProfile: fetchProfile()
              │
              └─► Show AadhaarVerification
                   │
                   ├─ Is verified? YES → Show Badge
                   │
                   └─ Is verified? NO
                       │
                       ├─ Step 1: Input Aadhaar (4 digits)
                       │
                       ├─ POST /api/users/aadhaar/generate-otp/
                       │    └─► OTP Sent
                       │
                       ├─ Step 2: Input OTP (6 digits)
                       │
                       ├─ POST /api/users/aadhaar/verify-otp/
                       │    │
                       │    └─► Success
                       │         │
                       │         └─► Call refreshProfile()
                       │              │
                       │              └─► fetchProfile()
                       │                   │
                       │                   └─► Update State
                       │                        │
                       │                        └─► Show Badge
                       │
                       └─ On Error
                           └─► Show Error Message
```

---

## State Management Flow

```
Profile Component State:
┌─────────────────────────────────────┐
│ profile: {                          │
│   id, username, email,              │
│   role, first_name, last_name,      │
│   phone_number, address,            │
│   profile_picture, rating,          │
│   aadhaar_verified, aadhaar_last4   │
│ }                                   │
│                                     │
│ loading: boolean                    │
│ error: string | null                │
│ isEditing: boolean                  │
│ isSaving: boolean                   │
│ formData: {...}                     │
│ profilePicture: File | null         │
└─────────────────────────────────────┘
        │
        └─► DonorProfile State:
            ├─ donations: []
            ├─ stats: { total, pending, verified, delivered }
            └─ loading: boolean
        
        └─► ReceiverProfile State:
            ├─ requests: []
            ├─ orders: []
            ├─ stats: { requests, approved, completed, items_received }
            └─ loading: boolean
        
        └─► VolunteerProfile State:
            ├─ tasks: []
            ├─ stats: { volunteer_code, total_tasks, completed, pending, rating }
            └─ loading: boolean
        
        └─► AadhaarVerification State:
            ├─ aadhaarLast4: string
            ├─ otpSent: boolean
            ├─ otp: string
            ├─ loading: boolean
            └─ error: string
```

---

## Props Hierarchy

```
Profile (No Props)
│
├─► DonorProfile
│   ├─ profile: ProfileObject
│   └─ refreshProfile: () => void
│       │
│       └─► ProfileCard
│           ├─ profile: ProfileObject
│           └─ onEditClick?: () => void
│
│       └─► AadhaarVerification
│           ├─ profile: { aadhaar_verified, aadhaar_last4 }
│           └─ onVerified: () => void
│
├─► ReceiverProfile
│   ├─ profile: ProfileObject
│   └─ refreshProfile: () => void
│       └─► (Same structure as DonorProfile)
│
├─► VolunteerProfile
│   ├─ profile: ProfileObject
│   └─ refreshProfile: () => void
│       └─► (Same structure as DonorProfile)
│
├─► AdminProfile
│   └─ profile: ProfileObject
│
└─► AadhaarVerification (Profile Level)
    ├─ profile: { aadhaar_verified, aadhaar_last4 }
    └─ onVerified: () => void
```

---

## API Call Sequence Diagram

```
PROFILE FETCH
─────────────
User Visits /profile
    │
    └─► Profile.jsx useEffect
         │
         └─► API Request: GET /users/profile/
              │
              ├─ Header: Authorization: Bearer {token}
              │
              └─► Response: { id, username, email, role, ... }
                   │
                   └─► setProfile(data)
                        │
                        └─► Render based on role

PROFILE EDIT
────────────
User Clicks Edit
    │
    └─► Form appears with current values
         │
         └─► User changes fields
              │
              └─► User clicks Save
                   │
                   └─► API Request: PUT /users/profile/ (multipart)
                        │
                        ├─ Header: Authorization: Bearer {token}
                        ├─ Header: Content-Type: multipart/form-data
                        ├─ Body: { first_name, last_name, phone_number, address, date_of_birth, profile_picture }
                        │
                        └─► Response: Updated profile object
                             │
                             └─► setProfile(updatedData)
                                  │
                                  └─► Close edit form

AADHAAR VERIFICATION
────────────────────
User Not Verified
    │
    └─► Enter Last 4 Digits
         │
         └─► Click Send OTP
              │
              └─► API Request: POST /users/aadhaar/generate-otp/
                   │
                   ├─ Header: Authorization: Bearer {token}
                   ├─ Body: { aadhaar_last4: "1234" }
                   │
                   └─► Response: { message: "OTP sent" }
                        │
                        └─► Show OTP Input
                             │
                             └─► User Enters OTP
                                  │
                                  └─► Click Verify OTP
                                       │
                                       └─► API Request: POST /users/aadhaar/verify-otp/
                                            │
                                            ├─ Header: Authorization: Bearer {token}
                                            ├─ Body: { otp: "123456" }
                                            │
                                            └─► Response: { message: "Verified" }
                                                 │
                                                 └─► Call refreshProfile()
                                                      │
                                                      └─► Profile reloads with aadhaar_verified: true
                                                           │
                                                           └─► Show Verified Badge
```

---

## Component Lifecycle

```
Profile Component
├─► Mount
│   ├─► useEffect
│   │   └─► fetchProfile()
│   │       └─► API call
│   │           └─► setProfile
│   │               └─► Render
│   │
│   └─► Initial Render
│       └─► Show Loading State
│
├─► Update
│   ├─► User Clicks Edit
│   │   └─► setIsEditing(true)
│   │       └─► Show Edit Form
│   │
│   ├─► User Updates Profile
│   │   └─► saveProfile()
│   │       ├─► setIsSaving(true)
│   │       ├─► API call
│   │       ├─► setProfile (new data)
│   │       ├─► setIsEditing(false)
│   │       └─► setIsSaving(false)
│   │           └─► Render updated state
│   │
│   └─► User Verifies Aadhaar
│       └─► AadhaarVerification.onVerified()
│           └─► fetchProfile()
│               └─► API call
│                   └─► Update profile
│
└─► Unmount
    └─► Clean up (if any)
```

---

## Styling Hierarchy

```
Profile.css
├─── .profile-container
│    ├─── .profile-card
│    │    ├─── .profile-header
│    │    │    ├─── .profile-avatar
│    │    │    │    └─── .avatar-image / .avatar-emoji
│    │    │    └─── .profile-info
│    │    └─── .profile-details
│    │         └─── .detail-row
│    │
│    ├─── .role-profile
│    │    ├─── .profile-card-section
│    │    ├─── .donor-info / .receiver-info / .volunteer-info-section
│    │    │    └─── .info-item
│    │    ├─── .aadhaar-section
│    │    └─── .stats-grid
│    │
│    ├─── .profile-edit-form
│    │    ├─── .form-group
│    │    │    └─── .form-input
│    │    └─── .form-actions
│    │
│    ├─── .aadhaar-section
│    │    ├─── .aadhaar-verified-badge
│    │    ├─── .aadhaar-form
│    │    └─── .input-group
│    │
│    └─── .btn-primary / .btn-secondary
```

---

## CSS Class Selector Map

| Class | Purpose | Component |
|-------|---------|-----------|
| `.profile-container` | Main wrapper | Profile |
| `.profile-card` | Card display | ProfileCard |
| `.profile-card-section` | Card in role | All role components |
| `.donor-info`, `.receiver-info` | Contact section | Role components |
| `.info-item` | Single info | Role components |
| `.aadhaar-section` | Verification area | Profile + AadhaarVerification |
| `.aadhaar-verified-badge` | Success state | AadhaarVerification |
| `.aadhaar-form` | Form area | AadhaarVerification |
| `.input-wrapper` | Input group | AadhaarVerification |
| `.otp-hint` | Helper text | AadhaarVerification |
| `.error-message` | Error display | AadhaarVerification |
| `.btn-primary` | Primary button | All components |
| `.btn-secondary` | Secondary button | All components |

---

## File Import Dependencies

```
Profile.jsx
├─ React (useEffect, useState, useCallback)
├─ api (axios instance)
├─ ./Profile.css (all styles)
├─ ./ProfileCard.jsx
├─ ./DonorProfile.jsx
├─ ./ReceiverProfile.jsx
├─ ./VolunteerProfile.jsx
├─ ./AdminProfile.jsx
└─ ./AadhaarVerification.jsx

DonorProfile.jsx / ReceiverProfile.jsx / VolunteerProfile.jsx
├─ React (useEffect, useState)
├─ api (axios instance)
├─ ./ProfileCard.jsx
└─ ./AadhaarVerification.jsx

AadhaarVerification.jsx
├─ React (useState)
└─ api (axios instance)

ProfileCard.jsx
└─ ./Profile.css
```

---

## Responsive Design Breakpoints

```
Desktop (> 768px)
├─ Full layout with side-by-side elements
├─ Multi-column stats grid
├─ Flex row for contact info
└─ Large input fields

Mobile (≤ 768px)
├─ Stacked vertical layout
├─ Single-column stats
├─ Full-width contact info
├─ Full-width input fields
└─ Full-width buttons
```

---

This visual reference provides a complete overview of the component structure, data flow, and architecture of the React profile system.
