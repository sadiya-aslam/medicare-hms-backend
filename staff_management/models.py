from django.db import models

# Create your models here.
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from datetime import date
from datetime import time 
from core.models import User  


class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    qualification = models.CharField(max_length=100, null=True, blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    consultation_fee = models.DecimalField(max_digits=6, decimal_places=2, default=200.00)
    bio = models.TextField(blank=True, null=True)

    def clean(self):
    
        if self.user.role != 'Doctor':
            raise ValidationError("The selected user must have the 'Doctor' role.")
        
        if self.consultation_fee < 0:
            raise ValidationError("Consultation fee cannot be negative.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Dr. {self.user.get_full_name() or self.user.username}"

    def is_available_on(self, check_date):
        
        day_name = check_date.strftime("%A")  
        has_schedule = self.schedules.filter(
            day_of_week=day_name, 
            is_closed=False
        ).exists()
        
        if not has_schedule:
            return False 
        on_leave = self.leaves.filter(start_date__lte=check_date, end_date__gte=check_date).exists()
        if on_leave:
            return False 

        return True





 

class Schedule(models.Model):
    
    DAYS_OF_WEEK = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]

    SHIFT_CHOICES = [
        ('Morning', 'Morning (10 AM - 1 PM)'),
        ('Evening', 'Evening (5 PM - 10 PM)'),
    ]

    doctor = models.ForeignKey(
        'Doctor', 
        on_delete=models.CASCADE,
        related_name="schedules"
    )
    day_of_week = models.CharField(max_length=10, choices=DAYS_OF_WEEK)
    shift = models.CharField(max_length=10, choices=SHIFT_CHOICES,default='Morning')
    start_time = models.TimeField(editable=False)
    end_time = models.TimeField(editable=False)
    is_closed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('doctor', 'day_of_week', 'shift') 
        
        ordering = ['day_of_week', 'shift']

    def save(self, *args, **kwargs):
        
        if self.shift == 'Morning':
            self.start_time = time(10, 0)
            self.end_time = time(13, 0) 
        elif self.shift == 'Evening':
            self.start_time = time(17, 0)
            self.end_time = time(22, 0) 
        
        
        if self.start_time is None or self.end_time is None:
             
             raise ValueError("Shift times could not be determined.")

        super().save(*args, **kwargs)

    def __str__(self):
        status = " (Closed)" if self.is_closed else ""
        return f"{self.day_of_week} - {self.shift}{status}"
    


class DoctorLeave(models.Model):
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="leaves")
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.CharField(max_length=200, blank=True, null=True)
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Approved')

    class Meta:
        ordering = ['-start_date']
        verbose_name = "Doctor Leave"
        verbose_name_plural = "Doctor Leaves"

    def clean(self):
        if self.start_date > self.end_date:
            raise ValidationError("End date cannot be before start date.")
        if self.start_date < date.today():
            raise ValidationError("Leave cannot start in the past.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.doctor} ({self.start_date} to {self.end_date}) - {self.status}"    
