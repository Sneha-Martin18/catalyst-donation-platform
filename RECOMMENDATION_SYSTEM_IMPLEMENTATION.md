# Donation Recommendation System - Complete Implementation

## Overview

The donation recommendation system automatically matches newly created donation items with receivers who have pending item requests, creating a seamless connection between donors and receivers.

## Architecture

### Components

1. **Matching Engine** (`services/matching_engine.py`)
   - `get_best_receivers_for_item(donation_id, top_n=5)` - Finds best matching receivers
   - `run_matching_logic(donation_id)` - Orchestrates the matching process

2. **Models** (`receiver/models.py`)
   - `RecommendedDonation` - Stores recommendations with status tracking

3. **Signals** (`donation/signals.py`)
   - Automatically triggers matching when donation is created

4. **API Views**
   - **Receiver**: View recommendations, request items
   - **Donor**: View requests, approve/reject recommendations

5. **URLs**
   - `/api/receiver/` - Receiver endpoints
   - `/api/donation/` - Donation endpoints

## Database Model

### RecommendedDonation

```python
class RecommendedDonation(models.Model):
    STATUS_CHOICES = [
        ('suggested', 'Suggested'),      # Auto-recommended by system
        ('requested', 'Requested'),      # Receiver requested this item
        ('accepted', 'Accepted'),        # Donor approved & created order
        ('rejected', 'Rejected'),        # Donor rejected the request
    ]
    
    donation = ForeignKey(Donation)
    receiver = ForeignKey(User)
    similarity_score = FloatField()      # 0.0 - 1.0
    status = CharField()                  # See STATUS_CHOICES
    created_at = DateTimeField()
```

## Workflow

### 1. Donation Created → Auto-Recommendations

```
POST /api/donation/
{
    "item_name": "Laptop",
    "category": "Electronics",
    "condition": "like_new",
    ...
}
↓
[Signal: post_save on Donation]
↓
[Matching Engine]
- Query all pending ItemRequests
- Calculate similarity scores for each receiver
- Filter by threshold (score > 0.2)
- Select top 5 receivers
↓
[Create RecommendedDonation entries]
- donation_item → Donation instance
- receiver → Best-matched receivers
- similarity_score → Match score
- status → "suggested"
```

### 2. Matching Algorithm

The matching engine considers:

1. **Category Match** (High priority - 0.5 points)
   - Exact match: 0.5 points
   - Partial match: 0.2 points

2. **Item Name Similarity** (Medium priority - 0.4 points)
   - Uses difflib.SequenceMatcher for text similarity
   - Multiplied by 0.4

3. **Condition Match** (Bonus - 0.1 points)
   - Matches condition preference: +0.1 points

**Minimum Score Threshold**: 0.2 (filters out poor matches)

## API Endpoints

### Receiver Endpoints

#### 1. List Recommended Items
```
GET /api/receiver/me/recommended-items/

Response:
{
    "count": 2,
    "results": [
        {
            "id": 1,
            "donation_id": 5,
            "donation_item": "Laptop",
            "item_category": "Electronics",
            "item_description": "Good condition laptop",
            "item_condition": "like_new",
            "donor_name": "john_doe",
            "similarity_score": 0.88,
            "status": "suggested",
            "created_at": "2024-01-15T10:00:00Z"
        }
    ]
}
```

#### 2. Request an Item (suggested → requested)
```
POST /api/receiver/recommendations/{recommendation_id}/request/

Response: {
    "message": "Item requested successfully",
    "status": "requested"
}

Side Effects:
- Changes status: suggested → requested
- Creates notification for donor
```

### Donor Endpoints

#### 1. View Requests for Donation
```
GET /api/donation/{donation_id}/requests/

Response:
{
    "count": 2,
    "results": [
        {
            "id": 1,
            "donation_id": 5,
            "donation_item": "Laptop",
            "receiver_name": "jane_smith",
            "similarity_score": 0.88,
            "status": "requested",
            "created_at": "2024-01-15T11:00:00Z"
        }
    ]
}
```

#### 2. Approve a Request (requested → accepted)
```
POST /api/donation/recommendations/{recommendation_id}/approve/

Response: {
    "message": "Request approved",
    "status": "accepted"
}

Side Effects:
- Changes status: requested → accepted
- Marks donation as "assigned"
- Rejects all other pending requests for this donation
- Creates DonationOrder
- Notifies receiver of approval
```

#### 3. Reject a Request (requested → rejected)
```
POST /api/donation/recommendations/{recommendation_id}/reject/

Response: {
    "message": "Request rejected",
    "status": "rejected"
}

Side Effects:
- Changes status: requested → rejected
- Notifies receiver of rejection
- Donation remains open for other requests
```

## Status Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  RECOMMENDATION LIFECYCLE                   │
└─────────────────────────────────────────────────────────────┘

System Creates Donation
         ↓
    ┌────────────────────┐
    │  suggested (auto)  │
    │ [System Generated] │
    └────────────────────┘
         ↓
    [Receiver views & decides]
         ↓
    ────────────────────────────────
    │                            │
    ▼                            │
┌──────────┐              ┌──────────────┐
│requested │              │ rejected     │
│ [Waiting]│              │ [Cancelled]  │
└──────────┘              └──────────────┘
    │ (Donor approval)
    ▼
┌──────────┐
│accepted  │
│[Success] │
└──────────┘
    ↓
[DonationOrder created]
```

## Security & Permissions

### Receiver Can:
- View only their own recommended items
- Request items only from "suggested" status
- View only their own notifications

### Donor Can:
- View requests only for their own donations
- Approve/reject requests for their donations only
- See aggregated request data for their items

### Validation:
- `IsAuthenticated` - User must be logged in
- `IsReceiver` - Receiver endpoints require receiver role
- Foreign key validation - Ensure user owns the resource

## Example Usage Flow

### Step 1: Donor Creates Donation
```bash
curl -X POST http://localhost:8000/api/donation/ \
  -H "Authorization: Bearer {donor_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "MacBook Pro",
    "category": "Electronics",
    "condition": "like_new",
    "quantity": 1
  }'
```

### Step 2: System Auto-Recommends (Automatic)
```
Matching Engine runs:
- Finds receivers with pending "Electronics" requests
- Calculates similarity scores
- Creates RecommendedDonation(status='suggested')
```

### Step 3: Receiver Sees Recommendation
```bash
curl -X GET http://localhost:8000/api/receiver/me/recommended-items/ \
  -H "Authorization: Bearer {receiver_token}"
```

### Step 4: Receiver Requests Item
```bash
curl -X POST http://localhost:8000/api/receiver/recommendations/1/request/ \
  -H "Authorization: Bearer {receiver_token}"
```

### Step 5: Donor Views Requests
```bash
curl -X GET http://localhost:8000/api/donation/5/requests/ \
  -H "Authorization: Bearer {donor_token}"
```

### Step 6: Donor Approves Request
```bash
curl -X POST http://localhost:8000/api/donation/recommendations/1/approve/ \
  -H "Authorization: Bearer {donor_token}"
```

## Important Notes

### Do NOT Auto-Assign Items
- System recommends and notifies
- Donors make final decisions (not automatic)
- This preserves donor control

### Notification System
- Donors notified when receiver requests
- Receivers notified when request approved/rejected
- Uses `notifications.models.Notification`

### Transaction Safety
- Approval uses `@transaction.atomic`
- Ensures atomic state transitions
- Rejects other requests atomically

### Scalability
- Signal currently runs synchronously
- For high volume, consider Celery async tasks
- Matching algorithm is O(n) where n = pending requests

## Troubleshooting

### No Recommendations Generated?
1. Check donation status = 'pending'
2. Verify receivers have pending ItemRequests
3. Confirm similarity score > 0.2
4. Check donation app signals registered in apps.py

### Permissions Error?
1. Ensure user is authenticated
2. Verify user owns the resource
3. Check request includes Authorization header

### Database Issue?
1. Run migrations: `python manage.py migrate`
2. Verify RecommendedDonation table exists
3. Check database user permissions

## Testing

### Run Comprehensive Tests
```bash
cd catalyst
python ../test_recommendation_system.py
```

This creates:
- Test users (donors, receivers)
- Test item requests
- Tests all endpoints
- Validates status transitions
- Confirms notifications created

## Files Modified

1. `receiver/models.py` - RecommendedDonation model (already exists)
2. `receiver/serializers.py` - RecommendedDonationSerializer (already exists)
3. `receiver/views.py` - ReceiverRecommendationListView, RequestRecommendedItemView (already exists)
4. `receiver/urls.py` - Added recommendation URLs ✅
5. `donation/views.py` - Added DonorApproveRecommendationView, DonorRejectRecommendationView ✅
6. `donation/urls.py` - Added recommendation URLs ✅
7. `donation/signals.py` - Signal configuration (already exists)
8. `services/matching_engine.py` - Matching logic (already exists)
9. `donation/apps.py` - Signal registration (already exists)

## Next Steps (Optional Enhancements)

1. **Async Processing**: Use Celery for background matching
2. **ML-Based Matching**: Implement ML model for better recommendations
3. **Analytics**: Track recommendation conversion rates
4. **Filtering**: Add filters by condition, location, etc.
5. **Search**: Full-text search for donors/receivers
6. **Ratings**: Add recommendation quality ratings
