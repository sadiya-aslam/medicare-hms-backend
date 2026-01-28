from rest_framework import serializers
from .models import Prescription, PrescriptionItem,Service
from .models import Bill, Payment

class PrescriptionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionItem
        fields = ['medicine_name', 'dosage', 'frequency', 'duration', 'instructions']

class PrescriptionSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='appointment.doctor.user.get_full_name', read_only=True)
    date = serializers.DateField(source='appointment.date', read_only=True)
    reason_for_visit = serializers.CharField(source='appointment.reason_for_visit', read_only=True)
    
    
    items = PrescriptionItemSerializer(many=True, read_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id', 
            'doctor_name', 
            'date', 
            'reason_for_visit', 
            'notes',
            'items' 
        ]



class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['amount_paid', 'payment_method', 'status', 'payment_date']

class BillSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='appointment.doctor.user.get_full_name', read_only=True)
    service_name = serializers.CharField(source='appointment.service.name', read_only=True)
    date = serializers.DateField(source='appointment.date', read_only=True)
    
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Bill
        fields = [
            'id', 
            'doctor_name', 
            'service_name', 
            'date', 
            'amount', 
            'total_paid', 
            'amount_due', 
            'status', 
            'issued_date', 
            'payments'
        ]        

class PrescriptionCreateSerializer(serializers.ModelSerializer):
    
    items = PrescriptionItemSerializer(many=True)

    class Meta:
        model = Prescription
        fields = ['appointment', 'notes', 'items']

    def validate_appointment(self, value):
        
        user = self.context['request'].user
        if value.doctor.user != user:
            raise serializers.ValidationError("You cannot write a prescription for another doctor's appointment.")
        return value

    def create(self, validated_data):
        
        
        items_data = validated_data.pop('items')
        
        
        prescription = Prescription.objects.create(**validated_data)
        
        
        for item_data in items_data:
            PrescriptionItem.objects.create(prescription=prescription, **item_data)
            
        return prescription        
    
class ServiceSerializer(serializers.ModelSerializer):
    doctor_names = serializers.StringRelatedField(source='doctors', many=True, read_only=True)
    class Meta:
        model = Service
        fields = ['id', 'name', 'base_price', 'default_duration_min','doctor_names','doctors']





class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'amount_paid', 'payment_method', 'status', 'payment_date']

class BillSerializer(serializers.ModelSerializer):
    
    payments = PaymentSerializer(many=True, read_only=True)
    
    doctor_name = serializers.CharField(source='appointment.doctor.user.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='appointment.patient.user.get_full_name', read_only=True)
    total_paid = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    amount_due = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Bill
        fields = [
            'id', 'appointment', 'patient_name', 
            'amount', 'status', 'issued_date', 
            'total_paid', 'amount_due', 'payments','doctor_name'
        ]