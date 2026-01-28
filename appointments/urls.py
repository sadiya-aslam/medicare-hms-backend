from django.urls import path
from .views import (BookAppointmentView,PatientAppointmentListView,RescheduleAppointmentView,
                    CancelAppointmentView,DoctorAppointmentListView,CompleteAppointmentView,
                    CreateFeedbackView,AdminTodayQueueView,UpdateAppointmentStatusView
)
urlpatterns = [
    path('book/', BookAppointmentView.as_view(), name='book_appointment'),
    path('my-appointments/', PatientAppointmentListView.as_view(), name='patient_history'),
    path('cancel/<int:pk>/', CancelAppointmentView.as_view(), name='cancel_appointment'),
    path('reschedule/<int:pk>/', RescheduleAppointmentView.as_view(), name='reschedule_appointment'),
    path('doctor/appointments/', DoctorAppointmentListView.as_view(), name='doctor_appointments'),
    path('doctor/complete/<int:pk>/', CompleteAppointmentView.as_view(), name='complete_appointment'),
    path('feedback/', CreateFeedbackView.as_view(), name='create_feedback'),
    path('admin/today/', AdminTodayQueueView.as_view(), name='admin_today_queue'),
    path('update_status/<int:pk>/', UpdateAppointmentStatusView.as_view(), name='update_status'),
]