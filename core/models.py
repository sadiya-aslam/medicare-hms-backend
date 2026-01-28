from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError
from django.core.cache import cache
from django.core.validators import RegexValidator
from datetime import timedelta


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)  
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "Admin")  

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)



class User(AbstractUser):
    ROLE_CHOICES = [
        ("Patient", "Patient"),
        ("Doctor", "Doctor"),
        ("Admin", "Admin"),
    ]

    username = None  
    email = models.EmailField(unique=True)

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone_regex = RegexValidator(
    regex=r'^\+?1?\d{9,15}$',
    message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
)


    phone_number = models.CharField(
    validators=[phone_regex],
    max_length=17,
    unique=True,
    null=True,
    blank=True
)
    date_created = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ['first_name', 'last_name']  

    objects = UserManager()

    def __str__(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return f"{full_name} ({self.role})" if full_name else f"{self.email} ({self.role})"



class Notification(models.Model):
    TYPE_CHOICES = [
        ("Email", "Email"),
        ("SMS", "SMS"),
    
    ]

    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Sent", "Sent"),
        ("Failed", "Failed"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    message_body = models.TextField()
    created_time = models.DateTimeField(auto_now_add=True)  
    delivered_time = models.DateTimeField(null=True, blank=True)  
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending", db_index=True)
    is_read = models.BooleanField(default=False, db_index=True)  

    def __str__(self):
        return f"Notification to {self.user.email} - {self.type} ({self.status})"

    class Meta:
        ordering = ["-created_time"] 



class ClinicSettings(models.Model):
    clinic_name = models.CharField(max_length=255, unique=True)
    appointment_lead_time = models.DurationField(default=timedelta(hours=24))  
    cancellation_policy = models.TextField(null=True, blank=True)
    

    def __str__(self):
        return self.clinic_name

    def clean(self):
        if ClinicSettings.objects.exists() and not self.pk:
            raise ValidationError("There can be only one ClinicSettings instance.")
        super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        cache.delete("clinic_settings") 



def get_clinic_settings():
    settings = cache.get("clinic_settings")
    if settings is None:
        settings = ClinicSettings.objects.first()
        cache.set("clinic_settings", settings, timeout=86400)  
    return settings