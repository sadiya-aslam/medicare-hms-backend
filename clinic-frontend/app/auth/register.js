import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
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
import { authAPI } from '../services/api';

const RegisterScreen = () => {
    const router = useRouter();
    const [role, setRole] = useState('patient'); 
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); 
    const [dobDate, setDobDate] = useState(new Date()); 
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        date_of_birth: '', 
        qualification: '',
        experience_years: '',
        consultation_fee: '',
        bio: ''
    });

    
    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false); 
        if (selectedDate) {
            setDobDate(selectedDate);
            
            const formattedDate = selectedDate.toISOString().split('T')[0];
            setFormData({ ...formData, date_of_birth: formattedDate });
        }
    };

    const handleRegister = async () => {
        
        if (!formData.email || !formData.password || !formData.first_name || !formData.last_name || !formData.phone_number) {
            Alert.alert("Missing Info", "Please fill in all required fields.");
            return;
        }

        if (role === 'patient' && !formData.date_of_birth) {
            Alert.alert("Missing Info", "Please select your Date of Birth.");
            return;
        }

        setLoading(true);
        try {
            const commonPayload = {
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone_number: formData.phone_number,
            };

            if (role === 'patient') {
                await authAPI.registerPatient({
                    ...commonPayload,
                    date_of_birth: formData.date_of_birth
                });
            } else {
                await authAPI.registerDoctor({
                    ...commonPayload,
                    qualification: formData.qualification,
                    experience_years: formData.experience_years,
                    consultation_fee: formData.consultation_fee,
                    bio: formData.bio
                });
            }

            
            if (Platform.OS === 'web') {
                window.alert("Registration Successful! Please log in.");
                router.replace('/login');
            } else {
                Alert.alert(
                    "Registration Successful! 🎉", 
                    "Your account has been created. Please log in.", 
                    [{ text: "Go to Login", onPress: () => router.replace('/login') }]
                );
            }

        } catch (err) {
            console.error("Registration Error (Handled):", err); 
            
            let errorMessage = "Something went wrong. Please check your inputs.";
            let errorTitle = "Registration Failed";

            
            if (err.response?.data) {
                const data = err.response.data;
                const firstField = Object.keys(data)[0];
                const firstError = Array.isArray(data[firstField]) ? data[firstField][0] : data[firstField];
                
                errorTitle = "Invalid Input";
                
                errorMessage = `${firstField.charAt(0).toUpperCase() + firstField.slice(1)}: ${firstError}`;
            }

            if (Platform.OS === 'web') window.alert(errorMessage);
            else Alert.alert(errorTitle, errorMessage);
            
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
                
                
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join us to manage your health better</Text>
                </View>

                
                <View style={styles.roleContainer}>
                    <TouchableOpacity 
                        style={[styles.roleBtn, role === 'patient' && styles.roleBtnActive]} 
                        onPress={() => setRole('patient')}
                    >
                        <Text style={[styles.roleText, role === 'patient' && styles.roleTextActive]}>Patient</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.roleBtn, role === 'doctor' && styles.roleBtnActive]} 
                        onPress={() => setRole('doctor')}
                    >
                        <Text style={[styles.roleText, role === 'doctor' && styles.roleTextActive]}>Doctor</Text>
                    </TouchableOpacity>
                </View>

                
                <View style={styles.form}>
                    <View style={styles.row}>
                        <TextInput 
                            style={[styles.input, {flex: 1, marginRight: 10}]} 
                            placeholder="First Name" 
                            value={formData.first_name}
                            onChangeText={t => setFormData({...formData, first_name: t})}
                        />
                        <TextInput 
                            style={[styles.input, {flex: 1}]} 
                            placeholder="Last Name" 
                            value={formData.last_name}
                            onChangeText={t => setFormData({...formData, last_name: t})}
                        />
                    </View>

                    <TextInput 
                        style={styles.input} 
                        placeholder="Email Address" 
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={t => setFormData({...formData, email: t})}
                    />

                    <View style={[styles.input, styles.passwordContainer]}>
    <TextInput 
        style={styles.passwordInput} 
        placeholder="Password" 
        secureTextEntry={!showPassword} 
        value={formData.password}
        onChangeText={t => setFormData({...formData, password: t})}
    />
    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
        <Ionicons 
            name={showPassword ? "eye" : "eye-off"} 
            size={20} 
            color="#6b7280" 
        />
    </TouchableOpacity>
</View>

                    <TextInput 
                        style={styles.input} 
                        placeholder="Phone Number" 
                        keyboardType="phone-pad"
                        value={formData.phone_number}
                        onChangeText={t => setFormData({...formData, phone_number: t})}
                    />

                    
                    {role === 'patient' && (
                        <View>
                            <Text style={styles.sectionLabel}>Patient Details</Text>
                            
                            <TouchableOpacity 
                                style={[styles.input, styles.dateInput]} 
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={formData.date_of_birth ? styles.dateText : styles.placeholderText}>
                                    {formData.date_of_birth || "Select Date of Birth"}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                            </TouchableOpacity>

                            
                            {showDatePicker && (
                                <DateTimePicker
                                    value={dobDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    maximumDate={new Date()}  
                                    onChange={handleDateChange}
                                />
                            )}
                        </View>
                    )}

                    
                    {role === 'doctor' && (
                        <View>
                            <Text style={styles.sectionLabel}>Doctor Professional Details</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Qualification (e.g. MBBS, MD)" 
                                value={formData.qualification}
                                onChangeText={t => setFormData({...formData, qualification: t})}
                            />
                            <View style={styles.row}>
                                <TextInput 
                                    style={[styles.input, {flex: 1, marginRight: 10}]} 
                                    placeholder="Exp (Years)" 
                                    keyboardType="numeric"
                                    value={formData.experience_years}
                                    onChangeText={t => setFormData({...formData, experience_years: t})}
                                />
                                <TextInput 
                                    style={[styles.input, {flex: 1}]} 
                                    placeholder="Fee (Rs)" 
                                    keyboardType="numeric"
                                    value={formData.consultation_fee}
                                    onChangeText={t => setFormData({...formData, consultation_fee: t})}
                                />
                            </View>
                            <TextInput 
                                style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
                                placeholder="Short Bio" 
                                multiline
                                value={formData.bio}
                                onChangeText={t => setFormData({...formData, bio: t})}
                            />
                        </View>
                    )}

                    <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Register</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.replace('/login')} style={styles.loginLink}>
                        <Text style={styles.linkText}>Already have an account? <Text style={{fontWeight: 'bold', color: '#2563eb'}}>Login</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 20, paddingTop: 60 },
    backBtn: { marginBottom: 15 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
    subtitle: { fontSize: 16, color: '#6b7280', marginTop: 5 },

    roleContainer: { flexDirection: 'row', marginHorizontal: 20, marginVertical: 20, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 4 },
    roleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    roleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    roleText: { fontWeight: '600', color: '#6b7280' },
    roleTextActive: { color: '#2563eb' },

    form: { paddingHorizontal: 20 },
    row: { flexDirection: 'row' },
    sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#9ca3af', marginTop: 10, marginBottom: 10, textTransform: 'uppercase' },

    input: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e5e7eb' },
    
    
    dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateText: { color: '#1f2937', fontSize: 14 },
    placeholderText: { color: '#9ca3af', fontSize: 14 },

    submitBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    loginLink: { alignItems: 'center', marginTop: 20 },
    linkText: { color: '#4b5563' },

    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 15, 
    },
    passwordInput: {
        flex: 1, 
        paddingVertical: 0, 
    },
});

export default RegisterScreen;