import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    StyleSheet, 
    ActivityIndicator, 
    Alert, 
    Platform,
    KeyboardAvoidingView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { appointmentAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

import DateTimePicker from '@react-native-community/datetimepicker';

const ManageLeave = () => {
    const router = useRouter();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState(null); 
    
    
    const getPickerDate = () => {
        if (pickerMode === 'start' && formData.start_date) return new Date(formData.start_date);
        if (pickerMode === 'end' && formData.end_date) return new Date(formData.end_date);
        return new Date();
    };

    const [formData, setFormData] = useState({
        start_date: '',
        end_date: '',
        reason: ''
    });

    useEffect(() => {
        loadLeaves();
    }, []);

    const loadLeaves = async () => {
        try {
            const res = await appointmentAPI.getMyLeaves();
            setLeaves(res.data);
        } catch (err) {
            console.error("Failed to load leaves", err);
        } finally {
            setLoading(false);
        }
    };

    
    const handleDateChange = (event, selectedDate) => {
        setShowPicker(false); 
        if (selectedDate) {
            const formattedDate = selectedDate.toISOString().split('T')[0]; 
            
            if (pickerMode === 'start') {
                setFormData({ ...formData, start_date: formattedDate });
            } else if (pickerMode === 'end') {
                
                if (formData.start_date && formattedDate < formData.start_date) {
                    Alert.alert("Invalid Date", "End date cannot be before start date.");
                    return;
                }
                setFormData({ ...formData, end_date: formattedDate });
            }
        }
        setPickerMode(null);
    };

    
    const openDatePicker = (mode) => {
        setPickerMode(mode);
        setShowPicker(true);
    };

    const handleSubmit = async () => {
        if (!formData.start_date || !formData.end_date || !formData.reason) {
            const msg = "Please fill in all fields.";
            if (Platform.OS === 'web') alert(msg);
            else Alert.alert("Error", msg);
            return;
        }

        setSubmitting(true);
        try {
            await appointmentAPI.addLeave(formData);
            
            const msg = "Leave Added Successfully";
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert("Success", msg);

            setFormData({ start_date: '', end_date: '', reason: '' }); 
            loadLeaves(); 
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to add leave";
            if (Platform.OS === 'web') alert("Error: " + errorMsg);
            else Alert.alert("Error", errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = (id) => {
        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to delete this leave?")) {
                handleDelete(id);
            }
        } else {
            Alert.alert(
                "Confirm Delete",
                "Are you sure you want to delete this leave?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: 'destructive', onPress: () => handleDelete(id) }
                ]
            );
        }
    };

    const handleDelete = async (id) => {
        try {
            await appointmentAPI.deleteLeave(id);
            loadLeaves();
        } catch (err) {
            const msg = "Failed to delete leave";
            if (Platform.OS === 'web') alert(msg);
            else Alert.alert("Error", msg);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={{ flex: 1 }}
        >
            <View style={styles.container}>
                
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Manage Leaves</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    
                    
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Add Time Off</Text>
                        
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={styles.label}>Start Date</Text>
                                
                                <TouchableOpacity 
                                    style={styles.dateInput}
                                    onPress={() => openDatePicker('start')}
                                >
                                    <Text style={formData.start_date ? styles.inputText : styles.placeholderText}>
                                        {formData.start_date || "Select Date"}
                                    </Text>
                                    <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.halfInput}>
                                <Text style={styles.label}>End Date</Text>
                                
                                <TouchableOpacity 
                                    style={styles.dateInput}
                                    onPress={() => openDatePicker('end')}
                                >
                                    <Text style={formData.end_date ? styles.inputText : styles.placeholderText}>
                                        {formData.end_date || "Select Date"}
                                    </Text>
                                    <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        
                        {showPicker && (
                            <DateTimePicker
                                value={getPickerDate()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                minimumDate={new Date()} 
                                onChange={handleDateChange}
                            />
                        )}

                        <Text style={styles.label}>Reason</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]}
                            placeholder="Vacation, Conference, Personal..."
                            multiline
                            numberOfLines={3}
                            value={formData.reason}
                            onChangeText={t => setFormData({...formData, reason: t})}
                        />

                        <TouchableOpacity 
                            style={[styles.submitBtn, submitting && styles.disabledBtn]} 
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? <ActivityIndicator color="#fff"/> : <Text style={styles.submitBtnText}>Add Leave</Text>}
                        </TouchableOpacity>
                    </View>

                    
                    <Text style={styles.listHeader}>Upcoming Leaves</Text>

                    
                    {leaves.length === 0 ? (
                        <Text style={styles.emptyText}>No upcoming leaves found.</Text>
                    ) : (
                        leaves.map((leave) => (
                            <View key={leave.id} style={styles.leaveCard}>
                                <View style={styles.leaveContent}>
                                    <View style={styles.dateRow}>
                                        <Ionicons name="calendar-outline" size={18} color="#dc2626" />
                                        <Text style={styles.dateText}>
                                            {leave.start_date} <Text style={{color:'#6b7280', fontWeight:'normal'}}>to</Text> {leave.end_date}
                                        </Text>
                                    </View>
                                    <Text style={styles.reasonText}>{leave.reason}</Text>
                                </View>
                                
                                <TouchableOpacity onPress={() => confirmDelete(leave.id)} style={styles.deleteBtn}>
                                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                    
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    
    header: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    backBtn: { marginRight: 15 },
    backText: { color: '#2563eb', fontSize: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },

    content: { padding: 20 },

    
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 2, marginBottom: 25 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e40af', marginBottom: 15 },
    
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    halfInput: { width: '48%' },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 5 },
    
    
    dateInput: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderWidth: 1, 
        borderColor: '#d1d5db', 
        borderRadius: 8, 
        padding: 12, 
        marginBottom: 15, 
        backgroundColor: '#f9fafb' 
    },
    inputText: { color: '#1f2937', fontSize: 14 },
    placeholderText: { color: '#9ca3af', fontSize: 14 },

    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 15, backgroundColor: '#f9fafb' },
    textArea: { height: 80, textAlignVertical: 'top' },

    submitBtn: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center' },
    disabledBtn: { backgroundColor: '#93c5fd' },
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    
    listHeader: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
    emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 10 },

    leaveCard: { 
        backgroundColor: '#fff', 
        borderRadius: 10, 
        padding: 15, 
        marginBottom: 10, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444', 
        elevation: 1
    },
    leaveContent: { flex: 1 },
    dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    dateText: { marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
    reasonText: { color: '#4b5563', fontSize: 14 },

    deleteBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 8, marginLeft: 10 },
});

export default ManageLeave;