from rest_framework import serializers
from .models import Schedule
from .models import Doctor
from .models import DoctorLeave

class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = ['id', 'day_of_week', 'shift', 'start_time', 'end_time', 'is_closed']
        read_only_fields = ['start_time', 'end_time'] 


class DoctorProfileSerializer(serializers.ModelSerializer):
    
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    phone_number = serializers.CharField(required=False)

    class Meta:
        model = Doctor
        fields = [
            'user',  
            'email', 
            'first_name', 
            'last_name', 
            'phone_number',
            'qualification', 
            'experience_years', 
            'consultation_fee', 
            'bio'
        ]

    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['first_name'] = instance.user.first_name
        data['last_name'] = instance.user.last_name
        data['phone_number'] = instance.user.phone_number
        return data

    
    def update(self, instance, validated_data):
        
        user = instance.user
        if 'first_name' in validated_data:
            user.first_name = validated_data.pop('first_name')
        if 'last_name' in validated_data:
            user.last_name = validated_data.pop('last_name')
        if 'phone_number' in validated_data:
            user.phone_number = validated_data.pop('phone_number')
        user.save()
        return super().update(instance, validated_data)




class DoctorLeaveSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)
    class Meta:
        model = DoctorLeave
        fields = ['id','doctor','doctor_name', 'start_date', 'end_date', 'reason','status']
        read_only_fields = ['doctor_name']
    def validate(self, data):
        
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("End date cannot be before start date.")
        return data
    


class DoctorSelectSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    id = serializers.IntegerField(source='pk', read_only=True)
    
    class Meta:
        model = Doctor
        fields = ['id', 'full_name']



class DoctorMyLeaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorLeave
        fields = ['id', 'start_date', 'end_date', 'reason', 'status']
        read_only_fields = ['status']