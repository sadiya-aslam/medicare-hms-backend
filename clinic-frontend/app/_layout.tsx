import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            // 🎨 GLOBAL HEADER STYLES (Applies to all screens)
            headerStyle: { backgroundColor: '#fff' }, // Clean white header
            headerTintColor: '#000', // Black text/arrows
            headerTitleStyle: { fontWeight: 'bold' }, // Professional bold title
            headerBackTitle: 'Back', // Simple "Back" text instead of previous screen name
            headerShadowVisible: false, // Optional: Removes the thin line under the header for a cleaner look
          }}
        >
          {/* 1. Main Entry Points */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />

          {/* 2. Auth Screens */}
          <Stack.Screen 
            name="login" 
            options={{ title: 'Login' }} 
          />
          <Stack.Screen 
            name="auth/register" 
            options={{ title: 'Create Account' }} 
          />

          {/* 3. Admin Screens */}
          <Stack.Screen 
            name="admin/dashboard" 
            options={{ title: 'Admin Dashboard' }} 
          />
          <Stack.Screen 
            name="admin/approve_doctors" 
            options={{ title: 'Approve Doctors' }} 
          />
          <Stack.Screen 
            name="admin/billing" 
            options={{ title: 'Manage Bills' }} 
          />
          <Stack.Screen 
            name="admin/services" 
            options={{ title: 'Manage Services' }} 
          />
          <Stack.Screen 
            name="admin/leaves" 
            options={{ title: 'Manage Leaves' }} 
          />
          <Stack.Screen 
            name="patient/dashboard" 
            options={{ title: 'Dashboard' }} 
          />
          {/* 4. Patient Screens */}
          <Stack.Screen 
            name="patient/book/index" 
            options={{ title: 'Select Doctor' }} 
          />
          <Stack.Screen 
            name="patient/book/[id]" 
            options={{ title: 'Book Appointment' }} 
          />
          <Stack.Screen 
            name="patient/reschedule/[id]" 
            options={{ title: 'Reschedule Appointment' }} 
          />
          <Stack.Screen 
            name="patient/appointments" 
            options={{ title: 'My Appointments' }} 
          />
          <Stack.Screen 
            name="patient/bills" 
            options={{ title: 'Billing History' }} 
          />
          <Stack.Screen 
            name="patient/feedback" 
            options={{ title: 'Feedback' }} 
          />
          <Stack.Screen 
            name="patient/prescriptions" 
            options={{ title: 'My Prescriptions' }} 
          />
          <Stack.Screen 
            name="patient/profile" 
            options={{ title: 'Edit Profile' }} 
          />

          {/* 5. Doctor Screens (Add these if you have them!) */}
          <Stack.Screen 
            name="doctor/dashboard" 
            options={{ title: 'Doctor Dashboard' }} 
          />
          <Stack.Screen 
            name="doctor/leaves" 
            options={{ title: 'My Leaves' }} 
          />
          <Stack.Screen 
            name="doctor/profile" 
            options={{ title: 'Edit Profile' }} 
          />
          <Stack.Screen 
            name="doctor/schedule" 
            options={{ title: 'My Schedule' }} 
          />
          <Stack.Screen 
            name="doctor/prescription/[id]" 
            options={{ title: ' Add Prescription ' }} 
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}