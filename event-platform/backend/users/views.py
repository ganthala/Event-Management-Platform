from rest_framework import generics, permissions, views
from rest_framework.response import Response
from .serializers import RegisterSerializer, UserSerializer
from .models import User
from events.models import Event
from bookings.models import Booking
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class AdminStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Forbidden"}, status=403)

        # Get Attendees
        attendees_qs = User.objects.filter(role='attendee')
        attendee_data = []
        for u in attendees_qs:
            bookings = Booking.objects.filter(user=u, status='confirmed').select_related('event')
            total_spent = bookings.aggregate(total=Sum('total_price'))['total'] or 0
            
            # Daily activity for graphs - Use TruncDate for reliable grouping
            activity = Booking.objects.filter(user=u, status='confirmed').annotate(date_only=TruncDate('booking_date')).values('date_only').annotate(count=Sum('quantity')).order_by('-date_only')
            activity_data = {str(item['date_only']): item['count'] for item in activity}
            
            c_activity = Booking.objects.filter(user=u, status='cancelled').annotate(date_only=TruncDate('booking_date')).values('date_only').annotate(count=Sum('quantity')).order_by('-date_only')
            c_activity_data = {str(item['date_only']): item['count'] for item in c_activity}

            # Group attendee bookings by event for cleaner history
            events_attended_dict = {}
            # Need both confirmed and cancelled for history
            all_u_bookings = Booking.objects.filter(user=u).select_related('event')
            for b in all_u_bookings:
                e_id = b.event.id
                if e_id not in events_attended_dict:
                    events_attended_dict[e_id] = {
                        "title": b.event.title,
                        "date": b.event.date,
                        "total_quantity": 0,
                        "total_price_paid": 0,
                        "daily_history": {},
                        "cancelled_history": {}
                    }
                
                d_str = str(b.booking_date.date())
                if b.status == 'confirmed':
                    events_attended_dict[e_id]["total_quantity"] += b.quantity
                    events_attended_dict[e_id]["total_price_paid"] += b.total_price
                    events_attended_dict[e_id]["daily_history"][d_str] = events_attended_dict[e_id]["daily_history"].get(d_str, 0) + b.quantity
                elif b.status == 'cancelled':
                    events_attended_dict[e_id]["cancelled_history"][d_str] = events_attended_dict[e_id]["cancelled_history"].get(d_str, 0) + b.quantity

            attendee_data.append({
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "is_active": u.is_active,
                "date_joined": u.date_joined,
                "total_spent": total_spent,
                "activity_by_day": activity_data,
                "cancelled_activity_by_day": c_activity_data,
                "events_attended": list(events_attended_dict.values())
            })

        # Get Organizers
        organizers_qs = User.objects.filter(role='organizer')
        organizer_data = []
        for u in organizers_qs:
            events = Event.objects.filter(organizer=u).annotate(
                total_bookings=Count('bookings'),
                total_tickets=Sum('bookings__quantity')
            )
            revenue = Booking.objects.filter(event__organizer=u, status='confirmed').aggregate(total=Sum('total_price'))['total'] or 0
            
            # Daily activity for graphs (bookings for their events)
            activity = Booking.objects.filter(event__organizer=u, status='confirmed').annotate(date_only=TruncDate('booking_date')).values('date_only').annotate(count=Sum('quantity')).order_by('-date_only')
            activity_data = {str(item['date_only']): item['count'] for item in activity}
            
            c_activity = Booking.objects.filter(event__organizer=u, status='cancelled').annotate(date_only=TruncDate('booking_date')).values('date_only').annotate(count=Sum('quantity')).order_by('-date_only')
            c_activity_data = {str(item['date_only']): item['count'] for item in c_activity}

            organizer_data.append({
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "is_active": u.is_active,
                "date_joined": u.date_joined,
                "total_revenue": revenue,
                "activity_by_day": activity_data,
                "cancelled_activity_by_day": c_activity_data,
                "events_organized": [
                    {
                        "id": e.id,
                        "title": e.title,
                        "date": e.date,
                        "bookings_count": e.total_bookings,
                        "tickets_sold": e.total_tickets or 0,
                        "daily_history": {
                            str(item['date_only']): item['count'] 
                            for item in Booking.objects.filter(event=e, status='confirmed').annotate(date_only=TruncDate('booking_date')).values('date_only').annotate(count=Sum('quantity')).order_by('date_only')
                        },
                        "cancelled_history": {
                            str(item['date_only']): item['count'] 
                            for item in Booking.objects.filter(event=e, status='cancelled').annotate(date_only=TruncDate('booking_date')).values('date_only').annotate(count=Sum('quantity')).order_by('date_only')
                        }
                    } for e in events
                ]
            })

        return Response({
            "summary": {
                "total_users": User.objects.count(),
                "total_attendees": attendees_qs.count(),
                "total_organizers": organizers_qs.count(),
                "total_events": Event.objects.count(),
                "total_bookings": Booking.objects.count()
            },
            "attendees": attendee_data,
            "organizers": organizer_data
        })

    def post(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Forbidden"}, status=403)
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "User ID required"}, status=400)
            
        try:
            user_to_toggle = User.objects.get(id=user_id)
            if user_to_toggle.role == 'admin':
                return Response({"error": "Cannot deactivate an admin"}, status=400)
                
            user_to_toggle.is_active = not user_to_toggle.is_active
            user_to_toggle.save()
            
            return Response({
                "status": "success", 
                "is_active": user_to_toggle.is_active,
                "username": user_to_toggle.username
            })
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
