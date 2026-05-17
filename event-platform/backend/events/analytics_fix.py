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
        # We use Q objects for cleaner filtering inside aggregate if needed, 
        # but here we filter the whole queryset first for performance.
        booking_qs = Booking.objects.filter(event_id__in=event_ids, status='confirmed')
        
        stats = booking_qs.aggregate(
            total_bookings=Count('id'),
            total_revenue=Sum('total_price'),
            avg_tickets=Avg('quantity')
        )

        # 2. Detailed Breakdown (Only for Global View)
        breakdown_data = []
        if not event_id:
            # We use the 'ratings' related name we found earlier
            detailed_events = Event.objects.filter(organizer=request.user).annotate(
                b_count=Count('booking', filter=Q(booking__status='confirmed')),
                b_rev=Sum('booking__total_price', filter=Q(booking__status='confirmed')),
                b_rating=Avg('ratings__score')
            ).order_by('-b_count')
            
            for e in detailed_events:
                breakdown_data.append({
                    "id": e.id,
                    "title": e.title,
                    "bookings": e.b_count or 0,
                    "revenue": float(e.b_rev or 0),
                    "rating": round(e.b_rating or 0, 1)
                })

        # 3. Engagement
        engagement = {
            "unique_attendees": booking_qs.values('user').distinct().count(),
            "avg_rating": Rating.objects.filter(event_id__in=event_ids).aggregate(Avg('score'))['score__avg'] or 0
        }

        # 4. History Trend
        history = booking_qs.annotate(day=TruncDate('booking_date')).values('day').annotate(
            count=Count('id'), 
            revenue=Sum('total_price')
        ).order_by('day')

        history_data = []
        for h in history:
            if h['day']:
                history_data.append({
                    "day": h['day'].strftime('%Y-%m-%d'),
                    "count": h['count'],
                    "revenue": float(h['revenue'] or 0)
                })

        return Response({
            "summary": {
                "total_bookings": stats['total_bookings'] or 0,
                "total_revenue": float(stats['total_revenue'] or 0),
                "avg_tickets": round(stats['avg_tickets'] or 0, 1)
            },
            "event_breakdown": breakdown_data,
            "engagement": engagement,
            "history": history_data,
            "is_single_event": bool(event_id)
        })
