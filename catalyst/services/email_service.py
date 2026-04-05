"""
Email service for sending notifications to users
"""
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags


def send_order_confirmation_email(order):
    """
    Send order confirmation email to the receiver when order is created.
    
    Args:
        order: DonationOrder instance
    """
    try:
        receiver = order.receiver
        donation = order.donation
        
        # Email content
        subject = f"Order Confirmation - {donation.item_name}"
        
        # HTML email body
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{
                        font-family: 'Inter', 'Roboto', Arial, sans-serif;
                        background-color: #f8fafb;
                        color: #2c3e50;
                    }}
                    .email-container {{
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    }}
                    .email-header {{
                        background: linear-gradient(135deg, #b0c924 0%, #96a829 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                    }}
                    .email-header h1 {{
                        margin: 0;
                        font-size: 28px;
                        font-weight: 700;
                    }}
                    .email-body {{
                        padding: 30px;
                    }}
                    .order-details {{
                        background: #f8fafb;
                        border-left: 4px solid #b0c924;
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }}
                    .detail-row {{
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px solid #eee;
                    }}
                    .detail-row:last-child {{
                        border-bottom: none;
                    }}
                    .detail-label {{
                        font-weight: 600;
                        color: #7f8c8d;
                        font-size: 14px;
                    }}
                    .detail-value {{
                        color: #2c3e50;
                        font-weight: 600;
                    }}
                    .greeting {{
                        font-size: 16px;
                        margin: 0 0 20px 0;
                        color: #2c3e50;
                    }}
                    .message {{
                        font-size: 15px;
                        color: #555;
                        line-height: 1.6;
                        margin: 20px 0;
                    }}
                    .cta-button {{
                        display: inline-block;
                        background: #b0c924;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 6px;
                        margin: 20px 0;
                        font-weight: 600;
                        font-size: 14px;
                    }}
                    .cta-button:hover {{
                        background: #a0b91d;
                    }}
                    .status-badge {{
                        display: inline-block;
                        background: #fef3c7;
                        color: #92400e;
                        padding: 8px 12px;
                        border-radius: 6px;
                        font-size: 13px;
                        font-weight: 600;
                        margin: 10px 0;
                    }}
                    .email-footer {{
                        background: #2c3e50;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        font-size: 13px;
                    }}
                    .footer-text {{
                        margin: 5px 0;
                    }}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="email-header">
                        <h1>✅ Order Confirmed!</h1>
                    </div>
                    
                    <div class="email-body">
                        <p class="greeting">Hi {receiver.get_full_name() or receiver.username},</p>
                        
                        <p class="message">
                            Great news! Your order has been successfully created. We've received your request and our team is reviewing it.
                        </p>
                        
                        <div class="order-details">
                            <div class="detail-row">
                                <span class="detail-label">Order ID</span>
                                <span class="detail-value">#{order.id}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Item</span>
                                <span class="detail-value">{donation.item_name}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Category</span>
                                <span class="detail-value">{donation.category.title()}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Delivery Method</span>
                                <span class="detail-value">
                                    {'🚴 Volunteer Pickup' if order.delivery_type == 'volunteer' else '🏠 Self Pickup'}
                                </span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Order Status</span>
                                <span class="status-badge">⏳ Pending Approval</span>
                            </div>
                        </div>
                        
                        <p class="message">
                            <strong>What happens next?</strong><br>
                            Our team will review your order and approve it shortly. Once approved, we'll notify you about the delivery details and connect you with the donor if needed.
                        </p>
                        
                        <p class="message">
                            You can track your order status anytime by visiting your dashboard.
                        </p>
                        
                        <center>
                            <a href="{settings.FRONTEND_URL}/dashboard/user/my-orders" class="cta-button">
                                Track Your Order
                            </a>
                        </center>
                        
                        <p class="message" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #7f8c8d; font-size: 13px;">
                            If you have any questions about your order, please contact our support team or reply to this email.
                        </p>
                    </div>
                    
                    <div class="email-footer">
                        <p class="footer-text">
                            <strong>Catalyst Donation Platform</strong>
                        </p>
                        <p class="footer-text">
                            © 2026 All rights reserved.
                        </p>
                        <p class="footer-text">
                            This is an automated message, please do not reply directly to this email.
                        </p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Plain text fallback
        text_content = f"""
        Order Confirmation - {donation.item_name}
        
        Hi {receiver.get_full_name() or receiver.username},
        
        Great news! Your order has been successfully created.
        
        ORDER DETAILS:
        Order ID: #{order.id}
        Item: {donation.item_name}
        Category: {donation.category}
        Delivery Method: {'Volunteer Pickup' if order.delivery_type == 'volunteer' else 'Self Pickup'}
        Status: Pending Approval ⏳
        
        What happens next?
        Our team will review your order and approve it shortly. Once approved, we'll notify you about the delivery details.
        
        You can track your order at: {settings.FRONTEND_URL}/dashboard/user/my-orders
        
        If you have any questions, please contact us.
        
        Best regards,
        Catalyst Team
        """
        
        # Create email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[receiver.email]
        )
        
        # Attach HTML version
        email.attach_alternative(html_content, "text/html")
        
        # Send email
        email.send(fail_silently=False)
        
        print(f"✅ Order confirmation email sent to {receiver.email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send order confirmation email: {str(e)}")
        return False


def send_order_approved_email(order):
    """
    Send email when admin approves an order.
    """
    try:
        receiver = order.receiver
        donation = order.donation
        
        subject = f"Great News! Your Order is Approved - {donation.item_name}"
        
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{
                        font-family: 'Inter', 'Roboto', Arial, sans-serif;
                        background-color: #f8fafb;
                        color: #2c3e50;
                    }}
                    .email-container {{
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    }}
                    .email-header {{
                        background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                    }}
                    .email-header h1 {{
                        margin: 0;
                        font-size: 28px;
                        font-weight: 700;
                    }}
                    .email-body {{
                        padding: 30px;
                    }}
                    .success-badge {{
                        display: inline-block;
                        background: #dcfce7;
                        color: #166534;
                        padding: 10px 15px;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 600;
                        margin: 15px 0;
                    }}
                    .message {{
                        font-size: 15px;
                        color: #555;
                        line-height: 1.6;
                        margin: 15px 0;
                    }}
                    .cta-button {{
                        display: inline-block;
                        background: #16a34a;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 6px;
                        margin: 20px 0;
                        font-weight: 600;
                    }}
                    .email-footer {{
                        background: #2c3e50;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        font-size: 13px;
                    }}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="email-header">
                        <h1>🎉 Your Order is Approved!</h1>
                    </div>
                    
                    <div class="email-body">
                        <p class="message">Hi {receiver.get_full_name() or receiver.username},</p>
                        
                        <p class="message">
                            Excellent news! Your order for <strong>{donation.item_name}</strong> has been approved! 
                        </p>
                        
                        <div class="success-badge">✅ Order Approved</div>
                        
                        <p class="message">
                            <strong>Next Steps:</strong><br>
                            {'A volunteer will deliver the item to your provided address shortly.' if order.delivery_type == 'volunteer' else 'You can now pick up the item from the donor.'}
                        </p>
                        
                        <center>
                            <a href="{settings.FRONTEND_URL}/dashboard/user/my-orders" class="cta-button">
                                View Order Details
                            </a>
                        </center>
                    </div>
                    
                    <div class="email-footer">
                        <p>© 2026 Catalyst Donation Platform</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        text_content = f"""
        Your Order is Approved!
        
        Hi {receiver.get_full_name() or receiver.username},
        
        Great news! Your order for {donation.item_name} has been approved.
        
        Next Steps:
        {'A volunteer will deliver the item to your address shortly.' if order.delivery_type == 'volunteer' else 'You can now pick up the item from the donor.'}
        
        Check your order details at: {settings.FRONTEND_URL}/dashboard/user/my-orders
        
        Best regards,
        Catalyst Team
        """
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[receiver.email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to send approval email: {str(e)}")
        return False


def send_delivery_completed_email(order):
    """
    Send email to both receiver and donor when delivery is marked as completed.
    """
    try:
        receiver = order.receiver
        donor = order.donation.donor
        donation = order.donation
        volunteer = order.volunteer
        
        # Email to RECEIVER
        subject_receiver = f"Delivery Completed! - {donation.item_name}"
        
        html_content_receiver = f"""
        <html>
            <head>
                <style>
                    body {{
                        font-family: 'Inter', 'Roboto', Arial, sans-serif;
                        background-color: #f8fafb;
                        color: #2c3e50;
                    }}
                    .email-container {{
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    }}
                    .email-header {{
                        background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                    }}
                    .email-header h1 {{
                        margin: 0;
                        font-size: 28px;
                        font-weight: 700;
                    }}
                    .email-body {{
                        padding: 30px;
                    }}
                    .success-box {{
                        background: #dcfce7;
                        border-left: 4px solid #16a34a;
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }}
                    .detail-row {{
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px solid #eee;
                    }}
                    .detail-row:last-child {{
                        border-bottom: none;
                    }}
                    .detail-label {{
                        font-weight: 600;
                        color: #7f8c8d;
                    }}
                    .detail-value {{
                        color: #2c3e50;
                        font-weight: 600;
                    }}
                    .message {{
                        font-size: 15px;
                        color: #555;
                        line-height: 1.6;
                        margin: 15px 0;
                    }}
                    .cta-button {{
                        display: inline-block;
                        background: #16a34a;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 6px;
                        margin: 20px 0;
                        font-weight: 600;
                    }}
                    .email-footer {{
                        background: #2c3e50;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        font-size: 13px;
                    }}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="email-header">
                        <h1>🎉 Delivery Completed!</h1>
                    </div>
                    
                    <div class="email-body">
                        <p class="message">Hi {receiver.get_full_name() or receiver.username},</p>
                        
                        <p class="message">
                            Excellent news! Your order has been delivered successfully! 🎁
                        </p>
                        
                        <div class="success-box">
                            <p style="margin: 0; font-weight: 600; color: #166534;">✅ Delivery Confirmed</p>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;">
                                Your item <strong>{donation.item_name}</strong> was delivered on {donation.updated_at.strftime('%B %d, %Y')}
                            </p>
                        </div>
                        
                        <div style="background: #f8fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="margin: '0 0 10px 0'; color: #2c3e50;">Delivery Summary</h4>
                            <div class="detail-row">
                                <span class="detail-label">Item</span>
                                <span class="detail-value">{donation.item_name}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Volunteer Delivery By</span>
                                <span class="detail-value">{volunteer.get_full_name() or volunteer.username}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Delivered On</span>
                                <span class="detail-value">{donation.updated_at.strftime('%B %d, %Y at %I:%M %p')}</span>
                            </div>
                        </div>
                        
                        <p class="message">
                            Thank you for being part of the Catalyst community! Your support helps make a difference. 💚
                        </p>
                        
                        <center>
                            <a href="{settings.FRONTEND_URL}/dashboard/user/my-orders" class="cta-button">
                                View All Orders
                            </a>
                        </center>
                    </div>
                    
                    <div class="email-footer">
                        <p>© 2026 Catalyst Donation Platform</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        text_content_receiver = f"""
        Delivery Completed!
        
        Hi {receiver.get_full_name() or receiver.username},
        
        Great news! Your order has been delivered successfully!
        
        Item: {donation.item_name}
        Delivered By: {volunteer.get_full_name() or volunteer.username}
        Delivered On: {donation.updated_at.strftime('%B %d, %Y at %I:%M %p')}
        
        Thank you for being part of Catalyst!
        
        View your order: {settings.FRONTEND_URL}/dashboard/user/my-orders
        
        Best regards,
        Catalyst Team
        """
        
        email_receiver = EmailMultiAlternatives(
            subject=subject_receiver,
            body=text_content_receiver,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[receiver.email]
        )
        email_receiver.attach_alternative(html_content_receiver, "text/html")
        email_receiver.send(fail_silently=False)
        
        print(f"✅ Delivery completed email sent to receiver: {receiver.email}")
        
        # Email to DONOR
        subject_donor = f"Delivery Successful - {donation.item_name} Delivered"
        
        html_content_donor = f"""
        <html>
            <head>
                <style>
                    body {{
                        font-family: 'Inter', 'Roboto', Arial, sans-serif;
                        background-color: #f8fafb;
                        color: #2c3e50;
                    }}
                    .email-container {{
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    }}
                    .email-header {{
                        background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                    }}
                    .email-header h1 {{
                        margin: 0;
                        font-size: 28px;
                        font-weight: 700;
                    }}
                    .email-body {{
                        padding: 30px;
                    }}
                    .success-box {{
                        background: #dcfce7;
                        border-left: 4px solid #16a34a;
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }}
                    .detail-row {{
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px solid #eee;
                    }}
                    .detail-row:last-child {{
                        border-bottom: none;
                    }}
                    .detail-label {{
                        font-weight: 600;
                        color: #7f8c8d;
                    }}
                    .detail-value {{
                        color: #2c3e50;
                        font-weight: 600;
                    }}
                    .message {{
                        font-size: 15px;
                        color: #555;
                        line-height: 1.6;
                        margin: 15px 0;
                    }}
                    .cta-button {{
                        display: inline-block;
                        background: #16a34a;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 6px;
                        margin: 20px 0;
                        font-weight: 600;
                    }}
                    .email-footer {{
                        background: #2c3e50;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        font-size: 13px;
                    }}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="email-header">
                        <h1>✅ Delivery Successfully Completed</h1>
                    </div>
                    
                    <div class="email-body">
                        <p class="message">Hi {donor.get_full_name() or donor.username},</p>
                        
                        <p class="message">
                            Your donation has been successfully delivered! Thank you for your generosity! 💚
                        </p>
                        
                        <div class="success-box">
                            <p style="margin: 0; font-weight: 600; color: #166534;">✅ Delivery Confirmed</p>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;">
                                <strong>{donation.item_name}</strong> has been delivered to {receiver.get_full_name() or receiver.username}
                            </p>
                        </div>
                        
                        <div style="background: #f8fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="margin: '0 0 10px 0'; color: #2c3e50;">Donation Impact</h4>
                            <div class="detail-row">
                                <span class="detail-label">Item Donated</span>
                                <span class="detail-value">{donation.item_name}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Delivered To</span>
                                <span class="detail-value">{receiver.get_full_name() or receiver.username}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Delivered By</span>
                                <span class="detail-value">{volunteer.get_full_name() or volunteer.username}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Delivered On</span>
                                <span class="detail-value">{donation.updated_at.strftime('%B %d, %Y')}</span>
                            </div>
                        </div>
                        
                        <p class="message">
                            <strong>Your Impact:</strong> Your donation has made a real difference! Thank you for being part of the Catalyst community and helping those in need. 🌟
                        </p>
                        
                        <center>
                            <a href="{settings.FRONTEND_URL}/dashboard/donor" class="cta-button">
                                View More Opportunities to Help
                            </a>
                        </center>
                    </div>
                    
                    <div class="email-footer">
                        <p>© 2026 Catalyst Donation Platform</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        text_content_donor = f"""
        Delivery Successfully Completed!
        
        Hi {donor.get_full_name() or donor.username},
        
        Great news! Your donation has been successfully delivered!
        
        Donation Details:
        Item: {donation.item_name}
        Delivered To: {receiver.get_full_name() or receiver.username}
        Delivered By: {volunteer.get_full_name() or volunteer.username}
        Delivered On: {donation.updated_at.strftime('%B %d, %Y')}
        
        Your generosity has made a real difference. Thank you for being part of Catalyst!
        
        Best regards,
        Catalyst Team
        """
        
        email_donor = EmailMultiAlternatives(
            subject=subject_donor,
            body=text_content_donor,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[donor.email]
        )
        email_donor.attach_alternative(html_content_donor, "text/html")
        email_donor.send(fail_silently=False)
        
        print(f"✅ Delivery completed email sent to donor: {donor.email}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to send delivery completed email: {str(e)}")
        return False

def send_order_picked_up_email(order):
    """
    Send email to receiver when volunteer picks up the order.
    """
    try:
        receiver = order.receiver
        donation = order.donation
        volunteer = order.volunteer
        
        subject = f"Order Picked Up! - {donation.item_name}"
        
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{
                        font-family: 'Inter', 'Roboto', Arial, sans-serif;
                        background-color: #f8fafb;
                        color: #2c3e50;
                    }}
                    .email-container {{
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    }}
                    .email-header {{
                        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                    }}
                    .email-header h1 {{
                        margin: 0;
                        font-size: 28px;
                        font-weight: 700;
                    }}
                    .email-body {{
                        padding: 30px;
                    }}
                    .order-details {{
                        background: #fff7ed;
                        border-left: 4px solid #f97316;
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }}
                    .detail-row {{
                        display: flex;
                        justify-content: space-between;
                        padding: 10px 0;
                        border-bottom: 1px solid #eee;
                    }}
                    .detail-row:last-child {{
                        border-bottom: none;
                    }}
                    .detail-label {{
                        font-weight: 600;
                        color: #7f8c8d;
                        font-size: 14px;
                    }}
                    .detail-value {{
                        color: #2c3e50;
                        font-weight: 600;
                    }}
                    .status-badge {{
                        display: inline-block;
                        background: #fed7aa;
                        color: #92400e;
                        padding: 8px 12px;
                        border-radius: 6px;
                        font-size: 13px;
                        font-weight: 600;
                        margin: 10px 0;
                    }}
                    .greeting {{
                        font-size: 16px;
                        margin: 0 0 20px 0;
                        color: #2c3e50;
                    }}
                    .message {{
                        font-size: 15px;
                        color: #555;
                        line-height: 1.6;
                        margin: 20px 0;
                    }}
                    .volunteer-info {{
                        background: #f0f9ff;
                        border-left: 4px solid #3b82f6;
                        padding: 15px;
                        margin: 15px 0;
                        border-radius: 4px;
                    }}
                    .volunteer-label {{
                        font-size: 13px;
                        color: #1e40af;
                        font-weight: 600;
                    }}
                    .volunteer-name {{
                        font-size: 15px;
                        color: #1e40af;
                        font-weight: 700;
                    }}
                    .cta-button {{
                        display: inline-block;
                        background: #f97316;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 6px;
                        margin: 20px 0;
                        font-weight: 600;
                        font-size: 14px;
                    }}
                    .cta-button:hover {{
                        background: #ea580c;
                    }}
                    .email-footer {{
                        background: #2c3e50;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        font-size: 13px;
                    }}
                    .footer-text {{
                        margin: 5px 0;
                    }}
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="email-header">
                        <h1>🚴 Order On The Way!</h1>
                    </div>
                    
                    <div class="email-body">
                        <p class="greeting">Hi {receiver.get_full_name() or receiver.username},</p>
                        
                        <p class="message">
                            Great news! A volunteer has picked up your donation and is on the way to deliver it to you!
                        </p>
                        
                        <div class="order-details">
                            <div class="detail-row">
                                <span class="detail-label">Order ID</span>
                                <span class="detail-value">#{order.id}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Item</span>
                                <span class="detail-value">{donation.item_name}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Order Status</span>
                                <span class="status-badge">🚚 In Transit</span>
                            </div>
                        </div>
                        
                        <div class="volunteer-info">
                            <p class="volunteer-label">📍 Delivery By:</p>
                            <p class="volunteer-name">{volunteer.get_full_name() or volunteer.username}</p>
                            <p class="volunteer-label">Volunteer ID: {volunteer.volunteer_code or 'N/A'}</p>
                        </div>
                        
                        <p class="message">
                            <strong>What to expect:</strong><br>
                            {"The volunteer will deliver the item to your address shortly. Please ensure someone is available to receive it." if order.delivery_type == 'volunteer' else 'The item will be ready for pickup at the donor\'s location. Contact the volunteer if you need their location details.'}
                        </p>
                        
                        <center>
                            <a href="{settings.FRONTEND_URL}/dashboard/user/my-orders" class="cta-button">
                                Track Order
                            </a>
                        </center>
                        
                        <p class="message" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #7f8c8d; font-size: 13px;">
                            If you have any questions about your delivery, please check your order details or contact our support team.
                        </p>
                    </div>
                    
                    <div class="email-footer">
                        <p class="footer-text">
                            <strong>Catalyst Donation Platform</strong>
                        </p>
                        <p class="footer-text">
                            © 2026 All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        text_content = f"""
        Order Picked Up - On The Way!
        
        Hi {receiver.get_full_name() or receiver.username},
        
        Great news! A volunteer has picked up your donation and is on the way!
        
        ORDER DETAILS:
        Order ID: #{order.id}
        Item: {donation.item_name}
        Order Status: 🚚 In Transit
        
        DELIVERY BY:
        Volunteer: {volunteer.get_full_name() or volunteer.username}
        Volunteer ID: {volunteer.volunteer_code or 'N/A'}
        
        What to expect:
        {"The volunteer will deliver the item to your address shortly. Please ensure someone is available to receive it." if order.delivery_type == 'volunteer' else 'The item will be ready for pickup at the donor\'s location.'}
        
        Track your order at: {settings.FRONTEND_URL}/dashboard/user/my-orders
        
        If you have any questions, please contact us.
        
        Best regards,
        Catalyst Team
        """
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[receiver.email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
        
        print(f"✅ Order picked up email sent to {receiver.email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send order picked up email: {str(e)}")
        return False