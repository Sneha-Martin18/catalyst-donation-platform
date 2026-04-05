# 📝 EXACT CODE CHANGES - Line by Line

## File 1: `catalyst/analytics/views.py`

### Change 1: Updated Imports (Line 1-16)

**ADDED:**
```python
from rest_framework.permissions import IsAuthenticated  # NEW
from django.db.models import Count, Avg                # NEW - for aggregation
from donation.serializers import PublicDonationSerializer  # NEW
```

**Updated imports section now:**
```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated  # ← Updated
from rest_framework import status
from django.db.models import Sum, Count, Avg  # ← Updated with Count, Avg
from django.utils.timezone import now
from datetime import timedelta
from rest_framework.generics import ListAPIView
from django.http import FileResponse

from donation.models import Donation
from donation.serializers import PublicDonationSerializer  # ← NEW
from receiver.models import ItemRequest
from analytics.models import AnalyticsReport
from analytics.serializers import AnalyticsReportSerializer
from analytics.utils.report_pdf import generate_report_pdf
```

### Change 2: Added New Views (After Line 180)

**ADDED at end of file:**
```python
# ==================================================
# AI RECOMMENDATION VIEWS
# ==================================================

class ReceiverRecommendationsAPIView(APIView):
    """
    Get AI-powered donation recommendations for receivers
    Based on their request history
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Query params
        limit = int(request.query_params.get('limit', 10))
        
        # Get user's request history
        user_requests = ItemRequest.objects.filter(receiver=request.user)
        
        # ❌ No request history -> fallback to recent donations
        if not user_requests.exists():
            donations = Donation.objects.filter(
                status='verified',
                donation_type='item'
            ).exclude(
                orders__isnull=False
            ).order_by('-created_at')[:limit]
            
            serializer = PublicDonationSerializer(donations, many=True)
            return Response({
                "recommendations": serializer.data,
                "count": len(donations),
                "message": "No request history found. Showing recent donations."
            }, status=status.HTTP_200_OK)
        
        # 1️⃣ Build preference profile from request history
        preferred_categories = list(
            user_requests.values('category')
            .annotate(count=Count('id'))
            .order_by('-count')
            .values_list('category', flat=True)[:5]
        )
        
        preferred_conditions = list(
            user_requests.values('condition')
            .annotate(count=Count('id'))
            .order_by('-count')
            .values_list('condition', flat=True)[:3]
        )
        
        avg_quantity = user_requests.aggregate(
            avg_qty=Avg('quantity')
        )['avg_qty'] or 1
        
        # 2️⃣ Get available donations
        available = Donation.objects.filter(
            status='verified',
            donation_type='item'
        ).exclude(
            orders__isnull=False
        ).order_by('-created_at')
        
        if not available.exists():
            return Response({
                "recommendations": [],
                "count": 0,
                "message": "No donations available at the moment."
            }, status=status.HTTP_200_OK)
        
        # 3️⃣ Score each donation based on user profile
        scored = []
        for donation in available:
            score = 0
            
            # Category match (40%)
            if donation.category in preferred_categories:
                idx = preferred_categories.index(donation.category)
                score += (5 - idx) * 0.08
            
            # Condition match (30%)
            if donation.condition in preferred_conditions:
                idx = preferred_conditions.index(donation.condition)
                score += (3 - idx) * 0.10
            
            # Quantity match (10%)
            if donation.quantity >= avg_quantity:
                score += 0.10
            
            # Freshness bonus (5%) - newer donations get slight boost
            days_old = (now() - donation.created_at).days
            if days_old < 7:
                score += 0.05
            
            scored.append({'donation': donation, 'score': score})
        
        # 4️⃣ Sort by score & return top matches
        scored.sort(key=lambda x: x['score'], reverse=True)
        recommendations = [item['donation'] for item in scored[:limit]]
        
        serializer = PublicDonationSerializer(recommendations, many=True)
        return Response({
            "recommendations": serializer.data,
            "count": len(recommendations),
            "message": "Personalized recommendations based on your request history"
        }, status=status.HTTP_200_OK)


class ReceiverProfileInsightsAPIView(APIView):
    """
    Get receiver's preference profile and trending items
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_requests = ItemRequest.objects.filter(receiver=request.user)
        
        # ❌ No requests yet
        if not user_requests.exists():
            return Response({
                "profile": None,
                "trending_categories": [],
                "message": "Make some requests to see your preference profile"
            }, status=status.HTTP_200_OK)
        
        # 1️⃣ Build user preference profile
        profile = {
            'preferred_categories': list(
                user_requests.values('category')
                .annotate(count=Count('id'))
                .order_by('-count')
                .values_list('category', flat=True)[:5]
            ),
            'preferred_conditions': list(
                user_requests.values('condition')
                .annotate(count=Count('id'))
                .order_by('-count')
                .values_list('condition', flat=True)[:3]
            ),
            'request_count': user_requests.count(),
            'avg_quantity': round(
                user_requests.aggregate(Avg('quantity'))['quantity__avg'] or 1, 2
            ),
        }
        
        # 2️⃣ Get trending categories across all donations
        trending = Donation.objects.filter(
            status='verified',
            donation_type='item'
        ).values('category').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        trending_list = [
            {
                'category': item['category'],
                'available_count': item['count']
            }
            for item in trending
        ]
        
        return Response({
            "profile": profile,
            "trending_categories": trending_list
        }, status=status.HTTP_200_OK)
```

---

## File 2: `catalyst/analytics/urls.py`

### Complete File (REPLACED)

**BEFORE:**
```python
from django.urls import path
from .views import AnalyticsReportListView, CategoryBalanceAnalyticsAPIView, ReportPDFDownloadView
from donation.views import DonationRequestRatioView
from analytics.views import GenerateAnalyticsReportView

urlpatterns = [
    path(
        'admin/analytics/category-balance/',
        CategoryBalanceAnalyticsAPIView.as_view(),
        name='category-balance-analytics'
    ),
    path(
        "donation-request-ratio/",
        DonationRequestRatioView.as_view(),
        name="donation-request-ratio"
    ),
     path(
        "reports/generate/",
        GenerateAnalyticsReportView.as_view(),
        name="generate-analytics-report"
    ),
     path(
        "reports/",
        AnalyticsReportListView.as_view(),
        name="analytics-report-list"
    ),
     path("reports/<int:report_id>/pdf/", ReportPDFDownloadView.as_view(),
        name="analytics-report-pdf-download"),
]
```

**AFTER:**
```python
from django.urls import path
from .views import (
    AnalyticsReportListView, 
    CategoryBalanceAnalyticsAPIView, 
    ReportPDFDownloadView,
    ReceiverRecommendationsAPIView,          # ← NEW
    ReceiverProfileInsightsAPIView,          # ← NEW
)
from donation.views import DonationRequestRatioView
from analytics.views import GenerateAnalyticsReportView

urlpatterns = [
    # Admin Analytics
    path(
        'admin/analytics/category-balance/',
        CategoryBalanceAnalyticsAPIView.as_view(),
        name='category-balance-analytics'
    ),
    path(
        "donation-request-ratio/",
        DonationRequestRatioView.as_view(),
        name="donation-request-ratio"
    ),
    
    # Reports
    path(
        "reports/generate/",
        GenerateAnalyticsReportView.as_view(),
        name="generate-analytics-report"
    ),
    path(
        "reports/",
        AnalyticsReportListView.as_view(),
        name="analytics-report-list"
    ),
    path(
        "reports/<int:report_id>/pdf/", 
        ReportPDFDownloadView.as_view(),
        name="analytics-report-pdf-download"
    ),
    
    # AI Recommendations ← NEW SECTION
    path(
        'recommendations/', 
        ReceiverRecommendationsAPIView.as_view(), 
        name='receiver-recommendations'
    ),
    path(
        'receiver-insights/', 
        ReceiverProfileInsightsAPIView.as_view(), 
        name='receiver-insights'
    ),
]
```

---

## File 3: `donation-frontend/src/components/Recommendations/RecommendationEngine.jsx`

**NEW FILE - 130 lines**
```jsx
import { useEffect, useState } from "react";
import api from "../../api/api";
import "./RecommendationEngine.css";

function RecommendationEngine() {
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("recommendations");

  useEffect(() => {
    fetchRecommendations();
    fetchInsights();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await api.get("analytics/recommendations/?limit=12");
      setRecommendations(res.data.recommendations);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const res = await api.get("analytics/receiver-insights/");
      setInsights(res.data);
    } catch (err) {
      console.error("Failed to fetch insights:", err);
    }
  };

  if (loading) {
    return <div className="rec-loading">⏳ Analyzing your preferences...</div>;
  }

  return (
    <div className="recommendation-engine">
      <div className="rec-header">
        <h2>🤖 AI-Powered Recommendations</h2>
        <p>Based on your request history</p>
      </div>

      {/* Tabs */}
      <div className="rec-tabs">
        <button
          className={`tab ${activeTab === "recommendations" ? "active" : ""}`}
          onClick={() => setActiveTab("recommendations")}
        >
          💡 For You
        </button>
        <button
          className={`tab ${activeTab === "insights" ? "active" : ""}`}
          onClick={() => setActiveTab("insights")}
        >
          📊 Your Profile
        </button>
      </div>

      {/* Recommendations Tab */}
      {activeTab === "recommendations" && (
        <div className="rec-content">
          {error ? (
            <div className="rec-error">{error}</div>
          ) : recommendations.length > 0 ? (
            <div className="rec-grid">
              {recommendations.map((donation) => (
                <div key={donation.id} className="rec-card">
                  {/* Image */}
                  <div className="rec-image">
                    {donation.images && donation.images.length > 0 ? (
                      <img 
                        src={donation.images[0].image_url} 
                        alt={donation.item_name}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/240x180?text=No+Image";
                        }}
                      />
                    ) : (
                      <div className="rec-no-image">📷</div>
                    )}
                    <div className="rec-badge">AI ✨</div>
                  </div>

                  {/* Content */}
                  <div className="rec-body">
                    <h3>{donation.item_name}</h3>
                    <p className="rec-category">📦 {donation.category}</p>
                    <p className="rec-condition">
                      Condition: {donation.condition?.replace(/_/g, " ")}
                    </p>
                    <p className="rec-quantity">Qty: {donation.quantity}</p>
                    <p className="rec-description">
                      {donation.description?.substring(0, 60)}...
                    </p>
                  </div>

                  {/* Action */}
                  <button className="rec-btn-request">Request Item</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rec-empty">
              <p>📭 No recommendations yet. Make some requests to get personalized suggestions!</p>
            </div>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === "insights" && insights && (
        <div className="rec-insights">
          <div className="insights-section">
            <h3>📋 Your Preferences</h3>
            {insights.profile ? (
              <div className="insights-grid">
                <div className="insight-card">
                  <span className="insight-label">Favorite Categories</span>
                  <div className="insight-values">
                    {insights.profile.preferred_categories.map((cat, idx) => (
                      <span key={idx} className="insight-tag">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="insight-card">
                  <span className="insight-label">Preferred Conditions</span>
                  <div className="insight-values">
                    {insights.profile.preferred_conditions.map((cond, idx) => (
                      <span key={idx} className="insight-tag">
                        {cond?.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="insight-card">
                  <span className="insight-label">Total Requests</span>
                  <div className="insight-value">{insights.profile.request_count}</div>
                </div>

                <div className="insight-card">
                  <span className="insight-label">Avg Quantity</span>
                  <div className="insight-value">{Math.round(insights.profile.avg_quantity)}</div>
                </div>
              </div>
            ) : (
              <p>Make some requests to see your preference profile</p>
            )}
          </div>

          <div className="insights-section">
            <h3>🔥 Trending Now</h3>
            <div className="trending-list">
              {insights.trending_categories.map((item, idx) => (
                <div key={idx} className="trending-item">
                  <span className="trending-rank">#{idx + 1}</span>
                  <span className="trending-category">{item.category}</span>
                  <span className="trending-count">{item.available_count} available</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecommendationEngine;
```

---

## File 4: `donation-frontend/src/components/Recommendations/RecommendationEngine.css`

**NEW FILE - 280 lines of CSS**
(See separate CSS file - too long to include here)

---

## Summary of Changes

| File | Type | Lines Added | Lines Removed | Status |
|------|------|-------------|---------------|--------|
| analytics/views.py | Backend | ~130 | 0 | ✅ Modified |
| analytics/urls.py | Backend | ~20 | ~8 | ✅ Modified |
| RecommendationEngine.jsx | Frontend | 130 | 0 | ✅ Created |
| RecommendationEngine.css | Frontend | 280 | 0 | ✅ Created |

**Total Changes:**
- 560 lines of new code
- 2 files modified
- 2 files created
- 0 files deleted
- 0 database migrations needed
- 0 breaking changes

**All changes are backward compatible!** ✅
