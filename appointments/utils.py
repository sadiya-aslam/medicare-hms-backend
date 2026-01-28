import threading
from django.core.mail import send_mail
from django.conf import settings

# 👇 Helper function that runs in the background
def send_email_thread(subject, message, recipient_list):
    try:
        print(f"📧 Background Thread: Sending email to {recipient_list}...")
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        print("✅ Background Thread: Email sent!")
    except Exception as e:
        print(f"❌ Background Thread Failed: {e}")

def send_appointment_notification(appointment, action):
    if not appointment.patient or not appointment.patient.user.email:
        print("❌ Error: Patient has no email address.")
        return

    patient_email = appointment.patient.user.email
    patient_name = appointment.patient.user.first_name
    doctor_name = appointment.doctor.user.get_full_name()
    date_str = appointment.date.strftime('%A, %d %B %Y')
    time_str = appointment.time_slot.strftime('%I:%M %p')

    # --- Message Logic (Same as before) ---
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

    # 👇 THE FIX: Start a new thread for the email
    # This lets the code continue immediately without waiting for Gmail
    email_thread = threading.Thread(
        target=send_email_thread,
        args=(subject, message, [patient_email])
    )
    email_thread.start()