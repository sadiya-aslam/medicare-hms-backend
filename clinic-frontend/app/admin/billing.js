import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, ScrollView,
    StyleSheet,
    Text, TouchableOpacity,
    View,
    Platform
} from 'react-native';
import { appointmentAPI } from '../services/api';

const BillingScreen = () => {
    const { appointmentId } = useLocalSearchParams();
    const router = useRouter();

    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchBill();
    }, []);

    const fetchBill = async () => {
        try {
            const res = await appointmentAPI.getBill(appointmentId);
            setBill(res.data);
        } catch (err) {
            Alert.alert("Error", "Could not fetch bill details.");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (method) => {
    if (!bill) return;
    
    
    const processTransaction = async () => {
        setProcessing(true);
        try {
            const payload = {
                bill_id: bill.id,
                amount: bill.amount_due,
                method: method
            };
            
           
            
            await appointmentAPI.processPayment(payload);
            
            
            if (Platform.OS === 'web') {
                window.alert("Success: Payment Recorded! 💰");
            } else {
                Alert.alert("Success", "Payment Recorded! 💰");
            }
            
            fetchBill(); 
        } catch (err) {
            console.error(err);
            if (Platform.OS === 'web') {
                window.alert("Error: Payment failed.");
            } else {
                Alert.alert("Error", "Payment failed.");
            }
        } finally {
            setProcessing(false);
        }
    };

    
    if (Platform.OS === 'web') {
        
        const confirmed = window.confirm(`Collect ₹${bill.amount_due} via ${method}?`);
        if (confirmed) {
            processTransaction();
        }
    } else {
        
        Alert.alert(
            "Confirm Payment",
            `Collect ₹${bill.amount_due} via ${method}?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Confirm", onPress: processTransaction }
            ]
        );
    }
};

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb"/></View>;

    return (
        <View style={styles.container}>
            
            

            <ScrollView contentContainerStyle={styles.content}>
                
                
                <View style={styles.card}>
                    <Text style={styles.label}>Patient Name</Text>
                    <Text style={styles.value}>{bill?.patient_name}</Text>
                    
                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <Text style={styles.label}>Total Amount</Text>
                        <Text style={styles.price}>₹{bill?.amount}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.label}>Status</Text>
                        <Text style={[styles.status, { color: bill?.status === 'Paid' ? 'green' : 'red' }]}>
                            {bill?.status}
                        </Text>
                    </View>

                    {bill?.status === 'Unpaid' && (
                        <View style={styles.dueContainer}>
                            <Text style={styles.dueText}>Amount Due: ₹{bill?.amount_due}</Text>
                        </View>
                    )}
                </View>

                
                {bill?.status === 'Unpaid' ? (
                    <View style={styles.actions}>
                        <Text style={styles.sectionTitle}>Select Payment Method</Text>
                        
                        <TouchableOpacity 
                            style={[styles.payBtn, styles.cashBtn]} 
                            onPress={() => handlePayment('Cash')}
                            disabled={processing}
                        >
                            <Text style={styles.payText}>💵 Collect Cash</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.payBtn, styles.upiBtn]} 
                            onPress={() => handlePayment('UPI')}
                            disabled={processing}
                        >
                            <Text style={styles.payText}>📱 UPI / Online</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.successBox}>
                        <Text style={styles.successText}>✅ Bill Fully Paid</Text>
                    </View>
                )}

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
   

    content: { padding: 20 },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 2 },
    
    label: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
    value: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 15 },
    
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    price: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    status: { fontSize: 18, fontWeight: 'bold' },
    
    dueContainer: { marginTop: 10, padding: 10, backgroundColor: '#fee2e2', borderRadius: 8, alignItems: 'center' },
    dueText: { color: '#dc2626', fontWeight: 'bold', fontSize: 16 },

    actions: { marginTop: 10 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#374151' },
    
    payBtn: { padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
    cashBtn: { backgroundColor: '#16a34a' },
    upiBtn: { backgroundColor: '#2563eb' },
    payText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    successBox: { backgroundColor: '#dcfce7', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    successText: { color: '#16a34a', fontSize: 18, fontWeight: 'bold' }
});

export default BillingScreen;