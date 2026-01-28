from django.urls import path
from core.views import (PatientRegistrationView,CustomLoginView,PatientProfileView,
                        DoctorRegistrationView,AdminResetPasswordView,ChangePasswordView, 
                        PendingDoctorsView,ApproveDoctorView,RejectDoctorView)
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    path('register/patient/', PatientRegistrationView.as_view(), name='patient-register'),
    path('login/', CustomLoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('patient/profile/', PatientProfileView.as_view(), name='patient-profile'),
    path('register/doctor/', DoctorRegistrationView.as_view(), name='doctor-register'),
    path('admin/reset-password/', AdminResetPasswordView.as_view(), name='admin-reset-password'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('admin/pending-doctors/', PendingDoctorsView.as_view(), name='pending-doctors'),
    path('admin/approve-doctor/<int:id>/', ApproveDoctorView.as_view(), name='approve-doctor'),
    path('admin/reject_doctor/<int:pk>/', RejectDoctorView.as_view(), name='reject_doctor'),

]
