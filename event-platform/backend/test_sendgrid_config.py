import os
import django
from django.core.mail import send_mail
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def test_sendgrid():
    print("--- SendGrid Connectivity Test ---")
    print(f"Backend: {settings.EMAIL_BACKEND}")
    print(f"From Email: {settings.DEFAULT_FROM_EMAIL}")
    
    try:
        subject = "Test Professional Email from Event Platform"
        message = "If you are reading this, your SendGrid integration is working perfectly! 🚀"
        recipient = input("Enter your email address to receive the test mail: ")
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [recipient],
            fail_silently=False,
        )
        print(f"\n✅ SUCCESS! A test email has been sent to {recipient}")
        print("Note: If you are in DEBUG mode with 'test_key_id', check your terminal console instead of your inbox.")
    except Exception as e:
        print(f"\n❌ FAILED: {str(e)}")

if __name__ == "__main__":
    test_sendgrid()
