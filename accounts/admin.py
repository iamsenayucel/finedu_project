from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Classroom, Unit, Subtopic, Content, UserProgress, UserBadge

# CustomUser modelimizi Django'nun standart kullanıcı paneline uyarlıyoruz
@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    # Kendi eklediğimiz alanları (role, grade_level vb.) panele dahil ediyoruz
    fieldsets = UserAdmin.fieldsets + (
        ('FinEdu Özel Bilgiler', {'fields': ('role', 'grade_level', 'student_code')}),
    )
    # Listede görünmesini istediğimiz sütunlar
    list_display = ('username', 'email', 'role', 'grade_level', 'student_code')

# Diğer tüm modellerimizi basitçe panele kaydediyoruz
admin.site.register(Classroom)
admin.site.register(Unit)
admin.site.register(Subtopic)
admin.site.register(Content)
admin.site.register(UserProgress)
admin.site.register(UserBadge)