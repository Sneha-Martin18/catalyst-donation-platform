from django.urls import path
from .views import (
    AnalyticsReportListView, 
    CategoryBalanceAnalyticsAPIView, 
    ReportPDFDownloadView,
    ReceiverRecommendationsAPIView,
    ReceiverProfileInsightsAPIView,
)
from donation.views import DonationRequestRatioView
from analytics.views import GenerateAnalyticsReportView, PredictiveAnalyticsAPIView

urlpatterns = [
    # Admin Analytics
    path(
        'admin/analytics/predictions/',
        PredictiveAnalyticsAPIView.as_view(),
        name='demand-predictions'
    ),
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
    
    # AI Recommendations
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
