from django.contrib import admin
from medical_records.models import Service,Prescription,Bill,Payment,PrescriptionItem
# Register your models here.
@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display=('name','default_duration_min','base_price')
    list_editable=('base_price', )

class PrescriptionItemInline(admin.TabularInline):
    model = PrescriptionItem
    extra = 1 

class PrescriptionAdmin(admin.ModelAdmin):
    inlines = [PrescriptionItemInline]
    list_display = ('appointment', 'created_at')


admin.site.register(Prescription, PrescriptionAdmin)
admin.site.register(PrescriptionItem)




class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 1  
    readonly_fields = ('payment_date',)
    
    def has_change_permission(self, request, obj=None):
        return True


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'status', 'amount', 'total_paid', 'amount_due', 'issued_date')
    readonly_fields = ('total_paid', 'amount_due', 'issued_date')
    inlines = [PaymentInline]
    list_filter = ('status',)
    search_fields = ('appointment__patient__name', 'appointment__id')
