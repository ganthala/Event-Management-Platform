from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from .models import User
from events.models import Event, TicketType
from bookings.models import Booking
from django.utils import timezone
from datetime import timedelta
import json

class UserTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(username='admin', email='admin@test.com', password='password123', role='admin')
        self.organizer = User.objects.create_user(username='org1', email='org@test.com', password='password123', role='organizer')
        self.attendee = User.objects.create_user(username='att1', email='att@test.com', password='password123', role='attendee')

    def test_admin_stats_view_access(self):
        # Unauthenticated
        response = self.client.get('/api/users/admin/stats/')
        self.assertEqual(response.status_code, 401)
        
        # Attendee should be forbidden
        self.client.force_authenticate(user=self.attendee)
        response = self.client.get('/api/users/admin/stats/')
        self.assertEqual(response.status_code, 403)

        # Admin should get stats
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/users/admin/stats/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('summary', response.data)
        self.assertIn('total_users', response.data['summary'])

    def test_admin_stats_aggregation(self):
        # Create an event and bookings to test aggregation
        event = Event.objects.create(
            title="Test Event",
            description="Test Description",
            date=timezone.now().date() + timedelta(days=1),
            time="10:00",
            location="Test Loc",
            city="Test City",
            state="Test State",
            price=100.0,
            capacity=100,
            organizer=self.organizer
        )
        
        ticket_type = TicketType.objects.create(
            event=event,
            name="General",
            price=100.0,
            quantity_available=100
        )
        
        Booking.objects.create(
            user=self.attendee,
            event=event,
            quantity=2,
            total_price=200.0,
            status='confirmed',
            booking_date=timezone.now(),
            ticket_type=ticket_type,
            digital_ticket_id='TEST-TICKET-1'
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/users/admin/stats/')
        self.assertEqual(response.status_code, 200)
        
        # Verify attendees array has data
        attendees = response.data['attendees']
        self.assertGreater(len(attendees), 0)
        attendee_data = next(a for a in attendees if a['id'] == self.attendee.id)
        self.assertEqual(attendee_data['total_spent'], 200.0)

        # Verify organizer array has data
        organizers = response.data['organizers']
        self.assertGreater(len(organizers), 0)
        org_data = next(o for o in organizers if o['id'] == self.organizer.id)
        self.assertEqual(org_data['total_revenue'], 200.0)
        self.assertGreater(len(org_data['events_organized']), 0)
