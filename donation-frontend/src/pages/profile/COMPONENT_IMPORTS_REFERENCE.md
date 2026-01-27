# Component Import Reference

## Import Structure

### Main Profile Component
```javascript
// Profile.jsx
import { useEffect, useState, useCallback } from "react";
import api from "../../api/api";
import "./Profile.css";
import DonorProfile from "./DonorProfile";
import ReceiverProfile from "./ReceiverProfile";
import VolunteerProfile from "./VolunteerProfile";
import AdminProfile from "./AdminProfile";
import ProfileCard from "./ProfileCard";
import AadhaarVerification from "./AadhaarVerification";
```

### Role-Specific Components
```javascript
// DonorProfile.jsx
import { useEffect, useState } from "react";
import api from "../../api/api";
import ProfileCard from "./ProfileCard";
import AadhaarVerification from "./AadhaarVerification";
```

```javascript
// ReceiverProfile.jsx
import { useEffect, useState } from "react";
import api from "../../api/api";
import ProfileCard from "./ProfileCard";
import AadhaarVerification from "./AadhaarVerification";
```

```javascript
// VolunteerProfile.jsx
import { useEffect, useState } from "react";
import api from "../../api/api";
import ProfileCard from "./ProfileCard";
import AadhaarVerification from "./AadhaarVerification";
```

### Aadhaar Verification Component
```javascript
// AadhaarVerification.jsx
import { useState } from "react";
import api from "../../api/api";
```

### Profile Card Component
```javascript
// ProfileCard.jsx
import "./Profile.css";
```

---

## Component Tree

```
Profile
├── ProfileCard
├── DonorProfile
│   ├── ProfileCard
│   └── AadhaarVerification
├── ReceiverProfile
│   ├── ProfileCard
│   └── AadhaarVerification
├── VolunteerProfile
│   ├── ProfileCard
│   └── AadhaarVerification
├── AdminProfile
└── AadhaarVerification (at Profile level)
```

---

## Props Passing Summary

### Profile → Role Components
```javascript
{
  profile: {object},
  refreshProfile: {function} // Callback to refresh after Aadhaar verification
}
```

### Role Components → ProfileCard
```javascript
{
  profile: {object}
}
```

### Role Components → AadhaarVerification
```javascript
{
  profile: {object},
  onVerified: {function} // refreshProfile callback
}
```

---

## File Structure

```
src/pages/profile/
├── Profile.jsx                    (Main container)
├── ProfileCard.jsx                (Pure presentation)
├── AadhaarVerification.jsx        (Reusable verification)
├── DonorProfile.jsx               (Role-specific)
├── ReceiverProfile.jsx            (Role-specific)
├── VolunteerProfile.jsx           (Role-specific)
├── AdminProfile.jsx               (Role-specific - unchanged)
├── Profile.css                    (All styles)
├── PROFILE_COMPONENTS_GUIDE.md    (This guide)
└── COMPONENT_IMPORTS_REFERENCE.md (This file)
```

---

## Environment Configuration

**API Base URL:** Defined in `src/api/api.js`
```javascript
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});
```

**JWT Token:** Automatically attached from localStorage
- Key: `"access"` (must match login storage key)
- Location: Request header `Authorization: Bearer {token}`

---

## Component Dependencies

- **React:** 18.x (hooks required)
- **Axios:** For HTTP requests
- **React Router:** For navigation (if needed in parent)
- **CSS:** Profile.css (all styles included)

No external UI libraries required - all styling is custom CSS.
