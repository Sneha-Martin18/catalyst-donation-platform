from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from donation.models import Donation
from receiver.models import ItemRequest, DonationOrder
from users.models import User
import re

class ChatbotQueryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_message = request.data.get('message', '').lower().strip()
        user = request.user
        
        # 1. HELP / FAQ
        if any(word in user_message for word in ["help", "faq", "what can you do", "hi", "hello"]):
            return Response({
                "message": f"Hi {user.username}! I'm your Catalyst Assistant. I can help you with:\n"
                           "- Checking your donation status\n"
                           "- Tracking your requested items\n"
                           "- Viewing your volunteer tasks\n"
                           "What would you like to know?",
                "options": [
                    {"label": "Check Donation Status", "value": "my donation status"},
                    {"label": "Check My Requests", "value": "my request status"},
                    {"label": "Donation Guide", "value": "how to donate"}
                ]
            })

        # 2. DONATION STATUS
        if "donation" in user_message and ("status" in user_message or "check" in user_message or "my" in user_message):
            try:
                latest_donation = Donation.objects.filter(donor=user).order_by('-created_at').first()
                if latest_donation:
                    return Response({
                        "message": f"Your latest donation for '{latest_donation.item_name}' is currently in **{latest_donation.status}** status.",
                        "options": [
                            {"label": "View All Donations", "type": "navigate", "path": "/dashboard/user/donations"},
                            {"label": "Donate More", "type": "navigate", "path": "/dashboard/user/donate"}
                        ]
                    })
                else:
                    return Response({
                        "message": "It looks like you haven't made any donations yet. Would you like to start?",
                        "options": [{"label": "Start Donating", "type": "navigate", "path": "/dashboard/user/donate"}]
                    })
            except Exception as e:
                return Response({"message": "I'm having trouble fetching your donations right now. Please try again later."})

        # 3. REQUEST STATUS
        if "request" in user_message or "order" in user_message:
            try:
                latest_order = DonationOrder.objects.filter(receiver=user).order_by('-created_at').first()
                if latest_order:
                    return Response({
                        "message": f"Your order for '{latest_order.donation.item_name}' is currently {latest_order.status}.",
                        "options": [{"label": "View My Orders", "type": "navigate", "path": "/dashboard/user/my-orders"}]
                    })
                else:
                    return Response({
                        "message": "You don't have any active orders. Browse our checkout to find items you need!",
                        "options": [{"label": "Browse Items", "type": "navigate", "path": "/dashboard/user/browse"}]
                    })
            except Exception:
                return Response({"message": "I couldn't find your request status details."})

        # 4. VOLUNTEER TASKS
        if "volunteer" in user_message or "task" in user_message:
            try:
                latest_task = DonationOrder.objects.filter(volunteer=user, status__in=['assigned', 'picked_up']).order_by('-created_at').first()
                if latest_task:
                    return Response({
                        "message": f"You have an active task: '{latest_task.donation.item_name}' which is currently **{latest_task.status}**.",
                        "options": [{"label": "View All Tasks", "type": "navigate", "path": "/dashboard/user/tasks"}]
                    })
                else:
                    return Response({
                        "message": "You don't have any active delivery tasks at the moment.",
                        "options": [{"label": "View History", "type": "navigate", "path": "/dashboard/user/volunteer-history"}]
                    })
            except Exception:
                return Response({"message": "I couldn't fetch your volunteer tasks right now."})

        # 4. HOW TO/GUIDE
        if "how" in user_message and "donate" in user_message:
            return Response({
                "message": "To donate: Go to the 'New Donation' page, fill in the item details, add a photo, and set your pickup address. An admin will verify it soon!",
                "options": [{"label": "Go to Donate", "type": "navigate", "path": "/dashboard/user/donate"}]
            })

        # FALLBACK
        return Response({
            "message": "I'm not sure I understand. I can help with status updates or basic guides. Try asking 'What is my donation status?'",
            "options": [
                {"label": "Donation Status", "value": "donation status"},
                {"label": "Request Status", "value": "request status"},
                {"label": "Help", "value": "help"}
            ]
        })
