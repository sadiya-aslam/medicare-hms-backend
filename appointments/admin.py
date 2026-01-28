from django.contrib import admin
from django.utils import timezone
from appointments.models import Patient,Feedback,Appointment


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('user', 'date_of_birth')
    search_fields = ('user__first_name', 'user__last_name', 'user__email')
    


class FeedbackInline(admin.StackedInline):
    model = Feedback
    readonly_fields = ('date_submitted',)
    max_num = 1
    can_delete = False


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'service', 'date', 'time_slot', 'status')
    list_filter = ('status', 'doctor', 'date')
    search_fields = ('patient__user__first_name', 'patient__user__last_name', 'doctor__user__first_name', 'doctor__user__last_name')
    readonly_fields = ('booking_timestamp',)
    inlines = [FeedbackInline] 

    
    def is_past_appointment(self, obj):
        return obj.date < timezone.now().date()
    is_past_appointment.boolean = True
    is_past_appointment.short_description = 'Past Appointment'


