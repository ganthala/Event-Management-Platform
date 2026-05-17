from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from bookings.models import Booking
from events.models import Event
from payments.models import Payment

@staff_member_required
def analytics_dashboard(request):
    # Total Bookings (Confirmed)
    total_bookings = Booking.objects.filter(status='confirmed').count()
    
    # Total Revenue (Paid)
    total_revenue = Payment.objects.filter(status='paid').aggregate(Sum('amount'))['amount__sum'] or 0.00
    
    # Popular Events (Top 5 by booking count)
    popular_events = Event.objects.annotate(
        booking_count=Count('booking')
    ).order_by('-booking_count')[:5]
    
    popular_labels = [e.title for e in popular_events]
    popular_data = [e.booking_count for e in popular_events]
    
    # User Engagement (Bookings per day over the last 7 days)
    last_7_days = timezone.now().date() - timedelta(days=7)
    recent_bookings = Booking.objects.filter(booking_date__gte=last_7_days, status='confirmed') \
        .extra({'date': "date(booking_date)"}) \
        .values('date') \
        .annotate(count=Count('id')) \
        .order_by('date')
        
    engagement_labels = [b['date'].strftime("%b %d") for b in recent_bookings]
    engagement_data = [b['count'] for b in recent_bookings]
    
    context = {
        'total_bookings': total_bookings,
        'total_revenue': total_revenue,
        'popular_labels': popular_labels,
        'popular_data': popular_data,
        'engagement_labels': engagement_labels,
        'engagement_data': engagement_data,
        'title': 'Analytics Dashboard'
    }
    
    return render(request, 'admin/analytics_dashboard.html', context)
