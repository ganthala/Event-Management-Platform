from django.test import TestCase
from rest_framework.test import APIClient
from users.models import User
from events.models import Event, TicketType
from .models import Booking
from django.utils import timezone
from datetime import timedelta

class BookingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.organizer = User.objects.create_user(username='org1', email='org@test.com', password='password123', role='organizer')
        self.attendee = User.objects.create_user(username='att1', email='att@test.com', password='password123', role='attendee')
        
        self.event = Event.objects.create(
            title="Test Event",
            description="Test Description",
            date=timezone.now().date() + timedelta(days=1),
            time="10:00",
            location="Test Loc",
            city="Test City",
            price=100.0,
            capacity=100,
            organizer=self.organizer
        )
        
        self.ticket_type = TicketType.objects.create(
            event=self.event,
            name="General",
            price=100.0,
            quantity_available=100
        )

    def test_create_booking(self):
        self.client.force_authenticate(user=self.attendee)
        
        response = self.client.post('/api/bookings/', {
            'event': self.event.id,
            'ticket_type': self.ticket_type.id,
            'quantity': 2,
            'payment_id': 'pay_TEST12345'
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Booking.objects.count(), 1)
        booking = Booking.objects.first()
        self.assertEqual(booking.quantity, 2)
        self.assertEqual(booking.total_price, 200.0)

    def test_cancel_booking(self):
        booking = Booking.objects.create(
            user=self.attendee,
            event=self.event,
            quantity=2,
            total_price=200.0,
            status='confirmed',
            booking_date=timezone.now(),
            ticket_type=self.ticket_type,
            digital_ticket_id='TEST-TICKET-1'
        )

        self.client.force_authenticate(user=self.attendee)
        response = self.client.post(f'/api/bookings/{booking.id}/cancel/')
        
        self.assertEqual(response.status_code, 200)
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'cancelled')
