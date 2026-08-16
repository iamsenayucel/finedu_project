from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, Classroom, Unit, Subtopic, Content, UserProgress, UserBadge,
    SurveyResponse, SurveyStatus, SupportOrganization, StudentSupportPreference,
)

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


@admin.register(SurveyResponse)
class SurveyResponseAdmin(admin.ModelAdmin):
    list_display = ('student', 'survey_type', 'question_id', 'selected_option', 'answered_at')
    list_filter = ('survey_type', 'question_id')
    search_fields = ('student__username', 'student__student_code')


@admin.register(SurveyStatus)
class SurveyStatusAdmin(admin.ModelAdmin):
    list_display = ('student', 'survey_type', 'is_completed', 'completed_at')
    list_filter = ('survey_type', 'is_completed')
    search_fields = ('student__username', 'student__student_code')
    actions = ['reset_survey']

    @admin.action(description="Seçili anket durumlarını sıfırla (cevaplarla birlikte)")
    def reset_survey(self, request, queryset):
        for status_obj in queryset:
            SurveyResponse.objects.filter(student=status_obj.student, survey_type=status_obj.survey_type).delete()
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f"{count} anket kaydı sıfırlandı.")


@admin.register(SupportOrganization)
class SupportOrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'display_order', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('name',)
    ordering = ('display_order', 'id')


@admin.register(StudentSupportPreference)
class StudentSupportPreferenceAdmin(admin.ModelAdmin):
    list_display = ('student', 'organization', 'is_active', 'selected_at')
    list_filter = ('is_active', 'organization')
    search_fields = ('student__username', 'student__student_code', 'student__email')