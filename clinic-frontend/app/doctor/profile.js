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
import { profileAPI } from '../services/api'; 

import ChangePasswordModal from '../components/ChangePasswordModal';

const DoctorProfile = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        qualification: '',
        experience_years: '',
        consultation_fee: '',
        bio: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await profileAPI.getDoctorProfile();
            const safeData = {
                first_name: res.data.first_name || '',
                last_name: res.data.last_name || '',
                phone_number: res.data.phone_number || '',
                qualification: res.data.qualification || '',
                experience_years: res.data.experience_years ? String(res.data.experience_years) : '',
                consultation_fee: res.data.consultation_fee ? String(res.data.consultation_fee) : '',
                bio: res.data.bio || ''
            };
            setFormData(safeData);
        } catch (err) {
            console.error("Failed to load profile", err);
            const msg = "Failed to load profile data";
            if (Platform.OS === 'web') alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const updateField = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await profileAPI.updateDoctorProfile(formData);
            
            const msg = "Professional Profile Updated!";
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
            const errorMsg = err.response?.data?.detail || "Update failed";
            if (Platform.OS === 'web') {
                alert("Error: " + errorMsg);
            } else {
                Alert.alert("Error", errorMsg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={{ marginTop: 10 }}>Loading Profile...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={{ flex: 1 }}
        >
            <View style={styles.container}>
                
                

                <ScrollView contentContainerStyle={styles.content}>
                    
                    
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Personal Details</Text>
                        <View style={styles.card}>
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>First Name</Text>
                                    <TextInput 
                                        style={styles.input}
                                        value={formData.first_name}
                                        onChangeText={(t) => updateField('first_name', t)}
                                        placeholder="John"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.label}>Last Name</Text>
                                    <TextInput 
                                        style={styles.input}
                                        value={formData.last_name}
                                        onChangeText={(t) => updateField('last_name', t)}
                                        placeholder="Doe"
                                    />
                                </View>
                            </View>

                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput 
                                style={styles.input}
                                value={formData.phone_number}
                                onChangeText={(t) => updateField('phone_number', t)}
                                keyboardType="phone-pad"
                                placeholder="1234567890"
                            />
                        </View>
                    </View>

                    
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Clinic Details</Text>
                        <View style={[styles.card, styles.blueCard]}>
                            
                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.blueLabel}>Experience (Yrs)</Text>
                                    <TextInput 
                                        style={styles.input}
                                        value={formData.experience_years}
                                        onChangeText={(t) => updateField('experience_years', t)}
                                        keyboardType="numeric"
                                        placeholder="5"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.blueLabel}>Fee (Rs.)</Text>
                                    <View style={styles.feeContainer}>
                                        <Text style={styles.currencyPrefix}>Rs.</Text>
                                        <TextInput 
                                            style={styles.feeInput}
                                            value={formData.consultation_fee}
                                            onChangeText={(t) => updateField('consultation_fee', t)}
                                            keyboardType="numeric"
                                            placeholder="500"
                                        />
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.blueLabel}>Qualification</Text>
                            <TextInput 
                                style={styles.input}
                                value={formData.qualification}
                                onChangeText={(t) => updateField('qualification', t)}
                                placeholder="MBBS, MD"
                            />
                        </View>
                    </View>

                    
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About Me</Text>
                        <View style={styles.card}>
                            <TextInput 
                                style={[styles.input, styles.textArea]}
                                value={formData.bio}
                                onChangeText={(t) => updateField('bio', t)}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                placeholder="Write a short bio..."
                            />
                        </View>
                    </View>

                    
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account Settings</Text>
                        <TouchableOpacity 
                            style={styles.passwordBtn} 
                            onPress={() => setShowPasswordModal(true)}
                        >
                            <Text style={styles.passwordBtnText}>🔐 Change Password</Text>
                        </TouchableOpacity>
                    </View>

                    
                    <View style={styles.actionRow}>
                        <TouchableOpacity 
                            style={styles.cancelBtn} 
                            onPress={() => router.back()}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.saveBtn, submitting && styles.disabledBtn]} 
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>Update Details</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>

                
                <ChangePasswordModal 
                    visible={showPasswordModal} 
                    onClose={() => setShowPasswordModal(false)} 
                />
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    content: { padding: 20 },

    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#4b5563', marginBottom: 10, marginLeft: 5 },
    
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 1 },
    blueCard: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe' },

    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    halfInput: { width: '48%' },

    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
    blueLabel: { fontSize: 14, fontWeight: '600', color: '#1e40af', marginBottom: 6 },

    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, backgroundColor: '#fff', fontSize: 16 },
    textArea: { height: 100 },

    
    feeContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#fff', overflow: 'hidden' },
    currencyPrefix: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 13, borderRightWidth: 1, borderRightColor: '#d1d5db', color: '#6b7280' },
    feeInput: { flex: 1, padding: 12, fontSize: 16 },

    
    passwordBtn: { backgroundColor: '#4b5563', padding: 15, borderRadius: 8, alignItems: 'center' },
    passwordBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    
    actionRow: { flexDirection: 'row', gap: 15 },
    cancelBtn: { flex: 1, padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', backgroundColor: '#fff' },
    cancelBtnText: { color: '#374151', fontWeight: 'bold', fontSize: 16 },
    
    saveBtn: { flex: 1, padding: 15, borderRadius: 8, backgroundColor: '#2563eb', alignItems: 'center' },
    disabledBtn: { backgroundColor: '#93c5fd' },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default DoctorProfile;