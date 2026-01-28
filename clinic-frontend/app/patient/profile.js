import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, ScrollView, Platform,
    KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import { profileAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ChangePasswordModal from '../components/ChangePasswordModal';

const ProfileScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        address: '',
        date_of_birth: '',
        gender: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await profileAPI.getProfile();
            const data = res.data.results ? res.data.results[0] : res.data;

            setProfile({
                first_name: data.user?.first_name || data.first_name || '',
                last_name: data.user?.last_name || data.last_name || '',
                email: data.user?.email || data.email || '',
                phone_number: data.phone_number || '',
                address: data.address || '',
                date_of_birth: data.date_of_birth || '',
                gender: data.gender || ''
            });
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to load profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            await profileAPI.updateProfile({
                phone_number: profile.phone_number,
                address: profile.address,
                gender: profile.gender
            });

            const msg = "Profile Updated Successfully!";
            Platform.OS === 'web' ? alert(msg) : Alert.alert("Success", msg);
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Could not update profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        router.replace('/login');
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={50} color="#fff" />
                    </View>
                    <Text style={styles.name}>{profile.first_name} {profile.last_name}</Text>
                    <Text style={styles.email}>{profile.email}</Text>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Personal Details</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date of Birth</Text>
                        <TextInput style={[styles.input, styles.readOnly]} value={profile.date_of_birth} editable={false} />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gender</Text>
                        <TextInput
                            style={styles.input}
                            value={profile.gender}
                            onChangeText={(text) => setProfile({ ...profile, gender: text })}
                            placeholder="Male / Female"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            value={profile.phone_number}
                            onChangeText={(text) => setProfile({ ...profile, phone_number: text })}
                            keyboardType="phone-pad"
                            placeholder="Enter phone number"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Address</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={profile.address}
                            onChangeText={(text) => setProfile({ ...profile, address: text })}
                            multiline
                            placeholder="Enter your address"
                        />
                    </View>

                    <View style={{ marginTop: 10, marginBottom: 20 }}>
                        <Text style={styles.sectionTitle}>Account Settings</Text>
                        <TouchableOpacity 
                            style={styles.passwordBtn} 
                            onPress={() => setShowPasswordModal(true)}
                        >
                            <Ionicons name="key-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.passwordBtnText}>Change Password</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>

                </View>

                <ChangePasswordModal 
                    visible={showPasswordModal} 
                    onClose={() => setShowPasswordModal(false)} 
                />

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: { backgroundColor: '#2563eb', paddingVertical: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    name: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    email: { fontSize: 14, color: '#dbeafe', marginTop: 5 },

    formSection: { padding: 20, marginTop: -20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 15, marginLeft: 5 },

    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, color: '#6b7280', marginBottom: 5, marginLeft: 5 },
    input: { backgroundColor: '#fff', borderRadius: 12, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#e5e7eb', color: '#1f2937' },
    readOnly: { backgroundColor: '#f9fafb', color: '#9ca3af' },
    textArea: { height: 80, textAlignVertical: 'top' },

    passwordBtn: { flexDirection: 'row', backgroundColor: '#4b5563', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    passwordBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    saveBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, padding: 15, borderWidth: 1, borderColor: '#fee2e2', borderRadius: 12, backgroundColor: '#fef2f2' },
    logoutText: { color: '#dc2626', fontWeight: 'bold', marginLeft: 8 }
});

export default ProfileScreen;