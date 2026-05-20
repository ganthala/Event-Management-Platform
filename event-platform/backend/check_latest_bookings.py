import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from bookings.models import Booking
from payments.models import Payment

print("--- LATEST 10 BOOKINGS ---")
bookings = Booking.objects.all().order_by('-id')[:10]
if not bookings:
    print("No bookings found in the database.")
for b in bookings:
    print(f"ID: {b.id} | User: {b.user.username} | Event: {b.event.title} | Status: {b.status} | Total Price: {b.total_price} | Date: {b.booking_date}")
    try:
        p = Payment.objects.get(booking=b)
        print(f"  -> Payment: Gateway={p.gateway} | Status={p.status} | OrderID={p.razorpay_order_id} | PaymentID={p.razorpay_payment_id}")
    except Payment.DoesNotExist:
        print("  -> No Payment record found.")
