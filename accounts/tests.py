from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import CustomUser, SupportOrganization, StudentSupportPreference


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
