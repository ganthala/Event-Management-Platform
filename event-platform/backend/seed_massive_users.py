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

def seed_massive_users():
    print("Starting Massive User and Activity Seeding...")
    
    # 1. Create Organizers
    organizer_names = [
        'Epic Productions', 'Urban Vibe Events', 'Skyline Promoters', 
        'Heritage Hub', 'Neon Nights', 'Culinaria Group', 
        'Zenith Tech', 'Laughter House', 'Pulse Media', 'Visionary Arts'
    ]
    
    organizers = []
    for name in organizer_names:
        username = name.lower().replace(' ', '_')
        if not User.objects.filter(username=username).exists():
            u = User.objects.create_user(
                username=username,
                email=f"info@{username}.com",
                password='password123',
                role='organizer'
            )
            organizers.append(u)
            print(f"Created Organizer: {name}")
        else:
            organizers.append(User.objects.get(username=username))

    # 2. Create Attendees
    attendee_count = 30
    attendees = []
    for i in range(attendee_count):
        username = f"attendee_pro_{i}"
        if not User.objects.filter(username=username).exists():
            u = User.objects.create_user(
                username=username,
                email=f"user_{i}@gmail.com",
                password='password123',
                role='attendee'
            )
            attendees.append(u)
        else:
            attendees.append(User.objects.get(username=username))
    print(f"Verified {len(attendees)} Attendees.")

    # 3. Create random bookings to generate revenue/spending
    print("Generating random bookings and revenue...")
    all_events = list(Event.objects.all())
    if not all_events:
        print("No events found to book! Run event seeding first.")
        return

    for attendee in attendees:
        # Each attendee books 2-6 random events
        to_book = random.sample(all_events, random.randint(2, 6))
        for event in to_book:
            # Get or create a ticket type
            ticket_type = event.ticket_types.first()
            if not ticket_type:
                ticket_type = TicketType.objects.create(
                    event=event,
                    name="General Admission",
                    price=event.price or 499,
                    quantity_available=100
                )
            
            qty = random.randint(1, 4)
            total = ticket_type.price * qty
            
            Booking.objects.create(
                user=attendee,
                event=event,
                ticket_type=ticket_type,
                quantity=qty,
                total_price=total,
                status='confirmed'
            )
    
    print("Seeding Complete! The Admin Dashboard is now full of data.")

if __name__ == '__main__':
    seed_massive_users()
