import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { appointmentAPI } from '../services/api';

const RateDoctorScreen = () => {
    const { appointmentId, doctorName } = useLocalSearchParams();
    const router = useRouter();
    
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const renderStars = () => {
        let stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                    <Ionicons 
                        name={i <= rating ? "star" : "star-outline"} 
                        size={40} 
                        color="#fbbf24" 
                        style={{ marginHorizontal: 5 }}
                    />
                </TouchableOpacity>
            );
        }
        return <View style={styles.starContainer}>{stars}</View>;
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            const msg = "Please tap a star to give a rating.";
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Rating Required", msg);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                appointment: parseInt(appointmentId), 
                rating_score: rating,
                comment: comment
            };

            await appointmentAPI.giveFeedback(payload);

            const successMsg = "Thank you for your feedback! ⭐";
            if (Platform.OS === 'web') {
                window.alert(successMsg);
                router.replace('/patient/dashboard'); 
            } else {
                Alert.alert("Success", successMsg, [
                    { text: "OK", onPress: () => router.replace('/patient/dashboard') }
                ]);
            }

        } catch (err) {
           
            
            let errorMsg = "Failed to submit feedback.";

            if (err.response?.data) {
                const data = err.response.data;

                if (data.appointment) {
                    const apptError = Array.isArray(data.appointment) ? data.appointment[0] : data.appointment;
                    if (typeof apptError === 'string' && apptError.includes("already exists")) {
                        errorMsg = "You have already submitted feedback for this visit.";
                    } else {
                        errorMsg = apptError;
                    }
                } 
                else if (typeof data === 'object') {
                    const firstKey = Object.keys(data)[0];
                    const firstVal = data[firstKey];
                    errorMsg = Array.isArray(firstVal) ? firstVal[0] : firstVal;
                } 
                else if (typeof data === 'string') {
                    errorMsg = data;
                }
            }
            
            if (Platform.OS === 'web') {
                window.alert(errorMsg);
            } else {
                Alert.alert("Feedback Failed", errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
            <View style={styles.container}>
               

                <View style={styles.card}>
                    <Text style={styles.title}>Rate Your Visit</Text>
                    <Text style={styles.subtitle}>How was your experience with</Text>
                    <Text style={styles.doctorName}>Dr. {doctorName}</Text>

                    {renderStars()}
                    <Text style={styles.ratingLabel}>{rating > 0 ? `${rating} out of 5` : "Tap a star"}</Text>

                    <TextInput 
                        style={styles.input} 
                        placeholder="Write a review (optional)..." 
                        multiline
                        numberOfLines={4}
                        value={comment}
                        onChangeText={setComment}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Review</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6', justifyContent: 'center', padding: 20 },
    backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
    backText: { color: '#6b7280', fontSize: 16 },
    
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 5 },
    subtitle: { color: '#6b7280', fontSize: 14 },
    doctorName: { fontSize: 18, fontWeight: 'bold', color: '#2563eb', marginBottom: 20 },
    
    starContainer: { flexDirection: 'row', marginBottom: 10 },
    ratingLabel: { color: '#fbbf24', fontWeight: 'bold', marginBottom: 20 },
    
    input: { width: '100%', backgroundColor: '#f9fafb', borderRadius: 10, padding: 15, height: 100, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 20 },
    
    submitBtn: { backgroundColor: '#2563eb', paddingVertical: 15, width: '100%', borderRadius: 12, alignItems: 'center' },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default RateDoctorScreen;