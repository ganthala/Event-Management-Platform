from rest_framework import serializers
from .models import Booking
from events.serializers import EventSerializer, TicketTypeSerializer

class BookingSerializer(serializers.ModelSerializer):
    event_details = EventSerializer(source='event', read_only=True)
    ticket_type_details = TicketTypeSerializer(source='ticket_type', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('user', 'status', 'total_price', 'digital_ticket_id', 'qr_code')
