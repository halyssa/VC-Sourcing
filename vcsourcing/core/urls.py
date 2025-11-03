from django.urls import path
from .views import health

# TODO: create a list named 'urlpatterns' with the value 'path('api/health/', health),'
urlpatterns = [
    path("api/health/", health, name="health"),
]