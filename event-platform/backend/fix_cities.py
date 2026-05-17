import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['DATABASE_URL'] = 'sqlite:///db.sqlite3'
django.setup()

from events.models import Event

def run():
    events = Event.objects.all()
    for e in events:
        parts = [p.strip() for p in e.location.split(',')]
        if len(parts) >= 3:
            e.city = parts[-2]
            e.state = parts[-1]
        elif len(parts) == 2:
            e.city = parts[-1]
            # Try to infer state if common
            if e.city == 'Delhi': e.state = 'Delhi'
        else:
            # Fallback patterns
            if 'Mumbai' in e.location or 'Mumbai' in e.title:
                e.city = 'Mumbai'
                e.state = 'Maharashtra'
            elif 'Delhi' in e.location or 'Delhi' in e.title:
                e.city = 'Delhi'
                e.state = 'Delhi'
            elif 'Bangalore' in e.location or 'Bangalore' in e.title:
                e.city = 'Bangalore'
                e.state = 'Karnataka'
            elif 'Hyderabad' in e.location or 'Hyderabad' in e.title:
                e.city = 'Hyderabad'
                e.state = 'Telangana'
            elif 'Pune' in e.location:
                e.city = 'Pune'
                e.state = 'Maharashtra'
            elif 'Jaipur' in e.location:
                e.city = 'Jaipur'
                e.state = 'Rajasthan'
            elif 'Goa' in e.location:
                e.city = 'Goa'
                e.state = 'Goa'
            elif 'chikkabalapura' in e.location:
                e.city = 'Chikkaballapur'
                e.state = 'Karnataka'
        
        # Final safety
        if not e.city: e.city = "Unknown"
        if not e.state: e.state = "Other"
        
        e.save()
    print(f"Updated {events.count()} events.")

if __name__ == "__main__":
    run()
