import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import api, { appointmentAPI } from '../services/api';

const AdminDashboard = () => {
    const router = useRouter();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [resetModalVisible, setResetModalVisible] = useState(false);
    const [targetEmail, setTargetEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchTodaysQueue();
        }, [])
    );

    const fetchTodaysQueue = async () => {
        try {
            const res = await appointmentAPI.getAdminQueue();
            let list = Array.isArray(res.data) ? res.data : (res.data.results || []);
            const activeAppointments = list.filter(item => item.status !== 'Cancelled');

            setAppointments(activeAppointments);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAdminReset = async () => {
        if (!targetEmail || !newPassword) {
            Alert.alert("Error", "Please fill in both fields");
            return;
        }

        try {
            await api.post('/api/core/admin/reset-password/', {
                email: targetEmail,
                new_password: newPassword
            });
            Alert.alert("Success", `Password for ${targetEmail} has been reset.`);
            setResetModalVisible(false);
            setTargetEmail('');
            setNewPassword('');
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || "Failed to reset password";
            Alert.alert("Error", msg);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.time}>{item.time_slot}</Text>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.badgeText}>{item.status}</Text>
                </View>
            </View>

            <Text style={styles.patientName}>{item.patient_name}</Text>
            <Text style={styles.doctorName}>Dr. {item.doctor_name}</Text>
            <Text style={styles.serviceName}>{item.service_name}</Text>

            <View style={styles.actions}>
                <TouchableOpacity 
                    style={styles.billBtn} 
                    onPress={() => router.push({ 
                        pathname: '/admin/billing', 
                        params: { appointmentId: item.id } 
                    })}
                >
                    <Text style={styles.btnText}>Billing 💵</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const getStatusColor = (s) => {
        if (s === 'Scheduled') return '#dcfce7'; 
        if (s === 'Checked-In') return '#fef9c3'; 
        if (s === 'Completed') return '#dbeafe'; 
        return '#f3f4f6';
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb"/></View>;

    return (
        <View style={styles.container}>
            
            <View style={styles.header}>
                
                <View>
                    <Text style={styles.title}>Reception Desk</Text>
                    <Text style={styles.subtitle}>Today's Appointments</Text>
                </View>

                
                <View style={styles.actionRow}>
                    
                    
                    <TouchableOpacity 
                        style={[styles.topMenuBtn, { backgroundColor: '#16a34a', borderColor: '#15803d' }]} 
                        onPress={() => router.push('/admin/approve_doctors')}
                    >
                        <Ionicons name="person-add" size={20} color="#fff" />
                    </TouchableOpacity>

                    
                    <TouchableOpacity 
                        style={[styles.topMenuBtn, { backgroundColor: '#dc2626', borderColor: '#b91c1c' }]} 
                        onPress={() => setResetModalVisible(true)}
                    >
                        <Ionicons name="key" size={20} color="#fff" />
                    </TouchableOpacity>

                    
                    <TouchableOpacity 
                        style={styles.topMenuBtn} 
                        onPress={() => router.push('/admin/services')}
                    >
                        <Ionicons name="pricetags" size={20} color="#fff" />
                    </TouchableOpacity>

                    
                    <TouchableOpacity 
                        style={styles.topMenuBtn} 
                        onPress={() => router.push('/admin/leaves')}
                    >
                        <Ionicons name="calendar" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
            
            <FlatList 
                data={appointments}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchTodaysQueue();}} />}
                ListEmptyComponent={<Text style={styles.emptyText}>No appointments for today.</Text>}
            />

            
            <Modal visible={resetModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reset User Password</Text>
                        
                        <Text style={styles.label}>User Email</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="e.g. doctor@hospital.com" 
                            value={targetEmail}
                            onChangeText={setTargetEmail}
                            autoCapitalize="none"
                        />
                        
                        <Text style={styles.label}>New Password</Text>
                        
                        
                        <View style={styles.passwordContainer}>
                            <TextInput 
                                style={styles.passwordInput} 
                                placeholder="Enter new password" 
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showPassword} 
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons 
                                    name={showPassword ? "eye" : "eye-off"} 
                                    size={20} 
                                    color="#6b7280" 
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                onPress={() => setResetModalVisible(false)} 
                                style={styles.cancelBtn}
                            >
                                <Text style={styles.btnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={handleAdminReset} 
                                style={styles.saveBtn}
                            >
                                <Text style={styles.btnText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    
    header: { 
        backgroundColor: '#1f2937', 
        paddingHorizontal: 20,
        paddingTop: 60, 
        paddingBottom: 25,
        
    },
    title: { 
        color: '#fff', 
        fontSize: 28, 
        fontWeight: 'bold' 
    }, 
    subtitle: { 
        color: '#9ca3af', 
        fontSize: 14,
        marginTop: 4 
    },

    
    actionRow: {
        flexDirection: 'row',
        gap: 15, 
        marginTop: 20 
    },

    topMenuBtn: {
        backgroundColor: '#374151',
        padding: 0, 
        borderRadius: 12, 
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#4b5563',
        width: 50,  
        height: 50
    },
    
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    time: { fontWeight: 'bold', fontSize: 16, color: '#2563eb' },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    
    patientName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    doctorName: { color: '#6b7280' },
    serviceName: { color: '#9ca3af', fontSize: 12, marginBottom: 10 },
    
    actions: { flexDirection: 'row', marginTop: 10, gap: 10 },
    billBtn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    
    emptyText: { textAlign: 'center', marginTop: 50, color: '#6b7280' },

    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 12, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#111827' },
    label: { fontWeight: '600', marginTop: 10, marginBottom: 5, color: '#374151' },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16 },
    modalButtons: { flexDirection: 'row', marginTop: 20, justifyContent: 'space-between', gap: 10 },
    cancelBtn: { backgroundColor: '#9ca3af', flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
    saveBtn: { backgroundColor: '#dc2626', flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 50, 
    },
    passwordInput: {
        flex: 1, 
        height: '100%',
        fontSize: 16,
    }
});

export default AdminDashboard;