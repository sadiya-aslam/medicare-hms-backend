import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { appointmentAPI } from '../services/api';

const Prescriptions = () => {
    const router = useRouter();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await appointmentAPI.getPrescriptions();
                const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
                setList(data);
            } catch(e) { console.error(e); } 
            finally { setLoading(false); }
        };
        fetchHistory();
    }, []);

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.doctor}>Dr. {item.doctor_name}</Text>
                <Text style={styles.date}>{item.date}</Text>
            </View>
            <Text style={styles.reason}>Reason: {item.reason_for_visit}</Text>
            
            <View style={styles.medicineList}>
                {item.items.map((med, index) => (
                    <View key={index} style={styles.medRow}>
                        <Text style={styles.medName}>• {med.medicine_name} ({med.dosage})</Text>
                        <Text style={styles.medFreq}>{med.frequency} - {med.duration}</Text>
                        {med.instructions && <Text style={styles.instr}>{med.instructions}</Text>}
                    </View>
                ))}
            </View>
            
            {item.notes && <Text style={styles.notes}>Note: {item.notes}</Text>}
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb"/></View>;

    return (
        <View style={styles.container}>
            
            <FlatList 
                data={list} 
                renderItem={renderItem} 
                contentContainerStyle={{padding: 20}}
                ListEmptyComponent={<Text style={{textAlign:'center', marginTop: 50, color:'#888'}}>No records found.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topBar: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center' },
    back: { color: '#2563eb', fontSize: 16, marginRight: 15 },
    title: { fontSize: 20, fontWeight: 'bold' },
    
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    doctor: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
    date: { color: '#6b7280' },
    reason: { fontStyle: 'italic', marginBottom: 10, color: '#4b5563' },
    
    medicineList: { backgroundColor: '#f9fafb', padding: 10, borderRadius: 8 },
    medRow: { marginBottom: 8 },
    medName: { fontWeight: 'bold', color: '#374151' },
    medFreq: { fontSize: 12, color: '#6b7280' },
    instr: { fontSize: 12, color: '#2563eb' },
    notes: { marginTop: 10, fontSize: 12, color: '#6b7280' }
});

export default Prescriptions;