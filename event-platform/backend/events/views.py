from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Event, Category, TicketType, Rating
from .serializers import EventSerializer, CategorySerializer, TicketTypeSerializer, RatingSerializer
from django_filters.rest_framework import DjangoFilterBackend
from math import radians, cos, sin, asin, sqrt

class IsOrganizerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ['organizer', 'admin']

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.organizer == request.user or request.user.role == 'admin'

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-created_at')
    serializer_class = EventSerializer
    permission_classes = [IsOrganizerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'date', 'price', 'city', 'state']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['date', 'created_at']

    def get_queryset(self):
        queryset = Event.objects.all().order_by('-created_at')
        is_mine = self.request.query_params.get('mine') == 'true'
        if is_mine and self.request.user.is_authenticated:
            return queryset.filter(organizer=self.request.user)
        return queryset

    def perform_create(self, serializer):
        event = serializer.save(organizer=self.request.user)
        # Automatically create a General Admission ticket type for the event
        from .models import TicketType
        TicketType.objects.create(
            event=event,
            name="General Admission",
            price=event.price,
            quantity_available=event.capacity
        )

    @action(detail=False, methods=['get'])
    def nearby(self, request):
        try:
            lat = float(request.query_params.get('lat'))
            lon = float(request.query_params.get('lon'))
            radius = float(request.query_params.get('radius', 50)) # in km
        except (TypeError, ValueError):
            return Response({"error": "Valid latitude and longitude required."}, status=400)

        from django.utils import timezone
        today = timezone.now().date()
        queryset = self.filter_queryset(self.get_queryset()).filter(date__gte=today)
        
        events = []
        for event in queryset.exclude(latitude__isnull=True).exclude(longitude__isnull=True):
            # Haversine formula
            lon1, lat1, lon2, lat2 = map(radians, [lon, lat, event.longitude, event.latitude])
            dlon = lon2 - lon1 
            dlat = lat2 - lat1 
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * asin(sqrt(a)) 
            r = 6371 # Radius of earth in kilometers. Use 3956 for miles
            if c * r <= radius:
                events.append(event)
                
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def locations(self, request):
        # Create a mapping of State -> [Cities]
        mapping = {}
        events = Event.objects.exclude(state__isnull=True).exclude(state='').exclude(city__isnull=True).exclude(city='')
        for s in events.values_list('state', flat=True).distinct():
            cities = Event.objects.filter(state=s).values_list('city', flat=True).distinct()
            mapping[s] = list(cities)
            
        return Response(mapping)

class TicketTypeViewSet(viewsets.ModelViewSet):
    queryset = TicketType.objects.all()
    serializer_class = TicketTypeSerializer
    permission_classes = [IsOrganizerOrReadOnly]

class RatingViewSet(viewsets.ModelViewSet):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        event = serializer.validated_data['event']
        from bookings.models import Booking
        from django.utils import timezone
        from rest_framework.exceptions import ValidationError
        
        # Check if event has passed
        # if event.date > timezone.now().date():
        #     raise ValidationError("You can only rate events after they have occurred.")
            
        # Check if user has a confirmed booking
        # has_booking = Booking.objects.filter(
        #     user=self.request.user,
        #     event=event,
        #     status='confirmed'
        # ).exists()
        
        # if not has_booking:
        #     raise ValidationError("You must have attended the event to submit a rating.")
            
        # Ensure user hasn't already rated this event
        if Rating.objects.filter(user=self.request.user, event=event).exists():
            raise ValidationError("You have already rated this event.")
            
        serializer.save(user=self.request.user)

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        from bookings.models import Booking
        from django.db.models import Sum, Count, Avg, Q
        from django.db.models.functions import TruncDate
        
        event_id = request.query_params.get('event_id')
        
        # Base queryset for organizer's events
        my_events = Event.objects.filter(organizer=request.user)
        
        if event_id:
            my_events = my_events.filter(id=event_id)
            
        # Get specific IDs to filter bookings
        event_ids = list(my_events.values_list('id', flat=True))
        
        # 1. Core Totals
        booking_qs = Booking.objects.filter(event_id__in=event_ids, status='confirmed')
        
        stats = booking_qs.aggregate(
            total_members=Sum('quantity'),
            total_revenue=Sum('total_price'),
            avg_tickets=Avg('quantity')
        )

        # 2. Detailed Breakdown (Only for Global View)
        breakdown_data = []
        if not event_id:
            # We iterate to avoid join-multiplication bugs with .annotate()
            for e in my_events:
                e_stats = Booking.objects.filter(event=e, status='confirmed').aggregate(
                    members=Sum('quantity'),
                    rev=Sum('total_price')
                )
                e_rating = Rating.objects.filter(event=e).aggregate(avg=Avg('score'))
                
                breakdown_data.append({
                    "id": e.id,
                    "title": e.title,
                    "members": e_stats['members'] or 0,
                    "revenue": float(e_stats['rev'] or 0),
                    "rating": round(e_rating['avg'] or 0, 1)
                })
            # Sort by members descending
            breakdown_data.sort(key=lambda x: x['members'], reverse=True)

        # 3. Engagement
        engagement = {
            "unique_attendees": booking_qs.values('user').distinct().count(),
            "avg_rating": Rating.objects.filter(event_id__in=event_ids).aggregate(Avg('score'))['score__avg'] or 0
        }

        # 4. History Trend
        history = booking_qs.annotate(day=TruncDate('booking_date')).values('day').annotate(
            count=Sum('quantity'), 
            revenue=Sum('total_price')
        ).order_by('-day')

        history_data = []
        for h in history:
            if h['day']:
                history_data.append({
                    "day": h['day'].strftime('%Y-%m-%d'),
                    "count": h['count'],
                    "revenue": float(h['revenue'] or 0)
                })

        # 5. Review Feed (Qualitative Feedback)
        reviews_qs = Rating.objects.filter(event_id__in=event_ids).order_by('-created_at')[:10]
        review_feed = [{
            "id": r.id,
            "user": r.user.username,
            "score": r.score,
            "feedback": r.feedback,
            "event_title": r.event.title,
            "date": r.created_at.strftime('%Y-%m-%d')
        } for r in reviews_qs]

        return Response({
            "summary": {
                "total_members": stats['total_members'] or 0,
                "total_revenue": float(stats['total_revenue'] or 0),
                "avg_tickets": round(stats['avg_tickets'] or 0, 1)
            },
            "event_breakdown": breakdown_data,
            "engagement": engagement,
            "history": history_data,
            "review_feed": review_feed,
            "is_single_event": bool(event_id)
        })
