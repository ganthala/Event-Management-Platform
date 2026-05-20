from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.conf import settings
import os
# import razorpay
from .models import Payment
from bookings.models import Booking
from bookings.emails import send_booking_confirmation

# client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

import stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_placeholder')

class StripeCreateSessionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            # Check for existing payment
            payment, created = Payment.objects.get_or_create(
                booking=booking,
                defaults={'amount': booking.total_price, 'gateway': 'stripe'}
            )
            
            if not created and payment.status == 'paid':
                return Response({'error': 'Already paid'}, status=status.HTTP_400_BAD_REQUEST)

            # Mock Stripe for dev
            if stripe.api_key == 'sk_test_placeholder':
                payment.stripe_checkout_id = "cs_test_mock123"
                payment.save()
                return Response({'url': 'http://localhost:3000/dashboard?mock_stripe=success'})

            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'inr',
                        'product_data': {
                            'name': booking.event.title,
                        },
                        'unit_amount': int(booking.total_price * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url='http://localhost:3000/dashboard?status=success',
                cancel_url='http://localhost:3000/discovery',
                client_reference_id=str(booking.id),
            )
            
            payment.stripe_checkout_id = session.id
            payment.save()
            
            return Response({'url': session.url})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StripeWebhookView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.headers.get('STRIPE_SIGNATURE')
        endpoint_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            booking_id = session.get('client_reference_id')
            if booking_id:
                try:
                    booking = Booking.objects.get(id=booking_id)
                    payment = booking.payment
                    payment.status = 'paid'
                    payment.save()
                    
                    booking.status = 'confirmed'
                    booking.save()
                    
                    # Deduct tickets
                    tt = booking.ticket_type
                    tt.quantity_available -= booking.quantity
                    tt.save()
                    
                    send_booking_confirmation(booking)
                except Exception:
                    pass

        return Response({'status': 'success'})

class CreateOrderView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        if hasattr(booking, 'payment'):
            return Response({'error': 'Payment already created'}, status=status.HTTP_400_BAD_REQUEST)

        amount = int(booking.total_price * 100) # Razorpay amount in paise
        
        data = {
            "amount": amount,
            "currency": "INR",
            "receipt": f"receipt_booking_{booking.id}"
        }
        
        try:
            # Mock Razorpay API for local testing if no real keys are provided
            if settings.RAZORPAY_KEY_ID == 'test_key_id':
                import uuid
                payment_data = {
                    'id': f"order_{uuid.uuid4().hex[:14]}",
                    'amount': amount,
                    'currency': 'INR'
                }
            else:
                payment_data = client.order.create(data=data)
                
            Payment.objects.create(
                booking=booking,
                gateway='razorpay',
                razorpay_order_id=payment_data['id'],
                amount=booking.total_price
            )
            payment_data['razorpay_key'] = settings.RAZORPAY_KEY_ID
            return Response(payment_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class VerifyPaymentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')

        try:
            payment = Payment.objects.get(razorpay_order_id=razorpay_order_id)
        except Payment.DoesNotExist:
            # Check if this is a mock direct booking from the frontend
            if str(razorpay_order_id).startswith('order_mock_'):
                booking_id = razorpay_order_id.replace('order_mock_', '')
                booking = Booking.objects.get(id=booking_id)
                payment = Payment.objects.create(
                    booking=booking,
                    gateway='razorpay',
                    razorpay_order_id=razorpay_order_id,
                    amount=booking.total_price,
                    status='created'
                )
            else:
                return Response({'error': 'Payment record not found'}, status=status.HTTP_404_NOT_FOUND)

        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }

        try:
            if settings.RAZORPAY_KEY_ID != 'test_key_id':
                client.utility.verify_payment_signature(params_dict)
                
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.status = 'paid'
            payment.save()
            
            # Update booking status
            booking = payment.booking
            booking.status = 'confirmed'
            booking.save()
            
            # Deduct ticket quantity
            ticket_type = booking.ticket_type
            ticket_type.quantity_available -= booking.quantity
            ticket_type.save()
            
            send_booking_confirmation(booking)
            
            return Response({'status': 'Payment verified successfully'}, status=status.HTTP_200_OK)
        except razorpay.errors.SignatureVerificationError:
            payment.status = 'failed'
            payment.save()
            return Response({'error': 'Signature verification failed'}, status=status.HTTP_400_BAD_REQUEST)

class RazorpayWebhookView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        webhook_signature = request.headers.get('X-Razorpay-Signature')
        webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', settings.RAZORPAY_KEY_SECRET)

        try:
            client.utility.verify_webhook_signature(request.body.decode('utf-8'), webhook_signature, webhook_secret)
        except Exception as e:
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

        event = request.data.get('event')
        payload = request.data.get('payload')

        if event == 'payment.captured':
            payment_entity = payload.get('payment', {}).get('entity', {})
            order_id = payment_entity.get('order_id')
            payment_id = payment_entity.get('id')
            
            try:
                payment = Payment.objects.get(razorpay_order_id=order_id)
                if payment.status != 'paid':
                    payment.status = 'paid'
                    payment.razorpay_payment_id = payment_id
                    payment.save()
                    
                    booking = payment.booking
                    if booking.status != 'confirmed':
                        booking.status = 'confirmed'
                        booking.save()
                        
                        ticket_type = booking.ticket_type
                        ticket_type.quantity_available -= booking.quantity
                        ticket_type.save()
                        
                        send_booking_confirmation(booking)
            except Payment.DoesNotExist:
                pass
                
        elif event == 'payment.failed':
            payment_entity = payload.get('payment', {}).get('entity', {})
            order_id = payment_entity.get('order_id')
            try:
                payment = Payment.objects.get(razorpay_order_id=order_id)
                payment.status = 'failed'
                payment.save()
            except Payment.DoesNotExist:
                pass

        return Response({'status': 'ok'}, status=status.HTTP_200_OK)

