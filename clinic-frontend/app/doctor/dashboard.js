import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import api from '../services/api';

const DoctorDashboard = () => {
    const router = useRouter();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [doctorName, setDoctorName] = useState("");

    useEffect(() => {
        loadData();
        loadUser();
    }, []);

    const loadUser = async () => {
        const email = await AsyncStorage.getItem("user_email");
        if (email) setDoctorName(email);
    };

    const loadData = async () => {
        try {
            console.log("Fetching today's appointments...");
            
            
            const res = await api.get('/api/appointments/doctor/appointments?date=today'); 
            
            console.log("SERVER RESPONSE:", res.data);

            let validData = [];
            if (Array.isArray(res.data)) {
                validData = res.data;
            } else if (res.data && Array.isArray(res.data.results)) {
                validData = res.data.results;
            } else {
                console.warn("Unexpected data format received:", res.data);
            }

            setAppointments(validData);
            
        } catch (err) {
            console.error("Failed to load data", err);
            if (err.response) {
                console.log("Error Detail:", err.response.data);
            }
            Alert.alert("Error", "Could not load appointments.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace('/login');
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const renderAppointmentCard = ({ item }) => {
        if (!item) return null;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.dateText}>{item.date || "No Date"}</Text>
                    <Text style={styles.timeText}>
                        {item.time_slot ? item.time_slot.slice(0, 5) : "--:--"}
                    </Text>
                </View>

                <View style={styles.cardBody}>
                    <Text style={styles.patientName}>{item.patient_name || "Unknown Patient"}</Text>
                    <Text style={styles.patientEmail}>{item.patient_email || "No Email"}</Text>
                    <Text style={styles.reason} numberOfLines={2}>
                        Reason: {item.reason_for_visit || "None provided"}
                    </Text>
                </View>

                <View style={styles.cardFooter}>
                    <View style={[
                        styles.statusBadge, 
                        item.status === 'Scheduled' ? styles.statusGreen : 
                        item.status === 'Completed' ? styles.statusBlue : styles.statusGray
                    ]}>
                        <Text style={styles.statusText}>{item.status || "Unknown"}</Text>
                    </View>

                    {item.status === 'Scheduled' && (
                        <TouchableOpacity 
                            style={styles.actionBtn}
                            onPress={() => router.push(`/doctor/prescription/${item.id}`)}
                        >
                            <Text style={styles.actionBtnText}>Prescribe</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            
            <View style={styles.navbar}>
                <View>
                    <Text style={styles.navTitle}>Doctor Portal</Text>
                    <Text style={styles.navSubtitle}>{doctorName ? `Dr. ${doctorName}` : "Welcome"}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            
            <View style={styles.buttonRow}>
                <TouchableOpacity 
                    style={[styles.menuBtn, { backgroundColor: '#2563eb' }]}
                    onPress={() => router.push('/doctor/schedule')}
                >
                    <Text style={styles.menuBtnText}>Schedule</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.menuBtn, { backgroundColor: '#ef4444' }]}
                    onPress={() => router.push('/doctor/leaves')}
                >
                    <Text style={styles.menuBtnText}>Leaves</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.menuBtn, { backgroundColor: '#4b5563' }]} 
                    onPress={() => router.push('/doctor/profile')}
                >
                    <Text style={styles.menuBtnText}>Profile</Text>
                </TouchableOpacity>
            </View>

            
            <Text style={styles.sectionTitle}>Today's Appointments</Text>
            
            {loading ? (
                <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={appointments}
                    renderItem={renderAppointmentCard}
                    keyExtractor={(item, index) => item?.id ? item.id.toString() : `fallback-${index}`}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No appointments for today.</Text>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    
    
    navbar: { 
        backgroundColor: '#fff', 
        padding: 20, 
        paddingTop: 50, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5
    },
    navTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e40af' },
    navSubtitle: { fontSize: 14, color: '#6b7280' },
    logoutBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    logoutText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    
    buttonRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 15 },
    menuBtn: { flex: 1, marginHorizontal: 5, padding: 12, borderRadius: 8, alignItems: 'center' },
    menuBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 10, color: '#1f2937' },
    listContent: { paddingHorizontal: 16, paddingBottom: 20 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#9ca3af' },

    
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    dateText: { fontWeight: 'bold', color: '#374151' },
    timeText: { color: '#6b7280' },
    
    cardBody: { marginBottom: 12 },
    patientName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    patientEmail: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
    reason: { fontSize: 14, color: '#4b5563', fontStyle: 'italic' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
    
    
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusGreen: { backgroundColor: '#dcfce7' }, 
    statusBlue: { backgroundColor: '#dbeafe' }, 
    statusGray: { backgroundColor: '#f3f4f6' },
    statusText: { fontSize: 12, fontWeight: 'bold', color: '#374151' },

    
    actionBtn: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
});

export default DoctorDashboard;