from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from events.admin_views import analytics_dashboard

urlpatterns = [
    path('admin/analytics/', analytics_dashboard, name='analytics_dashboard'),
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/', include('events.urls')),
    path('api/', include('bookings.urls')),
    path('api/payments/', include('payments.urls')),
    
    # OpenAPI Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
