# Donation Recommendation System - API Quick Reference

## Base URL
```
http://localhost:8000/api
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer {access_token}
```

---

## RECEIVER ENDPOINTS

### 1. List Recommended Items
**GET** `/receiver/me/recommended-items/`

Lists all recommended items for the authenticated receiver.

**Response Times**: Items are visible immediately after donation is created

**Query Parameters**:
- `limit` - Number of results (default: 20)
- `offset` - Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "donation_id": 10,
      "donation_item": "MacBook Pro",
      "item_category": "Electronics",
      "item_description": "15-inch laptop in excellent condition",
      "item_condition": "like_new",
      "donor_name": "john_doe",
      "receiver_name": "jane_smith",
      "similarity_score": 0.92,
      "status": "suggested",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not a receiver)

---

### 2. Request Recommended Item
**POST** `/receiver/recommendations/{recommendation_id}/request/`

Changes recommendation status from `suggested` to `requested`.

**URL Parameters**:
- `recommendation_id` - ID of the recommendation to request

**Request Body**: (empty)

**Response** (200 OK):
```json
{
  "message": "Item requested successfully",
  "status": "requested"
}
```

**Status Codes**:
- `200` - Successfully requested
- `400` - Item not in "suggested" state
- `401` - Unauthorized
- `404` - Recommendation not found

**Side Effects**:
- Donor receives notification: "New Request for Your Donation"
- Status changed from `suggested` → `requested`
- Only donors can now approve/reject this request

---

## DONOR ENDPOINTS

### 3. View Requests for Donation
**GET** `/donation/{donation_id}/requests/`

Lists all requests (status='requested') for the donor's donation.

**URL Parameters**:
- `donation_id` - ID of the donation

**Response** (200 OK):
```json
{
  "count": 2,
  "results": [
    {
      "id": 1,
      "donation_id": 10,
      "donation_item": "MacBook Pro",
      "item_category": "Electronics",
      "item_description": "15-inch laptop in excellent condition",
      "item_condition": "like_new",
      "receiver_name": "jane_smith",
      "similarity_score": 0.92,
      "status": "requested",
      "created_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized
- `403` - Not the donation owner
- `404` - Donation not found

**Notes**:
- Only shows requests in "requested" status
- Sorted by similarity score (highest first)
- Only the donation owner can view

---

### 4. Approve a Request
**POST** `/donation/recommendations/{recommendation_id}/approve/`

Approves a receiver's request and creates a DonationOrder.

**URL Parameters**:
- `recommendation_id` - ID of the recommendation to approve

**Request Body**: (empty)

**Response** (200 OK):
```json
{
  "message": "Request approved",
  "status": "accepted"
}
```

**Status Codes**:
- `200` - Successfully approved
- `400` - Request not in "requested" state
- `401` - Unauthorized
- `403` - Not the donation owner
- `404` - Recommendation not found

**Side Effects**:
1. Recommendation status: `requested` → `accepted`
2. Donation status: (current) → `assigned`
3. All other requests for this donation: → `rejected`
4. New DonationOrder created with status `assigned`
5. Receiver notified: "Request Approved!"
6. Donation is now unavailable for other receivers

**Important**: Only first approved request succeeds. Others are automatically rejected.

---

### 5. Reject a Request
**POST** `/donation/recommendations/{recommendation_id}/reject/`

Rejects a receiver's request without creating an order.

**URL Parameters**:
- `recommendation_id` - ID of the recommendation to reject

**Request Body**: (empty)

**Response** (200 OK):
```json
{
  "message": "Request rejected",
  "status": "rejected"
}
```

**Status Codes**:
- `200` - Successfully rejected
- `400` - Request not in "requested" state
- `401` - Unauthorized
- `403` - Not the donation owner
- `404` - Recommendation not found

**Side Effects**:
1. Recommendation status: `requested` → `rejected`
2. Receiver notified: "Request Rejected"
3. Donation remains available for other requests
4. No DonationOrder created

**Important**: Rejecting does NOT prevent donor from approving other requests later.

---

## Recommendation Status Reference

| Status | Set By | Transition | Next States |
|--------|--------|-----------|------------|
| `suggested` | System (automatic) | Auto-created on donation creation | `requested`, `rejected` |
| `requested` | Receiver | Via `/receiver/recommendations/{id}/request/` | `accepted`, `rejected` |
| `accepted` | Donor | Via `/donation/recommendations/{id}/approve/` | Final (DonationOrder created) |
| `rejected` | Donor or System | Via `/donation/recommendations/{id}/reject/` | Final (cannot change) |

---

## Common Error Responses

### 400 Bad Request
```json
{
  "error": "Item is not in suggested state"
}
```
Caused by: Requesting item that's not in `suggested` status

### 404 Not Found
```json
{
  "error": "Recommendation not found"
}
```
Caused by: Invalid recommendation_id or accessing another user's data

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```
Caused by: Trying to access/modify another user's donations or requests

---

## Workflow Examples

### Complete Approval Flow
```
1. POST /donation/
   → Donation created (status: pending)
   → System auto-generates recommendations
   
2. GET /receiver/me/recommended-items/
   → Receiver sees 5 recommendations
   
3. POST /receiver/recommendations/1/request/
   → Recommendation status: suggested → requested
   
4. GET /donation/10/requests/ [as donor]
   → Donor sees the request
   
5. POST /donation/recommendations/1/approve/
   → Recommendation status: requested → accepted
   → Donation status: pending → assigned
   → Other recommendations rejected automatically
   → DonationOrder created
```

### Rejection Flow
```
1. POST /receiver/recommendations/2/request/
   → Status: suggested → requested
   
2. POST /donation/recommendations/2/reject/ [as donor]
   → Status: requested → rejected
   → Donation still available
   → Try with other requests
```

---

## Performance Notes

- **Auto-Recommendations**: Generated immediately (synchronous)
- **Response Time**: API responses typically < 100ms
- **Database Queries**: Optimized with `select_related` and `prefetch_related`
- **Pagination**: Default 20 items per page

---

## Testing Endpoints with cURL

### List Recommendations
```bash
curl -X GET "http://localhost:8000/api/receiver/me/recommended-items/" \
  -H "Authorization: Bearer {token}"
```

### Request Item
```bash
curl -X POST "http://localhost:8000/api/receiver/recommendations/1/request/" \
  -H "Authorization: Bearer {receiver_token}" \
  -H "Content-Type: application/json"
```

### View Requests
```bash
curl -X GET "http://localhost:8000/api/donation/10/requests/" \
  -H "Authorization: Bearer {donor_token}"
```

### Approve Request
```bash
curl -X POST "http://localhost:8000/api/donation/recommendations/1/approve/" \
  -H "Authorization: Bearer {donor_token}" \
  -H "Content-Type: application/json"
```

### Reject Request
```bash
curl -X POST "http://localhost:8000/api/donation/recommendations/1/reject/" \
  -H "Authorization: Bearer {donor_token}" \
  -H "Content-Type: application/json"
```

---

## Integration Notes

- Notifications are created automatically for state changes
- DonationOrder follows the donation delivery workflow
- All operations are transaction-safe
- Thread-safe with database locking during approval
