import { Ionicons } from '@expo/vector-icons'; 
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { appointmentAPI } from '../services/api';

const ManageSchedule = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    
    const [selections, setSelections] = useState({});

    useEffect(() => {
        loadSchedule();
    }, []);

    const loadSchedule = async () => {
        try {
            const res = await appointmentAPI.getMySchedule();
            const fetchedData = res.data; 
            
            const newSelections = {};
            fetchedData.forEach(item => {
                if (item.is_closed || item.shift === 'Closed') {
                    newSelections[`${item.day_of_week}-Closed`] = true;
                } else {
                    newSelections[`${item.day_of_week}-${item.shift}`] = true;
                }
            });
            setSelections(newSelections);
        } catch (err) {
            console.error(err);
            if (Platform.OS === 'web') alert("Failed to load schedule");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (day, type) => {
        
        if (type === 'Closed') {
            const isClosing = !selections[`${day}-Closed`];
            setSelections(prev => ({
                ...prev,
                [`${day}-Closed`]: isClosing,
                [`${day}-Morning`]: isClosing ? false : prev[`${day}-Morning`], 
                [`${day}-Evening`]: isClosing ? false : prev[`${day}-Evening`]
            }));
        } else {
            
            setSelections(prev => ({
                ...prev,
                [`${day}-${type}`]: !prev[`${day}-${type}`],
                [`${day}-Closed`]: false 
            }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const payload = [];
        
        days.forEach(day => {
            if (selections[`${day}-Closed`]) {
                payload.push({ day_of_week: day, shift: 'Closed', is_closed: true });
            } else {
                if (selections[`${day}-Morning`]) payload.push({ day_of_week: day, shift: 'Morning', is_closed: false });
                if (selections[`${day}-Evening`]) payload.push({ day_of_week: day, shift: 'Evening', is_closed: false });
            }
        });

        try {
            await appointmentAPI.saveMySchedule(payload);
            
            const msg = "Schedule Saved Successfully!";
            if (Platform.OS === 'web') {
                window.alert(msg);
                router.replace('/doctor/dashboard');
            } else {
                Alert.alert("Success", msg, [
                    { text: "OK", onPress: () => router.replace('/doctor/dashboard') }
                ]);
            }
        } catch (err) {
            console.error(err);
            const errorMsg = "Error saving schedule";
            if (Platform.OS === 'web') {
                alert(errorMsg);
            } else {
                Alert.alert("Error", errorMsg);
            }
        } finally {
            setSaving(false);
        }
    };

    
    const Checkbox = ({ label, checked, onPress, color = "#2563eb", subLabel }) => (
        <TouchableOpacity onPress={onPress} style={styles.checkboxRow}>
            <Ionicons 
                name={checked ? "checkbox" : "square-outline"} 
                size={24} 
                color={checked ? color : "#9ca3af"} 
            />
            <View style={{ marginLeft: 10 }}>
                <Text style={[styles.checkboxLabel, checked && { color: color, fontWeight: 'bold' }]}>
                    {label}
                </Text>
                {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={{ marginTop: 10 }}>Loading Schedule...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Weekly Schedule</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.description}>
                    Set your availability. Mark days as 'Closed' to prevent bookings.
                </Text>

                {days.map(day => {
                    const isClosed = !!selections[`${day}-Closed`];

                    return (
                        <View key={day} style={[styles.card, isClosed && styles.cardClosed]}>
                            
                            <View style={styles.cardHeader}>
                                <Text style={[styles.dayTitle, isClosed && styles.textClosed]}>{day}</Text>
                                
                                <TouchableOpacity 
                                    onPress={() => toggleSelection(day, 'Closed')}
                                    style={styles.closedToggle}
                                >
                                    <Text style={[styles.closedLabel, isClosed && { color: '#dc2626' }]}>CLOSED</Text>
                                    <Ionicons 
                                        name={isClosed ? "checkbox" : "square-outline"} 
                                        size={20} 
                                        color={isClosed ? "#dc2626" : "#9ca3af"} 
                                    />
                                </TouchableOpacity>
                            </View>

                            
                            <View style={[styles.shiftsContainer, isClosed && styles.disabledContent]}>
                                <Checkbox 
                                    label="Morning" 
                                    subLabel="10:00 AM - 01:00 PM"
                                    checked={!!selections[`${day}-Morning`]}
                                    onPress={() => !isClosed && toggleSelection(day, 'Morning')}
                                />
                                <View style={styles.divider} />
                                <Checkbox 
                                    label="Evening" 
                                    subLabel="05:00 PM - 10:00 PM"
                                    checked={!!selections[`${day}-Evening`]}
                                    onPress={() => !isClosed && toggleSelection(day, 'Evening')}
                                />
                            </View>
                        </View>
                    );
                })}

                
                <TouchableOpacity 
                    style={[styles.saveBtn, saving && styles.disabledBtn]} 
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Schedule</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} /> 
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    
    header: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    backBtn: { marginRight: 15 },
    backText: { color: '#2563eb', fontSize: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },

    scrollContent: { padding: 20 },
    description: { color: '#6b7280', marginBottom: 20, fontSize: 14 },

    
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
    cardClosed: { backgroundColor: '#fef2f2', borderColor: '#fee2e2', borderWidth: 1 },
    
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    dayTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    textClosed: { color: '#dc2626' },

    closedToggle: { flexDirection: 'row', alignItems: 'center' },
    closedLabel: { marginRight: 6, fontSize: 12, fontWeight: 'bold', color: '#9ca3af' },

    shiftsContainer: { marginTop: 5 },
    disabledContent: { opacity: 0.4 },

    
    checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    checkboxLabel: { fontSize: 16, color: '#374151' },
    subLabel: { fontSize: 12, color: '#9ca3af' },
    divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 4 },

    
    saveBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    disabledBtn: { backgroundColor: '#93c5fd' },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

export default ManageSchedule;