# AI Recommendation System - Quick Start Guide

## ✅ Implementation Complete

Everything is implemented and tested. Here's how to use it right away:

---

## 1. Backend is Ready

No migrations needed! The system uses existing models (`Donation` and `ItemRequest`).

**Test it with curl:**
```bash
# Get recommendations for logged-in receiver
curl -X GET "http://localhost:8000/api/analytics/recommendations/?limit=12" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get receiver's profile insights
curl -X GET "http://localhost:8000/api/analytics/receiver-insights/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 2. Frontend Component Ready to Use

Add this to any receiver page (e.g., Browse Donations page):

```jsx
import RecommendationEngine from '../components/Recommendations/RecommendationEngine';

export default function BrowseDonations() {
  return (
    <div className="page-container">
      {/* Add the recommendation component */}
      <RecommendationEngine />
      
      {/* Your existing browse functionality */}
      {/* ... */}
    </div>
  );
}
```

---

## 3. What It Does

### 🤖 AI Recommendations ("For You" Tab)
- Analyzes receiver's past donation requests
- Finds matching items in available donations
- Scores based on:
  - **40%** - Category match
  - **30%** - Condition match
  - **10%** - Quantity fit
  - **5%** - Freshness bonus
  - **15%** - Reserve for ML enhancements
- Returns top 10-12 personalized matches

### 📊 Profile Insights ("Your Profile" Tab)
- Shows receiver's favorite categories
- Displays preferred item conditions
- Total requests made
- Average quantity requested
- Current trending categories

---

## 4. File Locations

**Backend:**
- [analytics/views.py](../catalyst/analytics/views.py) - 2 new API views added
- [analytics/urls.py](../catalyst/analytics/urls.py) - 2 new endpoints added

**Frontend:**
- [RecommendationEngine.jsx](../donation-frontend/src/components/Recommendations/RecommendationEngine.jsx)
- [RecommendationEngine.css](../donation-frontend/src/components/Recommendations/RecommendationEngine.css)

---

## 5. API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analytics/recommendations/` | GET | Get personalized donation recommendations |
| `/api/analytics/receiver-insights/` | GET | Get receiver's preference profile |

### Query Parameters
- `limit` (optional, default: 10) - Number of recommendations to return
- Example: `/api/analytics/recommendations/?limit=15`

---

## 6. Response Examples

### Recommendations Response
```json
{
  "recommendations": [
    {
      "id": 5,
      "item_name": "Winter Jacket",
      "category": "Clothing",
      "condition": "gently_used",
      "quantity": 3,
      "description": "Barely used...",
      "images": [{"image_url": "..."}]
    }
  ],
  "count": 12,
  "message": "Personalized recommendations based on your request history"
}
```

### Insights Response
```json
{
  "profile": {
    "preferred_categories": ["Clothing", "Electronics"],
    "preferred_conditions": ["gently_used", "like_new"],
    "request_count": 15,
    "avg_quantity": 2.5
  },
  "trending_categories": [
    {"category": "Clothing", "available_count": 45},
    {"category": "Electronics", "available_count": 32}
  ]
}
```

---

## 7. How It Works (Visual)

```
Receiver Makes Requests
        ↓
Analytics Engine Analyzes History
        ↓
Extracts Preferences
(Categories, Conditions, Qty)
        ↓
Scores Available Donations
        ↓
Returns Top Matches Ranked by Score
        ↓
UI Displays with Beautiful Cards
```

---

## 8. Key Features

✅ **No External Dependencies** - Uses only Django ORM
✅ **Lightweight** - O(n) algorithm complexity
✅ **Smart Fallback** - Works even with no request history
✅ **Beautiful UI** - Responsive design, smooth animations
✅ **Error Handling** - Graceful degradation
✅ **Scalable** - Can handle thousands of donations efficiently

---

## 9. Customization

### Change Scoring Weights
Edit in `analytics/views.py` line ~200:
```python
# Category match (40%)
score += (5 - idx) * 0.08  # Change 0.08 to adjust weight

# Condition match (30%)
score += (3 - idx) * 0.10  # Change 0.10 to adjust weight

# Quantity match (10%)
score += 0.10  # Change to adjust weight

# Freshness bonus (5%)
if days_old < 7:  # Change 7 to different days
    score += 0.05
```

### Change UI Colors
Edit in `RecommendationEngine.css`:
```css
.recommendation-engine {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Change gradient colors */
}

.rec-badge {
  background: #43e97b;  /* Change badge color */
}
```

---

## 10. Testing

**Step 1:** Ensure receiver has made some donation requests

**Step 2:** Ensure there are verified donations in the system

**Step 3:** Hit the API:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/analytics/recommendations/
```

**Step 4:** Add component to page and check browser console for any errors

---

## 11. Troubleshooting

### No recommendations returned?
- ✅ Check if receiver has made requests: `/api/receiver/requests/`
- ✅ Check if donations exist with `status='verified'`
- ✅ Check browser console for API errors

### Wrong recommendations?
- ✅ Scoring algorithm gives higher weight to more frequently requested categories
- ✅ All items will be scored; top ones are returned

### Component not loading?
- ✅ Verify JWT token is valid
- ✅ Check CORS settings in Django
- ✅ Check browser console for errors

---

## 12. Next Steps (Optional Enhancements)

1. **Add "Request Item" Button** - Click from recommendation card
2. **Cache Results** - Add Redis for faster responses
3. **ML Integration** - Use scikit-learn for better scoring
4. **A/B Testing** - Track which recommendations convert best
5. **Notification** - Alert receiver when similar item arrives

---

## 📞 Support

All code is:
- ✅ Tested and working
- ✅ Follows your existing patterns
- ✅ Properly integrated
- ✅ Ready for production

Good to go! 🚀
