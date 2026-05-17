import os
import django
import random
from dotenv import load_dotenv
from datetime import timedelta
from django.utils import timezone

# Setup Django environment
load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from events.models import Event, Category, TicketType
from django.contrib.auth import get_user_model

User = get_user_model()

def generate_indian_events():
    print("Generating highly realistic events across India...")
    
    organizer, _ = User.objects.get_or_create(username='india_events', email='events@india.com')
    if not organizer.role:
        organizer.role = 'organizer'
        organizer.save()

    categories = ['Music', 'Tech', 'Comedy', 'Sports', 'Food']
    cat_objs = {name: Category.objects.get_or_create(name=name)[0] for name in categories}

    locations = [
        {"city": "Mumbai", "state": "Maharashtra", "venue": "Jio World Garden", "lat": 19.0660, "lon": 72.8646},
        {"city": "Mumbai", "state": "Maharashtra", "venue": "NESCO Center", "lat": 19.1537, "lon": 72.8550},
        {"city": "Delhi", "state": "Delhi", "venue": "Jawaharlal Nehru Stadium", "lat": 28.5823, "lon": 77.2346},
        {"city": "Delhi", "state": "Delhi", "venue": "Pragati Maidan", "lat": 28.6186, "lon": 77.2415},
        {"city": "Bangalore", "state": "Karnataka", "venue": "BIEC", "lat": 13.0645, "lon": 77.4727},
        {"city": "Bangalore", "state": "Karnataka", "venue": "Manpho Convention Center", "lat": 13.0450, "lon": 77.6258},
        {"city": "Hyderabad", "state": "Telangana", "venue": "HITEX Exhibition Center", "lat": 17.4703, "lon": 78.3751},
        {"city": "Chennai", "state": "Tamil Nadu", "venue": "Chennai Trade Centre", "lat": 13.0181, "lon": 80.1912},
        {"city": "Pune", "state": "Maharashtra", "venue": "MahaLaxmi Lawns", "lat": 18.4975, "lon": 73.9511},
        {"city": "Kolkata", "state": "West Bengal", "venue": "Salt Lake Stadium", "lat": 22.5646, "lon": 88.4093},
        {"city": "Ahmedabad", "state": "Gujarat", "venue": "Narendra Modi Stadium", "lat": 23.0917, "lon": 72.5975},
        {"city": "Jaipur", "state": "Rajasthan", "venue": "JECC", "lat": 26.7725, "lon": 75.8451},
        {"city": "Goa", "state": "Goa", "venue": "Vagator Beach", "lat": 15.6030, "lon": 73.7336},
    ]

    event_templates = [
        ("Sunburn Arena Ft. Alan Walker", "Music", 2500.0),
        ("India Web3 Summit", "Tech", 1500.0),
        ("Zakir Khan Live", "Comedy", 999.0),
        ("IPL T20 Showdown", "Sports", 3500.0),
        ("Global Food & Wine Festival", "Food", 500.0),
        ("Arijit Singh Live in Concert", "Music", 4000.0),
        ("React India Conference", "Tech", 2000.0),
        ("Russell Peters Return Tour", "Comedy", 5000.0),
        ("Indian Super League Finals", "Sports", 1200.0),
        ("Street Food Carnival", "Food", 250.0),
    ]

    count = 0
    for loc in locations:
        # Generate 2-3 events per location
        for _ in range(random.randint(2, 3)):
            template = random.choice(event_templates)
            title = template[0] + f" - {loc['city']}"
            category = cat_objs[template[1]]
            price = template[2]
            
            date = (timezone.now() + timedelta(days=random.randint(1, 60))).date()
            time_str = f"{random.randint(16, 20)}:00:00"
            location_str = f"{loc['venue']}, {loc['city']}, {loc['state']}"
            
            # Slightly jitter coordinates so pins don't overlap completely
            lat = loc['lat'] + random.uniform(-0.02, 0.02)
            lon = loc['lon'] + random.uniform(-0.02, 0.02)
            
            event_obj, created = Event.objects.get_or_create(
                title=title,
                location=location_str,
                defaults={
                    'description': f"Join us for an amazing {template[1].lower()} experience at {loc['venue']}!",
                    'date': date,
                    'time': time_str,
                    'price': price,
                    'latitude': lat,
                    'longitude': lon,
                    'capacity': random.randint(500, 5000),
                    'category': category,
                    'organizer': organizer
                }
            )
            
            if created:
                TicketType.objects.create(event=event_obj, name="General Admission", price=price, quantity_available=random.randint(100, 500))
                if price > 500:
                    TicketType.objects.create(event=event_obj, name="VIP Pass", price=price * 2.5, quantity_available=random.randint(20, 50))
                count += 1
                print(f"Added: {title} at {location_str}")

    print(f"\nSuccess! Populated {count} realistic events across {len(locations)} major Indian cities.")

if __name__ == '__main__':
    generate_indian_events()
