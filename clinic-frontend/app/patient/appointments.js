import React, { useState, useEffect } from 'react';
import { 
    View, Text, TouchableOpacity, ScrollView, StyleSheet, 
    ActivityIndicator, Alert, Platform, RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { appointmentAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const MyAppointments = () => {
    const router = useRouter();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    
    const loadAppointments = async () => {
        try {
            const res = await appointmentAPI.getPatientAppointments();
            
            const listData = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setAppointments(listData);
            setError(null);
        } catch (err) {
            console.error("Failed to load history", err);
            setError("Could not load appointments.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    
    const handleCancel = async (id) => {
        try {
            await appointmentAPI.cancelAppointment(id);
            Platform.OS === 'web' ? alert("Cancelled!") : Alert.alert("Success", "Appointment Cancelled");
            loadAppointments(); 
        } catch (err) {
            const msg = err.response?.data?.error || "Cannot cancel past appointments";
            Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
        }
    };

    const confirmCancel = (id) => {
        if (Platform.OS === 'web') {
            if (window.confirm("Cancel this appointment?")) handleCancel(id);
        } else {
            Alert.alert("Confirm", "Cancel this appointment?", [
                { text: "No" }, { text: "Yes", onPress: () => handleCancel(id) }
            ]);
        }
    };

    
    const getStatusColor = (s) => s === 'Scheduled' ? '#16a34a' : s === 'Completed' ? '#2563eb' : '#dc2626';
    const getStatusBg = (s) => s === 'Scheduled' ? '#dcfce7' : s === 'Completed' ? '#dbeafe' : '#fee2e2';

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
                <Text style={styles.headerTitle}>My Appointments</Text>
            </View>

            <ScrollView 
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAppointments(); }} />}
            >
                {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : appointments.length === 0 ? (
                    <Text style={styles.emptyText}>No appointments found.</Text>
                ) : (
                    appointments.map((appt) => (
                        <View key={appt.id} style={styles.card}>
                            <View style={styles.cardTop}>
                                <View>
                                    <Text style={styles.dateText}>{appt.date}</Text>
                                    <Text style={styles.timeText}>{appt.time_slot.slice(0,5)}</Text>
                                </View>
                                <View style={[styles.badge, { backgroundColor: getStatusBg(appt.status) }]}>
                                    <Text style={{ color: getStatusColor(appt.status), fontWeight: 'bold' }}>{appt.status}</Text>
                                </View>
                            </View>

                            <Text style={styles.docName}>Dr. {appt.doctor_name}</Text>
                            <Text style={styles.serviceName}>{appt.service_name}</Text>

                            <View style={styles.actions}>
                                {appt.status === 'Scheduled' && (
                                    <>
                                        <TouchableOpacity onPress={() => router.push({ pathname: `/patient/reschedule/${appt.id}`, params: { doctorId: appt.doctor } })}>
                                            <Text style={styles.linkText}>Reschedule</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => confirmCancel(appt.id)}>
                                            <Text style={[styles.linkText, { color: '#dc2626' }]}>Cancel</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {appt.status === 'Completed' && (
                                    <TouchableOpacity 
                                        style={styles.rateBtn}
                                        onPress={() => router.push({
                                            pathname: '/patient/feedback',
                                            params: { 
                                                appointmentId: appt.id, 
                                                doctorName: appt.doctor_name || "Doctor"
                                            }
                                        })}
                                    >
                                        <Ionicons name="star" size={14} color="white" style={{marginRight: 4}} />
                                        <Text style={styles.rateBtnText}>Rate Visit</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center' },
    backText: { color: '#2563eb', fontSize: 16, marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 15 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    dateText: { fontSize: 16, fontWeight: 'bold' },
    timeText: { color: '#6b7280' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    docName: { fontSize: 16, fontWeight: '600' },
    serviceName: { color: '#6b7280', marginBottom: 10 },
    
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, alignItems: 'center' }, // Added alignItems
    linkText: { fontWeight: 'bold', color: '#ea580c' },
    
    rateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fbbf24', 
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    rateBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },

    emptyText: { textAlign: 'center', marginTop: 50, color: '#6b7280' },
    errorText: { textAlign: 'center', color: 'red', marginTop: 20 }
});

export default MyAppointments;