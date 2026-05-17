import os
import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from bookings.models import Booking

def check_bookings():
    for bid in [329, 327]:
        try:
            b = Booking.objects.get(id=bid)
            print(f"Booking {bid}: Event Date={b.event.date}, Today={timezone.now().date()}, Status={b.status}")
            if b.event.date <= timezone.now().date():
                print(f"  -> REASON: Event is today or in the past!")
        except Booking.DoesNotExist:
            print(f"Booking {bid} not found.")

if __name__ == "__main__":
    check_bookings()
