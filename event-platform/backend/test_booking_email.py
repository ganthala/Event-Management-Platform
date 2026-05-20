import os
import django
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def test_booking_email():
    recipient = "jathinreddysk@gmail.com"
    subject = "Test Booking Ticket Confirmation"
    text_content = "Hi jathin,\nYour test booking is confirmed!"
    html_content = "<h1>Hi jathin,</h1><p>Your test booking is confirmed!</p>"
    
    print(f"Attempting to send test email to {recipient}...")
    try:
        msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [recipient])
        msg.attach_alternative(html_content, "text/html")
        sent = msg.send(fail_silently=False)
        print(f"Sent status: {sent}")
        if sent:
            print("SUCCESS! Sent successfully.")
        else:
            print("FAILED.")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_booking_email()
