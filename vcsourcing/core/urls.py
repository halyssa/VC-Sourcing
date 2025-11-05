from django.urls import path
from .views import health

urlpatterns = [
     path("api/health/", health),
]