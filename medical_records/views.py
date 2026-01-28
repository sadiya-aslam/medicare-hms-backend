from django.shortcuts import render

# Create your views here.
from rest_framework import generics,status, permissions
from .models import Prescription,Service,Bill, Payment
from .serializers import (PrescriptionSerializer,ServiceSerializer,BillSerializer, 
                          PaymentSerializer,PrescriptionCreateSerializer)
from core.permissions import IsPatient,IsDoctor
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from appointments.models import Appointment







class PatientMedicalHistoryView(generics.ListAPIView):
    serializer_class = PrescriptionSerializer
    permission_classes = [IsPatient]

    def get_queryset(self):
        
        return Prescription.objects.filter(
            appointment__patient__user=self.request.user
        ).order_by('-appointment__date')




class PatientBillListView(generics.ListAPIView):
    serializer_class = BillSerializer
    permission_classes = [IsPatient]

    def get_queryset(self):
        return Bill.objects.filter(
            appointment__patient__user=self.request.user
        ).order_by('-issued_date')        
    


class CreatePrescriptionView(generics.CreateAPIView):
   
    serializer_class = PrescriptionCreateSerializer
    permission_classes = [IsDoctor]    

class ServiceListView(generics.ListAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] 

    def get_queryset(self):
        queryset = Service.objects.all()
        
        
        doctor_id = self.request.query_params.get('doctor_id')
        
        if doctor_id:
            
            queryset = queryset.filter(doctors=doctor_id)
            
        return queryset





class GetGenerateBillView(APIView):
    
    permission_classes = [permissions.IsAuthenticated] 

    def get(self, request, appointment_id):
        
        appointment = get_object_or_404(Appointment, pk=appointment_id) 
        bill, created = Bill.objects.get_or_create(appointment=appointment)

        
        if created:
            
            bill.amount = appointment.service.base_price 
            bill.save()

        serializer = BillSerializer(bill)
        return Response(serializer.data)

class ProcessPaymentView(APIView):
    
    permission_classes = [permissions.IsAuthenticated] 

    def post(self, request):
        bill_id = request.data.get('bill_id')
        amount = request.data.get('amount')
        method = request.data.get('method', 'Cash') 
        bill = get_object_or_404(Bill, pk=bill_id)
        payment = Payment.objects.create(
            bill=bill,
            amount_paid=amount,
            payment_method=method,
            status='Completed' 
        )
        
        return Response({"message": "Payment Successful", "bill_status": bill.status}, status=200)
    


class ServiceListCreateView(generics.ListCreateAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated] 


class ServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]
