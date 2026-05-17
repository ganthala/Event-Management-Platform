from django.urls import path
from .views import CreateOrderView, VerifyPaymentView, RazorpayWebhookView, StripeCreateSessionView, StripeWebhookView

urlpatterns = [
    path('create-order/', CreateOrderView.as_view(), name='create_order'),
    path('verify-payment/', VerifyPaymentView.as_view(), name='verify_payment'),
    path('webhook/', RazorpayWebhookView.as_view(), name='razorpay_webhook'),
    path('stripe/create-session/', StripeCreateSessionView.as_view(), name='stripe_create_session'),
    path('stripe/webhook/', StripeWebhookView.as_view(), name='stripe_webhook'),
]
