import os
import django
from django.core.mail import send_mail
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def test_email():
    print(f"Using Backend: {settings.EMAIL_BACKEND}")
    print(f"Using Host: {settings.EMAIL_HOST}")
    print(f"Using User: {settings.EMAIL_HOST_USER}")
    
    try:
        subject = "Test Email from Event Platform"
        message = "If you are reading this, your email configuration is working! 🚀"
        recipient = settings.EMAIL_HOST_USER
        
        print(f"Attempting to send test email to {recipient}...")
        
        sent = send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [recipient],
            fail_silently=False,
        )
        
        if sent:
            print("SUCCESS! Check your inbox (and spam folder).")
        else:
            print("FAILED: Email was not sent.")
            
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    test_email()
