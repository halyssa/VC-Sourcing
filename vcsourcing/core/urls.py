from django.urls import path
from .views import health
from .views import CompanyListView

urlpatterns = [
     path("api/health/", health),
]

urlpatterns = [
    path('api/companies/', CompanyListView.as_view(), name='company-list'),
]