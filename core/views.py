from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer,PatientProfileSerializer
from rest_framework import generics,status,permissions
from core.serializers import PatientRegistrationSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser,AllowAny
from rest_framework import generics,status
from appointments.models import Patient
from .permissions import IsPatient  
from .serializers import PatientRegistrationSerializer, DoctorRegistrationSerializer 
from django.contrib.auth import get_user_model
User = get_user_model()



class PatientRegistrationView(generics.CreateAPIView):
   
    serializer_class = PatientRegistrationSerializer
    authentication_classes = [] 
    permission_classes = [AllowAny]



class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer





class PatientProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = PatientProfileSerializer
    permission_classes = [IsPatient]

    def get_object(self):
        
        return Patient.objects.get(user=self.request.user)    
    






class DoctorRegistrationView(generics.CreateAPIView):
   
    serializer_class = DoctorRegistrationSerializer
    authentication_classes = [] 
    permission_classes = [AllowAny]
    def create(self, request, *args, **kwargs):
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user.is_active = False
        user.save()

        
        return Response({
            "message": "Registration Submitted! Your account is pending approval by the Hospital Admin."
        }, status=status.HTTP_201_CREATED)   




 




class AdminResetPasswordView(APIView):
    
    permission_classes = [permissions.IsAdminUser]  

    def post(self, request):
        email = request.data.get("email")
        new_password = request.data.get("new_password")

        
        if not email or not new_password:
            return Response({"error": "Email and new password are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            
            user = User.objects.get(email=email)
            
            
            user.set_password(new_password)
            user.save()
            
            return Response({"message": f"Password for {email} has been reset successfully!"}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"error": "User with this email not found."}, status=status.HTTP_404_NOT_FOUND)
        








class ChangePasswordView(APIView):
    
    permission_classes = [permissions.IsAuthenticated]  

    def post(self, request):
        user = request.user  
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        
        if not old_password or not new_password:
            return Response({"error": "Both old and new passwords are required."}, status=status.HTTP_400_BAD_REQUEST)

        
        if not user.check_password(old_password):
            return Response({"error": "Incorrect old password."}, status=status.HTTP_400_BAD_REQUEST)

        
        if len(new_password) < 6:
            return Response({"error": "New password must be at least 6 characters."}, status=status.HTTP_400_BAD_REQUEST)

        
        user.set_password(new_password)
        user.save()

        return Response({"message": "Password changed successfully!"}, status=status.HTTP_200_OK)
    





class PendingDoctorsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        
        pending_docs = User.objects.filter(role='doctor', is_active=False)
        
        data = []
        for u in pending_docs:
            
            try:
                
                qualification = u.doctor.qualification 
            except AttributeError:
                
                qualification = "N/A"

            data.append({
                "id": u.id, 
                "full_name": f"{u.first_name} {u.last_name}", 
                "email": u.email, 
                "qualification": qualification 
            })
            
        return Response(data)


class ApproveDoctorView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, id):
        try:
            doctor = User.objects.get(id=id, role='doctor')
            doctor.is_active = True
            doctor.save()
            return Response({"message": "Doctor Approved Successfully!"})
        except User.DoesNotExist:
            return Response({"error": "Doctor not found"}, status=404)
        




class RejectDoctorView(generics.DestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()

    def delete(self, request, *args, **kwargs):
        user_id = self.kwargs.get('pk')
        try:
            user = User.objects.get(id=user_id)
            
            
            if user.is_active:
                return Response(
                    {"error": "Cannot reject an already active doctor."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.delete()
            return Response({"message": "Application rejected and user removed."}, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)