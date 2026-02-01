import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import api from '../services/api';

const ServiceManagement = () => {
    const router = useRouter();
    const [services, setServices] = useState([]);
    const [doctors, setDoctors] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    
    const [modalVisible, setModalVisible] = useState(false);
    const [showDocPicker, setShowDocPicker] = useState(false); 
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    
    
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [desc, setDesc] = useState('');
    const [duration, setDuration] = useState('');
    const [selectedDocIds, setSelectedDocIds] = useState([]); 

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            
            const [srvRes, docRes] = await Promise.all([
                api.get('/api/medical_records/services/'),
                api.get('/api/staff/doctors-list/')
            ]);
            setServices(srvRes.data);
            setDoctors(docRes.data);
        } catch (err) {
            Alert.alert("Error", "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name || !price || !duration) {
            Alert.alert("Error", "Name, Price, and Duration are required!");
            return;
        }

        try {
            const payload = { 
                name, 
                base_price: parseFloat(price), 
                description: desc,
                default_duration_min: parseInt(duration),
                doctors: selectedDocIds 
            };

            if (isEditing) {
                
                await api.patch(`/api/medical_records/services-create/${currentId}/`, payload);
                Alert.alert("Success", "Service Updated! ✅");
            } else {
                
                await api.post('/api/medical_records/services-create/', payload);
                Alert.alert("Success", "New Service Added! ✨");
            }

            setModalVisible(false);
            fetchData(); 
            resetForm();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.detail || "Operation failed.";
            Alert.alert("Error", errorMsg);
        }
    };

    const performDelete = async (id) => {
        try {
            await api.delete(`/api/medical_records/services-create/${id}/`);
            if (Platform.OS !== 'web') {
                Alert.alert("Deleted", "Service has been removed.");
            }
            fetchData(); 
        } catch (err) {
            console.error("Delete Error:", err.response?.status);
            alert("Error: Could not delete.");
        }
    };

    const handleDelete = (id) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Are you sure you want to delete this service?");
            if (confirmed) performDelete(id);
        } else {
            Alert.alert("Confirm Delete", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: 'destructive', onPress: () => performDelete(id) }
            ]);
        }
    };

    const toggleDoctorSelection = (id) => {
        if (selectedDocIds.includes(id)) {
            setSelectedDocIds(prev => prev.filter(docId => docId !== id));
        } else {
            setSelectedDocIds(prev => [...prev, id]);
        }
    };

    const openEdit = (item) => {
        setIsEditing(true);
        setCurrentId(item.id);
        
        setName(item.name || '');
        setPrice(item.base_price ? item.base_price.toString() : '');
        setDesc(item.description || '');
        
        const durationValue = item.default_duration_min || item.duration;
        setDuration(durationValue ? durationValue.toString() : '');
        
        
        setSelectedDocIds(item.doctors || []); 

        setModalVisible(true);
    };

    const resetForm = () => {
        setName(''); setPrice(''); setDesc(''); setDuration('');
        setSelectedDocIds([]); // Reset selection
        setIsEditing(false); setCurrentId(null);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.serviceDesc}>{item.description || "No description"}</Text>
                
                <View style={styles.metaRow}>
                    <Text style={styles.price}>₹{item.base_price}</Text>
                    <Text style={styles.duration}> ⏱ {item.default_duration_min} mins</Text>
                </View>

                
                <Text style={styles.docList}>
                    👨‍⚕️ {item.doctor_names && item.doctor_names.length > 0 
                        ? item.doctor_names.join(", ") 
                        : "Available for All"}
                </Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={24} color="#2563eb" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={24} color="#dc2626" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            

            {loading ? <ActivityIndicator size="large" color="#2563eb" style={{marginTop: 50}} /> : (
                <FlatList 
                    data={services} 
                    renderItem={renderItem} 
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                />
            )}

            <TouchableOpacity 
                style={styles.fab} 
                onPress={() => { resetForm(); setModalVisible(true); }}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            
            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{isEditing ? "Edit Service" : "Add New Service"}</Text>
                        
                        <TextInput style={styles.input} placeholder="Service Name (e.g. MRI)" value={name} onChangeText={setName} />
                        
                        <View style={styles.rowInputs}>
                            <TextInput style={[styles.input, {flex: 1, marginRight: 5}]} placeholder="Price (₹)" value={price} onChangeText={setPrice} keyboardType="numeric" />
                            <TextInput style={[styles.input, {flex: 1, marginLeft: 5}]} placeholder="Mins (e.g. 30)" value={duration} onChangeText={setDuration} keyboardType="numeric" />
                        </View>

                        <TextInput 
                            style={[styles.input, {height: 60}]} 
                            placeholder="Description (Optional)" 
                            value={desc} 
                            onChangeText={setDesc}
                            multiline 
                        />

                        
                        <Text style={styles.label}>Assign Doctors:</Text>
                        <TouchableOpacity style={styles.selectorBtn} onPress={() => setShowDocPicker(true)}>
                            <Text style={styles.selectorText}>
                                {selectedDocIds.length === 0 
                                    ? "Select Doctors..." 
                                    : `${selectedDocIds.length} Doctor(s) Selected`}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                        </TouchableOpacity>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={{ color: 'red' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            
            <Modal visible={showDocPicker} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerContent}>
                        <Text style={styles.modalTitle}>Select Doctors</Text>
                        <Text style={{color:'#6b7280', marginBottom: 10, textAlign:'center'}}>
                            Tap to select who provides this service
                        </Text>
                        
                        <ScrollView style={{ maxHeight: 300 }}>
                            {doctors.map(doc => {
                                const isSelected = selectedDocIds.includes(doc.id);
                                return (
                                    <TouchableOpacity 
                                        key={doc.id} 
                                        style={[styles.docItem, isSelected && styles.docItemSelected]}
                                        onPress={() => toggleDoctorSelection(doc.id)}
                                    >
                                        <Text style={[styles.docName, isSelected && {color: '#2563eb', fontWeight: 'bold'}]}>
                                            {doc.full_name}
                                        </Text>
                                        {isSelected && <Ionicons name="checkmark-circle" size={24} color="#2563eb" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <TouchableOpacity style={styles.closePickerBtn} onPress={() => setShowDocPicker(false)}>
                            <Text style={{color: '#fff', fontWeight: 'bold'}}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    
    
    card: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2, alignItems: 'center' },
    serviceName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
    serviceDesc: { fontSize: 12, color: '#6b7280', marginVertical: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    price: { fontSize: 16, fontWeight: 'bold', color: '#166534' },
    duration: { fontSize: 14, color: '#4b5563', marginLeft: 10 },
    docList: { marginTop: 8, fontSize: 12, color: '#2563eb', fontStyle: 'italic' },
    
    actions: { flexDirection: 'row', gap: 10 },
    iconBtn: { padding: 5 },

    fab: { position: 'absolute', bottom: 90, right: 30, backgroundColor: '#2563eb', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', width: '85%', padding: 20, borderRadius: 10, elevation: 5 },
    pickerContent: { backgroundColor: '#fff', width: '80%', padding: 20, borderRadius: 10, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    
    input: { borderWidth: 1, borderColor: '#d1d5db', padding: 12, borderRadius: 6, marginBottom: 10, fontSize: 16 },
    rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
    
    label: { fontWeight: 'bold', marginTop: 5, marginBottom: 5, color: '#374151' },
    selectorBtn: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, backgroundColor: '#f9fafb', marginBottom: 15 },
    selectorText: { color: '#1f2937' },

    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
    saveBtn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 6, width: '45%', alignItems: 'center' },
    cancelBtn: { padding: 12, width: '45%', alignItems: 'center', borderWidth: 1, borderColor: '#ef4444', borderRadius: 6 },

    
    docItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    docItemSelected: { backgroundColor: '#eff6ff' },
    docName: { fontSize: 16, color: '#374151' },
    closePickerBtn: { backgroundColor: '#2563eb', padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 15 }
});

export default ServiceManagement;