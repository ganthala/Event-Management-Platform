from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

def send_booking_confirmation(booking):
    try:
        subject = f"Booking Confirmation: {booking.event.title}"
        
        # Context data for template
        context = {
            'user': booking.user,
            'event': booking.event,
            'booking': booking,
            'ticket_type': booking.ticket_type,
        }
        
        text_content = f"Hi {booking.user.username},\nYour booking for {booking.event.title} is confirmed.\nTicket ID: {booking.digital_ticket_id}"
        html_content = render_to_string('emails/booking_confirmation.html', context)
        
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [booking.user.email])
        msg.attach_alternative(html_content, "text/html")
        
        # Attach QR code if it exists
        if booking.qr_code:
            msg.attach_file(booking.qr_code.path)
            
        msg.send(fail_silently=True)
    except Exception as e:
        print(f"Error sending booking confirmation email: {e}")

def send_cancellation_confirmation(booking):
    try:
        subject = f"Booking Cancelled: {booking.event.title}"
        
        context = {
            'user': booking.user,
            'event': booking.event,
            'booking': booking,
        }
        
        text_content = f"Hi {booking.user.username},\nYour booking for {booking.event.title} has been cancelled."
        html_content = render_to_string('emails/cancellation_confirmation.html', context)
        
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [booking.user.email])
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=True)
    except Exception as e:
        print(f"Error sending cancellation confirmation email: {e}")

def send_refund_confirmation(payment):
    try:
        booking = payment.booking
        subject = f"Refund Processed: {booking.event.title}"
        
        context = {
            'user': booking.user,
            'event': booking.event,
            'payment': payment,
        }
        
        text_content = f"Hi {booking.user.username},\nA refund of ₹{payment.amount} for {booking.event.title} has been processed.\nRefund ID: {payment.razorpay_refund_id}"
        html_content = render_to_string('emails/refund_confirmation.html', context)
        
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [booking.user.email])
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=True)
    except Exception as e:
        print(f"Error sending refund confirmation email: {e}")
