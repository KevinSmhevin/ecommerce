from django.urls import path

from . import views
from . import api_views

from django.contrib.auth import views as auth_views

urlpatterns = [
    
    path('register', views.register, name='register'),
    
    #Email verification URL's
    
    path('email-verification/<str:uidb64>/<str:token>/', views.email_verification, name='email-verification'),
    
    path('email-verification-sent', views.email_verification_sent, name='email-verification-sent'),

    path('email-verification-success', views.email_verification_success, name='email-verification-success'),

    path('email-verification-failed', views.email_verification_failed, name='email-verification-failed'),
    
    # Login / logout urls
    
    path('my-login', views.my_login, name='my-login'),
        
    path('user-logout', views.user_logout, name='user-logout'),
    
    # Dashboard
    
    path('dashboard', views.dashboard, name='dashboard'),
    
    path('profile-management', views.profile_management, name='profile-management'),

    path('delete-account', views.delete_account, name='delete-account'),
    
    
    # Password management urls/views
    
    path('reset_password', auth_views.PasswordResetView.as_view(template_name="account/password/password-reset.html"), name='reset_password'),
    
    path('reset_password_sent', auth_views.PasswordResetDoneView.as_view(template_name="account/password/password-reset-sent.html"), name='password_reset_done'),
    
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(template_name="account/password/password-reset-form.html"), name='password_reset_confirm'),

    path('reset_password_complete', auth_views.PasswordResetCompleteView.as_view(template_name="account/password/password-reset-complete.html"), name='password_reset_complete'),
    
    # Manage shipping url
    
    path('manage-shipping', views.manage_shipping, name='manage-shipping'),
    
    # track orders url
    
    path('track-orders', views.track_orders, name='track-orders'),
    
    # check order url
    
    path('check-order', views.check_order, name='check-order'),
    
    # API endpoints
    path('api/login', api_views.api_login, name='api-login'),
    path('api/register', api_views.api_register, name='api-register'),
    path('api/logout', api_views.api_logout, name='api-logout'),
    path('api/check-auth', api_views.api_check_auth, name='api-check-auth'),
    path('api/check-order', api_views.api_check_order, name='api-check-order'),
    path('api/csrf-token', api_views.api_get_csrf_token, name='api-csrf-token'),
    path('api/dashboard', api_views.api_dashboard, name='api-dashboard'),
    path('api/track-orders', api_views.api_track_orders, name='api-track-orders'),
    path('api/profile-management', api_views.api_profile_management, name='api-profile-management'),
    path('api/manage-shipping', api_views.api_manage_shipping, name='api-manage-shipping'),
    
]