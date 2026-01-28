from django.urls import path
from .views import (PatientMedicalHistoryView,PatientBillListView,CreatePrescriptionView,
                    ServiceListView,GetGenerateBillView, ProcessPaymentView,
                    ServiceListCreateView, ServiceDetailView
)
urlpatterns = [
    path('history/', PatientMedicalHistoryView.as_view(), name='medical_history'),
    path('bills/', PatientBillListView.as_view(), name='patient_bills'),
    path('create/', CreatePrescriptionView.as_view(), name='create_prescription'),
    path('services/', ServiceListView.as_view(), name='service_list'),
    path('bill/<int:appointment_id>/', GetGenerateBillView.as_view(), name='get_generate_bill'),
    path('payment/add/', ProcessPaymentView.as_view(), name='add_payment'),
    path('services-create/', ServiceListCreateView.as_view(), name='service-list-create'),
    path('services-create/<int:pk>/', ServiceDetailView.as_view(), name='service-detail'),
]