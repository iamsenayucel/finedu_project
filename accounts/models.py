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
    program_completed_at = models.DateTimeField(null=True, blank=True)

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
    class Meta:
        ordering = ['order', 'id']
    def __str__(self):
        return f"{self.get_target_grade_display()} - {self.title}"
class Subtopic(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='subtopics')
    title = models.CharField(max_length=200)
    order = models.IntegerField(default=0)
    class Meta:
        ordering = ['order', 'id']
    def __str__(self):
        return f"{self.unit.title} > {self.title}"
class Content(models.Model):
    CONTENT_TYPES = (('VIDEO', 'Video'), ('GAME', 'Oyun/Simülasyon'))

    GAME_CHOICES = (
        ('financial_detective', '🕵️‍♂️ Finansal Medya Okuryazarlığı - 2'),
        ('drag_drop_needs', '🛒 İstek mi İhtiyaç mı? (İlkokul)'),
        ('stock_market', '📈 Borsa Simülatörü (Çok Yakında)'),
        # NOT: Aşağıdaki 10 kod, GameContainer.tsx (frontend render switch) ve
        # AdminPanel.tsx (admin seçim listesi) içinde tam çalışır oyunlar
        # olarak zaten mevcuttu, ancak burada (backend choices) hiç
        # tanımlanmamışlardı — AŞAMA 2 game-registry drift düzeltmesi.
        ('risk_hunter', '🎯 Risk Getiri Dengesi - 2'),
        ('real_data_hunter', '🔍 Finansal Medya Okuryazarlığı - 1'),
        ('space_shopping_depot', '🚀 Uzay Alışveriş Deposu - İstek & İhtiyaç'),
        ('risk_return_tradeoff', '📈 Risk Getiri Dengesi - 1'),
        ('economic_terms', '💡 Finansal Sistem Kavramlarını Keşfet - 1'),
        ('money_flow', '💸 Finansal Sistem Kavramlarını Keşfet - 2'),
        ('revenue_matching', '💰 Gelir Türleri - 1'),
        ('future_choice', '🎯 Gelir Türleri - 2'),
        ('investment_methods', '💹 Yasal Yatırım Araçlarını Keşfet'),
        ('scam_detector', '🕵️ Finansal Güvenlik Yöntemleri - 1'),
        ('financial_concept_hunt', '📊 Finansal Sistem - Ölçme Değerlendirme 1'),
        ('financial_system_concepts_2', '📊 Finansal Sistem - Ölçme Değerlendirme 2'),
        ('income_type_assessment', '📊 Gelir Türleri - Ölçme Değerlendirme 1'),
        ('media_literacy_assessment', '📊 Finansal Medya Okuryazarlığı - Ölçme Değerlendirme 2'),
        ('credit_card_awareness', '💳 Sağlıklı Borçlanma ve Kredi Kullanımı - 1'),
        ('credit_cost_analysis', '🧮 Sağlıklı Borçlanma ve Kredi Kullanımı - 2'),
        ('investment_or_consumption', '⚖️ Yatırım mı, Tüketim mi?'),
        ('information_filter', '📊 Finansal Medya Okuryazarlığı - Ölçme Değerlendirme 1'),
        ('market_detective', '📊 Risk Getiri Dengesi - Ölçme Değerlendirme 1'),
        ('portfolio_master', '📊 Risk Getiri Dengesi - Ölçme Değerlendirme 2'),
        ('legal_investment_assessment', '📊 Yasal Yatırım Araçları - Ölçme ve Değerlendirme'),
        ('legal_investment_assessment_2', '📊 Finansal Güvenlik Yöntemleri - Ölçme Değerlendirme 1'),
        ('economic_glossary_match', '📖 Ekonomi Sözlüğü'),
        ('media_glossary_puzzle', '🧩 Ekonomi Sözlüğü'),
        ('income_glossary_puzzle', '💰 Ekonomi Sözlüğü'),
        ('risk_glossary_puzzle', '🧩 Ekonomi Sözlüğü'),
        ('credit_financing_glossary_puzzle', '🧩 Ekonomi Sözlüğü'),
        ('fraud_hunt_glossary_puzzle', '🎣 Ekonomi Sözlüğü'),
        ('legal_investment_glossary_puzzle', '⚖️ Ekonomi Sözlüğü'),
        ('debt_credit_assessment', '📊 Sağlıklı Borçlanma ve Kredi Kullanımı - Ölçme Değerlendirme 2'),
        ('debt_credit_assessment_2', '📊 Sağlıklı Borçlanma ve Kredi Kullanımı - Ölçme Değerlendirme 1'),
        ('asset_liability_glossary_puzzle', '🧩 Ekonomi Sözlüğü'),
        ('asset_income_expense_assessment', '💻 Aktif ve Pasif Varlık Mantığı - 1'),
        ('short_long_term_impact', '⏳ Kısa ve Uzun Vadeli Finansal Etki - 1'),
        ('short_long_term_glossary_puzzle', '🧩 Ekonomi Sözlüğü'),
        ('investment_consumption_case_assessment', '📊 Aktif ve Pasif Varlık Mantığı - Ölçme Değerlendirme 1'),
    )
    
    subtopic = models.ForeignKey(Subtopic, on_delete=models.CASCADE, related_name='contents')
    title = models.CharField(max_length=200)
    content_type = models.CharField(max_length=55, choices=CONTENT_TYPES)
    video_file = models.FileField(upload_to='videos/', null=True, blank=True)
    game_file_path = models.CharField(max_length=255, null=True, blank=True)
    game_code = models.CharField(max_length=50, choices=GAME_CHOICES, blank=True, null=True, verbose_name="Oyun Seçimi")
    order = models.IntegerField(default=0)
    class Meta:
        ordering = ['order', 'id']
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
    class Meta:
        # Bir öğrenci + bir content için yalnızca bir UserProgress satırı
        # olabilir. Uygulama katmanı zaten get_or_create() ile bu invariantı
        # varsayıyor (bkz. views.user_progress_api) ama concurrency altında
        # (ör. aynı içerik için iki eşzamanlı tamamlama isteği) DB seviyesinde
        # garanti olmadan iki satır oluşabilirdi.
        constraints = [
            models.UniqueConstraint(fields=['student', 'content'], name='unique_userprogress_student_content')
        ]
    def __str__(self):
        return f"{self.student.username} - {self.content.title}"
class UserBadge(models.Model):
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE)
    earned_date = models.DateTimeField(auto_now_add=True)
    class Meta:
        # Bir öğrenci aynı ünite rozetini yalnızca bir kez taşıyabilir
        # (bkz. views.user_progress_api badge_created mantığı — burada da
        # aynı get_or_create + concurrency gerekçesi geçerli).
        constraints = [
            models.UniqueConstraint(fields=['student', 'unit'], name='unique_userbadge_student_unit')
        ]
    def __str__(self):
        return f"{self.student.username} - {self.unit.badge_name}"
    
# ÖN ANKET / SON ANKET MODELLERİ
class SurveyResponse(models.Model):
    SURVEY_TYPE_CHOICES = (
        ('pre_survey', 'Ön Anket'),
        ('post_survey', 'Son Anket'),
    )
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='survey_responses')
    survey_type = models.CharField(max_length=20, choices=SURVEY_TYPE_CHOICES)
    question_id = models.CharField(max_length=10)
    selected_option = models.CharField(max_length=5)
    answered_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'survey_type', 'question_id')

    def __str__(self):
        return f"{self.student.username} - {self.survey_type} - {self.question_id}"


class SurveyStatus(models.Model):
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='survey_statuses')
    survey_type = models.CharField(max_length=20, choices=SurveyResponse.SURVEY_TYPE_CHOICES)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('student', 'survey_type')

    def __str__(self):
        durum = 'Tamamlandı' if self.is_completed else 'Devam Ediyor'
        return f"{self.student.username} - {self.survey_type} - {durum}"


# SOSYAL SORUMLULUK TERCİHİ (Değerler Köprüsü) — gerçek bağış/ödeme İÇERMEZ,
# yalnızca öğrencinin "hangi kurumu desteklemek isterdim" tercihini kaydeder.
class SupportOrganization(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    impact_text = models.TextField(verbose_name="Farkındalık/Etki Mesajı")
    logo_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return self.name


class StudentSupportPreference(models.Model):
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='support_preferences')
    organization = models.ForeignKey(SupportOrganization, on_delete=models.PROTECT, related_name='student_preferences')
    is_active = models.BooleanField(default=True)
    selected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-selected_at']
        constraints = [
            models.UniqueConstraint(
                fields=['student'],
                condition=models.Q(is_active=True),
                name='unique_active_support_preference_per_student',
            )
        ]

    def __str__(self):
        durum = 'aktif' if self.is_active else 'geçmiş'
        return f"{self.student.username} -> {self.organization.name} ({durum})"


# SINIF MODELİ
class Classroom(models.Model):
    name = models.CharField(max_length=100)
    grade_level = models.CharField(max_length=55, null=True, blank=True)
    teacher = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='classrooms')
    students = models.ManyToManyField(CustomUser, related_name='enrolled_classes', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.teacher.first_name}"