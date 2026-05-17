import os
import django
import random

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from events.models import Event, Rating
from django.contrib.auth import get_user_model

User = get_user_model()

def seed_diverse_reviews():
    print("Generating Diverse Attendee Reviews...")
    
    # Clear existing ratings to start fresh
    Rating.objects.all().delete()
    
    # Get some attendees
    attendees = list(User.objects.filter(role='attendee'))
    if len(attendees) < 5:
        # Create some fake attendees if not enough
        for i in range(10):
            username = f'user_reviewer_{i}'
            if not User.objects.filter(username=username).exists():
                u = User.objects.create_user(
                    username=username,
                    email=f'reviewer{i}@test.com',
                    password='password123',
                    role='attendee'
                )
                attendees.append(u)

    review_pools = {
        'Music': [
            "The energy was insane! Best concert I've attended this year.",
            "Great sound quality and lighting. Loved the opening act.",
            "A bit crowded near the stage, but the performance made up for it!",
            "Incredible vibe. Can't wait for the next one.",
            "The artist was so interactive with the crowd. 5 stars!"
        ],
        'Tech': [
            "Very insightful sessions. The AI workshop was particularly good.",
            "Great networking opportunities. Met some amazing developers.",
            "The speakers were very knowledgeable and the demos worked perfectly.",
            "Found the panel discussion very helpful for my current project.",
            "Well organized tech event. Loved the hands-on labs."
        ],
        'Food': [
            "Absolutely delicious! The flavors were so authentic.",
            "Great teaching style. I can finally make a proper biryani now.",
            "The tasting session was the highlight. Everything was fresh.",
            "Met some fellow foodies and learned a lot of secret tips.",
            "Best workshop ever. The chef was very patient and helpful."
        ],
        'Workshops': [
            "Practical and engaging. I learned a new skill in just 3 hours.",
            "The instructor was very clear and provided great resources.",
            "Small group size made it easy to ask questions. High quality!",
            "Exceeded my expectations. Great value for money.",
            "Very therapeutic and creative session. Highly recommended."
        ],
        'Comedy': [
            "My jaw literally hurts from laughing so much!",
            "The comics were brilliant. Great timing and relevant jokes.",
            "Perfect evening out with friends. The atmosphere was light and fun.",
            "Some of the best stand-up I've seen in a long time.",
            "Hilarious performances! Will definitely come back."
        ],
        'General': [
            "A well-organized and memorable experience.",
            "Loved the atmosphere and the people. Great job by the team.",
            "Everything from entry to exit was smooth. Definitely worth it.",
            "High quality event with attention to detail. 5/5!",
            "Exactly what I was looking for. Had a fantastic time."
        ]
    }

    events = Event.objects.all()
    for event in events:
        # Determine category pool
        cat_name = event.category.name if event.category else 'General'
        pool = review_pools.get(cat_name, review_pools['General'])
        
        # Add 3-5 ratings per event
        num_ratings = random.randint(3, 7)
        sampled_attendees = random.sample(attendees, min(num_ratings, len(attendees)))
        
        for user in sampled_attendees:
            score = random.choices([5, 4, 3], weights=[60, 30, 10])[0]
            feedback = random.choice(pool)
            
            Rating.objects.create(
                event=event,
                user=user,
                score=score,
                feedback=feedback
            )
        
        print(f"Added {len(sampled_attendees)} unique reviews for: {event.title}")

    print("Review Seeding Complete! Every event now has unique, realistic attendee feedback.")

if __name__ == '__main__':
    seed_diverse_reviews()
