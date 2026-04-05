# Catalyst AI Recommendation System: Key Variables & Terminology

This document serves as a reference for all specific keywords, fields, and variables used to drive the Catalyst AI Donation Recommendation engine, spanning both the database layer and the scoring algorithm.

## 1. Database Fields (receiver.models)
When establishing the link between a specific `Donation` and a `User` (receiver), the `RecommendedDonation` model utilizes the following structural keywords:

*   **`donation`**: The foreign key linking to the `Donation` item.
*   **`receiver`**: The foreign key linking to the `User` who is receiving the recommendation.
*   **`similarity_score`**: (Float) A numerical value ranging from 0.0 upwards that determines how strongly the item matches the receiver's historical preferences. Higher means a better match.
*   **`status`**: The current state of the recommendation lifecycle. Valid keywords are:
    *   `'suggested'`: The initial state when the AI engine generates the match.
    *   `'requested'`: The receiver has seen the suggestion and clicked "Request Item".
    *   `'accepted'`: The donor has seen the request and clicked "Approve".
    *   `'rejected'`: The donor has seen the request and clicked "Reject", OR the donor approved someone else (which auto-rejects all parallel requests).

## 2. API Endpoints
The frontend communicates with the AI system using these specific endpoint routes:

*   **`GET /api/donation/recommendations/`**: `ReceiverRecommendationsAPIView` – Fetches the personalized feed for the receiver.
*   **`GET /api/donation/receiver-insights/`**: `ReceiverProfileInsightsAPIView` – Fetches the exact breakdown of the receiver's preference profile (top categories, average quantity, etc.).
*   **`GET /api/donation/<donation_id>/requests/`**: `DonationRequestsForItemView` – Allows a donor to view a list of people who have `'requested'` their item.
*   **`POST /api/donation/recommendations/<recommendation_id>/approve/`**: `DonorApproveRecommendationView` – Donor approves a specific request.
*   **`POST /api/donation/recommendations/<recommendation_id>/reject/`**: `DonorRejectRecommendationView` – Donor rejects a specific request.

## 3. The Scoring Engine Variables (`ReceiverRecommendationsAPIView`)
When `ReceiverRecommendationsAPIView` executes, it builds a mathematical profile using specific variable names to calculate the final `similarity_score`. 

Here are the key variables and parameters used in the logic:

### Profile Generation Variables
*   **`preferred_categories`**: A list of the top 5 `category` strings most frequently requested by the receiver.
*   **`preferred_conditions`**: A list of the top 3 `condition` strings (e.g., `'new_unused'`, `'gently_used'`) most frequently requested.
*   **`avg_quantity`**: (Float/Integer) The average `quantity` requested across all their past `ItemRequest` objects.

### Scoring Calculation Metrics
Each `Donation` is iterated over, and its `score` variable is accumulated based on:
1.  **Category Focus**: 
    ```python
    if donation.category in preferred_categories:
        idx = preferred_categories.index(donation.category)
        score += (5 - idx) * 0.08
    ```
    *(If it's their #1 requested category (idx 0), they get 0.40 points. If it's #5, they get 0.08 points).*

2.  **Condition Focus**:
    ```python
    if donation.condition in preferred_conditions:
        idx = preferred_conditions.index(donation.condition)
        score += (3 - idx) * 0.10
    ```
    *(If it's their #1 most requested condition, they get 0.30 points).*

3.  **Volume Match**:
    ```python
    if donation.quantity >= avg_quantity:
        score += 0.10
    ```
    *(If the donation provides enough quantity to meet their historical average, they get a flat 0.10 points).*

4.  **Age Decay (Freshness)**:
    ```python
    days_old = (now() - donation.created_at).days
    if days_old < 7:
        score += 0.05
    ```
    *(If the donation was created less than 7 days ago, it receives a flat 0.05 bonus, prioritizing newer inventory without eliminating older identical matches).*

### Presentation Variables
*   **`score`**: The active accumulator for the current donation being evaluated.
*   **`limit`**: (Query Parameter) The maximum number of recommendations to return (defaults to `10`).
*   **`scored.sort(key=lambda x: x['score'], reverse=True)`**: The final sorting algorithm prioritizing the highest scores first.
