import os
import django
import random
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from events.models import Event, Category
from django.contrib.auth import get_user_model

User = get_user_model()

def seed_india_wide():
    print("Starting India-wide Event Seeding...")
    
    # Ensure categories exist
    categories = {
        'Music': Category.objects.get_or_create(name='Music')[0],
        'Comedy': Category.objects.get_or_create(name='Comedy')[0],
        'Tech': Category.objects.get_or_create(name='Tech')[0],
        'Workshops': Category.objects.get_or_create(name='Workshops')[0],
        'Food': Category.objects.get_or_create(name='Food')[0],
    }
    
    # Get an organizer
    organizer = User.objects.filter(role='organizer').first()
    if not organizer:
        organizer = User.objects.create_user(
            username='india_organizer',
            email='organizer@india.com',
            password='password123',
            role='organizer'
        )

    # Clean up "Unknown Location" events
    unknown_events = Event.objects.filter(location__icontains='Unknown')
    print(f"Cleaning up {unknown_events.count()} events with 'Unknown' locations...")
    for e in unknown_events:
        e.location = "Heritage Plaza"
        e.city = "Mumbai"
        e.state = "Maharashtra"
        e.latitude = 19.0760
        e.longitude = 72.8777
        e.save()

    new_events = [
        {
            'title': 'Mumbai Music Festival 2026',
            'description': 'The biggest outdoor music festival at the iconic Gateway of India. Featuring top artists and a stunning sunset view.',
            'location': 'Gateway of India',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'latitude': 18.9220,
            'longitude': 72.8347,
            'category': categories['Music'],
            'price': 1499,
            'capacity': 5000
        },
        {
            'title': 'Delhi Tech Summit',
            'description': 'Exploring the future of AI and Web3 in the heart of the capital. Join industry leaders for a 2-day conference.',
            'location': 'India Gate Grounds',
            'city': 'New Delhi',
            'state': 'Delhi',
            'latitude': 28.6129,
            'longitude': 77.2295,
            'category': categories['Tech'],
            'price': 2999,
            'capacity': 1000
        },
        {
            'title': 'Hyderabad Biryani Workshop',
            'description': 'Learn the secrets of authentic Nizami Dum Biryani from master chefs. Tasting session included!',
            'location': 'Charminar Food Street',
            'city': 'Hyderabad',
            'state': 'Telangana',
            'latitude': 17.3616,
            'longitude': 78.4747,
            'category': categories['Workshops'],
            'price': 799,
            'capacity': 50
        },
        {
            'title': 'Chennai Beach Comedy Night',
            'description': 'Laugh till your stomach hurts with the funniest stand-up comics under the moonlight at Marina Beach.',
            'location': 'Marina Beach Promenade',
            'city': 'Chennai',
            'state': 'Tamil Nadu',
            'latitude': 13.0418,
            'longitude': 80.2824,
            'category': categories['Comedy'],
            'price': 499,
            'capacity': 300
        },
        {
            'title': 'Goa Sunset Yoga Retreat',
            'description': 'A peaceful yoga and wellness retreat on the shores of North Goa. Perfect for resetting your mind.',
            'location': 'Baga Beach',
            'city': 'North Goa',
            'state': 'Goa',
            'latitude': 15.5553,
            'longitude': 73.7517,
            'category': categories['Workshops'],
            'price': 1200,
            'capacity': 100
        },
        {
            'title': 'Pune Jazz & Wine Night',
            'description': 'Sophisticated evening of live jazz music and premium wine tasting in the lush Koregaon Park.',
            'location': 'Koregaon Park',
            'city': 'Pune',
            'state': 'Maharashtra',
            'latitude': 18.5362,
            'longitude': 73.8940,
            'category': categories['Music'],
            'price': 2499,
            'capacity': 200
        }
    ]

    for data in new_events:
        # Check if already exists
        if not Event.objects.filter(title=data['title']).exists():
            Event.objects.create(
                organizer=organizer,
                date=(datetime.now() + timedelta(days=random.randint(5, 60))).date(),
                time="18:30:00",
                **data
            )
            print(f"Added: {data['title']} in {data['city']}")
        else:
            print(f"Skipped: {data['title']} (Already exists)")

    print("Seeding Complete! India is now full of amazing events.")

if __name__ == '__main__':
    seed_india_wide()
