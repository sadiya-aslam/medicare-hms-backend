import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import api, { appointmentAPI } from '../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const BookTimeSlot = () => {
    const { id } = useLocalSearchParams(); 
    const router = useRouter();
    
    
    const [services, setServices] = useState([]);
    const [doctorSchedule, setDoctorSchedule] = useState([]);
    const [doctorLeaves, setDoctorLeaves] = useState([]);
    
    
    const [date, setDate] = useState(''); 
    const [serviceId, setServiceId] = useState('');
    const [reason, setReason] = useState('');
    
    
    const [selectedTime, setSelectedTime] = useState(new Date()); 
    const [displayTime, setDisplayTime] = useState(""); 
    

    const [dateObj, setDateObj] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false); 
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    
    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const [servicesRes, scheduleRes, leavesRes] = await Promise.all([
                    api.get(`/api/medical_records/services/?doctor_id=${id}`),
                    appointmentAPI.getDoctorSchedule(id),
                    appointmentAPI.getDoctorLeaves(id)
                ]);
                setServices(Array.isArray(servicesRes.data) ? servicesRes.data : (servicesRes.data.results || []));
                setDoctorSchedule(Array.isArray(scheduleRes.data) ? scheduleRes.data : (scheduleRes.data.results || []));
                setDoctorLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : (leavesRes.data.results || []));
            } catch (err) {
                console.error("Failed to load doctor data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    
    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDateObj(selectedDate);
            const formattedDate = selectedDate.toISOString().split('T')[0];
            setDate(formattedDate);
            
            setDisplayTime(""); 
        }
    };

    
    const handleTimeChange = (event, time) => {
        setShowTimePicker(false);
        if (time) {
            
            const hours = time.getHours().toString().padStart(2, '0');
            const minutes = time.getMinutes().toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}`;

            
            const isValid = checkDoctorShift(timeString);
            
            if (isValid) {
                setSelectedTime(time);
                setDisplayTime(timeString);
            } else {
                Alert.alert("Doctor Unavailable", "The doctor is not working at this time. Please check their schedule.");
                setDisplayTime(""); 
            }
        }
    };

    
    const checkDoctorShift = (selectedTimeString) => {
        if (!date || doctorSchedule.length === 0) return true; 

        const selectedDateObj = new Date(date);
        const dayName = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });

        
        const shifts = doctorSchedule.filter(s => s.day_of_week === dayName && !s.is_closed);

        if (shifts.length === 0) return false; 

        
        return shifts.some(shift => {
            const shiftStart = shift.start_time.substring(0, 5); // "09:00"
            const shiftEnd = shift.end_time.substring(0, 5);     // "17:00"
            return selectedTimeString >= shiftStart && selectedTimeString <= shiftEnd;
        });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await appointmentAPI.book({
                doctor: id,
                service_id: serviceId,
                date: date,
                time_slot: displayTime + ":00", 
                reason_for_visit: reason
            });
            
            const msg = "Booking Confirmed!";
            if (Platform.OS === 'web') {
                window.alert(msg);
                router.replace('/patient/dashboard');
            } else {
                Alert.alert("Success", msg, [
                    { text: "OK", onPress: () => router.replace('/patient/dashboard') }
                ]);
            }
        
        } catch (err) {
            
            let errorTitle = "Booking Failed";
            let finalMessage = "Something went wrong.";

            if (err.response && err.response.data) {
                let data = err.response.data;
                if (data.error) data = data.error;

                if (typeof data === 'string') {
                    finalMessage = data;
                } else if (typeof data === 'object') {
                    const keys = Object.keys(data);
                    if (keys.length > 0) {
                        const firstField = keys[0];
                        const errorContent = data[firstField];
                        const mainError = Array.isArray(errorContent) ? errorContent[0] : errorContent;
                        
                        if (firstField === 'non_field_errors') {
                            finalMessage = mainError;
                        } else {
                            const formattedField = firstField.replace(/_/g, ' ').toUpperCase();
                            finalMessage = `${formattedField}: ${mainError}`;
                        }
                    }
                }
            } else if (err.message) {
                finalMessage = err.message;
            }
            Alert.alert(errorTitle, finalMessage);
            
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb"/></View>;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Book Appointment</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    
                
                    <Text style={styles.label}>Select Service</Text>
                    {services.length === 0 ? (
                        <Text style={{color: '#6b7280', fontStyle: 'italic'}}>No services available.</Text>
                    ) : (
                        <View style={styles.serviceList}>
                            {services.map(s => (
                                <TouchableOpacity 
                                    key={s.id} 
                                    style={[styles.serviceCard, serviceId === s.id && styles.selectedService]}
                                    onPress={() => setServiceId(s.id)}
                                >
                                    <Text style={[styles.serviceName, serviceId === s.id && styles.selectedText]}>{s.name}</Text>
                                    <Text style={[styles.servicePrice, serviceId === s.id && styles.selectedText]}>Rs. {s.base_price}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    
                    <Text style={styles.label}>Select Date</Text>
                    <TouchableOpacity style={[styles.input, styles.rowInput]} onPress={() => setShowDatePicker(true)}>
                        <Text style={date ? styles.inputText : styles.placeholderText}>
                            {date || "YYYY-MM-DD"}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={dateObj}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            minimumDate={new Date()}
                            onChange={handleDateChange}
                        />
                    )}

                    
                    <Text style={styles.label}>Select Time</Text>
                    <TouchableOpacity 
                        style={[styles.input, styles.rowInput, !date && {opacity: 0.5}]} 
                        onPress={() => date ? setShowTimePicker(true) : Alert.alert("Select Date First")}
                        disabled={!date}
                    >
                        <Text style={displayTime ? styles.inputText : styles.placeholderText}>
                            {displayTime ? `${displayTime} hrs` : "Select Time (e.g. 10:30)"}
                        </Text>
                        <Ionicons name="time-outline" size={20} color="#6b7280" />
                    </TouchableOpacity>

                    {showTimePicker && (
                        <DateTimePicker
                            value={selectedTime}
                            mode="time"
                            is24Hour={true}
                            display="default"
                            minuteInterval={10} 
                            onChange={handleTimeChange}
                        />
                    )}

                
                    <Text style={styles.label}>Reason for Visit</Text>
                    <TextInput 
                        style={[styles.input, styles.textArea]}
                        placeholder="Fever, Checkup, etc."
                        multiline
                        numberOfLines={3}
                        value={reason}
                        onChangeText={setReason}
                    />

                    
                    <TouchableOpacity 
                        style={[styles.submitBtn, (!displayTime || !serviceId || submitting) && styles.disabledBtn]} 
                        onPress={handleSubmit}
                        disabled={!displayTime || !serviceId || submitting}
                    >
                        {submitting ? <ActivityIndicator color="#fff"/> : <Text style={styles.submitBtnText}>Confirm Booking</Text>}
                    </TouchableOpacity>

                    <View style={{height: 40}} />
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    backBtn: { marginRight: 15 },
    backText: { color: '#2563eb', fontSize: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
    content: { padding: 20 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginTop: 15, marginBottom: 8 },
    
    serviceList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    serviceCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', width: '48%' },
    selectedService: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    serviceName: { fontWeight: 'bold', color: '#1f2937' },
    servicePrice: { fontSize: 12, color: '#6b7280', marginTop: 4 },
    selectedText: { color: '#fff' },
    
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 },
    rowInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    inputText: { color: '#1f2937', fontWeight: 'bold' },
    placeholderText: { color: '#9ca3af' },
    
    textArea: { height: 80, textAlignVertical: 'top' },
    
    submitBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 30 },
    disabledBtn: { backgroundColor: '#93c5fd' },
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

export default BookTimeSlot;