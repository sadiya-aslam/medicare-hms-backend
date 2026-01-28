from django.urls import path
from .views import (DoctorProfileView,DoctorLeaveView,
                    PublicDoctorListView,DoctorPublicScheduleView,DoctorPublicLeaveView,
                    DoctorBatchScheduleView,DoctorLeaveDeleteView,AdminLeaveListView, 
                    AdminLeaveUpdateView,DoctorDropdownView,DoctorMyLeaveView)

urlpatterns = [
    path('my-schedule/', DoctorBatchScheduleView.as_view(), name='doctor_schedule'),
    path('profile-update/', DoctorProfileView.as_view(), name='doctor_profile_update'),
    path('list/', PublicDoctorListView.as_view(), name='doctor-list'),
    path('schedule/<int:doctor_id>/', DoctorPublicScheduleView.as_view(), name='public_doctor_schedule'),
    path('leaves/<int:doctor_id>/', DoctorPublicLeaveView.as_view(), name='public_doctor_leaves'),
    path('my-leave/<int:pk>/', DoctorLeaveDeleteView.as_view(), name='delete_leave'),
    path('admin/leaves/', AdminLeaveListView.as_view(), name='admin-leave-list'),
    path('admin/leaves/<int:pk>/', AdminLeaveUpdateView.as_view(), name='admin-leave-update'),
    path('doctors-list/', DoctorDropdownView.as_view(), name='doctors-list'),
    path('my-leave/', DoctorMyLeaveView.as_view(), name='doctor-my-leave'),
]

