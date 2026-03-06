from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

# 1. KULLANICI MODELLERİ
class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('TEACHER', 'Öğretmen'),
        ('STUDENT', 'Öğrenci'),
    )
    GRADE_CHOICES = (
        ('PRIMARY', 'İlkokul'),
        ('MIDDLE', 'Ortaokul'),
        ('HIGH', 'Lise'),
        ('UNIVERSITY_FINANCE', 'Üniversite (Finans/İşletme)'),
        ('UNIVERSITY_GENERAL', 'Üniversite (Genel)'),
    )
    
    role = models.CharField(max_length=55, choices=ROLE_CHOICES, default='STUDENT')
    grade_level = models.CharField(max_length=55, choices=GRADE_CHOICES, null=True, blank=True)
    student_code = models.CharField(max_length=55, unique=True, null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.role == 'STUDENT' and not self.student_code:
            self.student_code = str(uuid.uuid4()).upper()[:8] # Örn: 8A2B9C1D
        super().save(*args, **kwargs)


# 3. İÇERİK MİMARİSİ
class Unit(models.Model):
    title = models.CharField(max_length=200)
    target_grade = models.CharField(max_length=55, choices=CustomUser.GRADE_CHOICES)
    badge_name = models.CharField(max_length=100)
    badge_image = models.ImageField(upload_to='badges/', null=True, blank=True)
    def __str__(self):
        return f"{self.get_target_grade_display()} - {self.title}"
class Subtopic(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='subtopics')
    title = models.CharField(max_length=200)
    order = models.IntegerField(default=0)
    def __str__(self):
        return f"{self.unit.title} > {self.title}"
class Content(models.Model):
    CONTENT_TYPES = (('VIDEO', 'Video'), ('GAME', 'Oyun/Simülasyon'))
    
    subtopic = models.ForeignKey(Subtopic, on_delete=models.CASCADE, related_name='contents')
    title = models.CharField(max_length=200)
    content_type = models.CharField(max_length=55, choices=CONTENT_TYPES)
    video_url = models.URLField(null=True, blank=True)
    game_file_path = models.CharField(max_length=255, null=True, blank=True)
    order = models.IntegerField(default=0)
    def __str__(self):
        return f"{self.subtopic.title} > {self.title}"
# 4. İLERLEME VE OYUNLAŞTIRMA
class UserProgress(models.Model):
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    content = models.ForeignKey(Content, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    score = models.IntegerField(null=True, blank=True)
    date_completed = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.student.username} - {self.content.title}"
class UserBadge(models.Model):
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE)
    earned_date = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.student.username} - {self.unit.badge_name}"
    
# SINIF MODELİ
class Classroom(models.Model):
    name = models.CharField(max_length=100)
    grade_level = models.CharField(max_length=55, null=True, blank=True)
    teacher = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='classrooms')
    students = models.ManyToManyField(CustomUser, related_name='enrolled_classes', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.teacher.first_name}"