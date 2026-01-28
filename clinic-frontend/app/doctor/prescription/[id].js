import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';


import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appointmentAPI } from '../../services/api';

const WritePrescription = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    
    const insets = useSafeAreaInsets();

    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [medicines, setMedicines] = useState([
        { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);

    const addMedicineRow = () => {
        setMedicines([...medicines, { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    };

    const removeMedicineRow = (index) => {
        const updated = [...medicines];
        updated.splice(index, 1);
        setMedicines(updated);
    };

    const handleMedicineChange = (index, field, value) => {
        const updated = [...medicines];
        updated[index][field] = value;
        setMedicines(updated);
    };

    const handleSubmit = async () => {
        if (!notes && medicines[0].medicine_name === '') {
            const msg = "Please add a diagnosis note or at least one medicine.";
            Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
            return;
        }

        if (Platform.OS === 'web') {
            if (confirm("Are you sure you want to complete this prescription?")) {
                processSubmission();
            }
        } else {
            Alert.alert(
                "Confirm",
                "Are you sure you want to complete this prescription? This will mark the appointment as finished.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Save & Finish", onPress: processSubmission }
                ]
            );
        }
    };

    const processSubmission = async () => {
        setLoading(true);
        try {
            const payload = {
                appointment: parseInt(id), 
                notes: notes,
                items: medicines
            };

            try {
                await appointmentAPI.createPrescription(payload);
            } catch (createErr) {
                const errorData = JSON.stringify(createErr.response?.data || "");
                if (errorData.includes("already exists") || errorData.includes("unique constraint")) {
                    console.warn("Prescription already exists. Skipping creation and marking as complete.");
                } else {
                    throw createErr;
                }
            }
            
            await appointmentAPI.completeAppointment(id);
            
            const successMsg = "Success: Prescription saved and visit completed!";
            
            if (Platform.OS === 'web') {
                window.alert(successMsg);
                router.replace('/doctor/dashboard');
            } else {
                Alert.alert("Success", successMsg, [
                    { text: "OK", onPress: () => router.replace('/doctor/dashboard') }
                ]);
            }

        } catch (err) {
            console.error("FULL BACKEND ERROR:", err.response?.data);
            const errorMsg = JSON.stringify(err.response?.data || "Failed to save.", null, 2);
            Platform.OS === 'web' ? window.alert("Error:\n" + errorMsg) : Alert.alert("Error", errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        
        <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                style={{ flex: 1 }}
            >
                <View style={styles.container}>
                    
                    
                    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Text style={styles.backText}>← Back</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Write Prescription</Text>
                    </View>

                    <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}> 
                        
                        <View style={styles.section}>
                            <Text style={styles.label}>Diagnosis / Doctor's Notes</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Patient has fever and..."
                                multiline={true}
                                numberOfLines={4}
                                value={notes}
                                onChangeText={setNotes}
                                textAlignVertical="top"
                            />
                        </View>

                        <Text style={styles.sectionTitle}>Medicines</Text>

                        {medicines.map((med, index) => (
                            <View key={index} style={styles.medicineCard}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardIndex}>Medicine #{index + 1}</Text>
                                    {medicines.length > 1 && (
                                        <TouchableOpacity onPress={() => removeMedicineRow(index)}>
                                            <Text style={styles.removeText}>Remove</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Medicine Name (e.g., Paracetamol)"
                                    value={med.medicine_name}
                                    onChangeText={(text) => handleMedicineChange(index, 'medicine_name', text)}
                                />

                                <View style={styles.row}>
                                    <View style={[styles.col, { flex: 1 }]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Dosage" 
                                            value={med.dosage}
                                            onChangeText={(text) => handleMedicineChange(index, 'dosage', text)}
                                        />
                                    </View>
                                    <View style={[styles.col, { flex: 1, marginHorizontal: 5 }]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Freq" 
                                            value={med.frequency}
                                            onChangeText={(text) => handleMedicineChange(index, 'frequency', text)}
                                        />
                                    </View>
                                    <View style={[styles.col, { flex: 1 }]}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Duration" 
                                            value={med.duration}
                                            onChangeText={(text) => handleMedicineChange(index, 'duration', text)}
                                        />
                                    </View>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity onPress={addMedicineRow} style={styles.addBtn}>
                            <Text style={styles.addBtnText}>+ Add Another Medicine</Text>
                        </TouchableOpacity>

                    </ScrollView>

                    
                   <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 50 }]}>
                        <TouchableOpacity 
                            style={[styles.submitBtn, loading && styles.disabledBtn]} 
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitBtnText}>Save & Complete Visit</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    
    
    header: { 
        backgroundColor: '#fff', 
        paddingBottom: 15, 
        paddingHorizontal: 20, 
        flexDirection: 'row', 
        alignItems: 'center', 
        elevation: 3,
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5
    },
    backBtn: { marginRight: 15 },
    backText: { color: '#2563eb', fontSize: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },

    content: { padding: 20 },

    section: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 10 },
    textArea: { height: 100 },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#1f2937' },
    medicineCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    cardIndex: { fontWeight: 'bold', color: '#6b7280' },
    removeText: { color: '#ef4444', fontWeight: 'bold' },
    
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    col: { flexDirection: 'column' },

    addBtn: { alignItems: 'center', padding: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#2563eb', borderRadius: 8, marginBottom: 20 },
    addBtnText: { color: '#2563eb', fontWeight: 'bold', fontSize: 16 },

    footer: { 
        padding: 20, 
        backgroundColor: '#fff', 
        borderTopWidth: 1, 
        borderColor: '#e5e7eb',
        
    },
    submitBtn: { backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center' },
    disabledBtn: { backgroundColor: '#6ee7b7' },
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

export default WritePrescription;