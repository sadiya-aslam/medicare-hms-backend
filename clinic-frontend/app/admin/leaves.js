import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';

const AdminLeaveManagement = () => {
    const router = useRouter();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState([]);
    const [showDocList, setShowDocList] = useState(false);
    const [selectedDocName, setSelectedDocName] = useState('');

    
    const [modalVisible, setModalVisible] = useState(false);
    const [docId, setDocId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState(null); 

    useFocusEffect(
        useCallback(() => {
            fetchLeaves();
            fetchDoctors();
        }, [])
    );

    
    const getPickerDate = () => {
        if (pickerMode === 'start' && startDate) return new Date(startDate);
        if (pickerMode === 'end' && endDate) return new Date(endDate);
        return new Date();
    };

    
    const handleDateChange = (event, selectedDate) => {
        setShowPicker(false);
        if (selectedDate) {
            const formattedDate = selectedDate.toISOString().split('T')[0];
            if (pickerMode === 'start') setStartDate(formattedDate);
            if (pickerMode === 'end') setEndDate(formattedDate);
        }
        setPickerMode(null);
    };

    
    const openDatePicker = (mode) => {
        setPickerMode(mode);
        setShowPicker(true);
    };

    const fetchLeaves = async () => {
        try {
            const res = await api.get('/api/staff/admin/leaves/');
            setLeaves(res.data);
        } catch (err) {
            console.error("Fetch Error", err);
            Alert.alert("Error", "Failed to load leave requests.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/api/staff/doctors-list/');
            setDoctors(res.data);
        } catch (err) {
            console.error("Failed to load doctors list");
        }
    };

    const handleCreate = async () => {
        if (!docId || !startDate || !endDate) {
            Alert.alert("Error", "Please select a Doctor and enter Dates.");
            return;
        }

        try {
            const payload = {
                doctor: parseInt(docId), 
                start_date: startDate,
                end_date: endDate,
                reason: reason,
                status: 'Approved' 
            };

            await api.post('/api/staff/admin/leaves/', payload);
            
            const msg = "Leave Added Successfully! ✅";
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Success", msg);

            setModalVisible(false);
            setDocId(''); setSelectedDocName(''); setStartDate(''); setEndDate(''); setReason('');
            fetchLeaves();
        } catch (err) {
            console.error(err.response?.data);
            Alert.alert("Error", "Failed to add leave. Check dates.");
        }
    };

    const executeDelete = async (id) => {
        try {
            await api.delete(`/api/staff/admin/leaves/${id}/`);
            fetchLeaves(); 
            
            if (Platform.OS === 'web') {
                alert("Leave has been removed.");
            } else {
                Alert.alert("Deleted", "Leave has been removed.");
            }
        } catch (err) {
            console.error("Delete Error:", err);
            const msg = "Failed to delete leave.";
            Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
        }
    };

    const handleDelete = (id) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Are you sure you want to remove this leave entry?");
            if (confirmed) executeDelete(id);
        } else {
            Alert.alert(
                "Confirm Delete",
                "Are you sure you want to remove this leave entry?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: 'destructive', onPress: () => executeDelete(id) }
                ]
            );
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Text style={styles.doctorName}>
                    {item.doctor_name || "Doctor #" + item.doctor}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                </TouchableOpacity>
            </View>

            <Text style={styles.dateText}>
                📅 {item.start_date}  ➡  {item.end_date}
            </Text>
            
            {item.reason ? (
                <Text style={styles.reason}>"{item.reason}"</Text>
            ) : null}
        </View>
    );

    return (
        <View style={styles.container}>
            

            {loading ? <ActivityIndicator size="large" color="#2563eb" style={{marginTop: 50}} /> : (
                <FlatList 
                    data={leaves} 
                    renderItem={renderItem} 
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Doctor Leave</Text>
                        
                        <Text style={styles.label}>Select Doctor:</Text>
                        <TouchableOpacity 
                            style={styles.dropdownBtn} 
                            onPress={() => setShowDocList(true)}
                        >
                            <Text style={styles.dropdownText}>
                                {selectedDocName || "Tap to select a doctor..."}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#6b7280" />
                        </TouchableOpacity>

                        
                        <View style={styles.rowInputs}>
                            
                            
                            <View style={{ flex: 1, marginRight: 5 }}>
                                {Platform.OS === 'web' ? (
                                    <TextInput 
                                        style={styles.input} 
                                        placeholder="Start (YYYY-MM-DD)" 
                                        value={startDate} 
                                        onChangeText={setStartDate} 
                                    />
                                ) : (
                                    <TouchableOpacity 
                                        style={styles.dateInput} 
                                        onPress={() => openDatePicker('start')}
                                    >
                                        <Text style={startDate ? styles.inputText : styles.placeholderText}>
                                            {startDate || "Start Date"}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            
                            <View style={{ flex: 1, marginLeft: 5 }}>
                                {Platform.OS === 'web' ? (
                                    <TextInput 
                                        style={styles.input} 
                                        placeholder="End (YYYY-MM-DD)" 
                                        value={endDate} 
                                        onChangeText={setEndDate} 
                                    />
                                ) : (
                                    <TouchableOpacity 
                                        style={styles.dateInput} 
                                        onPress={() => openDatePicker('end')}
                                    >
                                        <Text style={endDate ? styles.inputText : styles.placeholderText}>
                                            {endDate || "End Date"}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                        </View>

                        
                        {Platform.OS !== 'web' && showPicker && (
                            <DateTimePicker
                                value={getPickerDate()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                minimumDate={new Date()}
                                onChange={handleDateChange}
                            />
                        )}

                        <TextInput style={styles.input} placeholder="Reason (e.g. Sick Leave)" value={reason} onChangeText={setReason} />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={{ color: 'red' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add Leave</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={showDocList} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.listContent}>
                        <Text style={styles.modalTitle}>Choose Doctor</Text>
                        <FlatList 
                            data={doctors}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.listItem}
                                    onPress={() => {
                                        setDocId(item.id);
                                        setSelectedDocName(item.full_name); 
                                        setShowDocList(false);
                                    }}
                                >
                                    <Text style={styles.listItemText}>{item.full_name}</Text>
                                    <Ionicons name="person-circle-outline" size={24} color="#2563eb" />
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.closeListBtn} onPress={() => setShowDocList(false)}>
                            <Text style={{color: '#fff', fontWeight: 'bold'}}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#1f2937', elevation: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginLeft: 15 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    doctorName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    dateText: { fontSize: 15, color: '#374151', marginBottom: 5 },
    reason: { fontSize: 14, color: '#6b7280', fontStyle: 'italic', marginBottom: 10 },
    
    fab: { position: 'absolute', bottom: 90, right: 30, backgroundColor: '#2563eb', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', width: '85%', padding: 20, borderRadius: 10, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#d1d5db', padding: 12, borderRadius: 6, marginBottom: 10, fontSize: 16 },
    
    
    dateInput: { 
        borderWidth: 1, borderColor: '#d1d5db', padding: 12, borderRadius: 6, marginBottom: 10, 
        backgroundColor: '#fff', alignItems: 'center' 
    },
    inputText: { color: '#000', fontSize: 16 },
    placeholderText: { color: '#9ca3af', fontSize: 16 },

    rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
    saveBtn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 6, width: '45%', alignItems: 'center' },
    cancelBtn: { padding: 12, width: '45%', alignItems: 'center', borderWidth: 1, borderColor: '#ef4444', borderRadius: 6 },

    
    label: { fontWeight: 'bold', marginBottom: 5, color: '#374151' },
    dropdownBtn: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1, borderColor: '#d1d5db', padding: 12, borderRadius: 6, marginBottom: 15, backgroundColor: '#f9fafb'
    },
    dropdownText: { fontSize: 16, color: '#1f2937' },
    
    
    listContent: { backgroundColor: '#fff', width: '80%', maxHeight: '60%', borderRadius: 10, padding: 10 },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    listItemText: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
    closeListBtn: { backgroundColor: '#dc2626', padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 10 }
});

export default AdminLeaveManagement;