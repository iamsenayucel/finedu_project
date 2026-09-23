import os
import logging
from django.shortcuts import render, redirect
from django.contrib.auth import login
from .forms import CustomUserCreationForm
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import AuthenticationForm
from .forms import CustomUserCreationForm
from django.shortcuts import render, redirect, get_object_or_404
from .models import (
    CustomUser, Unit, Subtopic, Content, UserProgress, Classroom, UserBadge,
    SurveyResponse, SurveyStatus, SupportOrganization, StudentSupportPreference,
)
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework.authtoken.views import ObtainAuthToken
from .serializers import (
    UserSerializer, UnitSerializer, SupportOrganizationSerializer,
    StudentSupportPreferenceSerializer, RegisterSerializer,
    SubtopicCreateSerializer, ContentCreateSerializer, ContentUpdateSerializer,
    ReorderSerializer,
)
from .permissions import IsAdmin, IsTeacher, IsStudent
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import AllowAny
from django.db.models import Count, Sum, Avg, Q, Prefetch
from django.db import transaction, IntegrityError
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


class LoginRateThrottle(AnonRateThrottle):
    # /api/login/ brute-force koruması. AnonRateThrottle IP'ye (get_ident)
    # göre sınırlar ve yalnızca authenticate OLMAMIŞ istekleri sayar — login
    # denemesi zaten her zaman anonim olduğu için bu tam uyuyor. Oran
    # DEFAULT_THROTTLE_RATES['login'] içinde tanımlı (bkz. settings.py).
    scope = 'login'


class ThrottledObtainAuthToken(ObtainAuthToken):
    # DRF'nin hazır obtain_auth_token view'ı class-based olduğu için
    # @throttle_classes decorator'ı (function-based view'lar için) buraya
    # uygulanamıyor; bu yüzden ince bir alt sınıf ile throttle_classes
    # ekleniyor. Davranışın geri kalanı (kimlik doğrulama, token üretimi)
    # ObtainAuthToken'dan değişmeden miras alınıyor.
    throttle_classes = [LoginRateThrottle]


    # Yeni Kullanıcı Kayıt Sayfası
def register_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Kayıt başarılıysa kullanıcıyı otomatik içeri al ve dashboard'a yönlendir
            login(request, user)
            return redirect('dashboard')
    else:
        form = CustomUserCreationForm()
    
    return render(request, 'register.html', {'form': form})

# Kullanıcı Giriş Sayfası
def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('dashboard')
    else:
        form = AuthenticationForm()
    
    # Form elemanlarına Bootstrap class'ı ekliyoruz
    for field in form.fields:
        form.fields[field].widget.attrs.update({'class': 'form-control'})
        
    return render(request, 'login.html', {'form': form})

# Kullanıcı Çıkış İşlemi
def logout_view(request):
    logout(request)
    return redirect('login') # Çıkış yapınca giriş sayfasına at

def dashboard_view(request):
    # Eğer giriş yapılmamışsa login'e gönder
    if not request.user.is_authenticated:
        return redirect('login')

    context = {}

    # EĞER GİREN KİŞİ ÖĞRENCİ İSE:
    if request.user.role == 'STUDENT':

        # Öğrencinin seviyesine (İlkokul) uygun üniteleri filtrele
        student_units = Unit.objects.filter(target_grade=request.user.grade_level)
        context['units'] = student_units

    return render(request, 'dashboard.html', context)

def unit_detail_view(request, unit_id):
    if not request.user.is_authenticated:
        return redirect('login')
    
    # URL'den gelen ID'ye göre o spesifik üniteyi buluruz
    unit = get_object_or_404(Unit, id=unit_id)
    
    context = {
        'unit': unit,
    }
    return render(request, 'unit_detail.html', context)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_dashboard_api(request):
    user = request.user

    if user.role == 'STUDENT':
        user.update_streak()

    user_data = dict(UserSerializer(user).data)

    user_data['total_score'] = user.total_score
    user_data['earned_badges'] = user.earned_badges
    user_data['streak_days'] = user.streak_days
    user_data['date_joined'] = user.date_joined.strftime('%d.%m.%Y')
    user_data['program_completed_at'] = user.program_completed_at.isoformat() if user.program_completed_at else None

    if user.role == 'STUDENT':
        completed_count = UserProgress.objects.filter(student=user, is_completed=True).count()
        total_count = Content.objects.filter(subtopic__unit__target_grade=user.grade_level).count()
        user_data['completed_count'] = completed_count
        user_data['total_content_count'] = total_count

    units = Unit.objects.filter(target_grade=user.grade_level).order_by('order', 'id').prefetch_related('subtopics__contents')
    units_data = UnitSerializer(units, many=True).data

    return Response({
        'user': user_data,
        'units': units_data
    })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_progress_api(request):
    if request.method == 'GET':
        # Öğrencinin tamamladığı içeriklerin detaylarını (Puanlarıyla birlikte) gönder
        progress_data = UserProgress.objects.filter(student=request.user, is_completed=True).values('content_id', 'score', 'content__title')
        return Response(list(progress_data))
    
    elif request.method == 'POST':
        content_id = request.data.get('content_id')
        new_score = request.data.get('score') # React'ten oyun puanı gelirse al
        
        try:
            content = Content.objects.get(id=content_id)
            unit = content.subtopic.unit
            
            # Öğrencinin bu içerikteki ilerlemesini bul veya yarat
            progress, created = UserProgress.objects.get_or_create(
                student=request.user,
                content=content,
                defaults={'is_completed': True, 'score': new_score}
            )
            
            if not created:
                progress.is_completed = True
                progress.play_count += 1
                # Puan sadece ilk oynayışta kaydedilir
                if progress.score is None and new_score is not None:
                    progress.score = new_score
                progress.save()
                
            # --- ROZET KONTROL SİSTEMİ ---
            # Bu üniteye ait TÜM içerikleri bul
            unit_contents = Content.objects.filter(subtopic__unit=unit)
            # Bu öğrencinin bu ünitede tamamladığı İÇERİKLERİ bul
            completed_unit_contents = UserProgress.objects.filter(
                student=request.user, 
                content__in=unit_contents, 
                is_completed=True
            ).count()
            
            earned_new_badge = False
            # Eğer ünitedeki içerik sayısı, öğrencinin tamamladıklarına eşitse (Ünite BİTTİYSE!)
            if unit_contents.count() > 0 and completed_unit_contents == unit_contents.count():
                # Öğrenciye bu rozeti ver (Eğer zaten yoksa)
                badge, badge_created = UserBadge.objects.get_or_create(
                    student=request.user,
                    unit=unit
                )
                if badge_created:
                    earned_new_badge = True
                    
            # Streak güncelle
            if request.user.role == 'STUDENT':
                request.user.update_streak()

            return Response({
                'status': 'success',
                'content_id': content_id,
                'earned_new_badge': earned_new_badge,
                'streak_days': request.user.streak_days,
            })
            
        except Content.DoesNotExist:
            return Response({'error': 'İçerik bulunamadı.'}, status=404)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_units_view(request):
    # GET: Tüm üniteleri listele
    if request.method == 'GET':
        units = Unit.objects.all().prefetch_related('subtopics__contents')
        serializer = UnitSerializer(units, many=True)
        return Response(serializer.data)
    
    # POST: Yeni ünite ekle
    elif request.method == 'POST':
        if request.user.role != 'ADMIN':
            return Response({'error': 'Yetkiniz yok'}, status=403)

        serializer = UnitSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        else:
            return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAdmin])
def api_users_view(request):
    users = CustomUser.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

# Alt Başlık (Subtopic) Ekleme API'si
@api_view(['POST'])
@permission_classes([IsAdmin])
def api_add_subtopic_view(request):
    serializer = SubtopicCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    data = serializer.validated_data
    try:
        unit = Unit.objects.get(id=data['unitId'])
        subtopic = Subtopic.objects.create(
            unit=unit,
            title=data['title'],
            order=1
        )
        return Response({'message': 'Alt başlık eklendi!', 'id': subtopic.id}, status=201)
    except Unit.DoesNotExist:
        return Response({'error': 'Ünite bulunamadı.'}, status=404)
    except Exception:
        logger.exception('Alt başlık eklenirken beklenmeyen hata oluştu.')
        return Response({'error': 'Alt başlık eklenirken bir hata oluştu.'}, status=400)


# Video yükleme kontratı: mevcut frontend (AdminPanel.tsx) <input type="file">
# için accept="video/mp4,video/x-m4v,video/*" kullanıyor — yani en azından
# mp4/m4v açıkça destekleniyor, "video/*" ile tarayıcı genel video türlerine
# izin veriyor. Ürün için kesin/nihai format listesi başka bir yerde
# belgelenmediğinden, bu genel web-uyumlu (HTML5 <video> ile oynatılabilen)
# formatlarla sınırlı güvenli bir allow-list kullanılıyor. Format desteği
# genişletilmek istenirse bu liste güncellenmelidir (OPEN QUESTION: nihai
# ürün kararı repository dışında netleştirilmeli).
ALLOWED_VIDEO_EXTENSIONS = {'.mp4', '.webm', '.mov', '.m4v'}
ALLOWED_VIDEO_CONTENT_TYPES = {
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v',
}
# 100MB: repository içinde belgelenmiş bir ürün limiti yok (OPEN QUESTION).
# Bu, tipik bir ders videosu için makul ama üst sınıra yakın olmayan,
# muhafazakar bir varsayılan değerdir; kesin değer ürün kararı gerektirir.
MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024


def _validate_video_file(video_file):
    """Geçersizse kullanıcıya gösterilecek hata metnini, geçerliyse None döner.

    NOT: content_type tarayıcı/istemci tarafından bildiriliyor, yani tek
    başına güvenilir bir güvenlik sınırı değil — bu yüzden extension ve
    boyut kontrolüyle birlikte katmanlı olarak kullanılıyor.
    """
    ext = os.path.splitext(video_file.name or '')[1].lower()
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        return 'Desteklenmeyen video formatı. İzin verilenler: ' + ', '.join(sorted(ALLOWED_VIDEO_EXTENSIONS))
    if video_file.content_type not in ALLOWED_VIDEO_CONTENT_TYPES:
        return 'Desteklenmeyen dosya türü.'
    if video_file.size > MAX_VIDEO_UPLOAD_BYTES:
        return f'Dosya çok büyük. Maksimum boyut: {MAX_VIDEO_UPLOAD_BYTES // (1024 * 1024)}MB.'
    return None


# İçerik (Video/Oyun) Ekleme API'si (GERÇEK DOSYA YÜKLEMELİ)
@api_view(['POST'])
@permission_classes([IsAdmin])
def api_add_content_view(request):
    serializer = ContentCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    data = serializer.validated_data
    try:
        subtopic = Subtopic.objects.get(id=data['subtopicId'])
        video_file = request.FILES.get('video_file')
        game_code = data.get('game_code')

        # Backend, frontend validation'ına güvenmez: video_file varsa
        # sunucu tarafında da doğrulanır. Geçersiz dosya durumunda hiçbir
        # Content satırı oluşturulmaz (bkz. AŞAMA 1 upload regression testleri).
        if video_file is not None:
            validation_error = _validate_video_file(video_file)
            if validation_error:
                return Response({'error': validation_error}, status=400)

        Content.objects.create(
            subtopic=subtopic,
            title=data.get('contentTitle'),
            content_type=data.get('contentType'),
            video_file=video_file,
            game_code=game_code,
            order=1
        )
        return Response({'message': 'İçerik başarıyla eklendi!'}, status=201)

    except Subtopic.DoesNotExist:
        return Response({'error': 'Seçilen alt başlık bulunamadı.'}, status=404)
    except Exception:
        logger.exception('İçerik eklenirken beklenmeyen hata oluştu.')
        return Response({'error': 'İçerik eklenirken bir hata oluştu.'}, status=400)
    
    
# Ünite Detay, Düzenleme ve Silme
@api_view(['GET', 'PUT', 'DELETE']) # GET eklendi
@permission_classes([IsAuthenticated])
def api_unit_detail_view(request, pk):
    unit = get_object_or_404(Unit, pk=pk)
    
    # 1. OKUMA (GET): Öğrenci, Öğretmen veya Admin fark etmeksizin herkes okuyabilir
    if request.method == 'GET':
        serializer = UnitSerializer(unit)
        return Response(serializer.data)
        
    # 2. GÜNCELLEME ve SİLME: Sadece ADMIN yapabilir
    if request.user.role != 'ADMIN': 
        return Response({'error': 'Yetkisiz işlem!'}, status=403)
        
    if request.method == 'PUT':
        serializer = UnitSerializer(unit, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
        
    elif request.method == 'DELETE':
        unit.delete()
        return Response(status=204)

# Alt Başlık Düzenleme ve Silme
@api_view(['PUT', 'DELETE'])
@permission_classes([IsAdmin])
def api_subtopic_detail_view(request, pk):
    subtopic = get_object_or_404(Subtopic, pk=pk)

    if request.method == 'PUT':
        subtopic.title = request.data.get('title', subtopic.title)
        subtopic.save()
        return Response({'message': 'Alt başlık güncellendi'})

    elif request.method == 'DELETE':
        subtopic.delete()
        return Response(status=204)

# İçerik Düzenleme ve Silme
@api_view(['PUT', 'DELETE'])
@permission_classes([IsAdmin])
def api_content_detail_view(request, pk):
    content = get_object_or_404(Content, pk=pk)

    if request.method == 'PUT':
        serializer = ContentUpdateSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        data = serializer.validated_data
        if 'contentTitle' in data:
            content.title = data['contentTitle']
        if 'contentType' in data:
            content.content_type = data['contentType']
        # NOT: Content modelinde artık 'video_url' alanı yok (bkz. migration
        # 0004_remove_content_video_url_content_video_file) — video yalnızca
        # video_file üzerinden yönetiliyor. Var olmayan alana yazmak
        # AttributeError/500 üretiyordu, bu satır bu yüzden kaldırıldı.
        # YENİ: Düzenleme yaparken de oyun kodunu güncelle
        if 'game_code' in data:
            content.game_code = data['game_code']
        content.save()
        return Response({'message': 'İçerik güncellendi'})

    elif request.method == 'DELETE':
        content.delete()
        return Response(status=204)


@api_view(['DELETE'])
@permission_classes([IsAdmin])
def api_user_detail_view(request, pk):
    user_to_delete = get_object_or_404(CustomUser, pk=pk)
    
    # Adminin yanlışlıkla kendisini silmesini engelliyoruz
    if user_to_delete.id == request.user.id:
        return Response({'error': 'Kendinizi silemezsiniz!'}, status=400)
        
    user_to_delete.delete()
    return Response(status=204)

# KULLANICI KAYIT API'Sİ (Herkese açık kayıt — yalnızca STUDENT/TEACHER oluşturabilir)
@api_view(['POST'])
@permission_classes([AllowAny]) # Herkesin kayıt olabilmesi için açık bırakıyoruz
def api_register_view(request):
    # Güvenlik: role dahil hiçbir alan request.data'dan ham okunmaz. Role
    # RegisterSerializer.PUBLIC_ROLES ile sınırlıdır — bu uç noktadan asla
    # ADMIN hesabı oluşturulamaz.
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        first_error = next(iter(serializer.errors.values()))[0]
        return Response({'error': str(first_error)}, status=400)

    validated = serializer.validated_data
    try:
        # Yeni kullanıcıyı veritabanına güvenli şifreleme (make_password) ile ekliyoruz
        user = CustomUser.objects.create(
            username=validated['email'], # Kullanıcı adını e-posta olarak ayarlıyoruz
            email=validated['email'],
            first_name=validated.get('first_name', ''),
            last_name=validated.get('last_name', ''),
            password=make_password(validated['password']), # Şifreyi kriptoluyoruz
            role=validated['role'],
            grade_level=validated.get('grade_level'),
        )
        return Response({'message': 'Kullanıcı başarıyla oluşturuldu!', 'user_id': user.id}, status=201)
    except Exception:
        # Örn. e-posta zaten kayıtlıysa (username=email üzerinden unique
        # constraint) burada IntegrityError yakalanır — ham DB hata metni
        # (ör. "UNIQUE constraint failed: ...") istemciye asla sızdırılmaz.
        logger.exception('Kullanıcı kaydı sırasında beklenmeyen hata oluştu.')
        return Response({'error': 'Kayıt işlemi gerçekleştirilemedi.'}, status=400)
    

# accounts/views.py dosyasındaki güncel Öğretmen ve Analiz Fonksiyonları

@api_view(['GET', 'POST'])
@permission_classes([IsTeacher])
def api_classrooms_view(request):
    if request.method == 'GET':
        # N+1 fix (AŞAMA 4, MEASURED: 3 öğrenci=12 sorgu, 20 öğrenci=63 sorgu
        # — öğrenci başına 3 sorgu: completed count, grade seviyesine göre
        # toplam içerik sayısı, total_score). Öğrenci başına sorgu yerine:
        # - completed/total_score tek annotate edilmiş prefetch sorgusunda,
        # - grade_level başına toplam içerik sayısı yalnızca bir kez
        #   hesaplanıp (aynı seviyedeki tüm öğrenciler arasında paylaşılıp)
        #   önbelleğe alınıyor.
        classrooms = list(
            Classroom.objects.filter(teacher=request.user).order_by('-created_at').prefetch_related(
                Prefetch(
                    'students',
                    queryset=CustomUser.objects.annotate(
                        completed_count=Count('userprogress', filter=Q(userprogress__is_completed=True), distinct=True),
                        computed_total_score=Sum('userprogress__score'),
                    ),
                )
            )
        )

        grade_levels = {s.grade_level for c in classrooms for s in c.students.all()}
        content_count_by_grade = {
            grade: Content.objects.filter(subtopic__unit__target_grade=grade).count()
            for grade in grade_levels
        }

        data = []
        for c in classrooms:
            students_data = []
            for s in c.students.all():
                total = content_count_by_grade.get(s.grade_level, 0)
                prog = int((s.completed_count / total) * 100) if total > 0 else 0

                students_data.append({
                    'id': s.id, 'first_name': s.first_name, 'last_name': s.last_name,
                    'student_code': s.student_code, 'progress': prog,
                    'total_score': s.computed_total_score or 0, 'streak_days': s.streak_days,
                })
            data.append({'id': c.id, 'name': c.name, 'grade_level': c.grade_level, 'students': students_data})
        return Response(data)
        
    elif request.method == 'POST':
        Classroom.objects.create(name=request.data.get('name'), grade_level=request.data.get('grade_level'), teacher=request.user)
        return Response({'message': 'Sınıf oluşturuldu!'}, status=201)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_add_student_to_class(request, pk):
    classroom = get_object_or_404(Classroom, pk=pk, teacher=request.user)
    try:
        student = CustomUser.objects.get(student_code=request.data.get('student_code'), role='STUDENT')
        classroom.students.add(student)
        return Response({'message': f'{student.first_name} sınıfa başarıyla eklendi!'})
    except CustomUser.DoesNotExist:
        return Response({'error': 'Bu koda sahip bir öğrenci bulunamadı.'}, status=404)

@api_view(['GET'])
@permission_classes([IsTeacher])
def api_student_detail_view(request, student_id):
    # Ownership zorunlu: teacher yalnızca kendi classroom'una kayıtlı
    # öğrencinin detayını görebilir (bkz. api_add_student_to_class'taki
    # aynı desen — Classroom.teacher=request.user).
    student = get_object_or_404(
        CustomUser.objects.filter(role='STUDENT', enrolled_classes__teacher=request.user).distinct(),
        id=student_id,
    )
    
    # DÜZELTME: user=student yerine student=student yapıldı
    completed_qs = UserProgress.objects.filter(student=student, is_completed=True)
    completed_titles = [p.content.title for p in completed_qs if p.content]
    
    # DÜZELTME: user=student yerine student=student yapıldı
    last_prog = UserProgress.objects.filter(student=student).last()
    last_watched = last_prog.content.title if last_prog and last_prog.content else "Henüz bir eğitime başlamadı."
    
    # Kazanılan Rozetler (Eğer ünitedeki tüm içerikler bittiyse)
    earned_badges = []
    completed_content_ids = set(completed_qs.values_list('content_id', flat=True))
    units = Unit.objects.filter(target_grade=student.grade_level).prefetch_related('subtopics__contents')
    for unit in units:
        unit_content_ids = [c.id for s in unit.subtopics.all() for c in s.contents.all()]
        if unit_content_ids and all(cid in completed_content_ids for cid in unit_content_ids):
            if unit.badge_name: earned_badges.append(unit.badge_name)
                
    total_contents = Content.objects.filter(subtopic__unit__target_grade=student.grade_level).count()
    progress_percent = int((len(completed_titles) / total_contents) * 100) if total_contents > 0 else 0
    
    return Response({
        'first_name': student.first_name, 'last_name': student.last_name,
        'completed_contents': completed_titles, 'last_watched': last_watched,
        'earned_badges': earned_badges, 'progress_percent': progress_percent
    })

@api_view(['GET'])
@permission_classes([IsTeacher])
def api_analytics_view(request):
    classrooms = Classroom.objects.filter(teacher=request.user)
    students = CustomUser.objects.filter(enrolled_classes__in=classrooms, role='STUDENT').distinct()

    if not students.exists():
        return Response([])

    grade_levels = students.values_list('grade_level', flat=True).distinct()
    contents = Content.objects.filter(subtopic__unit__target_grade__in=grade_levels).select_related('subtopic__unit').annotate(
        completed=Count('userprogress', filter=Q(userprogress__student__in=students, userprogress__is_completed=True))
    )[:30]

    student_count = students.count()
    result = []
    for content in contents:
        rate = round((content.completed / student_count) * 100) if student_count > 0 else 0
        result.append({
            'content_id': content.id,
            'content_title': content.title,
            'content_type': content.content_type,
            'unit_title': content.subtopic.unit.title,
            'completed_count': content.completed,
            'total_students': student_count,
            'completion_rate': rate,
        })

    result.sort(key=lambda x: x['completion_rate'])
    return Response(result[:15])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_profile_view(request):
    user = request.user
    completed_count = UserProgress.objects.filter(student=user, is_completed=True).count()
    total_count = Content.objects.filter(subtopic__unit__target_grade=user.grade_level).count()
    completed_units = 0
    completed_content_ids = set(UserProgress.objects.filter(student=user, is_completed=True).values_list('content_id', flat=True))
    units = Unit.objects.filter(target_grade=user.grade_level).prefetch_related('subtopics__contents')
    for unit in units:
        unit_content_ids = [c.id for s in unit.subtopics.all() for c in s.contents.all()]
        if unit_content_ids and all(cid in completed_content_ids for cid in unit_content_ids):
            completed_units += 1

    return Response({
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'role': user.role,
        'grade_level': user.grade_level,
        'student_code': user.student_code,
        'total_score': user.total_score,
        'earned_badges': user.earned_badges,
        'streak_days': user.streak_days,
        'date_joined': user.date_joined.strftime('%d.%m.%Y'),
        'completed_count': completed_count,
        'total_content_count': total_count,
        'completed_units': completed_units,
        'total_units': units.count(),
    })


@api_view(['POST'])
@permission_classes([IsAdmin])
def api_reorder_view(request):
    serializer = ReorderSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    item_type = serializer.validated_data['type']
    items = serializer.validated_data['items']
    model_by_type = {'UNIT': Unit, 'SUBTOPIC': Subtopic, 'CONTENT': Content}
    model = model_by_type[item_type]

    try:
        for item in items:
            model.objects.filter(id=item['id']).update(order=item['order'])
        return Response({'message': 'Sıralama başarıyla kaydedildi!'})
    except Exception:
        logger.exception('Sıralama kaydedilirken beklenmeyen hata oluştu.')
        return Response({'error': 'Sıralama kaydedilirken bir hata oluştu.'}, status=400)


@api_view(['GET'])
@permission_classes([IsAdmin])
def api_admin_report_view(request):
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)

    students = CustomUser.objects.filter(role='STUDENT')
    total_students = students.count()
    active_this_week = students.filter(last_activity_date__gte=week_ago).count()

    all_progress = UserProgress.objects.filter(is_completed=True)
    total_completions = all_progress.count()
    avg_score = all_progress.aggregate(avg=Avg('score'))['avg']
    avg_score = round(avg_score, 1) if avg_score else 0

    # --- Son 7 günlük aktivite ---
    daily_activity = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = UserProgress.objects.filter(
            is_completed=True,
            date_completed__date=day
        ).count()
        daily_activity.append({'date': day.strftime('%d.%m'), 'count': count})

    # --- İçerik performansı (tüm içerikler) ---
    # N+1 fix (AŞAMA 4, MEASURED): önceki hali her Content için 3 ayrı sorgu
    # (count + Sum aggregate + Avg aggregate) çalıştırıyordu. Aynı üç değer
    # artık tek bir annotate edilmiş sorguda hesaplanıyor — sonuç kontratı
    # (content_stats öğelerinin alanları/anlamı) değişmedi.
    contents = Content.objects.select_related('subtopic__unit').annotate(
        completions=Count('userprogress', filter=Q(userprogress__is_completed=True), distinct=True),
        play_count=Sum('userprogress__play_count', filter=Q(userprogress__is_completed=True)),
        avg_score_raw=Avg('userprogress__score', filter=Q(userprogress__is_completed=True)),
    )
    content_stats = []
    for c in contents:
        content_stats.append({
            'id': c.id,
            'title': c.title,
            'type': c.content_type,
            'unit': c.subtopic.unit.title,
            'completions': c.completions,
            'play_count': c.play_count or 0,
            'avg_score': round(c.avg_score_raw, 1) if c.avg_score_raw else 0,
        })
    content_stats.sort(key=lambda x: x['completions'], reverse=True)

    # --- Risk altındaki öğrenciler (7+ gün inaktif veya hiç giriş yapmamış) ---
    at_risk = students.filter(
        last_activity_date__lt=week_ago
    ).values('id', 'first_name', 'last_name', 'email', 'last_activity_date', 'grade_level')
    never_active = students.filter(last_activity_date__isnull=True).values(
        'id', 'first_name', 'last_name', 'email', 'last_activity_date', 'grade_level'
    )

    at_risk_list = []
    for s in list(at_risk) + list(never_active):
        last = s['last_activity_date']
        at_risk_list.append({
            'id': s['id'],
            'name': f"{s['first_name']} {s['last_name']}".strip() or s['email'],
            'email': s['email'],
            'grade_level': s['grade_level'],
            'last_active': last.strftime('%d.%m.%Y') if last else 'Hiç giriş yapmadı',
            'days_inactive': (today - last).days if last else None,
        })
    at_risk_list.sort(key=lambda x: (x['days_inactive'] is None, x['days_inactive'] or 999), reverse=True)

    # --- Sınıf seviyesi dağılımı ---
    grade_dist = list(
        students.values('grade_level')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    grade_labels = {
        'PRIMARY': 'İlkokul', 'MIDDLE': 'Ortaokul', 'HIGH': 'Lise',
        'UNIVERSITY_FINANCE': 'Üniversite (Finans)', 'UNIVERSITY_GENERAL': 'Üniversite (Genel)',
        None: 'Belirtilmemiş',
    }
    for g in grade_dist:
        g['label'] = grade_labels.get(g['grade_level'], g['grade_level'])

    # --- Top 10 öğrenci ---
    # N+1 fix (AŞAMA 4, MEASURED): `s.total_score` property'si her öğrenci
    # için ayrı bir aggregate sorgusu çalıştırıyordu. CustomUser.total_score
    # ile birebir aynı hesaplama (is_completed filtresi yok, bkz. models.py)
    # artık tek bir annotate edilmiş sorguda yapılıyor.
    top_students = []
    for s in students.annotate(computed_total_score=Sum('userprogress__score')):
        top_students.append({
            'name': f"{s.first_name} {s.last_name}".strip() or s.username,
            'total_score': s.computed_total_score or 0,
            'streak_days': s.streak_days,
            'grade_level': grade_labels.get(s.grade_level, s.grade_level),
        })
    top_students.sort(key=lambda x: x['total_score'], reverse=True)
    top_students = top_students[:10]

    return Response({
        'summary': {
            'total_students': total_students,
            'active_this_week': active_this_week,
            'total_completions': total_completions,
            'avg_score': avg_score,
        },
        'daily_activity': daily_activity,
        'content_stats': content_stats[:20],
        'at_risk': at_risk_list[:20],
        'grade_distribution': grade_dist,
        'top_students': top_students,
    })


class ChatbotRateThrottle(UserRateThrottle):
    scope = 'chatbot'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([ChatbotRateThrottle])
def api_chatbot_view(request):
    import requests as http_requests
    import os

    message = request.data.get('message', '').strip()
    if not message:
        return Response({'error': 'Mesaj boş olamaz.'}, status=400)

    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return Response({'error': 'API yapılandırma hatası.'}, status=500)

    system_prompt = (
        "Sen FinEdu'nun yapay zeka asistanısın. FinEdu, Türk öğrencilere finansal okuryazarlık "
        "öğreten bir eğitim platformudur.\n\n"
        "Görevin:\n"
        "- Finansal kavramları (bütçe, tasarruf, yatırım, enflasyon, faiz vb.) Türkçe olarak "
        "sade ve anlaşılır şekilde açıklamak\n"
        "- Platformdaki oyunlar ve eğitim içerikleri hakkında yardımcı olmak\n"
        "- Öğrencileri finansal konularda bilinçlendirmek\n"
        "- Kısa, net ve yaşa uygun cevaplar vermek\n\n"
        "Her zaman Türkçe yanıt ver. Finansal eğitim dışındaki konularda şunu söyle: "
        "'Üzgünüm, yalnızca finansal eğitim konularında yardımcı olabilirim.'"
    )

    try:
        resp = http_requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'model': 'gpt-4o-mini',
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': message},
                ],
                'max_tokens': 400,
                'temperature': 0.7,
            },
            timeout=15,
        )

        if resp.status_code != 200:
            return Response({'error': 'AI servisine ulaşılamadı.'}, status=502)

        reply = resp.json()['choices'][0]['message']['content']
        return Response({'reply': reply})

    except http_requests.Timeout:
        return Response({'error': 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.'}, status=504)
    except Exception:
        return Response({'error': 'Beklenmeyen bir hata oluştu.'}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def api_health_view(request):
    return Response({'status': 'ok'})


# --- ÖN ANKET / SON ANKET API'LERİ ---

VALID_SURVEY_TYPES = {choice[0] for choice in SurveyResponse.SURVEY_TYPE_CHOICES}
PRE_SURVEY_QUESTION_COUNT = 12
POST_SURVEY_QUESTION_COUNT = 12
SURVEY_QUESTION_COUNTS = {
    'pre_survey': PRE_SURVEY_QUESTION_COUNT,
    'post_survey': POST_SURVEY_QUESTION_COUNT,
}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_survey_status_view(request, survey_type):
    if survey_type not in VALID_SURVEY_TYPES:
        return Response({'error': 'Geçersiz anket tipi.'}, status=400)

    status_obj = SurveyStatus.objects.filter(student=request.user, survey_type=survey_type).first()
    answers = SurveyResponse.objects.filter(student=request.user, survey_type=survey_type).values('question_id', 'selected_option')
    answers_map = {a['question_id']: a['selected_option'] for a in answers}

    return Response({
        'survey_type': survey_type,
        'is_completed': status_obj.is_completed if status_obj else False,
        'completed_at': status_obj.completed_at.isoformat() if status_obj and status_obj.completed_at else None,
        'answers': answers_map,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_survey_answer_view(request, survey_type):
    if survey_type not in VALID_SURVEY_TYPES:
        return Response({'error': 'Geçersiz anket tipi.'}, status=400)

    status_obj = SurveyStatus.objects.filter(student=request.user, survey_type=survey_type).first()
    if status_obj and status_obj.is_completed:
        return Response({'error': 'Bu anket zaten tamamlandı, cevaplar değiştirilemez.'}, status=400)

    question_id = request.data.get('question_id')
    selected_option = request.data.get('selected_option')
    if not question_id or not selected_option:
        return Response({'error': 'question_id ve selected_option zorunludur.'}, status=400)

    SurveyResponse.objects.update_or_create(
        student=request.user,
        survey_type=survey_type,
        question_id=question_id,
        defaults={'selected_option': selected_option},
    )
    return Response({'status': 'saved', 'question_id': question_id, 'selected_option': selected_option})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_survey_complete_view(request, survey_type):
    if survey_type not in VALID_SURVEY_TYPES:
        return Response({'error': 'Geçersiz anket tipi.'}, status=400)

    status_obj, _ = SurveyStatus.objects.get_or_create(student=request.user, survey_type=survey_type)
    if status_obj.is_completed:
        return Response({'status': 'already_completed'})

    answered_count = SurveyResponse.objects.filter(student=request.user, survey_type=survey_type).count()
    required_count = SURVEY_QUESTION_COUNTS.get(survey_type)
    if required_count is not None and answered_count < required_count:
        return Response({'error': 'Tüm sorular cevaplanmadan anket tamamlanamaz.'}, status=400)

    status_obj.is_completed = True
    status_obj.completed_at = timezone.now()
    status_obj.save()

    # Son Anket (post_survey) tamamlandığında, öğrencinin FinEdu programını
    # bitirdiğini sistemde kalıcı olarak kaydet (gelecekteki ön/son anket
    # karşılaştırma ve gelişim analizleri için).
    if survey_type == 'post_survey' and not request.user.program_completed_at:
        request.user.program_completed_at = timezone.now()
        request.user.save(update_fields=['program_completed_at'])

    return Response({'status': 'completed'})


@api_view(['POST'])
@permission_classes([IsAdmin])
def api_survey_reset_view(request, survey_type):
    # Yalnızca sistem yöneticileri, test/gerekli durumlarda bir öğrencinin anket
    # sonuçlarını sıfırlayabilir (öğrenci kendi sonucunu asla değiştiremez).
    if survey_type not in VALID_SURVEY_TYPES:
        return Response({'error': 'Geçersiz anket tipi.'}, status=400)

    student = get_object_or_404(CustomUser, id=request.data.get('student_id'))
    SurveyResponse.objects.filter(student=student, survey_type=survey_type).delete()
    SurveyStatus.objects.filter(student=student, survey_type=survey_type).delete()

    if survey_type == 'post_survey' and student.program_completed_at:
        student.program_completed_at = None
        student.save(update_fields=['program_completed_at'])

    return Response({'status': 'reset'})


@api_view(['GET'])
@permission_classes([IsAdmin])
def api_admin_survey_results_view(request, survey_type):
    if survey_type not in VALID_SURVEY_TYPES:
        return Response({'error': 'Geçersiz anket tipi.'}, status=400)

    statuses = SurveyStatus.objects.filter(survey_type=survey_type).select_related('student')

    student_query = request.query_params.get('student')
    if student_query:
        statuses = statuses.filter(
            Q(student__first_name__icontains=student_query) |
            Q(student__last_name__icontains=student_query) |
            Q(student__email__icontains=student_query) |
            Q(student__student_code__icontains=student_query)
        )

    grade_level = request.query_params.get('grade_level')
    if grade_level:
        statuses = statuses.filter(student__grade_level=grade_level)

    completed_only = request.query_params.get('completed_only')
    if completed_only == 'true':
        statuses = statuses.filter(is_completed=True)

    statuses = statuses.order_by('-completed_at')

    try:
        page = max(1, int(request.query_params.get('page', 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        page_size = min(100, max(1, int(request.query_params.get('page_size', 20))))
    except (TypeError, ValueError):
        page_size = 20

    total_count = statuses.count()
    start = (page - 1) * page_size
    page_items = list(statuses[start:start + page_size])

    responses = SurveyResponse.objects.filter(
        survey_type=survey_type,
        student_id__in=[s.student_id for s in page_items],
    ).values('student_id', 'question_id', 'selected_option')
    answers_by_student: dict = {}
    for r in responses:
        answers_by_student.setdefault(r['student_id'], {})[r['question_id']] = r['selected_option']

    results = [{
        'student_id': s.student_id,
        'student_name': f"{s.student.first_name} {s.student.last_name}".strip() or s.student.username,
        'student_email': s.student.email,
        'student_code': s.student.student_code,
        'grade_level': s.student.grade_level,
        'is_completed': s.is_completed,
        'completed_at': s.completed_at.isoformat() if s.completed_at else None,
        'answers': answers_by_student.get(s.student_id, {}),
    } for s in page_items]

    return Response({
        'results': results,
        'count': total_count,
        'page': page,
        'page_size': page_size,
        'total_pages': (total_count + page_size - 1) // page_size if total_count else 0,
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def api_admin_survey_stats_view(request, survey_type):
    if survey_type not in VALID_SURVEY_TYPES:
        return Response({'error': 'Geçersiz anket tipi.'}, status=400)

    total_started = SurveyStatus.objects.filter(survey_type=survey_type).count()
    total_completed = SurveyStatus.objects.filter(survey_type=survey_type, is_completed=True).count()

    completed_student_ids = SurveyStatus.objects.filter(
        survey_type=survey_type, is_completed=True
    ).values_list('student_id', flat=True)

    option_counts = (
        SurveyResponse.objects
        .filter(survey_type=survey_type, student_id__in=completed_student_ids)
        .values('question_id', 'selected_option')
        .annotate(count=Count('id'))
        .order_by('question_id', 'selected_option')
    )

    by_question: dict = {}
    for row in option_counts:
        by_question.setdefault(row['question_id'], []).append({
            'option': row['selected_option'],
            'count': row['count'],
        })

    return Response({
        'survey_type': survey_type,
        'total_started': total_started,
        'total_completed': total_completed,
        'by_question': by_question,
    })


# --- DEĞERLER KÖPRÜSÜ / SOSYAL SORUMLULUK TERCİHİ API'LERİ ---
# ÖNEMLİ: Bu modül gerçek bağış veya ödeme içermez. Öğrenci yalnızca
# "hangi kurumu desteklemek isterdim" sorusuna cevap veren bir tercih kaydeder.

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_support_organizations_view(request):
    organizations = SupportOrganization.objects.filter(is_active=True)
    serializer = SupportOrganizationSerializer(organizations, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PUT'])
@permission_classes([IsStudent])
def api_student_support_preference_view(request):
    if request.method == 'GET':
        current = StudentSupportPreference.objects.filter(student=request.user, is_active=True).select_related('organization').first()
        if not current:
            return Response({'preference': None})
        return Response({'preference': StudentSupportPreferenceSerializer(current).data})

    # PUT: tercih oluştur / değiştir
    organization_id = request.data.get('organization_id')
    if not organization_id:
        return Response({'error': 'organization_id zorunludur.'}, status=400)

    try:
        organization = SupportOrganization.objects.get(id=organization_id, is_active=True)
    except SupportOrganization.DoesNotExist:
        return Response({'error': 'Geçersiz veya pasif kurum.'}, status=400)

    try:
        with transaction.atomic():
            current = StudentSupportPreference.objects.select_for_update().filter(
                student=request.user, is_active=True
            ).first()

            if current and current.organization_id == organization.id:
                return Response({'preference': StudentSupportPreferenceSerializer(current).data})

            if current:
                current.is_active = False
                current.save(update_fields=['is_active'])

            new_preference = StudentSupportPreference.objects.create(
                student=request.user, organization=organization, is_active=True
            )
    except IntegrityError:
        return Response({'error': 'Tercih az önce güncellendi, lütfen tekrar deneyin.'}, status=409)

    return Response({'preference': StudentSupportPreferenceSerializer(new_preference).data})


@api_view(['GET'])
@permission_classes([IsAdmin])
def api_admin_support_preferences_view(request):
    preferences = StudentSupportPreference.objects.filter(is_active=True).select_related('student', 'organization')

    organization_id = request.query_params.get('organization')
    if organization_id:
        preferences = preferences.filter(organization_id=organization_id)

    student_query = request.query_params.get('student')
    if student_query:
        preferences = preferences.filter(
            Q(student__first_name__icontains=student_query) |
            Q(student__last_name__icontains=student_query) |
            Q(student__email__icontains=student_query) |
            Q(student__student_code__icontains=student_query)
        )

    date_from = request.query_params.get('date_from')
    if date_from:
        preferences = preferences.filter(selected_at__date__gte=date_from)

    date_to = request.query_params.get('date_to')
    if date_to:
        preferences = preferences.filter(selected_at__date__lte=date_to)

    try:
        page = max(1, int(request.query_params.get('page', 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        page_size = min(100, max(1, int(request.query_params.get('page_size', 20))))
    except (TypeError, ValueError):
        page_size = 20

    total_count = preferences.count()
    start = (page - 1) * page_size
    page_items = preferences[start:start + page_size]

    results = [{
        'id': p.id,
        'student_id': p.student_id,
        'student_name': f"{p.student.first_name} {p.student.last_name}".strip() or p.student.username,
        'student_email': p.student.email,
        'grade_level': p.student.grade_level,
        'organization_id': p.organization_id,
        'organization_name': p.organization.name,
        'selected_at': p.selected_at.isoformat(),
    } for p in page_items]

    return Response({
        'results': results,
        'count': total_count,
        'page': page,
        'page_size': page_size,
        'total_pages': (total_count + page_size - 1) // page_size if total_count else 0,
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def api_admin_support_stats_view(request):
    active_preferences = StudentSupportPreference.objects.filter(is_active=True)
    total_students = active_preferences.count()

    org_counts = dict(
        active_preferences.values_list('organization_id').annotate(count=Count('id')).values_list('organization_id', 'count')
    )

    organizations = SupportOrganization.objects.filter(is_active=True)
    by_organization = []
    for org in organizations:
        count = org_counts.get(org.id, 0)
        percentage = round((count / total_students) * 100, 1) if total_students else 0
        by_organization.append({
            'organization_id': org.id,
            'organization_name': org.name,
            'count': count,
            'percentage': percentage,
        })

    return Response({
        'total_students_with_preference': total_students,
        'by_organization': by_organization,
    })