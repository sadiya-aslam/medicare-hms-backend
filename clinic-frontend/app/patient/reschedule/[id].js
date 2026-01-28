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
    TouchableOpacity,
    View
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { appointmentAPI } from '../../services/api';

const RescheduleScreen = () => {
    
    const { id, doctorId } = useLocalSearchParams(); 
    const router = useRouter();
    
    
    const [doctorSchedule, setDoctorSchedule] = useState([]);
    const [doctorLeaves, setDoctorLeaves] = useState([]);
    
    
    const [date, setDate] = useState(''); 
    const [selectedTime, setSelectedTime] = useState(new Date()); 
    const [displayTime, setDisplayTime] = useState(""); 
    
    
    const [dateObj, setDateObj] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false); 
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    
    useEffect(() => {
        if (!doctorId) return;

        const fetchData = async () => {
            try {
                const [scheduleRes, leavesRes] = await Promise.all([
                    appointmentAPI.getDoctorSchedule(doctorId),
                    appointmentAPI.getDoctorLeaves(doctorId)
                ]);

                setDoctorSchedule(Array.isArray(scheduleRes.data) ? scheduleRes.data : (scheduleRes.data.results || []));
                setDoctorLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : (leavesRes.data.results || []));

            } catch (err) {
                console.error("Failed to load doctor data", err);
                const msg = "Error loading doctor schedule.";
                Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [doctorId]);

    
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

            
            const isValid = checkDoctorAvailability(date, timeString);
            
            if (isValid) {
                setSelectedTime(time);
                setDisplayTime(timeString);
            } else {
                Alert.alert("Doctor Unavailable", "The doctor is not working or is on leave at this time. Please check the schedule.");
                setDisplayTime(""); 
            }
        }
    };

    
    const checkDoctorAvailability = (selectedDateStr, selectedTimeString) => {
        if (!selectedDateStr || doctorSchedule.length === 0) return true; 

        const selectedDate = new Date(selectedDateStr);

        
        const isOnLeave = doctorLeaves.some(leave => {
            const start = new Date(leave.start_date);
            const end = new Date(leave.end_date);
            const check = new Date(selectedDate);
            check.setHours(0,0,0,0);
            start.setHours(0,0,0,0);
            end.setHours(0,0,0,0);
            return check >= start && check <= end;
        });

        if (isOnLeave) return false;

        
        const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
        const shifts = doctorSchedule.filter(s => s.day_of_week === dayName && !s.is_closed);

        if (shifts.length === 0) return false; 

        
        return shifts.some(shift => {
            const shiftStart = shift.start_time.substring(0, 5);
            const shiftEnd = shift.end_time.substring(0, 5);
            return selectedTimeString >= shiftStart && selectedTimeString <= shiftEnd;
        });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await appointmentAPI.reschedule(id, {
                date: date,
                time_slot: displayTime + ":00" 
            });
            
            const msg = "Reschedule Successful!";
            if (Platform.OS === 'web') {
                window.alert(msg);
                router.replace('/patient/appointments');
            } else {
                Alert.alert("Success", msg, [
                    { text: "OK", onPress: () => router.replace('/patient/appointments') }
                ]);
            }
        } catch (err) {
            
            
            let errorMsg = "Could not reschedule";
            
            if (err.response?.data) {
                let data = err.response.data;
                if (data.error) data = data.error;

                if (typeof data === 'string') errorMsg = data;
                else if (typeof data === 'object') {
                    const keys = Object.keys(data);
                    if (keys.length > 0) errorMsg = `${keys[0]}: ${data[keys[0]]}`;
                }
            }
            
            Platform.OS === 'web' ? alert(errorMsg) : Alert.alert("Error", errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#ea580c"/></View>;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Reschedule</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    
                    <Text style={styles.title}>Choose New Time</Text>
                    <Text style={styles.subtitle}>Select a new date and time for your appointment.</Text>

                    
                    <Text style={styles.label}>New Date</Text>
                    <TouchableOpacity 
                        style={[styles.input, styles.rowInput]} 
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={date ? styles.inputText : styles.placeholderText}>
                            {date || "Select Date"}
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

                    
                    <Text style={styles.label}>New Time</Text>
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

                   
                    <TouchableOpacity 
                        style={[styles.submitBtn, (!displayTime || submitting) && styles.disabledBtn]} 
                        onPress={handleSubmit}
                        disabled={!displayTime || submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff"/> 
                        ) : (
                            <Text style={styles.submitBtnText}>Confirm Reschedule</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff7ed' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    backBtn: { marginRight: 15 },
    backText: { color: '#ea580c', fontSize: 16 }, 
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
    content: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#ea580c', marginBottom: 5 },
    subtitle: { fontSize: 14, color: '#4b5563', marginBottom: 25 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginTop: 15, marginBottom: 8 },
    
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 },
    rowInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    inputText: { color: '#1f2937', fontWeight: 'bold' },
    placeholderText: { color: '#9ca3af' },

    submitBtn: { backgroundColor: '#ea580c', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 30 },
    disabledBtn: { backgroundColor: '#fdba74' }, 
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

export default RescheduleScreen;