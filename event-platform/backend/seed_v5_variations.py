import os
import django
from datetime import datetime, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['DATABASE_URL'] = 'sqlite:///db.sqlite3'
django.setup()

from events.models import Event, TicketType, Rating, Category
from bookings.models import Booking
from users.models import User

def seed_variations():
    organizer = User.objects.get(username='india_events')
    users = list(User.objects.filter(username__startswith='dummy_user'))
    if not users:
        for i in range(10):
            u, _ = User.objects.get_or_create(username=f'dummy_user_{i}')
            users.append(u)

    # Categories
    tech = Category.objects.get(name='Technology')
    party = Category.objects.get(name='Party')
    music = Category.objects.get(name='Music')

    variation_events = [
        {
            'title': "Luxury Yacht Party",
            'category': party,
            'price': 10000,
            'bookings_count': 12,
            'avg_rating': 3, # Mixed reviews
            'days_spread': 7
        },
        {
            'title': "Free Coding Workshop",
            'category': tech,
            'price': 0,
            'bookings_count': 45,
            'avg_rating': 5, # Perfect reviews
            'days_spread': 2
        },
        {
            'title': "Indie Music Night",
            'category': music,
            'price': 800,
            'bookings_count': 30,
            'avg_rating': 4,
            'days_spread': 10
        },
        {
            'title': "AI Masterclass",
            'category': tech,
            'price': 2500,
            'bookings_count': 20,
            'avg_rating': 5,
            'days_spread': 5
        }
    ]

    for data in variation_events:
        event = Event.objects.create(
            title=data['title'],
            description=f"A special {data['title']} for our community.",
            date=(datetime.now() + timedelta(days=20)).date(),
            time="19:00:00",
            location="Varies",
            city="Mumbai",
            state="Maharashtra",
            price=data['price'],
            category=data['category'],
            organizer=organizer,
            capacity=200
        )
        tt = TicketType.objects.create(event=event, name="General", price=data['price'], quantity_available=200)

        print(f"Seeding {data['bookings_count']} bookings for {event.title}...")
        
        for _ in range(data['bookings_count']):
            u = random.choice(users)
            days_ago = random.randint(0, data['days_spread'])
            
            # Using custom booking date to create variations in the history graph
            b = Booking.objects.create(
                user=u, event=event, ticket_type=tt, quantity=random.randint(1, 2),
                status='confirmed', total_price=0
            )
            b.total_price = b.quantity * tt.price
            # Manual override of booking_date
            b.booking_date = datetime.now() - timedelta(days=days_ago)
            b.save()
            
            # Seed rating
            Rating.objects.get_or_create(
                user=u, event=event,
                defaults={'score': data['avg_rating'], 'feedback': 'Automated Feedback'}
            )

    print("Variation data seeded successfully!")

if __name__ == "__main__":
    seed_variations()
