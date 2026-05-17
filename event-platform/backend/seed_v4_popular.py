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

def seed_popular():
    organizer = User.objects.get(username='india_events')
    
    # Create a REALLY popular event
    pop_event = Event.objects.create(
        title="MEGA CONCERT 2026",
        description="The biggest concert of the year featuring global stars.",
        date=(datetime.now() + timedelta(days=30)).date(),
        time="20:00:00",
        location="Jio World Garden",
        city="Mumbai",
        state="Maharashtra",
        price=5000,
        organizer=organizer,
        capacity=5000
    )
    tt = TicketType.objects.create(event=pop_event, name="VIP", price=5000, quantity_available=5000)

    # Seed 20-30 bookings for this MEGA event
    users = list(User.objects.filter(username__startswith='attendee'))
    if not users:
        for i in range(10):
            u, _ = User.objects.get_or_create(username=f'dummy_user_{i}')
            users.append(u)

    print(f"Creating heavy engagement for {pop_event.title}...")
    for _ in range(25):
        u = random.choice(users)
        b = Booking.objects.create(
            user=u, event=pop_event, ticket_type=tt, quantity=random.randint(1, 4),
            status='confirmed', total_price=0
        )
        b.total_price = b.quantity * tt.price
        b.save()
        Rating.objects.get_or_create(user=u, event=pop_event, defaults={'score': 5, 'feedback': 'UNBELIEVABLE!'})

    print("Added Mega Popular Event and dummy data!")

if __name__ == "__main__":
    seed_popular()
