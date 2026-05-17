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
    comedy, _ = Category.objects.get_or_create(name='Comedy')
    college, _ = Category.objects.get_or_create(name='College')

    # Get or create an organizer
    organizer, _ = User.objects.get_or_create(username='india_events')
    if _:
        organizer.set_password('password123')
        organizer.role = 'organizer'
        organizer.save()

    new_events = [
        # COMEDY
        {
            'title': 'Laughter Riot with Zakir Khan',
            'description': 'A night of relatable stories and endless laughter with the Sakht Launda himself.',
            'date': date(2026, 6, 20),
            'time': time(19, 30),
            'location': 'Canvas Laugh Club',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'price': 1500,
            'category': comedy
        },
        {
            'title': 'Standup Night: Bangalore Edition',
            'description': 'Top comedians from Bangalore take the stage to talk about traffic, tech, and life.',
            'date': date(2026, 7, 12),
            'time': time(20, 0),
            'location': 'That Comedy Club',
            'city': 'Bangalore',
            'state': 'Karnataka',
            'price': 600,
            'category': comedy
        },
        # COLLEGE
        {
            'title': 'DU Annual Fest: Reverie 2026',
            'description': 'The biggest cultural festival of Delhi University featuring live bands and star performances.',
            'date': date(2026, 3, 15),
            'time': time(10, 0),
            'location': 'Gargi College Ground',
            'city': 'Delhi',
            'state': 'Delhi',
            'price': 0,
            'category': college
        },
        {
            'title': 'IISC Tech Fest: Pravega',
            'description': 'Indias biggest science, technology and cultural festival at IISC Bangalore.',
            'date': date(2026, 1, 20),
            'time': time(9, 0),
            'location': 'IISC Campus',
            'city': 'Bangalore',
            'state': 'Karnataka',
            'price': 200,
            'category': college
        },
        # TECH SUMMIT
        {
            'title': 'India AI Strategy Summit',
            'description': 'Discussing the future of Artificial Intelligence in the Indian ecosystem with industry leaders.',
            'date': date(2026, 8, 5),
            'time': time(10, 0),
            'location': 'Leela Palace',
            'city': 'Bangalore',
            'state': 'Karnataka',
            'price': 3000,
            'category': tech
        },
        # MUSIC
        {
            'title': 'Pune Sunburn Reload',
            'description': 'The ultimate EDM experience returns to Pune for a night of pure energy.',
            'date': date(2026, 12, 1),
            'time': time(16, 0),
            'location': 'Mahalakshmi Lawns',
            'city': 'Pune',
            'state': 'Maharashtra',
            'price': 2500,
            'category': music
        },
        # FOOD
        {
            'title': 'Kolkata Rosogolla Challenge',
            'description': 'A sweet celebration of Kolkatas most famous dessert. How many can you eat?',
            'date': date(2026, 11, 10),
            'time': time(11, 0),
            'location': 'Park Street',
            'city': 'Kolkata',
            'state': 'West Bengal',
            'price': 100,
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
            capacity=1000
        )
        TicketType.objects.create(
            event=e,
            name='General Entry',
            price=event_data['price'],
            quantity_available=1000
        )
    
    print(f"Added {len(new_events)} new high-quality events!")

if __name__ == "__main__":
    seed()
