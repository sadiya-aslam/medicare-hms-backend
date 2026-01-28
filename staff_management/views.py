from django.shortcuts import render

# Create your views here.
from rest_framework import generics,permissions,status,serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from datetime import time
from rest_framework.exceptions import ValidationError
from .models import Schedule, Doctor,DoctorLeave
from .serializers import (ScheduleSerializer,DoctorProfileSerializer,DoctorLeaveSerializer,
                          DoctorSelectSerializer,DoctorMyLeaveSerializer)
from core.permissions import IsDoctor
from rest_framework.permissions import IsAuthenticated






class DoctorScheduleView(generics.ListCreateAPIView):
    serializer_class = ScheduleSerializer
    permission_classes = [IsDoctor]

    def get_queryset(self):
        
        return Schedule.objects.filter(doctor__user=self.request.user)

    def perform_create(self, serializer):
        
        try:
            doctor_profile = Doctor.objects.get(user=self.request.user)
            serializer.save(doctor=doctor_profile)
        except Doctor.DoesNotExist:
            raise ValidationError("Doctor profile not found.")
        



class DoctorProfileView(generics.RetrieveUpdateAPIView):
    
    serializer_class = DoctorProfileSerializer
    permission_classes = [IsDoctor]

    def get_object(self):
        
        return Doctor.objects.get(user=self.request.user)        

class DoctorLeaveView(generics.ListCreateAPIView):
    
    serializer_class = DoctorLeaveSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DoctorLeave.objects.filter(doctor__user=self.request.user)

    def perform_create(self, serializer):
        
        serializer.save(doctor=self.request.user.doctor)

class DoctorLeaveDeleteView(generics.DestroyAPIView):
    
    serializer_class = DoctorLeaveSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DoctorLeave.objects.filter(doctor__user=self.request.user)   


class PublicDoctorListView(generics.ListAPIView):
    
    queryset = Doctor.objects.filter(user__role='Doctor',user__is_active=True)
    serializer_class = DoctorProfileSerializer
    permission_classes = [IsAuthenticated]

class DoctorPublicScheduleView(generics.ListAPIView):
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        doctor_id = self.kwargs['doctor_id']
        return Schedule.objects.filter(doctor__user__id=doctor_id)
    
class DoctorPublicLeaveView(generics.ListAPIView):
   
    serializer_class = DoctorLeaveSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        doctor_id = self.kwargs['doctor_id']
        return DoctorLeave.objects.filter(doctor__user__id=doctor_id)
    
class DoctorBatchScheduleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'doctor'):
            return Response({"error": "User is not a doctor"}, status=403)

        schedules = Schedule.objects.filter(doctor=request.user.doctor)
        data = [{'day_of_week': s.day_of_week, 'shift': s.shift} for s in schedules]
        return Response(data)

    def post(self, request):
        try:
            if not hasattr(request.user, 'doctor'):
                return Response({"error": "User is not a doctor"}, status=403)
                
            doctor = request.user.doctor
            new_schedules = request.data 

            if not isinstance(new_schedules, list):
                return Response({"error": "Invalid format. Expected a list."}, status=400)

            with transaction.atomic():
                Schedule.objects.filter(doctor=doctor).delete()
                
                created_slots = []
                for item in new_schedules:
                    
                    
                    is_closed = item.get('is_closed', False)
                    
                    shift_start = None
                    shift_end = None
                    
                    if is_closed:
                        
                        shift_start = time(0, 0)
                        shift_end = time(0, 0)
                        shift_name = 'Closed' 
                    
                    elif item['shift'] == 'Morning':
                        shift_start = time(10, 0)
                        shift_end = time(15, 0)
                        shift_name = 'Morning'
                    elif item['shift'] == 'Evening':
                        shift_start = time(18, 0)
                        shift_end = time(22, 0)
                        shift_name = 'Evening'
                    else:
                        shift_start = time(9, 0)
                        shift_end = time(17, 0)
                        shift_name = item['shift']

                    created_slots.append(Schedule(
                        doctor=doctor,
                        day_of_week=item['day_of_week'],
                        shift=shift_name,
                        start_time=shift_start,
                        end_time=shift_end,
                        is_closed=is_closed 
                    ))
                
                Schedule.objects.bulk_create(created_slots)
            
            return Response({"message": "Schedule updated successfully!"})

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)
        




class AdminLeaveListView(generics.ListCreateAPIView):
    
    queryset = DoctorLeave.objects.filter(status='Approved').order_by('-start_date')
    serializer_class = DoctorLeaveSerializer
    permission_classes = [permissions.IsAuthenticated]


class AdminLeaveUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            leave = DoctorLeave.objects.get(pk=pk)
            new_status = request.data.get('status') 

            if new_status not in ['Approved', 'Rejected']:
                return Response({"error": "Invalid status"}, status=400)

            leave.status = new_status
            leave.save()
            return Response({"message": f"Leave marked as {new_status}"})
            
        except DoctorLeave.DoesNotExist:
            return Response({"error": "Leave request not found"}, status=404)
    def delete(self, request, pk):
        try:
            leave = DoctorLeave.objects.get(pk=pk)
            leave.delete()
            return Response({"message": "Leave deleted successfully"}, status=status.HTTP_200_OK)
        except DoctorLeave.DoesNotExist:
            return Response({"error": "Leave request not found"}, status=status.HTTP_404_NOT_FOUND)    


class DoctorDropdownView(generics.ListAPIView):
    queryset = Doctor.objects.filter(user__role='Doctor',user__is_active=True)
    serializer_class = DoctorSelectSerializer
    permission_classes = [] 


class DoctorMyLeaveView(generics.ListCreateAPIView):
    serializer_class = DoctorMyLeaveSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        
        return DoctorLeave.objects.filter(doctor__user=self.request.user)

    def perform_create(self, serializer):
        
        try:
            doctor_obj = Doctor.objects.get(user=self.request.user)
            serializer.save(doctor=doctor_obj)
        except Doctor.DoesNotExist:
            
            raise serializers.ValidationError("You must be a registered Doctor to request leave.")