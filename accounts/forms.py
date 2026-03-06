from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser

class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ('username', 'email', 'first_name', 'last_name', 'role', 'grade_level')
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # HTML tarafında güzel görünmesi için Bootstrap sınıfları ekliyoruz
        for field in self.fields:
            self.fields[field].widget.attrs.update({'class': 'form-control'})