import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Calendar, Clock, LogOut, Shield, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator 
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { profileAPI } from "../services/api";

const HomeScreen = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const role = await AsyncStorage.getItem("user_role"); 

      if (token) {
        if (role === 'doctor') {
            router.replace('/doctor/dashboard');
            return; 
        }

        try {
            const response = await profileAPI.getPatientProfile();
            setIsAuthenticated(true);
            setUsername(response.data.first_name || "User");
        } catch (profileError) {
            console.log("Profile fetch failed", profileError);
            setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log("Error checking login:", error);
      setIsAuthenticated(false);
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setIsAuthenticated(false);
    router.replace("/login");
  };

  const handleBookNow = () => {
    if (isAuthenticated) {
      router.push("/book-appointment");
    } else {
      router.push("/login");
    }
  };

  if (loading) {
      return (
          <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#fff'}}>
              <ActivityIndicator size="large" color="#2563eb" />
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      
      
      
      <View style={styles.navbar}>
        
        
        <View style={styles.navLogoContainer}>
          <Shield size={28} color="#2563eb" style={{ marginRight: 8 }} />
          
          
          <Text 
            style={styles.navTitle} 
            numberOfLines={1} 
            adjustsFontSizeToFit
          >
            Dr. Mahajan's Clinic
          </Text>
        </View>

        <View style={styles.navButtons}>
          {isAuthenticated ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                onPress={() => router.push("/book-appointment")} 
                style={styles.btnDashboard}
              >
                <Text style={styles.btnDashboardText}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 10 }}>
                <LogOut size={24} color="#4b5563" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.navLoginText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push("/auth/register")}
                style={styles.btnRegister}
              >
                <Text style={styles.btnRegisterText}>Register</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.container}>
        
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
           Expert Medical Care{"\n"}
            <Text style={styles.heroHighlight}>Simplified for You</Text>
          </Text>
          
          <Text style={styles.heroDescription}>
            Book appointments with top Dr. Prashant Mahajan, manage your prescriptions, and view your medical history—all in one place.
          </Text>

          <TouchableOpacity onPress={handleBookNow} style={styles.heroBtn}>
            <Calendar size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.heroBtnText}>Book Appointment Now</Text>
          </TouchableOpacity>

          <View style={styles.illustrationContainer}>
             <View style={styles.abstractCircle}>
                <Shield size={80} color="#2563eb" />
             </View>
          </View>
        </View>

        
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why Choose Us?</Text>
          <Text style={styles.sectionSubtitle}>We provide comprehensive care with a patient-first approach.</Text>

          
          <View style={styles.featureCard}>
            <View style={[styles.iconBox, { backgroundColor: "#dcfce7" }]}>
              <User size={24} color="#16a34a" />
            </View>
            <Text style={styles.featureTitle}>Expert Consultation</Text>
            <Text style={styles.featureText}>Experience top-tier medical treatment and trusted advice tailored to your personal health needs.</Text>
          </View>

          
          <View style={styles.featureCard}>
            <View style={[styles.iconBox, { backgroundColor: "#f3e8ff" }]}>
              <Calendar size={24} color="#9333ea" />
            </View>
            <Text style={styles.featureTitle}>Easy Scheduling</Text>
            <Text style={styles.featureText}>Book, reschedule, or cancel appointments instantly with our real-time system.</Text>
          </View>

          
          <View style={styles.featureCard}>
            <View style={[styles.iconBox, { backgroundColor: "#ffedd5" }]}>
              <Clock size={24} color="#ea580c" />
            </View>
            <Text style={styles.featureTitle}>24/7 Access</Text>
            <Text style={styles.featureText}>View your medical records, prescriptions, and billing history anytime, anywhere.</Text>
          </View>
        </View>

        
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Dr. Mahajan's Clinic. All rights reserved.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  
  container: { flex: 1, backgroundColor: "#fff" },

  
  navbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f3f4f6", elevation: 2 },
  
  
  navLogoContainer: { flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 10 },
  
  
  navTitle: { fontSize: 22, fontWeight: "bold", color: "#2563eb", flex: 1 },
  
  navButtons: { flexDirection: "row", alignItems: "center" },
  navLoginText: { color: "#4b5563", fontWeight: "600", marginRight: 16, fontSize: 15 },
  btnRegister: { backgroundColor: "#2563eb", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, elevation: 4 },
  btnRegisterText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  btnDashboard: { backgroundColor: "#f3f4f6", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  btnDashboardText: { color: "#1d4ed8", fontWeight: "600", fontSize: 14 },

  
  heroSection: { backgroundColor: "#eff6ff", paddingHorizontal: 20, paddingTop: 40, paddingBottom: 60 },
  heroTitle: { fontSize: 32, fontWeight: "800", color: "#111827", lineHeight: 40, marginBottom: 16 },
  heroHighlight: { color: "#2563eb" },
  heroDescription: { fontSize: 16, color: "#4b5563", marginBottom: 32, lineHeight: 24 },
  heroBtn: { backgroundColor: "#2563eb", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, paddingHorizontal: 24, borderRadius: 8, elevation: 5, shadowColor: "#bfdbfe" },
  heroBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  illustrationContainer: { alignItems: "center", marginTop: 40 },
  abstractCircle: { width: 240, height: 240, borderRadius: 120, backgroundColor: "#bfdbfe", opacity: 0.5, justifyContent: "center", alignItems: "center" },

  
  featuresSection: { paddingVertical: 60, paddingHorizontal: 20, backgroundColor: "#fff" },
  sectionTitle: { fontSize: 28, fontWeight: "bold", color: "#111827", textAlign: "center" },
  sectionSubtitle: { fontSize: 16, color: "#6b7280", textAlign: "center", marginTop: 8, marginBottom: 40 },
  featureCard: { padding: 24, borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 16, marginBottom: 24 },
  iconBox: { width: 48, height: 48, borderRadius: 8, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  featureTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8, color: "#000" },
  featureText: { color: "#6b7280", lineHeight: 20 },

  
  footer: { paddingVertical: 40, borderTopWidth: 1, borderTopColor: "#e5e7eb", backgroundColor: "#f9fafb", alignItems: "center" },
  footerText: { color: "#6b7280", fontSize: 14 },
});

export default HomeScreen;