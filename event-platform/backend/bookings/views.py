from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.conf import settings
# import razorpay
from .models import Booking
from .serializers import BookingSerializer
from .emails import send_booking_confirmation, send_cancellation_confirmation, send_refund_confirmation
from django.db import transaction
from events.models import TicketType
import uuid

# Initialize Razorpay client
# client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Booking.objects.all()
        return Booking.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        with transaction.atomic():
            # Use select_for_update to prevent race conditions during ticket deduction
            ticket_type = TicketType.objects.select_for_update().get(id=serializer.validated_data['ticket_type'].id)
            quantity = serializer.validated_data['quantity']
            
            if ticket_type.quantity_available < quantity:
                raise serializers.ValidationError({"error": "Not enough tickets available."})
                
            total_price = ticket_type.price * quantity
        
        # Auto-confirm free tickets, otherwise keep pending for payment
        status_val = 'confirmed' if total_price == 0 else 'pending'
        
        # Deduct quantity if auto-confirmed
        if status_val == 'confirmed':
            ticket_type.quantity_available -= quantity
            ticket_type.save()
            
        # Let the model handle the digital_ticket_id and QR code generation
        serializer.save(
            user=self.request.user,
            total_price=total_price,
            status=status_val
        )
        
        # Send confirmation if auto-confirmed (free ticket)
        if status_val == 'confirmed':
            send_booking_confirmation(serializer.instance)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        
        if booking.status == 'cancelled':
            return Response({'error': 'Booking is already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Rule: Cannot cancel on or after the event date (Relaxed in DEBUG mode for testing)
        if not settings.DEBUG and booking.event.date <= timezone.now().date():
            return Response({'error': 'Cannot cancel booking on or after the event date.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Process Refund if paid via Razorpay
        if hasattr(booking, 'payment') and booking.payment.status == 'paid':
            try:
                if settings.RAZORPAY_KEY_ID == 'test_key_id' or 'mock' in booking.payment.razorpay_payment_id:
                    # Mock refund for local testing
                    refund_id = f"rfnd_mock_{uuid.uuid4().hex[:10]}"
                else:
                    refund_data = client.refund.create(data={
                        'payment_id': booking.payment.razorpay_payment_id,
                        'amount': int(booking.payment.amount * 100)
                    })
                    refund_id = refund_data['id']
                    
                booking.payment.status = 'refunded'
                booking.payment.razorpay_refund_id = refund_id
                booking.payment.save()
                
                send_refund_confirmation(booking.payment)
            except Exception as e:
                return Response({'error': f'Refund failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
                
        # Return ticket quantity to the pool if it was confirmed
        if booking.status == 'confirmed':
            ticket_type = booking.ticket_type
            ticket_type.quantity_available += booking.quantity
            ticket_type.save()
            
        booking.status = 'cancelled'
        booking.save()
        
        send_cancellation_confirmation(booking)
        
        return Response({'status': 'Booking successfully cancelled and refunded if applicable.'})
