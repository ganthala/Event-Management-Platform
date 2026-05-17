import os
import django
import random
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from events.models import Event, TicketType
from bookings.models import Booking

User = get_user_model()

def seed_cancellations_for_varshag():
    print("Finding Varshag...")
    varshag = User.objects.filter(username__icontains='varshag').first()
    
    if not varshag:
        print("Varshag not found! Creating Varshag organizer.")
        varshag = User.objects.create_user(
            username='varshag',
            email='varshag@events.com',
            password='password123',
            role='organizer'
        )
    
    # Get Varshag's events
    events = Event.objects.filter(organizer=varshag)
    if not events:
        print("Varshag has no events. Creating a few events for Varshag.")
        # Create some events if none exist
        for i in range(3):
            e = Event.objects.create(
                title=f"Varshag's Mega Event {i+1}",
                description="A high-performance event by Varshag.",
                date=datetime.now().date() + timedelta(days=10),
                time="18:00:00",
                location="Varshag Arena",
                city="Mumbai",
                state="Maharashtra",
                price=999,
                capacity=500,
                organizer=varshag
            )
        events = Event.objects.filter(organizer=varshag)

    # Create dummy attendees if needed
    attendees = User.objects.filter(role='attendee')[:10]
    if not attendees:
        print("No attendees found to book!")
        return

    print(f"Generating cancellations for {events.count()} events of {varshag.username}...")

    for event in events:
        # For each event, create some confirmed and some cancelled bookings
        ticket_type = event.ticket_types.first()
        if not ticket_type:
            ticket_type = TicketType.objects.create(
                event=event,
                name="Gold Pass",
                price=event.price,
                quantity_available=100
            )

        # Create 5-10 cancellations over the last 14 days
        for _ in range(random.randint(5, 12)):
            attendee = random.choice(attendees)
            # Pick a date in the last 14 days
            days_ago = random.randint(0, 13)
            booking_date = datetime.now() - timedelta(days=days_ago)
            
            b = Booking.objects.create(
                user=attendee,
                event=event,
                ticket_type=ticket_type,
                quantity=random.randint(1, 3),
                total_price=event.price,
                status='cancelled'
            )
            # Manually update created_at/booking_date since it's auto_now_add
            Booking.objects.filter(id=b.id).update(booking_date=booking_date)

        print(f"Added cancellations for event: {event.title}")

    print("Success! Varshag's dashboard will now show cancellation trends.")

if __name__ == '__main__':
    seed_cancellations_for_varshag()
