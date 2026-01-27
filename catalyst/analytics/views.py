from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from django.db.models import Sum
from django.utils.timezone import now
from datetime import timedelta
from rest_framework.generics import ListAPIView
from django.http import FileResponse

from donation.models import Donation
from receiver.models import ItemRequest
from analytics.models import AnalyticsReport
from analytics.serializers import AnalyticsReportSerializer
from analytics.utils.report_pdf import generate_report_pdf

class CategoryBalanceAnalyticsAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not start_date or not end_date:
            return Response(
                {"error": "start_date and end_date are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # --- Aggregate donations ---
        donation_qs = (
            Donation.objects
            .filter(
                status='verified',
                created_at__date__range=[start_date, end_date]
            )
            .values('category')
            .annotate(total_donated=Sum('quantity'))
        )

        # --- Aggregate requests ---
        request_qs = (
            ItemRequest.objects
            .filter(
                status='approved',
                created_at__date__range=[start_date, end_date]
            )
            .values('category')
            .annotate(total_requested=Sum('quantity'))
        )

        # --- Merge by category ---
        category_map = {}

        for d in donation_qs:
            category_map[d['category']] = {
                "category": d['category'],
                "donated": d['total_donated'],
                "requested": 0
            }

        for r in request_qs:
            if r['category'] not in category_map:
                category_map[r['category']] = {
                    "category": r['category'],
                    "donated": 0,
                    "requested": r['total_requested']
                }
            else:
                category_map[r['category']]['requested'] = r['total_requested']

        return Response({
            "start_date": start_date,
            "end_date": end_date,
            "categories": list(category_map.values())
        })

class GenerateAnalyticsReportView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        days = int(request.data.get("days", 30))
        end_date = now().date()
        start_date = end_date - timedelta(days=days)

        # ---- Compute Donations ----
        total_donations = (
            Donation.objects
            .filter(
                created_at__date__gte=start_date,
                created_at__date__lte=end_date,
                status__in=["verified", "assigned", "delivered"]
            )
            .aggregate(total=Sum("quantity"))["total"] or 0
        )

        # ---- Compute Requests ----
        total_requests = (
            ItemRequest.objects
            .filter(
                created_at__date__gte=start_date,
                created_at__date__lte=end_date,
                status__in=["approved", "completed"]
            )
            .aggregate(total=Sum("quantity"))["total"] or 0
        )

        # ---- Ratio & Status ----
        ratio = round(
            total_donations / total_requests, 2
        ) if total_requests > 0 else 0

        if ratio == 0:
            status_summary = "No demand recorded"
        elif ratio < 1:
            status_summary = "Demand-heavy"
        elif ratio == 1:
            status_summary = "Balanced"
        else:
            status_summary = "Supply-heavy"

        # ---- Auto-generated Text ----
        executive_summary = (
            f"This report analyzes donation and request activity between "
            f"{start_date} and {end_date}. During this period, the system "
            f"recorded {total_donations} donated items and "
            f"{total_requests} requested items, indicating a "
            f"{status_summary.lower()} state."
        )

        system_conclusion = (
            f"Based on the observed donation–request ratio of {ratio}, "
            f"the system currently reflects a {status_summary.lower()} "
            f"condition. Administrative action may be required depending "
            f"on ongoing trends."
        )

        # ---- Create Report ----
        report = AnalyticsReport.objects.create(
            title=f"Donation & Request Analysis ({start_date} → {end_date})",
            generated_by=request.user,
            start_date=start_date,
            end_date=end_date,
            total_donations=total_donations,
            total_requests=total_requests,
            donation_request_ratio=ratio,
            status_summary=status_summary,
            executive_summary=executive_summary,
            system_conclusion=system_conclusion,
        )

        return Response(
            {
                "id": report.id,
                "title": report.title,
                "status": "Report generated successfully"
            },
            status=status.HTTP_201_CREATED
        )
class AnalyticsReportListView(ListAPIView):
    queryset = AnalyticsReport.objects.all()
    serializer_class = AnalyticsReportSerializer
    permission_classes = [IsAdminUser]
    
class ReportPDFDownloadView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, report_id):
        report = AnalyticsReport.objects.get(id=report_id)
        pdf_buffer = generate_report_pdf(report)

        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"{report.title}.pdf",
            content_type="application/pdf",
        )
