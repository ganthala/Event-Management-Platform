import os
import django
from datetime import date, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['DATABASE_URL'] = 'sqlite:///db.sqlite3'
django.setup()

from events.models import Event, Category, TicketType
from users.models import User

def seed():
    # Ensure Categories exist
    tech, _ = Category.objects.get_or_create(name='Technology')
    music, _ = Category.objects.get_or_create(name='Music')
    food, _ = Category.objects.get_or_create(name='Food & Drinks')
    sports, _ = Category.objects.get_or_create(name='Sports')
    culture, _ = Category.objects.get_or_create(name='Culture')

    # Get or create an organizer
    organizer, _ = User.objects.get_or_create(username='india_events')
    if _:
        organizer.set_password('password123')
        organizer.role = 'organizer'
        organizer.email = 'events@india.com'
        organizer.save()

    new_events = [
        # BANGALORE
        {
            'title': 'Bangalore Startup Summit 2026',
            'description': 'The biggest gathering of entrepreneurs and VCs in the Silicon Valley of India.',
            'date': date(2026, 6, 15),
            'time': time(10, 0),
            'location': 'Koramangala Indoor Stadium',
            'city': 'Bangalore',
            'state': 'Karnataka',
            'price': 1500,
            'category': tech
        },
        {
            'title': 'Garden City Flower Show',
            'description': 'Experience the beauty of Bangalore in full bloom at the Lalbagh botanical garden.',
            'date': date(2026, 8, 20),
            'time': time(9, 0),
            'location': 'Lalbagh Botanical Garden',
            'city': 'Bangalore',
            'state': 'Karnataka',
            'price': 50,
            'category': culture
        },
        {
            'title': 'K-Pop Night Bangalore',
            'description': 'Dance the night away to your favorite K-pop hits with fans from across the city.',
            'date': date(2026, 5, 10),
            'time': time(19, 0),
            'location': 'Indiranagar Club',
            'city': 'Bangalore',
            'state': 'Karnataka',
            'price': 800,
            'category': music
        },
        {
            'title': 'Bangalore Foodie Fest',
            'description': 'From authentic Donne Biryani to global cuisines, taste the best of Bangalore.',
            'date': date(2026, 7, 5),
            'time': time(12, 0),
            'location': 'Palace Grounds',
            'city': 'Bangalore',
            'state': 'Karnataka',
            'price': 200,
            'category': food
        },
        # MUMBAI
        {
            'title': 'Mumbai Midnight Marathon',
            'description': 'Run along the Marine Drive under the stars in this unique midnight event.',
            'date': date(2026, 11, 12),
            'time': time(23, 0),
            'location': 'Marine Drive',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'price': 1200,
            'category': sports
        },
        {
            'title': 'Bollywood Gala Night',
            'description': 'An evening of dance, music, and glamour with top Bollywood celebrities.',
            'date': date(2026, 12, 25),
            'time': time(20, 0),
            'location': 'JW Marriott Sahar',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'price': 5000,
            'category': culture
        },
        # DELHI
        {
            'title': 'Delhi Heritage Walk',
            'description': 'Discover the hidden stories of Old Delhi and its majestic monuments.',
            'date': date(2026, 4, 30),
            'time': time(7, 0),
            'location': 'Red Fort',
            'city': 'Delhi',
            'state': 'Delhi',
            'price': 300,
            'category': culture
        },
        {
            'title': 'North India Tech Expo',
            'description': 'Showcasing the latest in AI, Robotics, and Cloud Computing.',
            'date': date(2026, 10, 15),
            'time': time(10, 0),
            'location': 'Pragati Maidan',
            'city': 'Delhi',
            'state': 'Delhi',
            'price': 0,
            'category': tech
        },
        # CHENNAI
        {
            'title': 'Chennai Music Season',
            'description': 'A celebration of Carnatic music and classical dance in the heart of the city.',
            'date': date(2026, 12, 10),
            'time': time(17, 0),
            'location': 'Music Academy Chennai',
            'city': 'Chennai',
            'state': 'Tamil Nadu',
            'price': 400,
            'category': music
        },
        # HYDERABAD
        {
            'title': 'Hyderabad Biryani Fest',
            'description': 'Taste over 50 varieties of Biryani from the legendary kitchens of Hyderabad.',
            'date': date(2026, 9, 22),
            'time': time(13, 0),
            'location': 'Hitex Exhibition Center',
            'city': 'Hyderabad',
            'state': 'Telangana',
            'price': 500,
            'category': food
        }
    ]

    for event_data in new_events:
        e = Event.objects.create(
            title=event_data['title'],
            description=event_data['description'],
            date=event_data['date'],
            time=event_data['time'],
            location=event_data['location'],
            city=event_data['city'],
            state=event_data['state'],
            price=event_data['price'],
            category=event_data['category'],
            organizer=organizer,
            capacity=500
        )
        # Create ticket type
        TicketType.objects.create(
            event=e,
            name='General Admission',
            price=event_data['price'],
            quantity_available=500
        )
    
    print(f"Added {len(new_events)} new events across India!")

if __name__ == "__main__":
    seed()
