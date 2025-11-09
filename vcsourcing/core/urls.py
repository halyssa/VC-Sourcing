from django.urls import path
from .views import health, CompanyListView, CompanyDetailView

urlpatterns = [
    path("health/", health, name="health"),
    path("api/companies/", CompanyListView.as_view(), name="company-list"),
    path("api/companies/<int:pk>/", CompanyDetailView.as_view(), name="company-detail"),
]