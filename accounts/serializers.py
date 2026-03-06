from rest_framework import serializers
from .models import CustomUser, Unit, Subtopic, Content, UserProgress

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'grade_level', 'student_code']

# Yeni: İçerikleri (Video/Oyun) JSON'a Çevirici
class ContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Content
        fields = ['id', 'title', 'content_type', 'video_url', 'game_file_path', 'order']

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