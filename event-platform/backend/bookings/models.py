import uuid
import qrcode
from io import BytesIO
from django.core.files import File
from django.db import models
from django.conf import settings
from events.models import Event, TicketType

class Booking(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='bookings')
    ticket_type = models.ForeignKey(TicketType, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    booking_date = models.DateTimeField(auto_now_add=True)
    digital_ticket_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    qr_code = models.ImageField(upload_to='qrcodes/', blank=True, null=True)
    
    def save(self, *args, **kwargs):
        if not self.digital_ticket_id:
            self.digital_ticket_id = str(uuid.uuid4())
            
        if self.status == 'confirmed' and not self.qr_code:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            # Embed rich text info into the QR code
            qr_data = (
                f"🎫 EVENT: {self.event.title}\n"
                f"👤 ATTENDEE: {self.user.username}\n"
                f"🎟️ TICKET: {self.ticket_type.name} (x{self.quantity})\n"
                f"📅 DATE: {self.event.date} @ {self.event.time}\n"
                f"🔐 ID: {self.digital_ticket_id}"
            )
            qr.add_data(qr_data)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            self.qr_code.save(f"qr_{self.digital_ticket_id}.png", File(buffer), save=False)
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.event.title} - {self.status}"
