import os
import django
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from events.models import Event, Category, TicketType
from datetime import timedelta
from django.utils import timezone

User = get_user_model()

def seed():
    # Create Organizer
    organizer, created = User.objects.get_or_create(username='demo_organizer', email='organizer@demo.com')
    if created:
        organizer.role = 'organizer'
        organizer.set_password('demo123')
        organizer.save()

    # Create Categories
    music, _ = Category.objects.get_or_create(name='Music Festival')
    tech, _ = Category.objects.get_or_create(name='Tech Conference')
    art, _ = Category.objects.get_or_create(name='Art Exhibition')

    # Event 1: Tech Meetup near user location
    e1, _ = Event.objects.get_or_create(
        title="Future Tech Summit 2026",
        description="A massive gathering of tech enthusiasts exploring AI and Web3.",
        date=(timezone.now() + timedelta(days=5)).date(),
        time="10:00:00",
        location="Silicon Valley Convention Center",
        price=150.00,
        latitude=13.215,
        longitude=77.980,
        capacity=500,
        category=tech,
        organizer=organizer
    )
    TicketType.objects.get_or_create(event=e1, name="General Admission", price=150.00, quantity_available=400)
    TicketType.objects.get_or_create(event=e1, name="VIP Pass", price=350.00, quantity_available=100)

    # Event 2: Local Music Gig
    e2, _ = Event.objects.get_or_create(
        title="Sunset Indie Music Fest",
        description="Local indie bands playing live at sunset. Bring your friends!",
        date=(timezone.now() + timedelta(days=2)).date(),
        time="17:30:00",
        location="Central Park Amphitheater",
        price=0.00,
        latitude=13.205,
        longitude=77.970,
        capacity=1000,
        category=music,
        organizer=organizer
    )
    TicketType.objects.get_or_create(event=e2, name="Free Entry", price=0.00, quantity_available=1000)

    # Event 3: Art Gallery Opening
    e3, _ = Event.objects.get_or_create(
        title="Modern Art Showcase",
        description="Exclusive gallery opening featuring local artists and contemporary sculptures.",
        date=(timezone.now() + timedelta(days=10)).date(),
        time="19:00:00",
        location="Downtown Gallery",
        price=50.00,
        latitude=13.220,
        longitude=77.965,
        capacity=100,
        category=art,
        organizer=organizer
    )
    TicketType.objects.get_or_create(event=e3, name="Standard Ticket", price=50.00, quantity_available=80)
    TicketType.objects.get_or_create(event=e3, name="Curator Tour", price=120.00, quantity_available=20)

    print("Successfully seeded the database with mock events and ticket types!")

if __name__ == '__main__':
    seed()
