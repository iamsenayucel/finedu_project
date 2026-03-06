from django.contrib import admin
from django.urls import path, include
from accounts.views import register_view, dashboard_view, login_view, logout_view, unit_detail_view
from rest_framework.authtoken.views import obtain_auth_token


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    
    path('register/', register_view, name='register'),
    path('login/', login_view, name='login'),     
    path('logout/', logout_view, name='logout'),  
    path('dashboard/', dashboard_view, name='dashboard'),
    path('unit/<int:unit_id>/', unit_detail_view, name='unit_detail'),
    path('api/login/', obtain_auth_token, name='api_token_auth'),
]