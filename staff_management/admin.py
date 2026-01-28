from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from staff_management.models import Doctor,Schedule,DoctorLeave

class CurrentlyOnLeaveFilter(admin.SimpleListFilter):
    title = 'availability'
    parameter_name = 'is_on_leave'

    def lookups(self, request, model_admin):
        return (
            ('yes', 'On Leave'),
            ('no', 'Available'),
        )

    def queryset(self, request, queryset):
        today = timezone.now().date()
        if self.value() == 'yes':
            return queryset.filter(leaves__start_date__lte=today,
                                   leaves__end_date__gte=today).distinct()
        if self.value() == 'no':
            return queryset.exclude(leaves__start_date__lte=today,
                                    leaves__end_date__gte=today).distinct()
        return queryset




class DoctorLeaveInline(admin.TabularInline):
    model = DoctorLeave
    extra = 1
    

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ("user","qualification", "experience_years", "consultation_fee")
    search_fields = ("user__first_name__istarstwith", "user__last_name__istartswith")
    
    fieldsets = (
        (None, {"fields": ("user",)}),
        ("Professional Info", {"fields": ("qualification", "experience_years", "consultation_fee", "bio")}),
    )

    list_filter=[CurrentlyOnLeaveFilter]
    inlines=[DoctorLeaveInline]

@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ("doctor", "day_of_week", "start_time", "end_time")
    list_filter = ("day_of_week",)
   

