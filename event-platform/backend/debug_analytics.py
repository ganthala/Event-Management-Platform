import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['DATABASE_URL'] = 'sqlite:///db.sqlite3'
django.setup()

from events.models import Event
from bookings.models import Booking
from django.db.models import Sum, Count

def debug_stats():
    # Pick an event that should have bookings
    event = Event.objects.filter(booking__status='confirmed').distinct().first()
    if not event:
        print("No events with confirmed bookings found!")
        return

    print(f"Checking stats for Event: {event.title} (ID: {event.id})")
    
    stats = Booking.objects.filter(event=event, status='confirmed').aggregate(
        total_bookings=Count('id'),
        total_revenue=Sum('total_price')
    )
    
    print(f"Results: {stats}")

    # Check the history query
    from django.db.models.functions import TruncDate
    history = Booking.objects.filter(
        event=event, 
        status='confirmed'
    ).annotate(day=TruncDate('booking_date')).values('day').annotate(count=Count('id'), revenue=Sum('total_price'))
    
    print(f"History entries: {list(history)}")

if __name__ == "__main__":
    debug_stats()
