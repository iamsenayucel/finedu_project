from django.contrib import admin
from django.urls import path, include
from accounts.views import register_view, dashboard_view, login_view, logout_view, unit_detail_view, ThrottledObtainAuthToken
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),

    path('register/', register_view, name='register'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('dashboard/', dashboard_view, name='dashboard'),
    path('unit/<int:unit_id>/', unit_detail_view, name='unit_detail'),
    # DRF'nin ObtainAuthToken'ı brute-force koruması için throttle'lı alt
    # sınıf üzerinden bağlanıyor (bkz. accounts.views.ThrottledObtainAuthToken).
    path('api/login/', ThrottledObtainAuthToken.as_view(), name='api_token_auth'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)