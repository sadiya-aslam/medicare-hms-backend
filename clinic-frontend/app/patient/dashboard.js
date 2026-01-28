import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    StyleSheet, 
    Alert, 
    Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const PatientDashboard = () => {
    const router = useRouter();
    const [userName, setUserName] = useState('Patient');

    useEffect(() => {
        const getUser = async () => {
            const email = await AsyncStorage.getItem('user_email');
            if (email) setUserName(email);
        };
        getUser();
    }, []);

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('access_token');
            await AsyncStorage.removeItem('refresh_token');
            await AsyncStorage.removeItem('user_role');
            await AsyncStorage.removeItem('user_email'); 
            await AsyncStorage.removeItem('user_id');
            
            router.replace('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const confirmLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to log out?")) {
                handleLogout();
            }
        } else {
            Alert.alert("Logout", "Are you sure you want to log out?", [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: handleLogout }
            ]);
        }
    };

    const DashboardCard = ({ title, description, icon, color, route }) => (
        <TouchableOpacity 
            style={[styles.card, { borderLeftColor: color }]} 
            onPress={() => router.push(route)}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: color + '20' }]}> 
                    <Ionicons name={icon} size={24} color={color} />
                </View>
                <Text style={styles.cardTitle}>{title}</Text>
            </View>
            <Text style={styles.cardDesc}>{description}</Text>
            <Text style={[styles.cardLink, { color: color }]}>Open &rarr;</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.appName}>Clinic App</Text>
                    <Text style={styles.welcomeText} numberOfLines={1}>
                        Welcome, {userName}
                    </Text>
                </View>

                <View style={styles.headerIcons}>
                    <TouchableOpacity onPress={() => router.push('/patient/profile')} style={styles.iconBtn}>
                        <Ionicons name="person-circle-outline" size={32} color="#4b5563" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={confirmLogout} style={styles.logoutBtn}>
                        <Ionicons name="log-out-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Dashboard</Text>
                
                <View style={styles.grid}>
                    <DashboardCard 
                        title="Book Appointment" 
                        description="schedule a visit with Dr. Prashant Mahajan."
                        icon="calendar"
                        color="#2563eb" // Blue
                        route="/patient/book" 
                    />

                    <DashboardCard 
                        title="My History" 
                        description="View upcoming visits and past history."
                        icon="time"
                        color="#10b981" // Green
                        route="/patient/appointments"
                    />

                    <DashboardCard 
                        title="Billing History" 
                        description="View invoices and payment status."
                        icon="receipt"
                        color="#f59e0b" 
                        route="/patient/bills"
                    />

                    <DashboardCard 
                        title="Prescriptions" 
                        description="View past prescriptions and notes."
                        icon="medkit"
                        color="#8b5cf6" 
                        route="/patient/prescriptions"
                    />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    
    header: { 
        backgroundColor: '#fff', 
        paddingTop: 50, 
        paddingBottom: 20, 
        paddingHorizontal: 20, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5
    },
    appName: { fontSize: 22, fontWeight: 'bold', color: '#2563eb' }, // Slightly bigger
    welcomeText: { fontSize: 14, color: '#6b7280', marginTop: 4 }, // Added margin
    
    headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    iconBtn: { padding: 5 },
    logoutBtn: { backgroundColor: '#ef4444', padding: 8, borderRadius: 8 },

    content: { padding: 20 },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 20 },

    grid: { gap: 15 },

    card: { 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        padding: 20, 
        elevation: 2,
        borderLeftWidth: 5,
        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    iconBox: { padding: 8, borderRadius: 8, marginRight: 12 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    cardDesc: { color: '#6b7280', fontSize: 14, marginBottom: 15 },
    cardLink: { fontWeight: 'bold', fontSize: 14 },
}); 

export default PatientDashboard;