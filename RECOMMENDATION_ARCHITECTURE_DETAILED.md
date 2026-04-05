# Donation Recommendation System - Architecture & Integration

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CATALYST APPLICATION                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                    API LAYER (Django REST)                     │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │  RECEIVER ENDPOINTS          │      DONOR ENDPOINTS          │   │
│  │  ─────────────────────────   │      ───────────────────      │   │
│  │  GET  /me/recommended-items/ │      GET  /{id}/requests/     │   │
│  │  POST /recommendations/{}/   │      POST /recommendations/{}  │   │
│  │        request/              │            approve/           │   │
│  │                              │      POST /recommendations/{}  │   │
│  │                              │            reject/            │   │
│  │                                                               │   │
│  └────────────────────────────────────────────────────────────────┘   │
│         ↓          ↓                          ↓          ↓              │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                    VIEWS LAYER                                 │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │  receiver/views.py                donation/views.py          │   │
│  │  ─────────────────                ─────────────────           │   │
│  │  ReceiverRecommendation       DonationRequestsForItem      │   │
│  │  ListAPIView                  DonorApproveRecommendation  │   │
│  │                                                               │   │
│  │  RequestRecommendedItem       DonorRejectRecommendation    │   │
│  │  APIView                                                   │   │
│  │                                                               │   │
│  └────────────────────────────────────────────────────────────────┘   │
│         ↓          ↓                          ↓          ↓              │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │              SERIALIZERS LAYER                                │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │  RecommendedDonationSerializer (receiver/serializers.py)    │   │
│  │  ────────────────────────────────────────────────────       │   │
│  │  Fields: id, donation_id, donation_item, item_category,    │   │
│  │          item_description, item_condition, donor_name,     │   │
│  │          receiver_name, similarity_score, status, created_at│   │
│  │                                                               │   │
│  └────────────────────────────────────────────────────────────────┘   │
│         ↓          ↓                          ↓          ↓              │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │              MODELS LAYER                                     │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │  RecommendedDonation (receiver/models.py)                   │   │
│  │  ────────────────────────────────────────                   │   │
│  │  Fields:                                                     │   │
│  │    - donation: ForeignKey(Donation)                          │   │
│  │    - receiver: ForeignKey(User)                              │   │
│  │    - similarity_score: FloatField (0.0 - 1.0)               │   │
│  │    - status: CharField ['suggested', 'requested',            │   │
│  │                         'accepted', 'rejected']              │   │
│  │    - created_at: DateTimeField                               │   │
│  │                                                               │   │
│  │  Constraints:                                                │   │
│  │    - unique_together = ('donation', 'receiver')             │   │
│  │    - ordering = ['-similarity_score', '-created_at']        │   │
│  │                                                               │   │
│  └────────────────────────────────────────────────────────────────┘   │
│         ↓          ↓                                                    │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │            BUSINESS LOGIC LAYER                                │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │  SIGNALS (donation/signals.py)                              │   │
│  │  ──────────────────────────────                             │   │
│  │  >>> post_save on Donation                                  │   │
│  │      └─> trigger_matching_engine()                          │   │
│  │                                                               │   │
│  │  MATCHING ENGINE (services/matching_engine.py)             │   │
│  │  ─────────────────────────────────────────────             │   │
│  │  >>> get_best_receivers_for_item(donation_id)             │   │
│  │      1. Query pending ItemRequests                          │   │
│  │      2. Calculate similarity scores                         │   │
│  │      3. Return top N receivers                              │   │
│  │                                                               │   │
│  │  >>> run_matching_logic(donation_id)                       │   │
│  │      1. Get best receivers (top 5)                          │   │
│  │      2. Create RecommendedDonation entries                  │   │
│  │      3. Set status = 'suggested'                            │   │
│  │                                                               │   │
│  └────────────────────────────────────────────────────────────────┘   │
│         ↓          ↓                                                    │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │         SUPPORTING SYSTEMS                                    │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │  NOTIFICATIONS (notifications/models.py)                    │   │
│  │  ────────────────────────────────────────                   │   │
│  │  Created when:                                               │   │
│  │  - Receiver requests item                                    │   │
│  │  - Donor approves request                                    │   │
│  │  - Donor rejects request                                     │   │
│  │                                                               │   │
│  │  DONATION ORDERS (receiver/models.py)                       │   │
│  │  ────────────────────────────────────────                   │   │
│  │  Created when:                                               │   │
│  │  - Donor approves a request (status='assigned')             │   │
│  │                                                               │   │
│  └────────────────────────────────────────────────────────────────┘   │
│         ↓                                                               │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                     DATABASE LAYER                             │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │  Tables Used:                                                │   │
│  │  - receiver_recommendeddonation (main table)                │   │
│  │  - donation_donation (reference)                            │   │
│  │  - auth_user (reference)                                     │   │
│  │  - receiver_itemrequest (for matching)                      │   │
│  │                                                               │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Complete Recommendation Cycle

```
                    ┌─── DONATION CREATION ───┐
                    │                         │
                    ▼                         ▼
              POST /api/donation/
              {
                "item_name": "Laptop",
                "category": "Electronics",
                "condition": "like_new"
              }
                    │
                    ▼
        [DonationListCreateAPIView]
                    │
                    ├─ Validate request
                    ├─ Create Donation
                    ├─ Upload images
                    └─ Save to DB
                    │
                    ▼ [Donation.status = 'pending']
        
        ┌─────────────────────────────────────┐
        │  SIGNAL: post_save on Donation      │  [donation/signals.py]
        └─────────────────────────────────────┘
                    │
                    ▼
        ┌─────────────────────────────────────┐
        │ trigger_matching_engine()           │
        │ run_matching_logic(donation_id)     │
        └─────────────────────────────────────┘
                    │
                    ▼
        ┌─────────────────────────────────────────┐
        │ get_best_receivers_for_item()           │ [services/matching_engine.py]
        ├─ Query ItemRequest.filter(status='pending')
        ├─ Calculate scores for each:
        │   * Category match (50%)
        │   * Name similarity (40%)
        │   * Condition bonus (10%)
        ├─ Filter by score > 0.2
        └─ Return top 5
                    │
                    ▼
        ┌──────────────────────────────────────────┐
        │ CREATE RecommendedDonation × 5          │
        ├─ donation_id = donation.id
        ├─ receiver_id = receiver.id
        ├─ similarity_score = score
        └─ status = 'suggested'
                    │
                    ▼  [In Database]
        
        ════════════════════════════════════════════
        
        RECEIVER GETS RECOMMENDATIONS
                    │
                    ▼
        GET /api/receiver/me/recommended-items/
                    │
                    ▼
        [ReceiverRecommendationListView]
        
        Return: RecommendationSerializer.data
        {
            "id": 1,
            "donation_id": 5,
            "donation_item": "Laptop",
            "item_category": "Electronics",
            "similarity_score": 0.85,
            "status": "suggested"  ← KEY
        }
                    │
                    ▼  [User sees recommendations]
        
        ════════════════════════════════════════════
        
        RECEIVER REQUESTS ITEM
                    │
                    ▼
        POST /api/receiver/recommendations/1/request/
                    │
                    ▼
        [RequestRecommendedItemView]
        
        ├─ Get RecommendedDonation(id=1)
        ├─ Validate status == 'suggested'
        ├─ Update: status = 'requested'
        │
        └─ Create Notification(donor):
            title: "New Request for Your Donation"
                    │
                    ▼  [In Database]
        
        ════════════════════════════════════════════
        
        DONOR VIEWS REQUESTS
                    │
                    ▼
        GET /api/donation/5/requests/
                    │
                    ▼
        [DonationRequestsForItemView]
        
        Return: RecommendationSerializer.data
        {
            "id": 1,
            "receiver_name": "jane_smith",
            "status": "requested"  ← KEY
            "similarity_score": 0.85
        }
                    │
                    ▼  [Donor sees requests]
        
        ════════════════════════════════════════════
        
        ┌─── DONOR DECISION ───────────────────────┐
        │                                          │
        │ Option A: APPROVE                Option B: REJECT
        │                                          │
        └──────────────────────────────────────────┘
                    │                   │
                    ▼                   ▼
        
        POST                          POST
        /donation/recommendations/   /donation/recommendations/
        1/approve/                   1/reject/
                    │                   │
                    ▼                   ▼
        
        [DonorApproveView]        [DonorRejectView]
                    │                   │
        ✓ status='requested'?    ✓ status='requested'?
        ✓ user=donor?            ✓ user=donor?
                    │                   │
                    ▼                   ▼
        
        ┌─ APPROVE LOGIC ──────┐  ┌─ REJECT LOGIC ───┐
        │                      │  │                  │
        │ UPDATE:              │  │ UPDATE:          │
        │ - Recommendation     │  │ - Recommendation │
        │   status='accepted'  │  │   status='rejected'
        │                      │  │                  │
        │ - Donation           │  │ - Donation       │
        │   status='assigned'  │  │   (unchanged)    │
        │                      │  │                  │
        │ - Other Recs:        │  │ - Notify Receiver│
        │   status='rejected'  │  │   "Rejected"     │
        │   (all others)       │  │                  │
        │                      │  │                  │
        │ CREATE:              │  │ (workflow ends)  │
        │ - DonationOrder      │  │                  │
        │   status='assigned'  │  │                  │
        │                      │  │                  │
        │ NOTIFY:              │  │                  │
        │ - Receiver:          │  │                  │
        │   "Approved!"        │  │                  │
        │                      │  │                  │
        └──────────────────────┘  └──────────────────┘
                    │                   │
                    ▼                   ▼
        
        [Delivery Workflow]     [Receiver Sees Rejection
                (continues)      in Notifications]
```

---

## Component Interactions

### 1. Signal → Matching Engine → Database
```
django.db.models.signals
└─ post_save(Donation)
    └─ trigger_matching_engine(sender, instance)
        └─ services.matching_engine.run_matching_logic(instance.id)
            ├─ get_best_receivers_for_item(instance.id, top_n=5)
            │   └─ Query ItemRequest with filtering
            │   └─ Calculate scores
            │   └─ Return (receiver_id, score) tuples
            └─ RecommendedDonation.objects.create()
```

### 2. API Request → Serializer → Database
```
HTTP Request (POST /api/receiver/recommendations/{id}/request/)
└─ RequestRecommendedItemView.post()
    ├─ Authentication: IsAuthenticated, IsReceiver
    ├─ Get RecommendedDonation(id=id, receiver=request.user)
    ├─ Validate status == 'suggested'
    ├─ Update status → 'requested'
    ├─ Save to database
    └─ Create Notification
```

### 3. API Response → Serializer → HTTP
```
HTTP Request (GET /api/receiver/me/recommended-items/)
└─ ReceiverRecommendationListView.get()
    ├─ Filter: RecommendedDonation.filter(receiver=request.user, status__in=[...])
    ├─ Paginate results
    ├─ RecommendedDonationSerializer.to_representation()
    │   ├─ Include nested donor, receiver, donation info
    │   └─ Return JSON
    └─ Response(data, 200)
```

### 4. Atomic Transaction: Approval
```
@transaction.atomic
└─ get RecommendedDonation with select_for_update()
    ├─ Set RecommendedDonation.status = 'accepted'
    ├─ Update Donation.status = 'assigned'
    ├─ Update other recommendations to 'rejected'
    ├─ Create DonationOrder
    ├─ Create Notification
    └─ (All committed together or rolled back)
```

---

## Database Schema Integration

```
┌─────────────────────────────────┐
│   auth_user (from Django)       │
├─────────────────────────────────┤
│ id (PK)                         │
│ username                        │
│ email                           │
│ is_active                       │
│ ... (other fields)              │
└─────────────────────────────────┘
      ▲                                 ▲
      │                                 │
      │ FK                              │ FK
      │                                 │
      │                    ┌────────────┴──────────────┐
      │                    │                           │
┌─────────────────────────────────┐   ┌────────────────────────────┐
│ receiver_itemrequest            │   │ donation_donation          │
├─────────────────────────────────┤   ├────────────────────────────┤
│ id (PK)                         │   │ id (PK)                    │
│ receiver_id (FK→User)           │   │ donor_id (FK→User)         │
│ item_name                       │   │ item_name                  │
│ category                        │   │ category                   │
│ condition                       │   │ condition                  │
│ quantity                        │   │ quantity                   │
│ status = 'pending'              │   │ status                     │
│ ...                             │   │ ...                        │
└─────────────────────────────────┘   └────────────────────────────┘
      ▲                                       ▲
      │                                       │
      │ Used by                               │ Referenced by
      │                                       │
      │                    ┌──────────────────┴──────────────────┐
      │                    │                                      │
      └────────────────────┼──────────────────────────────────────┘
                           │
                           │ FK (both)
                           │
                    ┌──────▼─────────────────────────────────┐
                    │ receiver_recommendeddonation           │
                    ├───────────────────────────────────────┤
                    │ id (PK)                                │
                    │ donation_id (FK→Donation)             │
                    │ receiver_id (FK→User)                 │
                    │ similarity_score (0.0 - 1.0)          │
                    │ status: 'suggested', 'requested',     │
                    │         'accepted', 'rejected'        │
                    │ created_at                             │
                    │                                        │
                    │ UC: (donation_id, receiver_id)        │
                    │ Index: status, similarity_score       │
                    └────────────────────────────────────────┘
                           ▲
                           │ Referenced by
                           │
                    ┌──────▼───────────────────────────────────┐
                    │ receiver_donationorder                  │
                    ├────────────────────────────────────────┤
                    │ id (PK)                                 │
                    │ donation_id (FK→Donation) [UC: active]│
                    │ receiver_id (FK→User)                  │
                    │ volunteer_id (FK→User, nullable)       │
                    │ delivery_type                           │
                    │ status: 'assigned', 'picked_up',       │
                    │         'delivered', 'canceled'        │
                    │ ...                                     │
                    └────────────────────────────────────────┘
```

---

## Request/Response Cycles

### Cycle 1: List Recommendations
```
┌──────────────────────┐
│   HTTP GET Request   │
│  /receiver/me/       │
│  recommended-items/  │
└──────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ ReceiverRecommendationListView               │
├──────────────────────────────────────────────┤
│ Permission Check: IsAuthenticated, IsReceiver│
│ Get Request User: jane_smith (ID: 5)         │
└──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ Query Database                               │
│ RecommendedDonation.objects.filter(          │
│   receiver=jane_smith,                       │
│   status__in=['suggested', 'requested',      │
│               'accepted']                    │
│ ).order_by('-similarity_score')              │
└──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ Apply Pagination                             │
│ limit=20, offset=0                           │
└──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ Serialize Data                               │
│ RecommendedDonationSerializer.to_representation()
│ For each recommendation:                     │
│   - donation.item_name                       │
│   - donation.category                        │
│   - donation.condition                       │
│   - donation.donor.username                  │
│   - receiver.username                        │
│   - similarity_score                         │
│   - status                                   │
└──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ JSON Response (200 OK)                       │
│ {                                             │
│   "count": 5,                                │
│   "results": [                               │
│     {                                        │
│       "id": 1,                               │
│       "donation_id": 10,                     │
│       "donation_item": "Laptop",             │
│       "item_category": "Electronics",        │
│       "similarity_score": 0.88,              │
│       "status": "suggested"                  │
│     },                                       │
│     ... more items ...                       │
│   ]                                          │
│ }                                            │
└──────────────────────────────────────────────┘
```

### Cycle 2: Request Item
```
┌────────────────────────┐
│   HTTP POST Request    │
│  /receiver/            │
│  recommendations/1/    │
│  request/              │
└────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ RequestRecommendedItemView                     │
├────────────────────────────────────────────────┤
│ Permission Check: IsAuthenticated, IsReceiver │
│ Get Request User: jane_smith (ID: 5)          │
│ Get recommendation_id from URL: 1             │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ Get from DB                                    │
│ RecommendedDonation.objects.get(               │
│   id=1,                                        │
│   receiver=jane_smith                          │
│ )                                              │
│ Result: rec = { status: 'suggested', ... }    │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ Validation                                     │
│ ✓ rec.status == 'suggested' ?                 │
│   YES → Continue                              │
│   NO  → 400 "Not in suggested state"          │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ Update & Save                                  │
│ rec.status = 'requested'                       │
│ rec.save(update_fields=['status'])             │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ Create Notification (non-blocking)             │
│ Notification.objects.create(                   │
│   user=rec.donation.donor,  [john_doe]        │
│   title="New Request for Your Donation",      │
│   message="jane_smith requested Laptop",      │
│   notification_type="info"                    │
│ )                                              │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ JSON Response (200 OK)                         │
│ {                                              │
│   "message": "Item requested successfully",   │
│   "status": "requested"                        │
│ }                                              │
└────────────────────────────────────────────────┘
```

### Cycle 3: Approve Request
```
┌────────────────────────────────┐
│   HTTP POST Request            │
│  /donation/                    │
│  recommendations/1/approve/    │
└────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ DonorApproveRecommendationView                 │
├────────────────────────────────────────────────┤
│ Authentication: IsAuthenticated                │
│ Get User: john_doe (ID: 3) [donor]            │
│ Get recommendation_id from URL: 1             │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ @transaction.atomic() - BEGIN TRANSACTION     │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ Get & Lock (select_for_update)                │
│ RecommendedDonation.objects.select_for_update()
│   .get(                                        │
│     id=1,                                      │
│     donation__donor=john_doe                   │
│   )                                            │
│ Result: rec = { status: 'requested', ... }    │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ Validation                                     │
│ ✓ rec.status == 'requested' ?                 │
│   YES → Continue                              │
│   NO  → ROLLBACK, 400 Error                   │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ Update Recommendation                          │
│ rec.status = 'accepted'                        │
│ rec.save(update_fields=['status'])             │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ Update Donation Status                         │
│ donation = rec.donation                        │
│ donation.status = 'assigned'                   │
│ donation.save(update_fields=['status'])        │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ Reject Other Recommendations                   │
│ RecommendedDonation.objects.filter(            │
│   donation=donation                            │
│ ).exclude(id=rec.id).update(                   │
│   status='rejected'                            │
│ )                                              │
│ Result: 4 other recs set to 'rejected'        │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ Create DonationOrder                           │
│ DonationOrder.objects.create(                  │
│   donation=donation,                           │
│   receiver=rec.receiver,   [jane_smith]       │
│   status='assigned',                           │
│   delivery_type='volunteer'                    │
│ )                                              │
│ Result: order = { id: 100, status: assigned } │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ Notify Receiver                                │
│ Notification.objects.create(                   │
│   user=rec.receiver,  [jane_smith]            │
│   title="Request Approved!",                  │
│   message="Your request for Laptop approved!",│
│   notification_type="success"                 │
│ )                                              │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ @transaction.atomic() - COMMIT TRANSACTION    │
│ All changes saved atomically                  │
└────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ JSON Response (200 OK)                         │
│ {                                              │
│   "message": "Request approved",              │
│   "status": "accepted"                         │
│ }                                              │
└────────────────────────────────────────────────┘
```

---

## Error Handling Flowchart

```
┌──────────────────────────────────────────┐
│     API Request Received                 │
└──────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Authentication Check                    │
│  ├─ Token present?                       │
│  └─ Token valid?                         │
└──────────────────────────────────────────┘
      NO │                       │ YES
         ▼                       ▼
    401 UNAUTHORIZED      ┌──────────────────────────────────────┐
                          │  Permission Check                    │
                          │  ├─ IsReceiver?                      │
                          │  ├─ IsAuthenticated?                 │
                          │  └─ Resource Ownership?              │
                          └──────────────────────────────────────┘
                            NO │                   │ YES
                               ▼                   ▼
                          403 FORBIDDEN      ┌──────────────────────────────┐
                                             │  Data Validation             │
                                             │  ├─ Record exists?           │
                                             │  ├─ Status is valid?         │
                                             │  └─ Business logic valid?    │
                                             └──────────────────────────────┘
                                              NO │             │ YES
                                                 ▼             ▼
                                            400 BAD REQUEST
                                            404 NOT FOUND  ✓ Process Request
                                                                │
                                                                ▼
                                                        ┌────────────────┐
                                                        │  200 OK        │
                                                        │  Response      │
                                                        └────────────────┘
```

---

## Integration Points with Other Systems

### 1. User Authentication
- **Integration**: Django's `IsAuthenticated` permission class
- **Location**: All view classes
- **Data**: `request.user` provides authenticated user
- **Security**: Token-based using JWT

### 2. Notification System
- **Integration**: `notifications.models.Notification`
- **Triggers**:
  - Receiver requests item
  - Donor approves request
  - Donor rejects request
- **Usage**: Asynchronous notifications stored in DB

### 3. Donation Model
- **Integration**: `donation.models.Donation`
- **FK Reference**: RecommendedDonation → Donation
- **Status Tracking**: Donation.status changes on approval
- **Signals**: Triggers matching engine on creation

### 4. Item Request Model
- **Integration**: `receiver.models.ItemRequest`
- **Purpose**: Source data for matching algorithm
- **Filter Criteria**: status='pending', receiver.is_active=True
- **Data Used**: category, item_name, condition

### 5. DonationOrder Model
- **Integration**: `receiver.models.DonationOrder`
- **Creation**: When recommendation is approved
- **Status**: 'assigned' (then progresses to 'picked_up', 'delivered')
- **Delivery**: Integrates with volunteer delivery system

### 6. User Profile
- **Integration**: `users.models.UserProfile`
- **Used For**: Verification status check
- **Address Storage**: Pickup/delivery addresses for orders

---

## Security & Validation Layers

```
┌─────────────────────────────────────────────────────────────┐
│               SECURITY & VALIDATION PYRAMID                 │
└─────────────────────────────────────────────────────────────┘

                         ▲
                        ╱ ╲
                       ╱   ╲  BUSINESS LOGIC
                      ╱     ╲  VALIDATION
                     ╱───────╲
                    ╱         ╲
                   ╱           ╲  • Status transitions
                  ╱             ╲ • Atomic operations
                 ╱               ╲• Foreign key checks
                ╱─────────────────╲
               ╱                   ╲
              ╱                     ╲ OBJECT PERMISSION
             ╱                       ╲VALIDATION (DRF)
            ╱─────────────────────────╲
           ╱                           ╲
          ╱                             ╲ • Resource ownership
         ╱                               ╲• User role checks
        ╱─────────────────────────────────╲• Object-level checks
       ╱                                   ╲
      ╱                                     ╲
     ╱       AUTHENTICATION & PERMISSIONS    ╲
    ╱─────────────────────────────────────────╲
   ╱                                           ╲
  ╱                                             ╲
 ╱ • IsAuthenticated                             ╲
╱   • IsReceiver/IsDonor                          ╲
╱───────────────────────────────────────────────────╲

        DATABASE CONSTRAINTS
        • Unique Together
        • Foreign Key Validation
        • Not Null Constraints
```

---

This comprehensive architecture ensures robust, scalable, and maintainable donation recommendation system integration.
