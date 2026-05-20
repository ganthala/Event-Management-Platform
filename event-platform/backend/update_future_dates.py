import os
import django
import random
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from events.models import Event

def update_all_events_to_future():
    today = datetime.now().date()
    events = Event.objects.all()
    
    print(f"--- Event Date Updater ---")
    print(f"Current Date: {today}")
    print(f"Total events found: {events.count()}")
    print("-" * 50)
    
    updated_count = 0
    
    # We will update every single event to a future date so that the entire platform is active
    # We can distribute them between 3 days and 120 days from today
    for event in events:
        old_date = event.date
        # Generate a random future date between 3 and 120 days in the future
        days_in_future = random.randint(3, 120)
        new_date = today + timedelta(days=days_in_future)
        
        event.date = new_date
        event.save()
        
        print(f"ID: {event.id:02d} | Title: {event.title:<40} | Old Date: {old_date} -> New Date: {new_date} (in {days_in_future} days)")
        updated_count += 1
        
    print("-" * 50)
    print(f"Successfully updated all {updated_count} events to future dates!")

if __name__ == '__main__':
    update_all_events_to_future()
