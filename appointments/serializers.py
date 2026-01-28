from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Appointment
from medical_records.models import Service 
from .models import Feedback


class AppointmentBookingSerializer(serializers.ModelSerializer):
    
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(), source='service', write_only=True
    )
    
    class Meta:
        model = Appointment
        fields = ['id', 'doctor', 'service', 'service_id', 'date', 'time_slot', 'reason_for_visit', 'status']
        read_only_fields = ['status', 'patient', 'service'] 
    def validate(self, data):
        
        try:
            
            temp_appointment = Appointment(**data)
            
    
            temp_appointment.clean()
            
        except DjangoValidationError as e:
           
            raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else list(e.messages))

        return data
    

    

class AppointmentListSerializer(serializers.ModelSerializer):
   
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    
    class Meta:
        model = Appointment
        fields = ['id','doctor', 'doctor_name', 'service_name', 'date', 'time_slot', 'status', 'reason_for_visit']

class AppointmentRescheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['date', 'time_slot'] 

    def validate(self, data):
        
        instance = self.instance 
        
        
        old_date = instance.date
        old_time = instance.time_slot
        
        
        instance.date = data.get('date', old_date)
        instance.time_slot = data.get('time_slot', old_time)

        
        try:
            instance.clean()
        except DjangoValidationError as e:
        
            instance.date = old_date
            instance.time_slot = old_time
            
            raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else list(e.messages))

        return data

class AppointmentCancelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = []         


class DoctorAppointmentListSerializer(serializers.ModelSerializer):
    
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    patient_email = serializers.EmailField(source='patient.user.email', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 
            'patient_name', 
            'patient_email',
            'service_name', 
            'date', 
            'time_slot', 
            'status', 
            'reason_for_visit'
        ]        

class AppointmentCompleteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = []      



class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['appointment', 'rating_score', 'comments']

    def validate_appointment(self, value):
        
        user = self.context['request'].user
        if value.patient.user != user:
            raise serializers.ValidationError("You can only rate your own appointments.")
        
        if value.status != 'Completed':
            raise serializers.ValidationError("You can only rate completed appointments.")
        return value        
    
class AppointmentSerializer(serializers.ModelSerializer):
    
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    patient_email = serializers.CharField(source='patient.user.email', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_price = serializers.DecimalField(source='service.base_price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 
            'patient', 'patient_name', 'patient_email',  # Patient Details
            'doctor', 'doctor_name',                     # Doctor Details
            'service', 'service_name', 'service_price',  # Service Details
            'date', 'time_slot', 'status',               # Appointment Details
            'reason_for_visit', 'booking_timestamp'
        ]
        read_only_fields = ['booking_timestamp']

    def to_representation(self, instance):
        
        representation = super().to_representation(instance)
        if instance.time_slot:
            representation['time_slot'] = instance.time_slot.strftime('%I:%M %p') 
        return representation