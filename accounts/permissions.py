from rest_framework.permissions import BasePermission


# Bu sınıflar yalnızca global rol kontrolünü (request.user.role) merkezileştirir.
# Kaynak sahipliği (ör. bir öğretmenin yalnızca kendi sınıfındaki öğrenciye
# erişebilmesi) burada DEĞİL, ilgili view içindeki scoped queryset/filter
# üzerinden sağlanmaya devam eder — bkz. accounts/views.py
# api_student_detail_view (Classroom.teacher=request.user ile scoped queryset).


class IsAdmin(BasePermission):
    message = 'Yetkiniz yok'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')


class IsTeacher(BasePermission):
    message = 'Yetkiniz yok'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'TEACHER')


class IsStudent(BasePermission):
    message = 'Yetkiniz yok'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'STUDENT')
