# Donation Recommendation System - Developer Quick Reference

## 🚀 5-Minute Overview

### What It Does
When a donor creates a donation, the system automatically finds 5 receivers with matching requests, notifies them, and enables approval workflow.

### Developer Quick Start
```bash
# 1. Review models
cat catalyst/receiver/models.py | grep -A 40 "class RecommendedDonation"

# 2. Review matching engine
cat catalyst/services/matching_engine.py

# 3. Check signal registration
cat catalyst/donation/signals.py

# 4. Review views
grep -n "class.*Recommendation\|class.*Donor" catalyst/receiver/views.py catalyst/donation/views.py

# 5. Run tests
python test_recommendation_system.py
```

---

## 📚 Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `receiver/models.py` | RecommendedDonation model | ~40 |
| `receiver/serializers.py` | Serializer for recommendations | ~35 |
| `receiver/views.py` | Receiver list & request views | ~120 |
| `donation/views.py` | Donor approval/rejection views | ~150 |
| `receiver/urls.py` | Receiver URL patterns | +2 |
| `donation/urls.py` | Donation URL patterns | +3 |
| `donation/signals.py` | Auto-trigger matching | ~15 |
| `services/matching_engine.py` | Matching algorithm | ~109 |

---

## 🔌 API Endpoints (Copy & Paste)

### List Recommendations
```bash
curl -X GET "http://localhost:8000/api/receiver/me/recommended-items/" \
  -H "Authorization: Bearer {receiver_token}" \
  -H "Content-Type: application/json"
```

### Request Item
```bash
curl -X POST "http://localhost:8000/api/receiver/recommendations/1/request/" \
  -H "Authorization: Bearer {receiver_token}" \
  -H "Content-Type: application/json"
```

### View Requests (as donor)
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

## 📊 Data Model Quick Reference

### RecommendedDonation
```python
class RecommendedDonation(models.Model):
    donation: ForeignKey(Donation)           # What's recommended
    receiver: ForeignKey(User)                # To whom
    similarity_score: FloatField(0.0-1.0)    # How good match
    status: CharField()                       # suggested|requested|accepted|rejected
    created_at: DateTimeField()               # When created
    
    # Unique constraint: one recommendation per donor-receiver pair
    Meta:
        unique_together = ('donation', 'receiver')
        ordering = ['-similarity_score', '-created_at']
```

---

## 🔄 Status Transitions

```
LIFECYCLE TABLE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status      │ Set By            │ Transition         │ Next State(s)
────────────┼──────────────────┼──────────────────┼─────────────────────
suggested   │ System (auto)    │ Donation created  │ requested, rejected
requested   │ Receiver         │ POST /.../request/│ accepted, rejected
accepted    │ Donor            │ POST /.../approve/│ (final, order created)
rejected    │ Donor/System     │ POST /.../reject/ │ (final)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚙️ Matching Algorithm

```
SCORE = (Category×0.5) + (Name_Sim×0.4) + (Condition×0.1)

Where:
  Category = 0.5 (exact), 0.2 (partial), 0 (no match)
  Name_Sim = difflib.SequenceMatcher() ratio × 0.4
  Condition = 0.1 (match) or 0 (no match)
  
Result: Top 5 with score > 0.2
```

---

## 🔐 Permissions Quick Ref

| Operation | Requires | Check |
|-----------|----------|-------|
| List recommendations | `IsAuthenticated`, `IsReceiver` | User is receiver |
| Request item | `IsAuthenticated`, `IsReceiver` | User owns recommendation |
| View requests | `IsAuthenticated` | User owns donation |
| Approve request | `IsAuthenticated` | User owns donation |
| Reject request | `IsAuthenticated` | User owns donation |

---

## 🐛 Debug Checklist

### No recommendations?
- [ ] Donation status = 'pending'?
- [ ] ItemRequest exists with status='pending'?
- [ ] Receiver is_active = True?
- [ ] Signal registered in donation/apps.py?
- [ ] Similarity score > 0.2?

### API 404 error?
- [ ] Check URL in receiver/urls.py or donation/urls.py
- [ ] View properly imported?
- [ ] URL pattern regex correct?

### Permission denied?
- [ ] Bearer token included?
- [ ] Token valid & not expired?
- [ ] User owns the resource?

### Database error?
- [ ] Migrations run? (`python manage.py migrate`)
- [ ] RecommendedDonation table exists?
- [ ] Foreign key constraints valid?

---

## 💾 Database Queries

### Get pending recommendations for receiver
```python
from receiver.models import RecommendedDonation
recs = RecommendedDonation.objects.filter(
    receiver=user,
    status__in=['suggested', 'requested', 'accepted']
).order_by('-similarity_score')
```

### Get requests for donation
```python
recs = RecommendedDonation.objects.filter(
    donation_id=donation_id,
    donation__donor=donor_user,
    status='requested'
)
```

### Create recommendation manually (testing only)
```python
from receiver.models import RecommendedDonation
rec = RecommendedDonation.objects.create(
    donation=donation_obj,
    receiver=receiver_user,
    similarity_score=0.85,
    status='suggested'
)
```

---

## 🧪 Test Commands

### Run all tests
```bash
cd catalyst && python ../test_recommendation_system.py
```

### Django system check
```bash
python manage.py check
```

### Check URL routing
```bash
python manage.py show_urls | grep recommendation
```

### Verify migrations
```bash
python manage.py migrate --dry-run
```

---

## 📝 Common Code Patterns

### Access recommendation in view
```python
rec = RecommendedDonation.objects.get(id=recommendation_id, receiver=request.user)
if rec.status != 'suggested':
    return Response({"error": "Invalid status"}, status=400)
rec.status = 'requested'
rec.save(update_fields=['status'])
```

### Serialize recommendation
```python
from .serializers import RecommendedDonationSerializer
serializer = RecommendedDonationSerializer(rec)
return Response(serializer.data)
```

### Atomic transactions
```python
from django.db import transaction

@transaction.atomic
def approve_request(recommendation_id):
    rec = RecommendedDonation.objects.select_for_update().get(id=recommendation_id)
    # Ensure atomic state changes
```

---

## 🚨 Common Errors & Fixes

### `ImportError: cannot import RecommendedDonation`
**Fix**: Ensure receiver/models.py is imported correctly
```python
from receiver.models import RecommendedDonation
```

### `Signal not triggered on donation creation`
**Fix**: Verify apps.py has ready() method:
```python
class DonationConfig(AppConfig):
    def ready(self):
        import donation.signals
```

### `API returns empty recommendations list`
**Fix**: Check ItemRequest records exist:
```python
from receiver.models import ItemRequest
print(ItemRequest.objects.filter(status='pending').count())
```

### `Atomic transaction failed`
**Fix**: Ensure using select_for_update() for locking:
```python
rec = RecommendedDonation.objects.select_for_update().get(id=id)
```

---

## 📞 Quick Help

### View all URLs
```bash
python manage.py show_urls | grep -i recommend
```

### Check database migrations
```bash
python manage.py showmigrations receiver
```

### Run in debug mode
```bash
python manage.py runserver --debug
```

### Access Django shell
```bash
python manage.py shell
# Then: from receiver.models import RecommendedDonation
```

---

## 🎯 Typical Workflow Code

### Complete example
```python
# Create donation (auto-triggers recommendations)
donation = Donation.objects.create(
    donor=user,
    item_name="Laptop",
    category="Electronics",
    status='pending'
)
# Signal triggers after save()
# RecommendedDonation entries created automatically

# Receiver sees recommendation
rec = RecommendedDonation.objects.get(id=1)
print(f"Item: {rec.donation.item_name}, Score: {rec.similarity_score}")

# Receiver requests
rec.status = 'requested'
rec.save()

# Donor views
requests = RecommendedDonation.objects.filter(
    donation=donation, 
    status='requested'
)

# Donor approves
rec.status = 'accepted'
donation.status = 'assigned'
rec.save()
donation.save()
DonationOrder.objects.create(donation=donation, receiver=rec.receiver)
```

---

## ✅ Pre-Deployment Checklist

- [ ] Run `python manage.py check` ✓ No errors
- [ ] Run `python manage.py migrate` ✓ No pending
- [ ] Run tests ✓ All passing
- [ ] Check URLs ✓ All registered
- [ ] Review signals ✓ Registered in apps.py
- [ ] Check permissions ✓ Correct decorators
- [ ] Test API ✓ Endpoints respond

---

## 📚 Full Documentation

Better documentation available in:
- `RECOMMENDATION_SYSTEM_IMPLEMENTATION.md` - Complete guide
- `RECOMMENDATION_API_REFERENCE.md` - All endpoints
- `RECOMMENDATION_ARCHITECTURE_DETAILED.md` - System design
- `test_recommendation_system.py` - Working examples

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Status**: ✅ Production Ready
