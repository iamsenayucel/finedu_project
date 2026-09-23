from rest_framework import serializers
from .models import CustomUser, Unit, Subtopic, Content, UserProgress, SupportOrganization, StudentSupportPreference

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'grade_level', 'student_code']


class RegisterSerializer(serializers.Serializer):
    # Public kayıt yalnızca STUDENT/TEACHER oluşturabilir. ADMIN buradan asla
    # üretilemez (bkz. production security audit — privilege escalation fix).
    PUBLIC_ROLES = ('STUDENT', 'TEACHER')

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True, default='')
    last_name = serializers.CharField(required=False, allow_blank=True, default='')
    role = serializers.ChoiceField(choices=PUBLIC_ROLES, default='STUDENT')
    grade_level = serializers.ChoiceField(
        choices=CustomUser.GRADE_CHOICES, required=False, allow_null=True, default=None
    )


class ContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        # DİKKAT: 'video_file' buraya eklendi!
        fields = ['id', 'title', 'content_type', 'video_file', 'game_file_path', 'order', 'game_code']

# Yeni: Alt Başlıkları JSON'a Çevirici
class SubtopicSerializer(serializers.ModelSerializer):
    contents = ContentSerializer(many=True, read_only=True) # İçerikleri alt başlığa bağladık
    class Meta:
        model = Subtopic
        fields = ['id', 'title', 'order', 'contents']

# Güncellenmiş Ünite Çevirici
class UnitSerializer(serializers.ModelSerializer):
    subtopics = SubtopicSerializer(many=True, read_only=True) # Alt başlıkları üniteye bağladık
    class Meta:
        model = Unit
        fields = ['id', 'title', 'target_grade', 'badge_name', 'badge_image', 'subtopics']

class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = ['id', 'student', 'content', 'is_completed', 'score', 'date_completed']


# --- WRITE ENDPOINT INPUT CONTRACT'LARI ---
# Bu serializer'lar business logic taşımaz; yalnızca ilgili view'ın kabul
# ettiği alanları, tiplerini ve (varsa) choice kısıtlarını doğrulanabilir
# hale getirir. Asıl akış (nesne oluşturma/güncelleme, 404/403 kararları)
# view içinde, öncekiyle aynı şekilde kalır.

class SubtopicCreateSerializer(serializers.Serializer):
    unitId = serializers.IntegerField()
    title = serializers.CharField(max_length=200)


class ContentCreateSerializer(serializers.Serializer):
    subtopicId = serializers.IntegerField()
    contentTitle = serializers.CharField(max_length=200)
    contentType = serializers.ChoiceField(choices=Content.CONTENT_TYPES)
    # game_code isteğe bağlı: VIDEO içerikte gönderilmeyebilir/boş gönderilebilir.
    game_code = serializers.ChoiceField(
        choices=Content.GAME_CHOICES, required=False, allow_null=True, allow_blank=True,
    )


class ContentUpdateSerializer(serializers.Serializer):
    # PUT burada halihazırda kısmi güncelleme gibi davranıyor (yalnızca
    # gönderilen alanlar değişir) — bu davranış korunuyor, tüm alanlar
    # isteğe bağlı bırakıldı.
    contentTitle = serializers.CharField(max_length=200, required=False)
    contentType = serializers.ChoiceField(choices=Content.CONTENT_TYPES, required=False)
    game_code = serializers.ChoiceField(
        choices=Content.GAME_CHOICES, required=False, allow_null=True, allow_blank=True,
    )


class ReorderItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    order = serializers.IntegerField()


class ReorderSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=['UNIT', 'SUBTOPIC', 'CONTENT'])
    # Boş/eksik 'items' önceki davranışta no-op (200) sayılıyordu; bu
    # davranış korunuyor.
    items = ReorderItemSerializer(many=True, required=False, default=list)


class SupportOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportOrganization
        fields = ['id', 'name', 'description', 'impact_text', 'logo_url', 'display_order']


class StudentSupportPreferenceSerializer(serializers.ModelSerializer):
    organization = SupportOrganizationSerializer(read_only=True)

    class Meta:
        model = StudentSupportPreference
        fields = ['id', 'organization', 'selected_at']