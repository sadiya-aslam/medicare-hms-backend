import React, { useState } from 'react';
import { 
    Modal, 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator, 
    Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import api from '../services/api'; 

const ChangePasswordModal = ({ visible, onClose }) => {
    const [loading, setLoading] = useState(false);

    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const resetForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
        onClose();
    };

    const handleSubmit = async () => {
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "New passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            
            await api.post('/api/core/auth/change-password/', {
                old_password: currentPassword,
                new_password: newPassword
            });
            
            Alert.alert("Success", "Password changed successfully! 🔐");
            resetForm();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || "Failed to change password";
            Alert.alert("Error", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>Change Password 🔐</Text>
                    <Text style={styles.subtitle}>Update your account security</Text>

                    
                    <Text style={styles.label}>Current Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter current password"
                            secureTextEntry={!showCurrent}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />
                        <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                            <Ionicons name={showCurrent ? "eye" : "eye-off"} size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter new password"
                            secureTextEntry={!showNew}
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                            <Ionicons name={showNew ? "eye" : "eye-off"} size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    
                    <Text style={styles.label}>Confirm New Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Confirm new password"
                            secureTextEntry={!showConfirm}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                            <Ionicons name={showConfirm ? "eye" : "eye-off"} size={20} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    
                    <View style={styles.btnRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Update</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'center', 
        padding: 20 
    },
    modalContainer: { 
        backgroundColor: '#fff', 
        borderRadius: 20, 
        padding: 25, 
        elevation: 5 
    },
    title: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        color: '#1f2937', 
        textAlign: 'center' 
    },
    subtitle: { 
        fontSize: 14, 
        color: '#6b7280', 
        textAlign: 'center', 
        marginBottom: 20, 
        marginTop: 5 
    },
    label: { 
        fontSize: 14, 
        fontWeight: '600', 
        color: '#374151', 
        marginBottom: 8 
    },
    
    
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 50
    },
    passwordInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#1f2937'
    },

    btnRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        gap: 15, 
        marginTop: 10 
    },
    cancelBtn: { 
        flex: 1, 
        padding: 15, 
        borderRadius: 12, 
        backgroundColor: '#f3f4f6', 
        alignItems: 'center' 
    },
    cancelText: { 
        fontWeight: 'bold', 
        color: '#4b5563' 
    },
    saveBtn: { 
        flex: 1, 
        padding: 15, 
        borderRadius: 12, 
        backgroundColor: '#2563eb', 
        alignItems: 'center' 
    },
    saveText: { 
        fontWeight: 'bold', 
        color: '#fff' 
    }
});

export default ChangePasswordModal;