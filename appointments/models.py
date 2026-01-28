from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import date
from core.models import User
from staff_management.models import Doctor, Schedule 

class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    date_of_birth = models.DateField(
        validators=[MaxValueValidator(limit_value=date.today(), message="Date of birth cannot be in the future.")]
    )
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    
    medical_history_summary = models.TextField(null=True, blank=True)

    def clean(self):
        if self.user.role != 'Patient':
            raise ValidationError("The linked user must have the 'Patient' role.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.user.get_full_name() or self.user.email


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('Scheduled', 'Scheduled'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
        ('No-Show', 'No-Show'),
        ('Checked-In', 'Checked-In'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="appointments")
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="appointments")
    service = models.ForeignKey('medical_records.Service', on_delete=models.PROTECT)
    date = models.DateField()
    time_slot = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Scheduled')
    reason_for_visit = models.TextField(null=True, blank=True)
    booking_timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('doctor', 'date', 'time_slot') 
        ordering = ['-date', '-time_slot']

    def clean(self):
        
        if self.date < date.today():
            raise ValidationError("Cannot book an appointment in the past.")
        if self.date == date.today() and self.time_slot < timezone.now().time():
            raise ValidationError("Cannot book an appointment time that has already passed.")

        
        if not self.doctor.is_available_on(self.date):
            raise ValidationError(f"Dr. {self.doctor.user.last_name} is not available on {self.date.strftime('%A, %d %B')} (Day off or Leave).")

        
        day_name = self.date.strftime('%A')
        
        daily_schedules = self.doctor.schedules.filter(
            day_of_week=day_name, 
            is_closed=False
        )

        is_valid_time = False
        valid_ranges = []

        for schedule in daily_schedules:
            valid_ranges.append(f"{schedule.shift}: {schedule.start_time.strftime('%I:%M %p')} - {schedule.end_time.strftime('%I:%M %p')}")
            
            if schedule.start_time <= self.time_slot < schedule.end_time:
                is_valid_time = True
                break 
        
        if not is_valid_time:
            ranges_str = " & ".join(valid_ranges)
            raise ValidationError(
                f"Invalid time. On {day_name}s, Dr. {self.doctor.user.last_name} is available during: {ranges_str}."
            )

    def save(self, *args, **kwargs):
        if not self.pk:  
            self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Appt: {self.patient} with {self.doctor} on {self.date} at {self.time_slot.strftime('%I:%M %p')}"


class Feedback(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name="feedback")
    rating_score = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comments = models.TextField(null=True, blank=True)
    date_submitted = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.appointment.status != 'Completed':
            raise ValidationError("Feedback can only be submitted for completed appointments.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Feedback for {self.appointment} - Rating: {self.rating_score}"