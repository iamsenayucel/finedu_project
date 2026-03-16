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
from .models import CustomUser, Unit, Subtopic, Content, UserProgress, Classroom
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import UserSerializer, UnitSerializer
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import AllowAny
from django.db.models import Count

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
@permission_classes([IsAuthenticated]) # Sadece giriş yapmış (Token'ı olan) kişiler görebilir
def current_user_dashboard_api(request):
    user = request.user
    
    # 1. Kullanıcı bilgilerini JSON'a çevir
    user_data = UserSerializer(user).data
    
    # 2. Sadece bu öğrencinin seviyesine (İlkokul vb.) uygun üniteleri bul ve JSON'a çevir
    units = Unit.objects.filter(target_grade=user.grade_level)
    units_data = UnitSerializer(units, many=True).data
    
    # İkisini paketleyip React'a gönder
    return Response({
        'user': user_data,
        'units': units_data
    })

from .models import Content, UserProgress

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_progress_api(request):
    # GET: Öğrencinin daha önce tamamladığı tüm içeriklerin ID'lerini liste olarak gönder
    if request.method == 'GET':
        completed_ids = UserProgress.objects.filter(student=request.user, is_completed=True).values_list('content_id', flat=True)
        return Response(list(completed_ids))
    
    # POST: Öğrenci "Videoyu Bitirdim" butonuna bastığında o içeriği tamamlandı olarak işaretle
    elif request.method == 'POST':
        content_id = request.data.get('content_id')
        try:
            content = Content.objects.get(id=content_id)
            progress, created = UserProgress.objects.get_or_create(
                student=request.user,
                content=content,
                defaults={'is_completed': True}
            )
            if not created:
                progress.is_completed = True
                progress.save()
            return Response({'status': 'success', 'content_id': content_id})
        except Content.DoesNotExist:
            return Response({'error': 'İçerik bulunamadı.'}, status=404)
        
# accounts/views.py dosyasının EN ALTINA ekle:

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
                    'student_code': s.student_code, 'progress': prog
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