import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, FlatList, ActivityIndicator, 
    RefreshControl, TouchableOpacity, LayoutAnimation, Platform, UIManager 
} from 'react-native';
import { useRouter } from 'expo-router';
import { appointmentAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MyBills = () => {
    const router = useRouter();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedBillId, setExpandedBillId] = useState(null); 

    const loadBills = async () => {
        try {
            const res = await appointmentAPI.getBills();
            const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setBills(list);
        } catch (err) {
            console.error("Failed to load bills", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadBills();
    }, []);

    const toggleExpand = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedBillId(expandedBillId === id ? null : id);
    };

    const renderBill = ({ item }) => {
        const isExpanded = expandedBillId === item.id;
        
        return (
            <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => toggleExpand(item.id)}
                style={styles.card}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.date}>{item.date}</Text>
                    <View style={[
                        styles.badge, 
                        { backgroundColor: item.status === 'Paid' ? '#dcfce7' : '#fee2e2' }
                    ]}>
                        <Text style={{ 
                            color: item.status === 'Paid' ? '#16a34a' : '#dc2626', 
                            fontWeight: 'bold', fontSize: 12 
                        }}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <View>
                        <Text style={styles.serviceName}>{item.service_name}</Text>
                        <Text style={styles.doctorName}>Dr. {item.doctor_name}</Text>
                    </View>
                    <Text style={styles.totalAmount}>Rs. {item.amount}</Text>
                </View>

                <View style={styles.footer}>
                    {parseFloat(item.amount_due) > 0 ? (
                        <Text style={styles.dueText}>Due: Rs. {item.amount_due}</Text>
                    ) : (
                        <Text style={styles.paidText}>Fully Paid ✅</Text>
                    )}
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#9ca3af" />
                </View>

                {isExpanded && (
                    <View style={styles.expandedSection}>
                        <View style={styles.divider} />
                        <Text style={styles.historyTitle}>Payment History</Text>
                        
                        {item.payments && item.payments.length > 0 ? (
                            item.payments.map((pay, index) => (
                                <View key={index} style={styles.paymentRow}>
                                    <View style={{flexDirection:'row', alignItems:'center'}}>
                                        <Ionicons name="card-outline" size={16} color="#4b5563" />
                                        <Text style={styles.payMethod}> {pay.payment_method}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.payAmount}>Rs. {pay.amount_paid}</Text>
                                        <Text style={styles.payDate}>{new Date(pay.payment_date).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noHistory}>No payments recorded yet.</Text>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb"/></View>;

    return (
        <View style={styles.container}>
            

            <FlatList
                data={bills}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderBill}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); loadBills();}} />}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={{color: '#9ca3af', marginTop: 50}}>No bills found.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20 },

    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 15, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    date: { color: '#6b7280', fontSize: 14 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    serviceName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
    doctorName: { fontSize: 14, color: '#6b7280' },
    totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },

    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dueText: { color: '#dc2626', fontWeight: 'bold' },
    paidText: { color: '#16a34a', fontWeight: '600' },

    expandedSection: { marginTop: 10 },
    divider: { height: 1, backgroundColor: '#e5e7eb', marginBottom: 10 },
    historyTitle: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
    payMethod: { color: '#4b5563' },
    payAmount: { fontWeight: 'bold', color: '#1f2937', textAlign: 'right' },
    payDate: { fontSize: 10, color: '#9ca3af', textAlign: 'right' },
    noHistory: { fontStyle: 'italic', color: '#9ca3af', fontSize: 12 }
});

export default MyBills;