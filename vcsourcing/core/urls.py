from django.urls import path
from .views import health
from .views import CompanyListView

<<<<<<< HEAD
# TODO: create a list named 'urlpatterns' with the value 'path('api/health/', health),'
urlpatterns = [
    path('api/health/', health),
=======
urlpatterns = [
     path("api/health/", health),
]

urlpatterns = [
    path('api/companies/', CompanyListView.as_view(), name='company-list'),
>>>>>>> ticket-3
]