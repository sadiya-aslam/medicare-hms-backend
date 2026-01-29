from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from core.models import User
from appointments.models import Patient
from django.db import transaction
from staff_management.models import Doctor

class PatientRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    date_of_birth = serializers.DateField(required=True,write_only=True)
    first_name = serializers.CharField(required=True) 
    last_name = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'phone_number', 'date_of_birth']

    @transaction.atomic
    def create(self, validated_data):
        dob = validated_data.pop('date_of_birth')

        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number'),
            role="Patient"
        )

        
        Patient.objects.create(
            user=user,
            date_of_birth=dob
        )

        return user





class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        
        data = super().validate(attrs)
        
    
        data.update({
            'user_id': self.user.id,
            'email': self.user.email,
            'role': self.user.role,  
            'message': 'Login Successful'
        })

        return data




class PatientProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    
    
    phone_number = serializers.CharField(source='user.phone_number', validators=[]) 

    class Meta:
        model = Patient
        
        fields = ['email', 'first_name', 'last_name', 'phone_number', 'date_of_birth', 'address', 'gender']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        
        new_phone = user_data.get('phone_number')
        if new_phone and new_phone != user.phone_number:
            if User.objects.filter(phone_number=new_phone).exists():
                raise serializers.ValidationError({"phone_number": "This number is already in use by another patient."})

        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance



class DoctorRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    qualification = serializers.CharField(required=True,write_only=True)
    experience_years = serializers.IntegerField(required=True,write_only=True)
    consultation_fee = serializers.DecimalField(max_digits=6, decimal_places=2, required=True,write_only=True)
    bio = serializers.CharField(required=False, allow_blank=True,write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'phone_number', 
                  'qualification', 'experience_years', 'consultation_fee', 'bio']

    @transaction.atomic
    def create(self, validated_data):
        
        qualification = validated_data.pop('qualification')
        experience = validated_data.pop('experience_years')
        fee = validated_data.pop('consultation_fee')
        bio = validated_data.pop('bio', '')
        password = validated_data.pop('password')

        
        user = User.objects.create_user(
            password=password,
            role="Doctor", 
            **validated_data
        )

        
        Doctor.objects.create(
            user=user,
            qualification=qualification,
            experience_years=experience,
            consultation_fee=fee,
            bio=bio
        )

        return user    