import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { appointmentAPI } from '../../services/api';

const SelectDoctor = () => {
    const router = useRouter();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const res = await appointmentAPI.getDoctorsList(); 
            console.log("DOCTOR DATA FROM SERVER:", JSON.stringify(res.data, null, 2));
            
            
            const doctorsList = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setDoctors(doctorsList);
            
        } catch (err) {
            console.error(err);
            setError("Failed to load doctors.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDoctor = (userId) => {
        
        router.push(`/patient/book/${userId}`);
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={{marginTop: 10}}>Finding Doctors...</Text>
        </View>
    );

    if (error) return (
        <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchDoctors} style={styles.retryBtn}>
                <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            
            

            <ScrollView contentContainerStyle={styles.content}>
                
                {doctors.length === 0 ? (
                    <Text style={styles.emptyText}>No doctors available at the moment.</Text>
                ) : (
                    <View style={styles.grid}>
                        {doctors.map((doc) => (
                            <View key={doc.id || doc.user} style={styles.card}>
                                
                                <View style={styles.cardHeader}>
                                    <View style={styles.avatarContainer}>
                                        <Ionicons name="person" size={30} color="#2563eb" />
                                    </View>
                                    <View style={{flex: 1}}>
                                        <Text style={styles.docName}>Dr. {doc.first_name} {doc.last_name}</Text>
                                        <Text style={styles.docSpeciality}>{doc.qualification}</Text>
                                    </View>
                                </View>

                                
                                <View style={styles.infoSection}>
                                    <Text style={styles.infoText}>{doc.experience_years} years experience</Text>
                                    <Text style={styles.bioText} numberOfLines={2}>
                                        {doc.bio || "No biography available for this doctor."}
                                    </Text>
                                </View>

                                
                                <View style={styles.cardFooter}>
                                    <View style={styles.feeBox}>
                                        <Text style={styles.feeLabel}>Consultation Fee</Text>
                                        <Text style={styles.feeValue}>Rs. {doc.consultation_fee}</Text>
                                    </View>
                                    
                                    <TouchableOpacity 
                                        style={styles.bookBtn}
                                        
                                        onPress={() => handleSelectDoctor(doc.user)} 
                                    >
                                        <Text style={styles.bookBtnText}>Book Now</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
                
                <View style={{height: 40}} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    
    content: { padding: 20 },
    grid: { gap: 15 }, 

    errorText: { color: '#dc2626', fontSize: 16, marginBottom: 15 },
    retryBtn: { padding: 10, backgroundColor: '#e5e7eb', borderRadius: 8 },
    retryText: { fontWeight: 'bold' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#6b7280' },

    
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2, marginBottom: 5 },
    
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    docName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    docSpeciality: { color: '#2563eb', fontWeight: '600' },

    infoSection: { marginBottom: 15 },
    infoText: { color: '#4b5563', fontSize: 14, marginBottom: 4 },
    bioText: { color: '#9ca3af', fontSize: 13, fontStyle: 'italic' },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
    feeBox: {},
    feeLabel: { fontSize: 12, color: '#6b7280' },
    feeValue: { fontSize: 16, fontWeight: 'bold', color: '#059669' },

    bookBtn: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
    bookBtnText: { color: '#fff', fontWeight: 'bold' },
});

export default SelectDoctor;