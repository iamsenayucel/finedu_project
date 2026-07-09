from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from django.db.models import Sum
from datetime import date

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
    streak_days = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.role == 'STUDENT' and not self.student_code:
            self.student_code = str(uuid.uuid4()).upper()[:8] # Örn: 8A2B9C1D
        super().save(*args, **kwargs)

    def update_streak(self):
        today = date.today()
        if self.last_activity_date:
            delta = (today - self.last_activity_date).days
            if delta == 1:
                self.streak_days += 1
            elif delta > 1:
                self.streak_days = 1
            # delta == 0: same day, no change
        else:
            self.streak_days = 1
        self.last_activity_date = today
        self.save(update_fields=['streak_days', 'last_activity_date'])

    @property
    def total_score(self):
        # UserProgress tablosunda bu öğrenciye ait 'score' alanlarını topla
        total = self.userprogress_set.aggregate(models.Sum('score'))['score__sum']
        return total or 0

    @property
    def earned_badges(self):
        # UserBadge tablosundan bu öğrenciye ait rozetlerin isimlerini liste yap
        return list(self.userbadge_set.values_list('unit__badge_name', flat=True))

# 3. İÇERİK MİMARİSİ
class Unit(models.Model):
    title = models.CharField(max_length=200)
    target_grade = models.CharField(max_length=55, choices=CustomUser.GRADE_CHOICES)
    order = models.IntegerField(default=1)
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

    GAME_CHOICES = (
        ('financial_detective', '🕵️‍♂️ Finansal Haber Dedektifi (10. Sınıf)'),
        ('drag_drop_needs', '🛒 İstek mi İhtiyaç mı? (İlkokul)'),
        ('stock_market', '📈 Borsa Simülatörü (Çok Yakında)'),
    )
    
    subtopic = models.ForeignKey(Subtopic, on_delete=models.CASCADE, related_name='contents')
    title = models.CharField(max_length=200)
    content_type = models.CharField(max_length=55, choices=CONTENT_TYPES)
    video_file = models.FileField(upload_to='videos/', null=True, blank=True)
    game_file_path = models.CharField(max_length=255, null=True, blank=True)
    game_code = models.CharField(max_length=50, choices=GAME_CHOICES, blank=True, null=True, verbose_name="Oyun Seçimi")
    order = models.IntegerField(default=0)
    def __str__(self):
        return f"{self.subtopic.title} > {self.title}"
# 4. İLERLEME VE OYUNLAŞTIRMA
class UserProgress(models.Model):
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    content = models.ForeignKey(Content, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    score = models.IntegerField(null=True, blank=True)
    play_count = models.IntegerField(default=1)
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