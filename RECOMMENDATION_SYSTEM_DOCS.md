# Donation Recommendation System: Implementation Guide

This document outlines the step-by-step implementation of the AI-powered Donation Recommendation System. The system automatically connects available donations to receivers based on their request history and allows donors to approve or reject item requests.

## 1. Data Models & Relationships
The foundation of the recommendation system lies in linking a `Donation` with a `User` (receiver).

**Models Created/Modified:**
*   `receiver.models.RecommendedDonation`
    *   Acts as the bridge table.
    *   **Fields:** `donation` (ForeignKey), `receiver` (ForeignKey), `similarity_score` (Float), `status` (Suggested, Requested, Accepted, Rejected).
    *   Enforces uniqueness so a receiver only gets recommended a specific item once.
*   `receiver.models.DonationOrder`
    *   Tracks the delivery lifecycle.
    *   Added a `unique_active_donation_order` constraint to ensure a donation cannot have multiple active orders (preventing double-booking).

## 2. Receiver Side: AI Recommendation Engine
When a receiver visits their "AI Suggestions" dashboard, the system generates dynamic recommendations based on their past behavior.

**Backend Implementation:** `ReceiverRecommendationsAPIView` (in `donation/views.py`)
1.  **Profile Building:** The system fetches the user's `ItemRequest` history and computes their top 5 preferred categories, top 3 preferred item conditions, and average requested quantity.
2.  **Available Inventory:** It queries all active, verified `Donation` records (physical items only) that haven't been ordered yet.
3.  **Scoring Algorithm:** Each available donation is scored against the receiver's profile:
    *   *Category Match (40% Weight):* Higher score for perfectly matching their most frequently requested categories.
    *   *Condition Match (30% Weight):* Matches their historically requested item conditions (e.g., "new", "gently used").
    *   *Quantity Match (10% Weight):* Ensures the donation has at least the amount they typically need.
    *   *Freshness Bonus (5% Weight):* Slightly boosts newly posted donations (under 7 days old) to keep the feed active.
4.  **Sorting & Response:** The results are sorted by the highest `similarity_score` and returned to the frontend. If the user has no history, it defaults to showing the most recently verified donations.

## 3. Donor Side: Managing Requests
When a receiver decides they want a recommended item, they "request" it, changing the recommendation status from `suggested` to `requested`. The donor then sees this in their dashboard.

**Backend Implementation:**
*   `DonationRequestsForItemView`: Allows the donor to view all pending requests (`status='requested'`) for a specific item they donated, ordered by how well the receiver's profile matched the item.
*   `DonorApproveRecommendationView`: Handles the donor's decision to accept a receiver:
    1.  Locks the row using `select_for_update()` to prevent race conditions (two people approving at the exact same millisecond).
    2.  Updates the specific recommendation to `accepted`.
    3.  Updates the parent `Donation` status to `assigned`.
    4.  **Crucial Step:** Automatically bulk-updates all *other* pending requests for this specific donation to `rejected`, ensuring no one else is kept waiting.
    5.  Generates a `DonationOrder` to kick off the volunteer delivery or self-pickup process.
    6.  Dispatches a success `Notification` to the winning receiver.
*   `DonorRejectRecommendationView`: Allows a donor to manually decline a receiver, setting the recommendation to `rejected` and notifying the receiver so they can look for other items.

## 4. Frontend Integration
The user interfaces were updated to expose this new data layer cleanly.

*   **Receiver UI (`Recommendations.jsx`):** Displays the algorithmically chosen items with a "Request Item" button.
*   **Receiver Insights (`ReceiverProfileInsightsAPIView`):** A secondary API endpoint that returns the mathematical breakdown of the receiver's profile (their top categories/conditions) so they can visually see *why* certain items are being recommended to them.
*   **Donor UI:** The "My Donations" page features a "View Requests" drawer/modal where donors evaluate incoming requests and click "Approve" or "Reject", driving the backend logic described above.
*   **Navigation (`UserLayout.jsx`):** A new "✨ AI Suggestions" link was added to the Receiver's sidebar.
