import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import api from '../services/api';

const ApproveDoctorsScreen = () => {
    const router = useRouter();
    const [pendingDoctors, setPendingDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchPendingDoctors();
        }, [])
    );

    const fetchPendingDoctors = async () => {
        try {
            
            const res = await api.get('/api/core/admin/pending-doctors/');
            setPendingDoctors(res.data);
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to load pending approvals.");
        } finally {
            setLoading(false);
        }
    };

    
    const handleApprove = (doctor) => {
        const confirmAction = async () => {
            try {
                await api.post(`/api/core/admin/approve-doctor/${doctor.id}/`);
                
                const msg = `Dr. ${doctor.full_name} has been approved! ✅`;
                
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert("Success", msg);
                
                fetchPendingDoctors(); 
            } catch (err) {
                console.error("Approval Error:", err);
                Alert.alert("Error", "Could not approve doctor.");
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Approve Dr. ${doctor.full_name}?`)) {
                confirmAction();
            }
        } else {
            Alert.alert(
                "Confirm Approval",
                `Are you sure you want to approve Dr. ${doctor.full_name}?`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Approve", onPress: confirmAction }
                ]
            );
        }
    };

    
    const handleReject = (doctor) => {
        const confirmAction = async () => {
            try {
                
                await api.delete(`/api/core/admin/reject_doctor/${doctor.id}/`);
                
                const msg = `Application rejected for Dr. ${doctor.full_name}. Account deleted. 🗑️`;

                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert("Rejected", msg);

                fetchPendingDoctors(); 
            } catch (err) {
                console.error("Reject Error:", err);
                Alert.alert("Error", "Failed to reject doctor.");
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Are you sure you want to REJECT and DELETE Dr. ${doctor.full_name}?`)) {
                confirmAction();
            }
        } else {
            Alert.alert(
                "Reject Application",
                `Are you sure you want to reject Dr. ${doctor.full_name}? This will delete their account permanently.`,
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Reject & Delete", 
                        style: "destructive", 
                        onPress: confirmAction 
                    }
                ]
            );
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.info}>
                <Text style={styles.name}>Dr. {item.full_name}</Text>
                <Text style={styles.details}>{item.email}</Text>
                <Text style={styles.details}>Qual: {item.qualification}</Text>
            </View>
            
            
            <View style={styles.actionsContainer}>
                
                <TouchableOpacity 
                    style={styles.rejectBtn} 
                    onPress={() => handleReject(item)}
                >
                    <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>

                
                <TouchableOpacity 
                    style={styles.approveBtn} 
                    onPress={() => handleApprove(item)}
                >
                    <Text style={styles.btnText}>Approve</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" style={{marginLeft: 4}} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pending Approvals</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#2563eb" style={{marginTop: 50}} />
            ) : pendingDoctors.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-done-circle-outline" size={80} color="#d1d5db" />
                    <Text style={styles.emptyText}>All caught up! No pending requests.</Text>
                </View>
            ) : (
                <FlatList 
                    data={pendingDoctors}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 20 }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#1f2937', elevation: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginLeft: 15 },
    
    
    card: { 
        backgroundColor: '#fff', 
        padding: 20, 
        borderRadius: 12, 
        marginBottom: 15, 
        elevation: 3,
        
    },
    info: { marginBottom: 15 },
    name: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
    details: { color: '#6b7280', fontSize: 14 },

    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 15
    },

    rejectBtn: { 
        backgroundColor: '#ef4444', 
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        borderRadius: 8, 
        flexDirection: 'row', 
        alignItems: 'center',
        justifyContent: 'center'
    },
    approveBtn: { 
        backgroundColor: '#16a34a', 
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        borderRadius: 8, 
        flexDirection: 'row', 
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { marginTop: 10, color: '#9ca3af', fontSize: 16 }
});

export default ApproveDoctorsScreen;