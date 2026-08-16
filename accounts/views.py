from rest_framework import viewsets
from .serializers import UserSerializer, UnitSerializer, UserProgressSerializer
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
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import UserSerializer, UnitSerializer, SupportOrganizationSerializer, StudentSupportPreferenceSerializer
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import AllowAny
from django.db.models import Count, Sum, Avg, Q
from django.db import transaction, IntegrityError
from django.utils import timezone
from datetime import timedelta

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer

class UserProgressViewSet(viewsets.ModelViewSet):
    queryset = UserProgress.objects.all()
    serializer_class = UserProgressSerializer

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

def dashboard_view(request):
    # Eğer kullanıcı giriş yapmamışsa login'e at
    if not request.user.is_authenticated:
        return redirect('login')
    
    context = {}
    
    # EĞER GİREN KİŞİ ÖĞRENCİ İSE:
    if request.user.role == 'STUDENT':
        
        # Filtreyi orijinal ve doğru haliyle bırakıyoruz
        student_units = Unit.objects.filter(target_grade=request.user.grade_level)
        context['units'] = student_units
        
        # --- TERMINALE YAZDIRMA (DEBUG) KISMI ---
        print("\n" + "="*30)
        print(f"Giriş Yapan: {request.user.username}")
        print(f"Öğrencinin Veritabanındaki Seviyesi: {request.user.grade_level}")
        print(f"Bulunan Üniteler: {student_units}")
        print("="*30 + "\n")
        # ----------------------------------------
        
    return render(request, 'dashboard.html', context)

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
        
        # --- TERMINALE YAZDIRMA (DEBUG) KISMI ---
        print("\n" + "🌟"*10 + " HATA AYIKLAMA (DEBUG) " + "🌟"*10)
        print(f"Giriş Yapan: {request.user.username}")
        print(f"Öğrencinin Veritabanındaki Seviyesi: {request.user.grade_level}")
        print(f"Filtrelenen Üniteler: {student_units}")
        print("🌟"*25 + "\n")
        # ----------------------------------------
        
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

    units = Unit.objects.filter(target_grade=user.grade_level).order_by('order')
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
        units = Unit.objects.all()
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
            print("Form Hatası:", serializer.errors) # Terminalde hatayı görmek için
            return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_users_view(request):
    # Sadece adminler tüm kullanıcıları görebilir
    if request.user.role != 'ADMIN':
        return Response({'error': 'Yetkiniz yok'}, status=403)
        
    users = CustomUser.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

# Alt Başlık (Subtopic) Ekleme API'si
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_add_subtopic_view(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Yetkiniz yok'}, status=403)
    try:
        unit = Unit.objects.get(id=request.data.get('unitId'))
        subtopic = Subtopic.objects.create(
            unit=unit,
            title=request.data.get('title'),
            order=1
        )
        return Response({'message': 'Alt başlık eklendi!', 'id': subtopic.id}, status=201)
    except Unit.DoesNotExist:
        return Response({'error': 'Ünite bulunamadı.'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

# İçerik (Video/Oyun) Ekleme API'si (GERÇEK DOSYA YÜKLEMELİ)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_add_content_view(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Yetkiniz yok'}, status=403)
    
    data = request.data
    try:
        subtopic = Subtopic.objects.get(id=data.get('subtopicId'))
        video_file = request.FILES.get('video_file')
        game_code = data.get('game_code')

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
    except Exception as e:
        return Response({'error': str(e)}, status=400)
    
    
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
@permission_classes([IsAuthenticated])
def api_subtopic_detail_view(request, pk):
    if request.user.role != 'ADMIN': return Response(status=403)
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
@permission_classes([IsAuthenticated])
def api_content_detail_view(request, pk):
    if request.user.role != 'ADMIN': return Response(status=403)
    content = get_object_or_404(Content, pk=pk)
    
    if request.method == 'PUT':
        content.title = request.data.get('contentTitle', content.title)
        content.content_type = request.data.get('contentType', content.content_type)
        content.video_url = request.data.get('videoUrl', content.video_url)
        # YENİ: Düzenleme yaparken de oyun kodunu güncelle
        content.game_code = request.data.get('game_code', content.game_code)
        content.save()
        return Response({'message': 'İçerik güncellendi'})
        
    elif request.method == 'DELETE':
        content.delete()
        return Response(status=204)
    

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_user_detail_view(request, pk):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Yetkiniz yok'}, status=403)
        
    user_to_delete = get_object_or_404(CustomUser, pk=pk)
    
    # Adminin yanlışlıkla kendisini silmesini engelliyoruz
    if user_to_delete.id == request.user.id:
        return Response({'error': 'Kendinizi silemezsiniz!'}, status=400)
        
    user_to_delete.delete()
    return Response(status=204)

# KULLANICI KAYIT API'Sİ (Hem dışarıdan kayıt hem de Admin panelinden ekleme için)
@api_view(['POST'])
@permission_classes([AllowAny]) # Herkesin kayıt olabilmesi için açık bırakıyoruz
def api_register_view(request):
    data = request.data
    try:
        # Yeni kullanıcıyı veritabanına güvenli şifreleme (make_password) ile ekliyoruz
        user = CustomUser.objects.create(
            username=data.get('email'), # Kullanıcı adını e-posta olarak ayarlıyoruz
            email=data.get('email'),
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            password=make_password(data.get('password')), # Şifreyi kriptoluyoruz
            role=data.get('role', 'STUDENT'),
            grade_level=data.get('grade_level')
        )
        return Response({'message': 'Kullanıcı başarıyla oluşturuldu!', 'user_id': user.id}, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=400)
    

# accounts/views.py dosyasındaki güncel Öğretmen ve Analiz Fonksiyonları

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_classrooms_view(request):
    if request.user.role != 'TEACHER': return Response(status=403)
    
    if request.method == 'GET':
        classrooms = Classroom.objects.filter(teacher=request.user).order_by('-created_at')
        data = []
        for c in classrooms:
            students_data = []
            for s in c.students.all():
                # DÜZELTME: user=s yerine student=s yapıldı
                completed = UserProgress.objects.filter(student=s, is_completed=True).count()
                total = Content.objects.filter(subtopic__unit__target_grade=s.grade_level).count()
                prog = int((completed / total) * 100) if total > 0 else 0
                
                students_data.append({
                    'id': s.id, 'first_name': s.first_name, 'last_name': s.last_name,
                    'student_code': s.student_code, 'progress': prog,
                    'total_score': s.total_score, 'streak_days': s.streak_days,
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
@permission_classes([IsAuthenticated])
def api_student_detail_view(request, student_id):
    if request.user.role != 'TEACHER': return Response(status=403)
    student = get_object_or_404(CustomUser, id=student_id, role='STUDENT')
    
    # DÜZELTME: user=student yerine student=student yapıldı
    completed_qs = UserProgress.objects.filter(student=student, is_completed=True)
    completed_titles = [p.content.title for p in completed_qs if p.content]
    
    # DÜZELTME: user=student yerine student=student yapıldı
    last_prog = UserProgress.objects.filter(student=student).last()
    last_watched = last_prog.content.title if last_prog and last_prog.content else "Henüz bir eğitime başlamadı."
    
    # Kazanılan Rozetler (Eğer ünitedeki tüm içerikler bittiyse)
    earned_badges = []
    units = Unit.objects.filter(target_grade=student.grade_level)
    for unit in units:
        unit_contents = Content.objects.filter(subtopic__unit=unit)
        if unit_contents.exists():
            if completed_qs.filter(content__in=unit_contents).count() == unit_contents.count():
                if unit.badge_name: earned_badges.append(unit.badge_name)
                
    total_contents = Content.objects.filter(subtopic__unit__target_grade=student.grade_level).count()
    progress_percent = int((len(completed_titles) / total_contents) * 100) if total_contents > 0 else 0
    
    return Response({
        'first_name': student.first_name, 'last_name': student.last_name,
        'completed_contents': completed_titles, 'last_watched': last_watched,
        'earned_badges': earned_badges, 'progress_percent': progress_percent
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_analytics_view(request):
    if request.user.role != 'TEACHER':
        return Response({'error': 'Yetkiniz yok'}, status=403)

    classrooms = Classroom.objects.filter(teacher=request.user)
    students = CustomUser.objects.filter(enrolled_classes__in=classrooms, role='STUDENT').distinct()

    if not students.exists():
        return Response([])

    grade_levels = students.values_list('grade_level', flat=True).distinct()
    contents = Content.objects.filter(subtopic__unit__target_grade__in=grade_levels).select_related('subtopic__unit')[:30]

    student_count = students.count()
    result = []
    for content in contents:
        completed = UserProgress.objects.filter(
            student__in=students, content=content, is_completed=True
        ).count()
        rate = round((completed / student_count) * 100) if student_count > 0 else 0
        result.append({
            'content_id': content.id,
            'content_title': content.title,
            'content_type': content.content_type,
            'unit_title': content.subtopic.unit.title,
            'completed_count': completed,
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
    units = Unit.objects.filter(target_grade=user.grade_level)
    for unit in units:
        unit_contents = Content.objects.filter(subtopic__unit=unit)
        if unit_contents.exists():
            done = UserProgress.objects.filter(student=user, content__in=unit_contents, is_completed=True).count()
            if done == unit_contents.count():
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
@permission_classes([IsAuthenticated])
def api_reorder_view(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Yetkiniz yok'}, status=403)
    
    # Hangi listenin sırası değişiyor? (UNIT, SUBTOPIC veya CONTENT)
    item_type = request.data.get('type') 
    # Gelen yeni sıralama listesi. Örn: [{"id": 5, "order": 1}, {"id": 2, "order": 2}]
    items = request.data.get('items', []) 
    
    try:
        for item in items:
            if item_type == 'UNIT':
                Unit.objects.filter(id=item['id']).update(order=item['order'])
            elif item_type == 'SUBTOPIC':
                Subtopic.objects.filter(id=item['id']).update(order=item['order'])
            elif item_type == 'CONTENT':
                Content.objects.filter(id=item['id']).update(order=item['order'])
                
        return Response({'message': 'Sıralama başarıyla kaydedildi!'})
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_admin_report_view(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Yetkiniz yok'}, status=403)

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
    contents = Content.objects.select_related('subtopic__unit').all()
    content_stats = []
    for c in contents:
        prog = UserProgress.objects.filter(content=c, is_completed=True)
        unique_students = prog.count()
        total_plays = prog.aggregate(total=Sum('play_count'))['total'] or 0
        avg = prog.aggregate(avg=Avg('score'))['avg']
        content_stats.append({
            'id': c.id,
            'title': c.title,
            'type': c.content_type,
            'unit': c.subtopic.unit.title,
            'completions': unique_students,
            'play_count': total_plays,
            'avg_score': round(avg, 1) if avg else 0,
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
    top_students = []
    for s in students:
        top_students.append({
            'name': f"{s.first_name} {s.last_name}".strip() or s.username,
            'total_score': s.total_score,
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
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
            timeout=30,
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
@permission_classes([IsAuthenticated])
def api_survey_reset_view(request, survey_type):
    # Yalnızca sistem yöneticileri, test/gerekli durumlarda bir öğrencinin anket
    # sonuçlarını sıfırlayabilir (öğrenci kendi sonucunu asla değiştiremez).
    if request.user.role != 'ADMIN':
        return Response({'error': 'Yetkiniz yok'}, status=403)
    if survey_type not in VALID_SURVEY_TYPES:
        return Response({'error': 'Geçersiz anket tipi.'}, status=400)

    student = get_object_or_404(CustomUser, id=request.data.get('student_id'))
    SurveyResponse.objects.filter(student=student, survey_type=survey_type).delete()
    SurveyStatus.objects.filter(student=student, survey_type=survey_type).delete()

    if survey_type == 'post_survey' and student.program_completed_at:
        student.program_completed_at = None
        student.save(update_fields=['program_completed_at'])

    return Response({'status': 'reset'})


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
@permission_classes([IsAuthenticated])
def api_student_support_preference_view(request):
    if request.user.role != 'STUDENT':
        return Response({'error': 'Yetkiniz yok'}, status=403)

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
@permission_classes([IsAuthenticated])
def api_admin_support_preferences_view(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Yetkiniz yok'}, status=403)

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
@permission_classes([IsAuthenticated])
def api_admin_support_stats_view(request):
    if request.user.role != 'ADMIN':
        return Response({'error': 'Yetkiniz yok'}, status=403)

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