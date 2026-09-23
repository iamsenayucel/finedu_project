import re
from pathlib import Path
from unittest.mock import patch

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction
from django.test import TestCase, override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import (
    CustomUser, SupportOrganization, StudentSupportPreference,
    Classroom, Unit, Subtopic, Content, UserProgress, UserBadge,
)


def make_user(role, **kwargs):
    defaults = {
        'username': kwargs.pop('username', f'{role.lower()}_{CustomUser.objects.count()}'),
        'password': 'testpass123',
    }
    defaults.update(kwargs)
    user = CustomUser.objects.create_user(role=role, **defaults)
    return user


class SupportPreferenceTests(TestCase):
    """Değerler Köprüsü (sosyal sorumluluk tercihi) API testleri.

    Bu modül gerçek bağış/ödeme içermez; testler yalnızca tercih
    kaydının doğru, güvenli ve tek-aktif kurallarına uygun çalıştığını doğrular.
    """

    def setUp(self):
        # NOT: 0036 seed migration'ı gerçek 4 kurumu (TEMA Vakfı, LÖSEV, TEGV, Mehmetçik Vakfı)
        # test veritabanına da uygular. İsim çakışmasını önlemek için testlerde farklı isimler kullanıyoruz.
        self.tema = SupportOrganization.objects.create(
            name='Test Kurum A', description='desc', impact_text='impact', display_order=101,
        )
        self.losev = SupportOrganization.objects.create(
            name='Test Kurum B', description='desc', impact_text='impact', display_order=102,
        )
        self.inactive_org = SupportOrganization.objects.create(
            name='Test Pasif Kurum', description='desc', impact_text='impact',
            display_order=103, is_active=False,
        )

        self.student = make_user('STUDENT', username='student1', grade_level='HIGH')
        self.other_student = make_user('STUDENT', username='student2', grade_level='HIGH')
        self.admin = make_user('ADMIN', username='admin1')
        self.teacher = make_user('TEACHER', username='teacher1')

        self.student_client = APIClient()
        self.student_client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.student).key}')

        self.other_student_client = APIClient()
        self.other_student_client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.other_student).key}')

        self.admin_client = APIClient()
        self.admin_client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.admin).key}')

        self.teacher_client = APIClient()
        self.teacher_client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.teacher).key}')

    # 1. Öğrenci aktif kurum listesini görebiliyor (pasif kurum hariç)
    def test_student_lists_active_organizations_only(self):
        res = self.student_client.get('/api/support-organizations/')
        self.assertEqual(res.status_code, 200)
        names = [o['name'] for o in res.data]
        self.assertIn(self.tema.name, names)
        self.assertIn(self.losev.name, names)
        self.assertNotIn(self.inactive_org.name, names)

    # 2 & 3. Öğrenci ilk tercihini oluşturabiliyor ve DB'ye doğru kaydediliyor
    def test_student_creates_first_preference(self):
        res = self.student_client.put('/api/student/support-preference/', {'organization_id': self.tema.id}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['preference']['organization']['id'], self.tema.id)

        pref = StudentSupportPreference.objects.get(student=self.student)
        self.assertEqual(pref.organization_id, self.tema.id)
        self.assertTrue(pref.is_active)

    # 4. Öğrenci tercihini değiştirebiliyor + eski tercih history olarak korunuyor
    def test_student_changes_preference_and_keeps_history(self):
        self.student_client.put('/api/student/support-preference/', {'organization_id': self.tema.id}, format='json')
        res = self.student_client.put('/api/student/support-preference/', {'organization_id': self.losev.id}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['preference']['organization']['id'], self.losev.id)

        all_prefs = StudentSupportPreference.objects.filter(student=self.student).order_by('id')
        self.assertEqual(all_prefs.count(), 2)
        self.assertFalse(all_prefs[0].is_active)
        self.assertEqual(all_prefs[0].organization_id, self.tema.id)
        self.assertTrue(all_prefs[1].is_active)
        self.assertEqual(all_prefs[1].organization_id, self.losev.id)

        active_count = StudentSupportPreference.objects.filter(student=self.student, is_active=True).count()
        self.assertEqual(active_count, 1)

    # 5. Aynı öğrencinin iki aktif tercihi DB seviyesinde oluşamıyor
    def test_db_constraint_blocks_second_active_preference(self):
        StudentSupportPreference.objects.create(student=self.student, organization=self.tema, is_active=True)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                StudentSupportPreference.objects.create(student=self.student, organization=self.losev, is_active=True)

    # 6. Öğrenci başka öğrencinin tercihini değiştiremiyor (student her zaman request.user'dan çözülür)
    def test_student_cannot_set_another_students_preference(self):
        res = self.student_client.put(
            '/api/student/support-preference/',
            {'organization_id': self.tema.id, 'student_id': self.other_student.id},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(StudentSupportPreference.objects.filter(student=self.student, organization=self.tema, is_active=True).exists())
        self.assertFalse(StudentSupportPreference.objects.filter(student=self.other_student).exists())

    # 7. Pasif kuruma tercih yapılamıyor
    def test_cannot_select_inactive_organization(self):
        res = self.student_client.put('/api/student/support-preference/', {'organization_id': self.inactive_org.id}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertFalse(StudentSupportPreference.objects.filter(student=self.student).exists())

    # Aynı kurum tekrar seçilirse yeni history satırı oluşmaz (no-op)
    def test_reselecting_same_organization_is_noop(self):
        self.student_client.put('/api/student/support-preference/', {'organization_id': self.tema.id}, format='json')
        res = self.student_client.put('/api/student/support-preference/', {'organization_id': self.tema.id}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(StudentSupportPreference.objects.filter(student=self.student).count(), 1)

    # 8. Admin tüm aktif tercihleri görebiliyor
    def test_admin_can_list_all_active_preferences(self):
        self.student_client.put('/api/student/support-preference/', {'organization_id': self.tema.id}, format='json')
        self.other_student_client.put('/api/student/support-preference/', {'organization_id': self.losev.id}, format='json')

        res = self.admin_client.get('/api/admin/support-preferences/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['count'], 2)

    # 9. Admin kurum bazlı filtreleme yapabiliyor
    def test_admin_filters_by_organization(self):
        self.student_client.put('/api/student/support-preference/', {'organization_id': self.tema.id}, format='json')
        self.other_student_client.put('/api/student/support-preference/', {'organization_id': self.losev.id}, format='json')

        res = self.admin_client.get(f'/api/admin/support-preferences/?organization={self.tema.id}')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['organization_id'], self.tema.id)

    # 10. Admin istatistik endpoint'i doğru sayıları döndürüyor (yeni kurum eklense de hardcode yok)
    def test_admin_stats_endpoint_returns_correct_counts(self):
        self.student_client.put('/api/student/support-preference/', {'organization_id': self.tema.id}, format='json')
        self.other_student_client.put('/api/student/support-preference/', {'organization_id': self.tema.id}, format='json')

        third_student = make_user('STUDENT', username='student3', grade_level='HIGH')
        third_client = APIClient()
        third_client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=third_student).key}')
        third_client.put('/api/student/support-preference/', {'organization_id': self.losev.id}, format='json')

        res = self.admin_client.get('/api/admin/support-preferences/stats/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['total_students_with_preference'], 3)

        by_org = {row['organization_name']: row for row in res.data['by_organization']}
        self.assertEqual(by_org[self.tema.name]['count'], 2)
        self.assertAlmostEqual(by_org[self.tema.name]['percentage'], 66.7, places=1)
        self.assertEqual(by_org[self.losev.name]['count'], 1)

    # 11. Admin olmayan kullanıcı admin endpoint'lerine erişemiyor
    def test_non_admin_cannot_access_admin_endpoints(self):
        res1 = self.student_client.get('/api/admin/support-preferences/')
        self.assertEqual(res1.status_code, 403)
        res2 = self.teacher_client.get('/api/admin/support-preferences/')
        self.assertEqual(res2.status_code, 403)
        res3 = self.student_client.get('/api/admin/support-preferences/stats/')
        self.assertEqual(res3.status_code, 403)

    # 12. Seed migration mantığı (get_or_create by name) tekrar çalıştırıldığında duplicate kayıt oluşturmuyor
    def test_seed_migration_logic_is_idempotent(self):
        from importlib import import_module

        seed_module = import_module('accounts.migrations.0036_seed_support_organizations')

        class _FakeApps:
            @staticmethod
            def get_model(app_label, model_name):
                return SupportOrganization

        before_count = SupportOrganization.objects.count()
        seed_module.seed_organizations(_FakeApps(), None)
        seed_module.seed_organizations(_FakeApps(), None)
        after_count = SupportOrganization.objects.count()

        self.assertEqual(before_count, after_count)
        self.assertEqual(SupportOrganization.objects.filter(name='TEMA Vakfı').count(), 1)


class RegistrationPrivilegeEscalationTests(TestCase):
    """Production security audit — Blocker 1 regression tests.

    Invariant: public/unauthenticated registration can NEVER create an
    ADMIN account, regardless of what the client sends in the request body.
    """

    def test_unauthenticated_role_admin_is_rejected_and_no_admin_created(self):
        client = APIClient()
        res = client.post(
            '/api/register/',
            {'email': 'attacker@example.com', 'password': 'AttackerPass123', 'role': 'ADMIN'},
            format='json',
        )
        # Yalnızca HTTP status yeterli değil — DB state'i de doğrula.
        self.assertEqual(res.status_code, 400)
        self.assertFalse(CustomUser.objects.filter(email='attacker@example.com').exists())
        self.assertEqual(CustomUser.objects.filter(role='ADMIN').count(), 0)

    def test_normal_registration_creates_student_by_default(self):
        client = APIClient()
        res = client.post(
            '/api/register/',
            {'email': 'student@example.com', 'password': 'StudentPass123', 'grade_level': 'HIGH'},
            format='json',
        )
        self.assertEqual(res.status_code, 201)
        user = CustomUser.objects.get(email='student@example.com')
        self.assertEqual(user.role, 'STUDENT')

    def test_public_teacher_registration_still_works(self):
        # Frontend (Register.tsx) TEACHER'ı seçilebilir rol olarak sunuyor;
        # bu davranış korunuyor, yalnızca ADMIN engelleniyor.
        client = APIClient()
        res = client.post(
            '/api/register/',
            {'email': 'teacher@example.com', 'password': 'TeacherPass123', 'role': 'TEACHER'},
            format='json',
        )
        self.assertEqual(res.status_code, 201)
        user = CustomUser.objects.get(email='teacher@example.com')
        self.assertEqual(user.role, 'TEACHER')

    def test_extra_privilege_fields_in_payload_do_not_escalate(self):
        client = APIClient()
        res = client.post(
            '/api/register/',
            {
                'email': 'sneaky@example.com',
                'password': 'SneakyPass123',
                'role': 'STUDENT',
                'is_staff': True,
                'is_superuser': True,
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201)
        user = CustomUser.objects.get(email='sneaky@example.com')
        self.assertEqual(user.role, 'STUDENT')
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)


class TeacherStudentAuthorizationTests(TestCase):
    """Production security audit — Blocker 2 regression tests (IDOR/BOLA).

    Invariant: a teacher can NEVER read student-specific data for a student
    outside their own classroom(s).
    """

    def setUp(self):
        self.teacher_a = make_user('TEACHER', username='teacherA')
        self.teacher_b = make_user('TEACHER', username='teacherB')
        self.student = make_user('STUDENT', username='studentX', grade_level='HIGH')
        self.unassigned_student = make_user('STUDENT', username='studentY', grade_level='HIGH')

        self.classroom_a = Classroom.objects.create(name='A Sinifi', teacher=self.teacher_a)
        self.classroom_a.students.add(self.student)

        self.classroom_b = Classroom.objects.create(name='B Sinifi', teacher=self.teacher_b)

        self.client_a = APIClient()
        self.client_a.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.teacher_a).key}')

        self.client_b = APIClient()
        self.client_b.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.teacher_b).key}')

        self.student_client = APIClient()
        self.student_client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.student).key}')

    def test_teacher_can_access_own_classroom_student(self):
        res = self.client_a.get(f'/api/student/{self.student.id}/detail/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['first_name'], self.student.first_name)

    def test_teacher_cannot_access_foreign_classroom_student(self):
        # teacher_b, student'ın (teacher_a'nın sınıfında) hiçbir classroom'una sahip değil.
        res = self.client_b.get(f'/api/student/{self.student.id}/detail/')
        self.assertEqual(res.status_code, 404)

    def test_teacher_cannot_access_unassigned_student(self):
        res = self.client_a.get(f'/api/student/{self.unassigned_student.id}/detail/')
        self.assertEqual(res.status_code, 404)

    def test_student_role_cannot_access_teacher_only_endpoint(self):
        res = self.student_client.get(f'/api/student/{self.student.id}/detail/')
        self.assertEqual(res.status_code, 403)

    def test_teacher_in_multiple_classrooms_with_same_student_no_crash(self):
        # M2M join'in .distinct() olmadan get_object_or_404'te
        # MultipleObjectsReturned üretmediğini doğrula.
        second_classroom = Classroom.objects.create(name='A Sinifi 2', teacher=self.teacher_a)
        second_classroom.students.add(self.student)

        res = self.client_a.get(f'/api/student/{self.student.id}/detail/')
        self.assertEqual(res.status_code, 200)


class ContentEditCrashTests(TestCase):
    """Production security audit — Blocker 3 regression tests.

    Invariant: editing content via PUT never raises an unhandled 500,
    regardless of which optional fields are present in the payload.
    """

    def setUp(self):
        self.admin = make_user('ADMIN', username='admin_content')
        self.unit = Unit.objects.create(title='Test Unit', target_grade='HIGH', badge_name='Test Badge')
        self.subtopic = Subtopic.objects.create(unit=self.unit, title='Test Subtopic')
        self.content = Content.objects.create(
            subtopic=self.subtopic, title='Original Title', content_type='VIDEO', game_code=None,
        )

        self.admin_client = APIClient()
        self.admin_client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.admin).key}')

    def test_put_without_video_url_does_not_500(self):
        res = self.admin_client.put(
            f'/api/contents/{self.content.id}/',
            {'contentTitle': 'Updated Title', 'contentType': 'VIDEO'},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.content.refresh_from_db()
        self.assertEqual(self.content.title, 'Updated Title')

    def test_put_updates_existing_fields_correctly(self):
        res = self.admin_client.put(
            f'/api/contents/{self.content.id}/',
            {'contentTitle': 'Another Title', 'contentType': 'GAME', 'game_code': 'drag_drop_needs'},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.content.refresh_from_db()
        self.assertEqual(self.content.title, 'Another Title')
        self.assertEqual(self.content.content_type, 'GAME')
        self.assertEqual(self.content.game_code, 'drag_drop_needs')

    def test_put_with_real_frontend_payload_shape_still_works(self):
        # AdminPanel.tsx bugün 'videoUrl' anahtarını da payload'a ekliyor
        # (bkz. AdminPanel.tsx formData.videoUrl) — fix bu şekli kırmamalı,
        # yalnızca artık var olmayan alana model üzerinde yazmayı durdurmalı.
        res = self.admin_client.put(
            f'/api/contents/{self.content.id}/',
            {'contentTitle': 'Frontend Payload Title', 'contentType': 'VIDEO', 'videoUrl': '', 'game_code': ''},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.content.refresh_from_db()
        self.assertEqual(self.content.title, 'Frontend Payload Title')


def _login_throttle_limit():
    from .views import LoginRateThrottle
    throttle = LoginRateThrottle()
    num_requests, _duration = throttle.parse_rate(throttle.get_rate())
    return num_requests


class LoginRateLimitTests(TestCase):
    """AŞAMA 1 — Security Item 1: /api/login/ brute-force koruması regression testleri.

    /api/login/ artık DRF'nin obtain_auth_token'ını doğrudan değil,
    accounts.views.ThrottledObtainAuthToken (scope='login', bkz.
    settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']['login']) üzerinden
    kullanıyor. AnonRateThrottle IP'ye göre saydığı için testler tek bir
    APIClient/IP üzerinden art arda istek atarak gerçek throttle davranışını
    doğruluyor.
    """

    def setUp(self):
        cache.clear()
        self.password = 'CorrectPass123'
        self.user = make_user('STUDENT', username='throttleuser', password=self.password)

    def tearDown(self):
        cache.clear()

    def test_correct_credentials_login_succeeds(self):
        client = APIClient()
        res = client.post('/api/login/', {'username': 'throttleuser', 'password': self.password}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('token', res.data)

    def test_few_wrong_attempts_are_normal_auth_failures_not_throttled(self):
        client = APIClient()
        limit = _login_throttle_limit()
        # Limitin altında kalan birkaç yanlış denemede sıradan 400 (geçersiz
        # kimlik bilgisi) alınmalı, 429 alınmamalı.
        for _ in range(max(1, limit - 1)):
            res = client.post('/api/login/', {'username': 'throttleuser', 'password': 'WrongPass'}, format='json')
            self.assertEqual(res.status_code, 400)

    def test_exceeding_limit_returns_429(self):
        client = APIClient()
        limit = _login_throttle_limit()
        last_status = None
        for _ in range(limit + 1):
            res = client.post('/api/login/', {'username': 'throttleuser', 'password': 'WrongPass'}, format='json')
            last_status = res.status_code
        self.assertEqual(last_status, 429)

    def test_login_throttle_does_not_affect_chatbot_throttle_scope(self):
        # login scope'unu doldurmak, tamamen ayrı bir scope/cache key kullanan
        # chatbot throttle'ını (bkz. ChatbotRateThrottle) etkilememeli.
        client = APIClient()
        limit = _login_throttle_limit()
        for _ in range(limit + 1):
            client.post('/api/login/', {'username': 'throttleuser', 'password': 'WrongPass'}, format='json')

        teacher = make_user('TEACHER', username='chatbot_teacher_throttle_check')
        teacher_client = APIClient()
        teacher_client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=teacher).key}')
        # OPENAI_API_KEY tanımlı değilse view kontrollü 500 döner — burada
        # gerçek dış API çağrısına bağımlı olmadan yalnızca 429 ALMADIĞINI,
        # yani login throttle'ının chatbot'u etkilemediğini doğruluyoruz.
        res = teacher_client.post('/api/chatbot/', {'message': 'Merhaba'}, format='json')
        self.assertNotEqual(res.status_code, 429)


class VideoUploadValidationTests(TestCase):
    """AŞAMA 1 — Security Item 2: video/dosya upload validation regression testleri."""

    def setUp(self):
        self.admin = make_user('ADMIN', username='upload_admin')
        self.teacher = make_user('TEACHER', username='upload_teacher')
        self.unit = Unit.objects.create(title='Upload Unit', target_grade='HIGH', badge_name='Upload Badge')
        self.subtopic = Subtopic.objects.create(unit=self.unit, title='Upload Subtopic')

        self.admin_client = APIClient()
        self.admin_client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.admin).key}')

        self.teacher_client = APIClient()
        self.teacher_client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.teacher).key}')

    @override_settings(STORAGES={
        # Prod'da default storage Cloudinary'dir ve test ortamında gerçek
        # Cloudinary API key'i yok. Bu test yalnızca validation + Content
        # satırının oluşup oluşmadığını doğruladığı için dosya fiilen
        # bellek-içi storage'a yazılır — gerçek Cloudinary'ye bağlanılmaz.
        'default': {'BACKEND': 'django.core.files.storage.InMemoryStorage'},
        'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
    })
    def test_allowed_video_file_is_accepted(self):
        video = SimpleUploadedFile('lesson.mp4', b'fake-mp4-bytes', content_type='video/mp4')
        res = self.admin_client.post('/api/contents/add/', {
            'subtopicId': self.subtopic.id,
            'contentTitle': 'Lesson 1',
            'contentType': 'VIDEO',
            'video_file': video,
        }, format='multipart')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Content.objects.filter(subtopic=self.subtopic).count(), 1)

    def test_disallowed_extension_is_rejected_with_400_not_500(self):
        malicious = SimpleUploadedFile('payload.exe', b'MZ-fake-binary', content_type='application/octet-stream')
        res = self.admin_client.post('/api/contents/add/', {
            'subtopicId': self.subtopic.id,
            'contentTitle': 'Bad Upload',
            'contentType': 'VIDEO',
            'video_file': malicious,
        }, format='multipart')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(Content.objects.filter(subtopic=self.subtopic).count(), 0)

    def test_oversized_video_is_rejected(self):
        # Gerçek MAX_VIDEO_UPLOAD_BYTES (100MB) kadar veri oluşturmak testi
        # gereksiz yavaşlatır/bellek tüketir; sınırı testte küçültüp aynı
        # kod yolunu (boyut kontrolü) doğruluyoruz.
        with patch('accounts.views.MAX_VIDEO_UPLOAD_BYTES', 10):
            oversized = SimpleUploadedFile('huge.mp4', b'0' * 20, content_type='video/mp4')
            res = self.admin_client.post('/api/contents/add/', {
                'subtopicId': self.subtopic.id,
                'contentTitle': 'Huge Upload',
                'contentType': 'VIDEO',
                'video_file': oversized,
            }, format='multipart')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(Content.objects.filter(subtopic=self.subtopic).count(), 0)

    def test_invalid_upload_leaves_no_partial_content_row(self):
        before_count = Content.objects.count()
        malicious = SimpleUploadedFile('payload.exe', b'MZ-fake-binary', content_type='application/octet-stream')
        self.admin_client.post('/api/contents/add/', {
            'subtopicId': self.subtopic.id,
            'contentTitle': 'Bad Upload 2',
            'contentType': 'VIDEO',
            'video_file': malicious,
        }, format='multipart')
        self.assertEqual(Content.objects.count(), before_count)

    def test_non_admin_cannot_use_upload_endpoint(self):
        video = SimpleUploadedFile('lesson.mp4', b'fake-mp4-bytes', content_type='video/mp4')
        res = self.teacher_client.post('/api/contents/add/', {
            'subtopicId': self.subtopic.id,
            'contentTitle': 'Should Not Work',
            'contentType': 'VIDEO',
            'video_file': video,
        }, format='multipart')
        self.assertEqual(res.status_code, 403)
        self.assertEqual(Content.objects.filter(subtopic=self.subtopic).count(), 0)


class UserProgressIntegrityTests(TestCase):
    """AŞAMA 1 — Data Integrity Item 1: UserProgress(student, content) DB constraint."""

    def setUp(self):
        self.student = make_user('STUDENT', username='progress_student', grade_level='HIGH')
        self.unit = Unit.objects.create(title='Integrity Unit', target_grade='HIGH', badge_name='Integrity Badge')
        self.subtopic = Subtopic.objects.create(unit=self.unit, title='Integrity Subtopic')
        self.content = Content.objects.create(subtopic=self.subtopic, title='Integrity Content', content_type='VIDEO')

    def test_duplicate_userprogress_rejected_by_db(self):
        UserProgress.objects.create(student=self.student, content=self.content, is_completed=True, score=10)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                UserProgress.objects.create(student=self.student, content=self.content, is_completed=True, score=20)
        # DB reddetti; ikinci satır gerçekten oluşmamış olmalı.
        self.assertEqual(UserProgress.objects.filter(student=self.student, content=self.content).count(), 1)

    def test_same_student_different_content_is_still_allowed(self):
        other_content = Content.objects.create(subtopic=self.subtopic, title='Other Content', content_type='VIDEO')
        UserProgress.objects.create(student=self.student, content=self.content, is_completed=True)
        UserProgress.objects.create(student=self.student, content=other_content, is_completed=True)
        self.assertEqual(UserProgress.objects.filter(student=self.student).count(), 2)


class UserBadgeIntegrityTests(TestCase):
    """AŞAMA 1 — Data Integrity Item 2: UserBadge(student, unit) DB constraint."""

    def setUp(self):
        self.student = make_user('STUDENT', username='badge_student', grade_level='HIGH')
        self.unit = Unit.objects.create(title='Badge Unit', target_grade='HIGH', badge_name='Badge Name')

    def test_duplicate_userbadge_rejected_by_db(self):
        UserBadge.objects.create(student=self.student, unit=self.unit)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                UserBadge.objects.create(student=self.student, unit=self.unit)
        self.assertEqual(UserBadge.objects.filter(student=self.student, unit=self.unit).count(), 1)

    def test_same_student_different_unit_is_still_allowed(self):
        other_unit = Unit.objects.create(title='Badge Unit 2', target_grade='HIGH', badge_name='Badge Name 2')
        UserBadge.objects.create(student=self.student, unit=self.unit)
        UserBadge.objects.create(student=self.student, unit=other_unit)
        self.assertEqual(UserBadge.objects.filter(student=self.student).count(), 2)


class ExceptionLeakageTests(TestCase):
    """AŞAMA 1 — Security Item 4: raw exception leakage fix regression testleri."""

    def test_duplicate_email_registration_does_not_leak_raw_db_error(self):
        client = APIClient()
        res1 = client.post('/api/register/', {'email': 'dup@example.com', 'password': 'DupPass123'}, format='json')
        self.assertEqual(res1.status_code, 201)

        # İkinci kayıt username=email üzerinden UNIQUE constraint'e çarpar
        # (IntegrityError) — bu artık istemciye ham DB hata metni olarak
        # sızmamalı, kontrollü 400 + generic mesaj dönmeli.
        res2 = client.post('/api/register/', {'email': 'dup@example.com', 'password': 'DupPass123'}, format='json')
        self.assertEqual(res2.status_code, 400)
        error_message = str(res2.data.get('error', ''))
        self.assertNotIn('UNIQUE', error_message.upper())
        self.assertNotIn('CONSTRAINT', error_message.upper())
        self.assertNotIn('accounts_customuser', error_message)

    def test_reorder_with_malformed_items_does_not_500_or_leak_exception(self):
        admin = make_user('ADMIN', username='reorder_admin')
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=admin).key}')
        # 'id' anahtarı eksik -> view içinde KeyError tetikler; bu artık
        # genel except Exception bloğunda yakalanıp generic mesaja çevrilmeli.
        res = client.post('/api/reorder/', {'type': 'UNIT', 'items': [{'no_id_field': 1}]}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertNotIn('KeyError', str(res.data))

    def test_add_subtopic_with_invalid_unit_does_not_leak_exception(self):
        admin = make_user('ADMIN', username='subtopic_admin')
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=admin).key}')
        res = client.post('/api/subtopics/add/', {'unitId': 999999, 'title': 'X'}, format='json')
        # Unit.DoesNotExist zaten ayrı, kontrollü bir 404 olarak ele alınıyor.
        self.assertEqual(res.status_code, 404)
        self.assertNotIn('DoesNotExist', str(res.data))


class HealthEndpointTests(TestCase):
    """AŞAMA 4 — Health/Readiness: /api/health/ liveness endpoint testleri.

    Bu bir LIVENESS endpoint'idir (process ayakta mı?) — DB/dış servis
    bağımlılığı yoktur. FINedu'nun mevcut ölçeğinde (~100 kullanıcı, tek
    Postgres/Neon instance) ayrı bir readiness endpoint'i (DB'ye SELECT 1
    atan) eklemenin getirisi düşük görülüp DEFERRED bırakıldı: mevcut tek
    endpoint zaten "uygulama süreci ayakta mı" sorusuna cevap veriyor ve
    Render zaten kendi health-check mekanizmasını bu endpoint üzerinden
    çalıştırabiliyor; DB'siz bir 200 yeterli sinyal (asıl DB erişilemezse
    diğer tüm endpointler zaten hata verir ve Render logstream'inde görünür).
    """

    def test_health_endpoint_returns_minimal_ok_response(self):
        res = self.client.get('/api/health/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {'status': 'ok'})

    def test_health_endpoint_does_not_require_authentication(self):
        # AllowAny olmalı — Render/monitoring bir token olmadan çağırabilmeli.
        client = APIClient()
        res = client.get('/api/health/')
        self.assertEqual(res.status_code, 200)

    def test_health_endpoint_does_not_leak_sensitive_settings(self):
        res = self.client.get('/api/health/')
        body = str(res.data)
        for leaky in ('SECRET_KEY', 'DATABASE_URL', 'DEBUG', 'django', 'sqlite', 'postgres'):
            self.assertNotIn(leaky.lower(), body.lower())


class SecurityHeaderTests(TestCase):
    """AŞAMA 1 — Security Item 3: security headers / HTTPS hardening regression testleri."""

    def test_nosniff_and_frame_options_present_by_default(self):
        # SECURE_CONTENT_TYPE_NOSNIFF ve X_FRAME_OPTIONS Django varsayılanları
        # (True / 'DENY') üzerinden zaten aktif — AŞAMA 1 bunlara dokunmadı,
        # sadece halihazırda gönderildiklerini doğruluyoruz.
        res = self.client.get('/api/health/')
        self.assertEqual(res.headers.get('X-Content-Type-Options'), 'nosniff')
        self.assertEqual(res.headers.get('X-Frame-Options'), 'DENY')

    def test_no_ssl_redirect_in_local_dev_settings(self):
        # DATABASE_URL tanımlı olmadığı (yerel/test ortamı) sürece
        # SECURE_SSL_REDIRECT açılmamalı — aksi halde yerel `runserver`/test
        # akışı kırılırdı.
        res = self.client.get('/api/health/', secure=False)
        self.assertEqual(res.status_code, 200)

    @override_settings(SECURE_SSL_REDIRECT=True)
    def test_ssl_redirect_sends_http_to_https_when_enabled(self):
        res = self.client.get('/api/health/', secure=False)
        self.assertEqual(res.status_code, 301)
        self.assertTrue(res['Location'].startswith('https://'))

    @override_settings(SECURE_HSTS_SECONDS=86400)
    def test_hsts_header_present_on_secure_request_when_enabled(self):
        res = self.client.get('/api/health/', secure=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn('max-age=86400', res.headers.get('Strict-Transport-Security', ''))


class SharedPermissionClassMigrationTests(TestCase):
    """AŞAMA 2 — Hedef 1: inline role check'lerin accounts.permissions
    (IsAdmin/IsTeacher/IsStudent) üzerinden merkezileştirilmesi sonrası
    davranışın (durum kodları) değişmediğini doğrular.

    Bu testler AŞAMA 0/1'deki mevcut rol testlerini TEKRARLAMAZ; onların
    kapsamadığı ek uçları (anonim erişim, admin'in teacher-only endpoint'e
    erişememesi) hedefler.
    """

    def setUp(self):
        self.admin = make_user('ADMIN', username='perm_admin')
        self.teacher = make_user('TEACHER', username='perm_teacher')
        self.student = make_user('STUDENT', username='perm_student', grade_level='HIGH')

        self.admin_client = APIClient()
        self.admin_client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.admin).key}')

        self.teacher_client = APIClient()
        self.teacher_client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.teacher).key}')

        self.student_client = APIClient()
        self.student_client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.student).key}')

    def test_anonymous_denied_on_admin_only_endpoint(self):
        res = APIClient().get('/api/users/')
        self.assertIn(res.status_code, (401, 403))

    def test_anonymous_denied_on_teacher_only_endpoint(self):
        res = APIClient().get('/api/classrooms/')
        self.assertIn(res.status_code, (401, 403))

    def test_student_denied_on_admin_only_endpoint(self):
        res = self.student_client.get('/api/users/')
        self.assertEqual(res.status_code, 403)

    def test_admin_denied_on_teacher_only_endpoint(self):
        # IsTeacher yalnızca role == 'TEACHER' kontrol eder — ADMIN, TEACHER
        # rolüne sahip olmadığı için önceki inline kontrolde olduğu gibi
        # burada da erişemez (ownership değil, saf rol kontrolü).
        res = self.admin_client.get('/api/classrooms/')
        self.assertEqual(res.status_code, 403)

    def test_teacher_denied_on_admin_only_endpoint(self):
        res = self.teacher_client.get('/api/users/')
        self.assertEqual(res.status_code, 403)

    def test_admin_can_access_admin_only_endpoint(self):
        res = self.admin_client.get('/api/users/')
        self.assertEqual(res.status_code, 200)

    def test_teacher_can_access_teacher_only_endpoint(self):
        res = self.teacher_client.get('/api/classrooms/')
        self.assertEqual(res.status_code, 200)

    def test_student_denied_on_student_only_endpoint_when_not_student(self):
        # api_student_support_preference_view artık IsStudent kullanıyor.
        res = self.teacher_client.get('/api/student/support-preference/')
        self.assertEqual(res.status_code, 403)

    def test_student_can_access_student_only_endpoint(self):
        res = self.student_client.get('/api/student/support-preference/')
        self.assertEqual(res.status_code, 200)


class WriteEndpointSerializerValidationTests(TestCase):
    """AŞAMA 2 — Hedef 2: add content / add subtopic / reorder / content
    update endpoint'lerindeki yeni serializer discipline regression testleri.
    """

    def setUp(self):
        self.admin = make_user('ADMIN', username='serializer_admin')
        self.unit = Unit.objects.create(title='Serializer Unit', target_grade='HIGH', badge_name='Serializer Badge')
        self.subtopic = Subtopic.objects.create(unit=self.unit, title='Serializer Subtopic')
        self.content = Content.objects.create(
            subtopic=self.subtopic, title='Serializer Content', content_type='VIDEO',
        )

        self.admin_client = APIClient()
        self.admin_client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=self.admin).key}')

    # --- api_add_subtopic_view ---
    def test_add_subtopic_missing_title_returns_400(self):
        res = self.admin_client.post('/api/subtopics/add/', {'unitId': self.unit.id}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(Subtopic.objects.filter(unit=self.unit).count(), 1)  # setUp'taki tek satır

    def test_add_subtopic_valid_payload_still_works(self):
        res = self.admin_client.post('/api/subtopics/add/', {'unitId': self.unit.id, 'title': 'New Sub'}, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertTrue(Subtopic.objects.filter(unit=self.unit, title='New Sub').exists())

    # --- api_add_content_view ---
    def test_add_content_invalid_content_type_choice_returns_400(self):
        res = self.admin_client.post('/api/contents/add/', {
            'subtopicId': self.subtopic.id, 'contentTitle': 'Bad', 'contentType': 'NOT_A_TYPE',
        }, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(Content.objects.filter(title='Bad').count(), 0)

    def test_add_content_invalid_game_code_choice_returns_400(self):
        res = self.admin_client.post('/api/contents/add/', {
            'subtopicId': self.subtopic.id, 'contentTitle': 'Bad Game', 'contentType': 'GAME',
            'game_code': 'this_code_does_not_exist',
        }, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(Content.objects.filter(title='Bad Game').count(), 0)

    def test_add_content_valid_game_code_still_works(self):
        # AŞAMA 2'de GAME_CHOICES'e eklenen (daha önce yalnızca frontend'de
        # var olan) bir kod — artık backend tarafından da kabul edilmeli.
        res = self.admin_client.post('/api/contents/add/', {
            'subtopicId': self.subtopic.id, 'contentTitle': 'Risk Hunter', 'contentType': 'GAME',
            'game_code': 'risk_hunter',
        }, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertTrue(Content.objects.filter(title='Risk Hunter', game_code='risk_hunter').exists())

    def test_add_content_missing_required_field_returns_400_not_500(self):
        res = self.admin_client.post('/api/contents/add/', {
            'subtopicId': self.subtopic.id, 'contentType': 'VIDEO',
        }, format='json')
        self.assertEqual(res.status_code, 400)

    # --- api_content_detail_view (PUT) ---
    def test_content_update_invalid_choice_returns_400(self):
        res = self.admin_client.put(
            f'/api/contents/{self.content.id}/',
            {'contentType': 'NOT_A_TYPE'},
            format='json',
        )
        self.assertEqual(res.status_code, 400)
        self.content.refresh_from_db()
        self.assertEqual(self.content.content_type, 'VIDEO')  # değişmedi

    def test_content_update_unknown_field_is_ignored_safely(self):
        # Örn. 'is_staff' gibi bilinmeyen/privileged bir alan gönderilse bile
        # serializer bunu sessizce yok sayar, herhangi bir model alanına sızmaz.
        res = self.admin_client.put(
            f'/api/contents/{self.content.id}/',
            {'contentTitle': 'Still Fine', 'is_staff': True},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.content.refresh_from_db()
        self.assertEqual(self.content.title, 'Still Fine')

    # --- api_reorder_view ---
    def test_reorder_invalid_type_returns_400(self):
        res = self.admin_client.post(
            '/api/reorder/', {'type': 'NOT_A_TYPE', 'items': [{'id': 1, 'order': 1}]}, format='json',
        )
        self.assertEqual(res.status_code, 400)

    def test_reorder_missing_items_is_still_a_noop_success(self):
        # Önceki davranış: items hiç gönderilmezse no-op (200) sayılıyordu.
        res = self.admin_client.post('/api/reorder/', {'type': 'UNIT'}, format='json')
        self.assertEqual(res.status_code, 200)

    def test_reorder_non_integer_id_returns_400(self):
        res = self.admin_client.post(
            '/api/reorder/', {'type': 'UNIT', 'items': [{'id': 'not-an-int', 'order': 1}]}, format='json',
        )
        self.assertEqual(res.status_code, 400)

    def test_reorder_valid_payload_still_updates_order(self):
        other_subtopic = Subtopic.objects.create(unit=self.unit, title='Other Sub', order=1)
        res = self.admin_client.post(
            '/api/reorder/',
            {'type': 'SUBTOPIC', 'items': [{'id': self.subtopic.id, 'order': 2}, {'id': other_subtopic.id, 'order': 1}]},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.subtopic.refresh_from_db()
        self.assertEqual(self.subtopic.order, 2)


class GameRegistryConsistencyTests(TestCase):
    """AŞAMA 2 — Hedef 3: admin panelinde seçilebilen her game_code'un
    backend Content.GAME_CHOICES içinde de geçerli olduğunu doğrular.

    Bu, GameContainer.tsx / AdminPanel.tsx (frontend) ile accounts/models.py
    (backend) arasındaki drift'i otomatik yakalayan minimal, cross-language
    bir statik tutarlılık kontrolüdür (bkz. final rapor "Game Registry").
    """

    def test_admin_panel_game_options_are_all_valid_backend_choices(self):
        registry_path = (
            Path(__file__).resolve().parent.parent
            / 'arayuz' / 'src' / 'components' / 'games' / 'gameRegistry.ts'
        )
        self.assertTrue(registry_path.exists(), f'gameRegistry.ts bulunamadı: {registry_path}')

        source = registry_path.read_text(encoding='utf-8')
        frontend_codes = set(re.findall(r'value:\s*"([^"]+)"', source))
        self.assertGreater(len(frontend_codes), 0, 'gameRegistry.ts içinde hiç game code bulunamadı.')

        backend_codes = {choice[0] for choice in Content.GAME_CHOICES}
        missing_from_backend = frontend_codes - backend_codes
        self.assertEqual(
            missing_from_backend, set(),
            f'Şu game code(lar) admin panelinde seçilebilir ama backend '
            f'GAME_CHOICES içinde yok: {missing_from_backend}',
        )


class DeadCodeRegressionTests(TestCase):
    """AŞAMA 2 — Hedef 5: kaldırılan dead code'un (ViewSet'ler, duplicate
    dashboard_view, debug print'ler) yeniden eklenmediğini doğrular.
    """

    def _views_source(self) -> str:
        views_path = Path(__file__).resolve().parent / 'views.py'
        return views_path.read_text(encoding='utf-8')

    def test_dead_viewsets_are_not_reintroduced(self):
        source = self._views_source()
        for name in ('UserViewSet', 'UnitViewSet', 'UserProgressViewSet'):
            self.assertNotIn(name, source, f'{name} yeniden eklenmiş görünüyor (bkz. AŞAMA 2 dead-code cleanup).')

    def test_dashboard_view_is_defined_exactly_once(self):
        source = self._views_source()
        self.assertEqual(
            len(re.findall(r'^def dashboard_view\(', source, re.MULTILINE)), 1,
            'dashboard_view birden fazla kez tanımlanmış (duplicate regresyonu).',
        )

    def test_no_debug_print_statements_in_views(self):
        source = self._views_source()
        self.assertNotIn('print(', source, 'views.py içinde debug print() çağrısı bulundu.')


class AdminReportPerformanceTests(TestCase):
    """AŞAMA 4 — api_admin_report_view N+1 regression testleri.

    MEASURED (CaptureQueriesContext ile, düzeltme öncesi): 5 öğrenci / 4
    içerik = 34 sorgu; 25 öğrenci / 12 içerik = 78 sorgu (veriyle birlikte
    doğrusal büyüyor — content_stats döngüsünde içerik başına 3 sorgu,
    top_students döngüsünde öğrenci başına `total_score` property'si üzerinden
    1 sorgu). Düzeltme sonrası (annotate/aggregate ile tek sorguya indirgendi):
    her iki ölçekte de 17 sorgu.

    Kırılgan bir "tam olarak N sorgu" testi yerine (bkz. CLAUDE.md/prompt
    "performance testleri kırılgan olmamalı"), burada asıl korunan invariant
    şu: sorgu sayısı veri hacmiyle BİRLİKTE BÜYÜMEMELİ. Bu, ORM'nin küçük iç
    değişikliklerinde (ör. 17 yerine 18 sorgu) kırılmaz, ama N+1 geri
    dönerse (sorgu sayısı veri boyutuyla orantılı büyürse) yakalar.
    """

    def _make_fixtures(self, num_students, num_contents_per_unit=2, num_units=2, username_prefix='s'):
        unit_ids = []
        content_ids = []
        for u in range(num_units):
            unit = Unit.objects.create(title=f'Unit {username_prefix}{u}', target_grade='HIGH', badge_name=f'Badge {username_prefix}{u}')
            sub = Subtopic.objects.create(unit=unit, title=f'Sub {username_prefix}{u}')
            for c in range(num_contents_per_unit):
                content = Content.objects.create(subtopic=sub, title=f'C{username_prefix}{u}-{c}', content_type='VIDEO', order=c)
                content_ids.append(content.id)
            unit_ids.append(unit.id)
        students = [
            make_user('STUDENT', username=f'{username_prefix}_student_{i}', grade_level='HIGH')
            for i in range(num_students)
        ]
        for s in students:
            for cid in content_ids:
                UserProgress.objects.get_or_create(student=s, content_id=cid, defaults={'is_completed': True, 'score': 10})
        return students, content_ids

    def _admin_client(self, username):
        admin = make_user('ADMIN', username=username)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=admin).key}')
        return client

    def test_admin_report_query_count_does_not_scale_with_data_size(self):
        from django.test.utils import CaptureQueriesContext
        from django.db import connection

        client = self._admin_client('admin_scale_check')

        self._make_fixtures(num_students=5, num_contents_per_unit=2, num_units=2, username_prefix='small')
        with CaptureQueriesContext(connection) as small_ctx:
            res_small = client.get('/api/admin-report/')
        self.assertEqual(res_small.status_code, 200)
        small_query_count = len(small_ctx.captured_queries)

        # Aynı isteği çok daha büyük bir veri kümesi üstüne ekleyerek tekrarla.
        self._make_fixtures(num_students=25, num_contents_per_unit=4, num_units=3, username_prefix='large')
        with CaptureQueriesContext(connection) as large_ctx:
            res_large = client.get('/api/admin-report/')
        self.assertEqual(res_large.status_code, 200)
        large_query_count = len(large_ctx.captured_queries)

        # N+1 geri dönerse bu fark onlarca sorguya çıkar (bkz. MEASURED
        # 34 -> 78). Sabit maliyetli sorgular arasındaki doğal küçük
        # farklılıklara (ör. distinct/sıralama planı) izin vermek için
        # gevşek ama anlamlı bir üst sınır kullanılıyor.
        self.assertLessEqual(
            large_query_count - small_query_count, 5,
            f'admin-report sorgu sayısı veri hacmiyle birlikte büyüyor '
            f'(küçük veri: {small_query_count}, büyük veri: {large_query_count}) — N+1 regresyonu şüphesi.'
        )

    def test_admin_report_content_and_student_aggregates_are_correct(self):
        # N+1 fix'inin (annotate/aggregate rewrite) önceki per-item aggregate
        # davranışıyla aynı sonucu ürettiğini doğrula.
        unit = Unit.objects.create(title='Unit X', target_grade='HIGH', badge_name='Badge X')
        sub = Subtopic.objects.create(unit=unit, title='Sub X')
        content = Content.objects.create(subtopic=sub, title='Content X', content_type='VIDEO', order=0)

        s1 = make_user('STUDENT', username='agg_s1', grade_level='HIGH')
        s2 = make_user('STUDENT', username='agg_s2', grade_level='HIGH')
        UserProgress.objects.create(student=s1, content=content, is_completed=True, score=10, play_count=2)
        UserProgress.objects.create(student=s2, content=content, is_completed=True, score=20, play_count=3)

        client = self._admin_client('admin_agg_check')
        res = client.get('/api/admin-report/')
        self.assertEqual(res.status_code, 200)

        stats = next(c for c in res.data['content_stats'] if c['id'] == content.id)
        self.assertEqual(stats['completions'], 2)
        self.assertEqual(stats['play_count'], 5)
        self.assertEqual(stats['avg_score'], 15.0)

        top_by_name = {t['name']: t['total_score'] for t in res.data['top_students']}
        self.assertEqual(top_by_name[f'{s1.first_name} {s1.last_name}'.strip() or s1.username], s1.total_score)
        self.assertEqual(top_by_name[f'{s2.first_name} {s2.last_name}'.strip() or s2.username], s2.total_score)


class ClassroomsPerformanceTests(TestCase):
    """AŞAMA 4 — api_classrooms_view N+1 regression testleri.

    MEASURED (düzeltme öncesi): 3 öğrenci = 12 sorgu, 20 öğrenci = 63 sorgu
    (öğrenci başına 3 sorgu: completed count, grade seviyesine göre toplam
    içerik sayısı, total_score). Düzeltme sonrası: her iki ölçekte de 4 sorgu.
    """

    def _build(self, num_students, prefix):
        unit = Unit.objects.create(title=f'U-{prefix}', target_grade='HIGH', badge_name=f'B-{prefix}')
        sub = Subtopic.objects.create(unit=unit, title=f'S-{prefix}')
        content = Content.objects.create(subtopic=sub, title=f'C-{prefix}', content_type='VIDEO', order=0)
        teacher = make_user('TEACHER', username=f'teacher_{prefix}')
        classroom = Classroom.objects.create(name=f'Class-{prefix}', teacher=teacher, grade_level='HIGH')
        for i in range(num_students):
            s = make_user('STUDENT', username=f'{prefix}_stu_{i}', grade_level='HIGH')
            classroom.students.add(s)
            UserProgress.objects.create(student=s, content=content, is_completed=True, score=5)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=teacher).key}')
        return client, classroom, content

    def test_classrooms_query_count_does_not_scale_with_student_count(self):
        from django.test.utils import CaptureQueriesContext
        from django.db import connection

        client_small, _, _ = self._build(3, 'small')
        with CaptureQueriesContext(connection) as ctx_small:
            res_small = client_small.get('/api/classrooms/')
        self.assertEqual(res_small.status_code, 200)

        client_large, _, _ = self._build(20, 'large')
        with CaptureQueriesContext(connection) as ctx_large:
            res_large = client_large.get('/api/classrooms/')
        self.assertEqual(res_large.status_code, 200)

        self.assertLessEqual(
            len(ctx_large.captured_queries) - len(ctx_small.captured_queries), 3,
            f'classrooms sorgu sayısı öğrenci sayısıyla birlikte büyüyor '
            f'(3 öğrenci: {len(ctx_small.captured_queries)}, 20 öğrenci: {len(ctx_large.captured_queries)}) '
            f'— N+1 regresyonu şüphesi.'
        )

    def test_classrooms_progress_and_score_values_are_correct(self):
        client, classroom, content = self._build(2, 'correctness')
        res = client.get('/api/classrooms/')
        self.assertEqual(res.status_code, 200)

        cls_data = next(c for c in res.data if c['id'] == classroom.id)
        self.assertEqual(len(cls_data['students']), 2)
        for student_data in cls_data['students']:
            # Bu grade_level'da tam olarak 1 içerik var ve öğrenci onu
            # tamamladı -> ilerleme %100 olmalı.
            self.assertEqual(student_data['progress'], 100)
            self.assertEqual(student_data['total_score'], 5)
