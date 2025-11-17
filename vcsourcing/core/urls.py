from django.urls import path
from .views import health, CompanyListView, CompanyDetailView, llm_test
from .auth_views import login, logout, me

urlpatterns = [
    path("api/health/", health, name="health"),
    path("api/companies/", CompanyListView.as_view(), name="company-list"),
    path("api/companies/<int:pk>/", CompanyDetailView.as_view(), name="company-detail"),
    path("llm/test/", llm_test, name="llm-test"),
    path("auth/login/", login, name="auth-login"),
    path("auth/logout/", logout, name="auth-logout"),
    path("auth/me/", me, name="auth-me"),
]

