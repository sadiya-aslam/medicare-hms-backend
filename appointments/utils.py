from django.core.mail import send_mail
from django.conf import settings

def send_appointment_notification(appointment, action):
 
    if not appointment.patient or not appointment.patient.user.email:
        print("❌ Error: Patient has no email address.")
        return

    patient_email = appointment.patient.user.email
    patient_name = appointment.patient.user.first_name
    doctor_name = appointment.doctor.user.get_full_name()
    date_str = appointment.date.strftime('%A, %d %B %Y')
    time_str = appointment.time_slot.strftime('%I:%M %p')

    
    if action == 'booked':
        subject = f"Appointment Confirmed: Dr. {doctor_name}"
        message = (
            f"Dear {patient_name},\n\n"
            f"Your appointment has been successfully booked.\n\n"
            f"👨‍⚕️ Doctor: Dr. {doctor_name}\n"
            f"📅 Date: {date_str}\n"
            f"⏰ Time: {time_str}\n\n"
            f"Thank you for choosing Dr. Mahajan's Clinic!"
        )
    elif action == 'rescheduled':
        subject = f"Appointment Update: Dr. {doctor_name}"
        message = (
            f"Dear {patient_name},\n\n"
            f"Your appointment has been rescheduled.\n\n"
            f"📅 New Date: {date_str}\n"
            f"⏰ New Time: {time_str}\n\n"
            f"Please arrive 10 minutes early."
        )
    elif action == 'cancelled':
        subject = "Appointment Cancelled"
        message = (
            f"Dear {patient_name},\n\n"
            f"Your appointment with Dr. {doctor_name} on {date_str} has been cancelled."
        )
    else:
        return

    
    try:
        print(f"📧 Sending email to {patient_email}...") 
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[patient_email],
            fail_silently=False,  
        )
        print("✅ Email sent successfully!")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")