from django.urls import path

from . import views

urlpatterns = [
    path('account-deletion/', views.account_deletion, name='ebay-account-deletion'),
]
