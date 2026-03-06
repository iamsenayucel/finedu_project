from django.urls import path
from .views import (
    api_register_view, 
    current_user_dashboard_api, 
    user_progress_api, 
    api_units_view, 
    api_users_view, 
    api_add_content_view, 
    api_add_subtopic_view, 
    api_unit_detail_view, 
    api_subtopic_detail_view, 
    api_content_detail_view, 
    api_user_detail_view,
    api_classrooms_view, 
    api_add_student_to_class, 
    api_student_detail_view
)

# Router ve ViewSet'leri tamamen sildik, çünkü kendi özel API'lerimizi kullanıyoruz.

urlpatterns = [
    # --- TEMEL KULLANICI İŞLEMLERİ ---
    path('register/', api_register_view, name='api_register'), # 404 Hatasını çözen satır!
    path('me/', current_user_dashboard_api, name='api_me'),
    path('progress/', user_progress_api, name='api_progress'),
    
    # --- LİSTELEME VE EKLEME İŞLEMLERİ ---
    path('units/', api_units_view, name='api_units'),
    path('users/', api_users_view, name='api_users'),
    path('contents/add/', api_add_content_view, name='api_add_content'),
    path('subtopics/add/', api_add_subtopic_view, name='api_add_subtopic'),
    
    # --- DETAY, DÜZENLEME VE SİLME İŞLEMLERİ ---
    path('units/<int:pk>/', api_unit_detail_view, name='api_unit_detail'),
    path('subtopics/<int:pk>/', api_subtopic_detail_view, name='api_subtopic_detail'),
    path('contents/<int:pk>/', api_content_detail_view, name='api_content_detail'),
    path('users/<int:pk>/', api_user_detail_view, name='api_user_detail'),

    path('classrooms/', api_classrooms_view, name='api_classrooms'),
    path('classrooms/<int:pk>/add_student/', api_add_student_to_class, name='api_add_student'),
    path('student/<int:student_id>/detail/', api_student_detail_view, name='api_student_detail'),
]