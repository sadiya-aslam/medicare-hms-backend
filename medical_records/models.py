from django.db import models

# Create your models here.
from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from appointments.models import Appointment
from staff_management.models import Doctor



class Service(models.Model):
    name = models.CharField(max_length=100, unique=True)
    default_duration_min = models.PositiveIntegerField(
        help_text="Default duration of the service in minutes"
    )
    base_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.00)],
        default=200
    )
    doctors = models.ManyToManyField(Doctor, related_name='services', blank=True)

    def __str__(self):
        return self.name



class Prescription(models.Model):
    
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name="prescription")
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True, help_text="General instructions (e.g., 'Drink plenty of water')")

    def __str__(self):
        return f"Prescription for {self.appointment}"

class PrescriptionItem(models.Model):
    
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name="items")
    medicine_name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=100, help_text="e.g., 500mg")
    frequency = models.CharField(max_length=100, help_text="e.g., 1-0-1 (Morning-Noon-Night)", null=True, blank=True)
    duration = models.CharField(max_length=100, help_text="e.g., 5 days", blank=True, null=True)
    instructions = models.CharField(max_length=200, blank=True, null=True, help_text="e.g., After food")

    def __str__(self):
        return f"{self.medicine_name} ({self.dosage})"









class Bill(models.Model):
    STATUS_CHOICES = [
        ('Unpaid', 'Unpaid'),
        ('Paid', 'Paid'),
    ]

    appointment = models.OneToOneField('appointments.Appointment', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.00)],null=True, blank=True,default=200.00)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Unpaid')
    issued_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Bill for {self.appointment} - {self.status}"

    
    @property
    def total_paid(self):
      
    
      if not self.pk:
         return 0
      return sum(payment.amount_paid for payment in self.payments.filter(status='Completed'))

    @property
    def amount_due(self):
        
        return self.amount - self.total_paid

    def update_status(self):
        
        if self.amount_due <= 0:
            self.status = 'Paid'
        else:
            self.status = 'Unpaid'
        self.save()
    def __str__(self):
        return f"Bill for {self.appointment.patient} ({self.appointment})"

class Payment(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Completed', 'Completed'),
        ('Failed', 'Failed'),
    ]

    METHOD_CHOICES = [
        ('Cash', 'Cash'),
        ('Card', 'Card'),
        ('UPI', 'UPI'),
    ]

    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='payments')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    payment_date = models.DateTimeField(auto_now_add=True)

    def clean(self):
        """Prevent overpayment."""
        if self.bill and self.amount_paid > self.bill.amount_due:
            raise ValidationError(f"Payment cannot exceed the amount due ({self.bill.amount_due}).")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.bill.update_status() 

    def __str__(self):
        return f"{self.payment_method} - {self.amount_paid} ({self.status})"
    def __str__(self):
        return f"Payment of ₹{self.amount_paid} by {self.bill.appointment.patient.user.get_full_name()} ({self.payment_method})"