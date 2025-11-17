from django.urls import path
from .views import health, CompanyListView, CompanyDetailView, UserWatchlistView, watchlist_add, watchlist_remove

urlpatterns = [
    path("api/health/", health, name="health"),
    path("api/companies/", CompanyListView.as_view(), name="company-list"),
    path("api/companies/<int:pk>/", CompanyDetailView.as_view(), name="company-detail"),
    path(
        "api/users/<int:user_id>/watchlist/",
        UserWatchlistView.as_view(),
        name="user-watchlist",
    ),
    path("api/watchlist/add/", watchlist_add, name="watchlist-add"),
    path("api/watchlist/remove/", watchlist_remove, name="watchlist-remove"),
]