import os
import django
from django.db.models import Sum, Count

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from bookings.models import Booking
from events.models import Event

def audit():
    e = Event.objects.filter(title__icontains='Sambrama').first()
    if not e:
        print("Event 'Sambrama' not found.")
        return
    
    print(f"Event: {e.title}")
    bookings = Booking.objects.filter(event=e, status='confirmed')
    total_qty = bookings.aggregate(Sum('quantity'))['quantity__sum'] or 0
    total_rev = bookings.aggregate(Sum('total_price'))['total_price__sum'] or 0
    
    print(f"Confirmed Bookings Count: {bookings.count()}")
    print(f"Total Members (Quantity Sum): {total_qty}")
    print(f"Total Revenue: {total_rev}")
    
    for b in bookings:
        print(f" - Booking {b.id}: User={b.user.username}, Qty={b.quantity}, Total Price={b.total_price}")

if __name__ == "__main__":
    audit()
