import difflib
from django.db.models import Q, Count
from django.contrib.auth import get_user_model
from receiver.models import ItemRequest, RecommendedDonation
from donation.models import Donation

User = get_user_model()

def get_receiver_preferred_categories(receiver_id, top_n=3):
    """
    Analyze receiver's activity (requests and orders) to find preferred categories.
    Returns a list of categories they've interacted with, sorted by frequency.
    """
    from receiver.models import DonationOrder
    from collections import Counter
    
    # Categories from ItemRequests
    request_categories = ItemRequest.objects.filter(
        receiver_id=receiver_id,
        status__in=['pending', 'approved', 'completed']
    ).values_list('category', flat=True)
    
    # Categories from DonationOrders (Active or Delivered)
    order_categories = DonationOrder.objects.filter(
        receiver_id=receiver_id,
        status__in=['assigned', 'picked_up', 'delivered']
    ).values_list('donation__category', flat=True)
    
    # Combine and clean
    all_categories = [c.strip().lower() for c in list(request_categories) + list(order_categories) if c]
    
    if not all_categories:
        return []

    # Count frequencies
    counts = Counter(all_categories)
    
    # Return top N categories
    return [cat for cat, _ in counts.most_common(top_n)]


def get_best_receivers_for_item(donation_id, top_n=5):
    """
    Finds the best receivers for a newly created donation item.
    Returns a list of tuples: (receiver_user_id, score)
    
    Matching logic based on:
    1. Receiver's historical request categories (High priority)
    2. Item name similarity (Medium priority)
    3. Condition match (Bonus)
    
    Only recommends to receivers who have actually requested items in the past.
    """
    try:
        donation = Donation.objects.get(id=donation_id)
    except Donation.DoesNotExist:
        return []

    # Get all receivers who have any activity (requests or orders)
    receivers_with_activity = User.objects.filter(
        Q(item_requests__isnull=False) | Q(receiver_orders__isnull=False),
        is_active=True
    ).exclude(id=donation.donor.id).distinct()

    if not receivers_with_activity.exists():
        return []

    scored_receivers = {}

    for receiver in receivers_with_activity:
        # Get this receiver's preferred categories from their request history
        preferred_categories = get_receiver_preferred_categories(receiver.id)
        
        if not preferred_categories:
            continue  # Skip receivers with no request history
        
        score = 0.0
        donation_category = donation.category.strip().lower()
        
        # Rule 1: Check if donation category matches any of receiver's preferred categories
        category_match = False
        for pref_cat in preferred_categories:
            if pref_cat == donation_category:
                score += 0.6  # Strong match
                category_match = True
                break
            elif pref_cat in donation_category or donation_category in pref_cat:
                score += 0.3  # Partial match
                category_match = True

        # Only proceed if there's a category match
        if not category_match:
            continue
        
        # Rule 2: Name similarity with receiver's past requests (bonus)
        receiver_past_items = ItemRequest.objects.filter(
            receiver=receiver
        ).values_list('item_name', flat=True)
        
        best_name_similarity = 0.0
        for past_item_name in receiver_past_items:
            similarity = difflib.SequenceMatcher(
                None, 
                past_item_name.lower(), 
                donation.item_name.lower()
            ).ratio()
            best_name_similarity = max(best_name_similarity, similarity)
        
        score += best_name_similarity * 0.3
        
        # Rule 3: Condition Match (Bonus)
        past_requests = ItemRequest.objects.filter(receiver=receiver)
        has_condition_match = past_requests.filter(condition=donation.condition).exists()
        if has_condition_match:
            score += 0.1
        
        scored_receivers[receiver.id] = score

    # Filter out receivers with low score
    recommendations = [
        (uid, s) 
        for uid, s in scored_receivers.items() 
        if s > 0.3  # Increased threshold to be more selective
    ]

    # Sort by score descending
    recommendations.sort(key=lambda x: x[1], reverse=True)
    
    # Return top N
    return recommendations[:top_n]


def run_matching_logic(donation_id):
    """
    Orchestrates the matching process:
    1. Matching Engine function
    2. Save to DB
    """
    top_receivers_with_scores = get_best_receivers_for_item(donation_id)
    
    if not top_receivers_with_scores:
        return

    try:
        donation = Donation.objects.get(id=donation_id)
    except Donation.DoesNotExist:
        return
        
    for receiver_id, score in top_receivers_with_scores:
        try:
            receiver = User.objects.get(id=receiver_id)
            
            # Check if already recommended to avoid duplicates
            if not RecommendedDonation.objects.filter(donation=donation, receiver=receiver).exists():
                RecommendedDonation.objects.create(
                    donation=donation,
                    receiver=receiver,
                    similarity_score=score,
                    status='suggested'
                )
        except User.DoesNotExist:
            continue
            
    print(f"Created {len(top_receivers_with_scores)} recommendations for Donation {donation_id}")
