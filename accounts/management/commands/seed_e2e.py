from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.utils import timezone

from accounts.models import CustomUser, Unit, Subtopic, Content, SurveyStatus

# AŞAMA 5 E2E altyapısı: Playwright'ın gerçek bir local Django backend'e karşı
# çalışabilmesi için deterministic, idempotent (get_or_create) test verisi.
# Bu komut yalnızca e2e/backend_server.py tarafından, ayrı bir SQLITE_NAME
# dosyasına karşı çağrılır — geliştiricinin normal db.sqlite3'üne asla
# dokunmaz (bkz. AŞAMA 5 madde 27, 70).
E2E_PASSWORD = "E2ePassw0rd!123"


class Command(BaseCommand):
    help = "Seeds deterministic users/content for the Playwright E2E suite (idempotent)."

    def handle(self, *args, **options):
        admin, _ = CustomUser.objects.get_or_create(
            username="e2e_admin",
            defaults={
                "email": "e2e_admin@example.test",
                "role": "ADMIN",
                "is_staff": True,
                "password": make_password(E2E_PASSWORD),
            },
        )
        if not admin.check_password(E2E_PASSWORD):
            admin.password = make_password(E2E_PASSWORD)
            admin.role = "ADMIN"
            admin.save()

        teacher, _ = CustomUser.objects.get_or_create(
            username="e2e_teacher",
            defaults={
                "email": "e2e_teacher@example.test",
                "role": "TEACHER",
                "password": make_password(E2E_PASSWORD),
            },
        )
        if not teacher.check_password(E2E_PASSWORD):
            teacher.password = make_password(E2E_PASSWORD)
            teacher.role = "TEACHER"
            teacher.save()

        student, _ = CustomUser.objects.get_or_create(
            username="e2e_student",
            defaults={
                "email": "e2e_student@example.test",
                "role": "STUDENT",
                "grade_level": "HIGH",
                "password": make_password(E2E_PASSWORD),
            },
        )
        if not student.check_password(E2E_PASSWORD):
            student.password = make_password(E2E_PASSWORD)
            student.role = "STUDENT"
            student.grade_level = "HIGH"
            student.save()
        # e2e_student'in ön anketi tamamlanmış sayılır — dashboard/unit/game
        # testleri her seferinde /pre-survey'e sapmadan çalışabilsin diye.
        SurveyStatus.objects.update_or_create(
            student=student, survey_type="pre_survey",
            defaults={"is_completed": True, "completed_at": timezone.now()},
        )

        # Ayrı bir öğrenci: kasıtlı olarak ön anketi TAMAMLANMAMIŞ — yalnızca
        # "student + incomplete pre-survey" gate testinde kullanılır (AŞAMA 5
        # madde 30), diğer testlerden bağımsız kalsın diye.
        gated_student, _ = CustomUser.objects.get_or_create(
            username="e2e_student_presurvey",
            defaults={
                "email": "e2e_student_presurvey@example.test",
                "role": "STUDENT",
                "grade_level": "HIGH",
                "password": make_password(E2E_PASSWORD),
            },
        )
        if not gated_student.check_password(E2E_PASSWORD):
            gated_student.password = make_password(E2E_PASSWORD)
            gated_student.role = "STUDENT"
            gated_student.grade_level = "HIGH"
            gated_student.save()
        SurveyStatus.objects.filter(student=gated_student, survey_type="pre_survey").delete()

        unit, _ = Unit.objects.get_or_create(
            title="E2E Test Ünitesi",
            target_grade="HIGH",
            defaults={"order": 1, "badge_name": "E2E Rozeti"},
        )
        subtopic, _ = Subtopic.objects.get_or_create(unit=unit, title="E2E Alt Konu", defaults={"order": 1})
        # drag_drop_needs: en basit/temsili oyun — game lazy-load regresyonunu
        # doğrulamak için yeterli (AŞAMA 5 madde 32 "representative game").
        Content.objects.get_or_create(
            subtopic=subtopic,
            title="E2E Oyunu",
            content_type="GAME",
            defaults={"game_code": "drag_drop_needs", "order": 1},
        )

        self.stdout.write(self.style.SUCCESS(
            f"E2E seed OK — admin={admin.username} teacher={teacher.username} "
            f"student={student.username} unit_id={unit.id}"
        ))
