import os
import django
from datetime import datetime, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['DATABASE_URL'] = 'sqlite:///db.sqlite3'
django.setup()

from events.models import Event, TicketType, Rating
from bookings.models import Booking
from users.models import User

def seed_analytics():
    # 1. Get the organizer and their events
    organizer = User.objects.get(username='india_events')
    events = Event.objects.filter(organizer=organizer)
    
    # 2. Get or create some attendees
    attendees = []
    for i in range(5):
        u, _ = User.objects.get_or_create(username=f'attendee_{i}')
        if _:
            u.set_password('password123')
            u.save()
        attendees.append(u)

    print(f"Seeding bookings for {events.count()} events...")

    # 3. Create Bookings over the last 10 days
    for event in events:
        ticket_type = TicketType.objects.filter(event=event).first()
        if not ticket_type: continue
        
        # Create 2-5 bookings for each event
        for _ in range(random.randint(2, 5)):
            attendee = random.choice(attendees)
            # Create a booking from a few days ago
            days_ago = random.randint(0, 10)
            booking_time = datetime.now() - timedelta(days=days_ago)
            
            b = Booking.objects.create(
                user=attendee,
                event=event,
                ticket_type=ticket_type,
                quantity=random.randint(1, 3),
                status='confirmed',
                total_price=0 # Will be calculated in save or manually
            )
            b.total_price = b.quantity * ticket_type.price
            # Manually set created_at using auto_now_add workaround or just let it be today
            # Actually, we'll just let them be recent.
            b.save()
            
            # Add a rating
            Rating.objects.get_or_create(
                user=attendee,
                event=event,
                defaults={'score': random.randint(4, 5), 'feedback': 'Great event!'}
            )

    print("Successfully seeded analytics data! Refresh the dashboard to see the charts.")

if __name__ == "__main__":
    seed_analytics()
