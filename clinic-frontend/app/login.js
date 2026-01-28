import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from '@expo/vector-icons';
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
} from "react-native";

import { authAPI, setAuthToken } from "./services/api";

const LoginScreen = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.login({ email, password });
      const token = res.data.access;
      const role = res.data.role;
      const userEmail = res.data.email;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user_email', userEmail || '');
      setAuthToken(token);


      if (role === 'Doctor') {
        router.replace('/doctor/dashboard');
      } else if (role === 'Patient') {
        router.replace('/patient/dashboard');
      } else if (role === 'Admin') {
        router.replace('/admin/dashboard');
      } else {
        Alert.alert("Login Failed", "Unknown User Role: " + role);
      }

    } catch (err) {
      console.error("Login Error (Handled):", err);

      let userMessage = "Something went wrong. Please try again.";


      if (err.response) {

        if (err.response.status === 401) {
          userMessage = "Invalid email or password. Please try again.";
        }

        else if (err.response.data?.detail) {

          if (err.response.data.detail.includes("No active account")) {
            userMessage = "Invalid email or password.";
          } else {
            userMessage = err.response.data.detail;
          }
        }
      } else if (err.message === "Network Error") {
        userMessage = "Please check your internet connection.";
      }


      Alert.alert("Login Failed", userMessage);


    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Clinic Login</Text>

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={[styles.input, styles.passwordContainer]}>
    <TextInput 
        style={styles.passwordInput} 
        placeholder="Password" 
        secureTextEntry={!showPassword} 
        value={password} 
        onChangeText={setPassword} 
    />
    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
        <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#6b7280" />
    </TouchableOpacity>
</View>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/auth/register")}>
            <Text style={styles.linkText}>Don't have an account? Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  scrollContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  card: { backgroundColor: "#fff", padding: 30, borderRadius: 10, width: "100%", elevation: 5 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  input: { width: "100%", padding: 12, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, marginBottom: 16 },
  loginBtn: { width: "100%", backgroundColor: "#2563eb", padding: 14, borderRadius: 6, alignItems: "center", marginBottom: 16 },
  loginBtnText: { color: "#fff", fontWeight: "bold" },
  linkText: { color: "#2563eb", textAlign: "center", marginTop: 10 },
  passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 15, 
    },
    passwordInput: {
        flex: 1, 
        paddingVertical: 0, 
    }
});

export default LoginScreen;