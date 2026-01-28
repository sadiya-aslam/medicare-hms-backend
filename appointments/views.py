from django.shortcuts import render

# Create your views here.
from rest_framework import generics, status,permissions
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, NotFound
from .models import Appointment, Patient
from .serializers import (AppointmentBookingSerializer,AppointmentListSerializer,AppointmentRescheduleSerializer,
                          AppointmentCancelSerializer,DoctorAppointmentListSerializer,AppointmentCompleteSerializer,
                          AppointmentSerializer)
from core.permissions import IsPatient,IsDoctor
from .serializers import FeedbackSerializer
from datetime import date
from .utils import send_appointment_notification
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

class BookAppointmentView(generics.CreateAPIView):
    serializer_class = AppointmentBookingSerializer
    permission_classes = [IsPatient]

    def create(self, request, *args, **kwargs):
        
        try:
            return super().create(request, *args, **kwargs)
        except ValidationError as e:
            
            return Response({"error": e.detail}, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        user = self.request.user
        
       
        try:
            patient_profile = Patient.objects.get(user=user)
        except Patient.DoesNotExist:
            raise NotFound({"error": "Patient profile not found. Please contact support."})

        
        existing_appt = Appointment.objects.filter(
            patient=patient_profile,
            date=serializer.validated_data['date'],
            time_slot=serializer.validated_data['time_slot']
        ).exists()
        
        if existing_appt:
            raise ValidationError({"error": "You already have an appointment booked for this date and time."})
    
        appointment = serializer.save(patient=patient_profile)

        send_appointment_notification(appointment, 'booked')





class PatientAppointmentListView(generics.ListAPIView):
    serializer_class = AppointmentListSerializer
    permission_classes = [IsPatient]

    def get_queryset(self):
        
        return Appointment.objects.filter(patient__user=self.request.user).order_by('-date', '-time_slot')
    
class CancelAppointmentView(generics.UpdateAPIView):
    serializer_class = AppointmentCancelSerializer
    permission_classes = [IsPatient]

    def get_queryset(self):
        
        return Appointment.objects.filter(patient__user=self.request.user)

    def perform_update(self, serializer):
        appointment = self.get_object()
        if appointment.status == 'Completed':
            raise ValidationError("Cannot cancel an appointment that is already completed.")
        if appointment.status == 'Cancelled':
            raise ValidationError("This appointment is already cancelled.")
        if appointment.date < date.today():
            raise ValidationError("Cannot cancel a past appointment.")
        appointment = serializer.save(status='Cancelled')
        send_appointment_notification(appointment, 'cancelled')

class RescheduleAppointmentView(generics.UpdateAPIView):
    serializer_class = AppointmentRescheduleSerializer
    permission_classes = [IsPatient]

    def get_queryset(self):
        return Appointment.objects.filter(patient__user=self.request.user)
    
    def perform_update(self, serializer):
        
        
        appointment = serializer.save(status='Scheduled')
        send_appointment_notification(appointment, 'reschedule')





class DoctorAppointmentListView(generics.ListAPIView):
    serializer_class = DoctorAppointmentListSerializer
    permission_classes = [IsDoctor]

    def get_queryset(self):
        
        queryset = Appointment.objects.filter(doctor__user=self.request.user)
        date_param = self.request.query_params.get('date')

        if date_param == 'today':
            queryset = queryset.filter(date=date.today())  
        return queryset.order_by('date', 'time_slot')
    



class CompleteAppointmentView(generics.UpdateAPIView):
    
    serializer_class = AppointmentCompleteSerializer
    permission_classes = [IsDoctor]

    def get_queryset(self):
        return Appointment.objects.filter(doctor__user=self.request.user)

    def perform_update(self, serializer):
        appointment = self.get_object()

        if appointment.status != 'Scheduled':
            raise ValidationError(f"Cannot complete an appointment that is {appointment.status}.")  
        serializer.save(status='Completed')    



class CreateFeedbackView(generics.CreateAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [IsPatient]

    def perform_create(self, serializer):
        
        serializer.save()


class AdminTodayQueueView(generics.ListAPIView):
    
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated] 

    def get_queryset(self):
       
        if self.request.user.role != 'Admin':
            return Appointment.objects.none() 

        
        return Appointment.objects.filter(
            date=date.today()
        ).order_by('time_slot')
    



class UpdateAppointmentStatusView(APIView):
    
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        appointment = get_object_or_404(Appointment, pk=pk)
        new_status = request.data.get('status')
        user = request.user

        if user.role == 'Admin':
            
            pass 
        elif user.role == 'Doctor' and appointment.doctor.user == user:
           
            if new_status not in ['Completed', 'Cancelled']:
                return Response({"error": "Doctors can only mark Completed or Cancelled."}, status=403)
        else:
            return Response({"error": "Unauthorized"}, status=403)

        
        if new_status:
            appointment.status = new_status
            appointment.save()
            return Response({"message": f"Status updated to {new_status}"}, status=200)
        
        return Response({"error": "Status is required"}, status=400)
