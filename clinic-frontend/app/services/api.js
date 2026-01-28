

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';


const API_URL = 'https://unwarmed-dee-fourcha.ngrok-free.dev'; 

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        
        'ngrok-skip-browser-warning': 'true', 
    },
});


api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        
        
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);


api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            
            
            await AsyncStorage.removeItem('token'); 
        }
        return Promise.reject(error);
    }
);


export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};


export const authAPI = {
    login: (data) => api.post('/api/core/login/', data),
    registerPatient: (data) => api.post('/api/core/register/patient/', data),
    registerDoctor: (data) => api.post('/api/core/register/doctor/', data),
};

export const appointmentAPI = {
    getDoctorsList: () => api.get('/api/staff/list/'),
    getServices: () => api.get('/api/medical_records/services/'), 
    getDoctorSchedule: (id) => api.get(`/api/staff/schedule/${id}/`), 
    getDoctorLeaves: (id) => api.get(`/api/staff/leaves/${id}/`),
    book: (data) => api.post('/api/appointments/book/', data),

    getDoctorAppointments: () => api.get('/api/appointments/doctor/appointments/'), 
    
    getMySchedule: () => api.get('/api/staff/my-schedule/'), 
    saveMySchedule: (data) => api.post('/api/staff/my-schedule/', data),
    getMyLeaves: () => api.get('/api/staff/my-leave/'),
    addLeave: (data) => api.post('/api/staff/my-leave/', data),
    deleteLeave: (id) => api.delete(`/api/staff/my-leave/${id}/`),
    
    getAppointmentDetails: (id) => api.get(`/api/appointments/${id}/`), 

    getPatientAppointments: () => api.get('/api/appointments/my-appointments/'),
    
    cancelAppointment: (id) => api.patch(`/api/appointments/cancel/${id}/`),
    completeAppointment: (id) => api.patch(`/api/appointments/doctor/complete/${id}/`),
    reschedule: (id, data) => api.patch(`/api/appointments/reschedule/${id}/`, data),
    getBills: () => api.get('/api/medical_records/bills/'),
    getPrescriptions: () => api.get('/api/medical_records/history/'),
    createPrescription: (data) => api.post('/api/medical_records/create/', data),
    giveFeedback: (data) => api.post('/api/appointments/feedback/', data),
    
    getAdminQueue: () => api.get('/api/appointments/admin/today/'),
    updateStatus: (id, status) => api.patch(`/api/appointments/update_status/${id}/`, { status: status }),
    
    getBill: (appointmentId) => api.get(`/api/finance/bill/${appointmentId}/`),
    processPayment: (payload) => api.post('/api/finance/payment/add/', payload),
};

export const profileAPI = {
    getProfile: () => api.get('/api/core/patient/profile/'),
    updateProfile: (data) => api.patch('/api/core/patient/profile/', data),
    getDoctorProfile: () => api.get('/api/staff/profile-update/'),
    updateDoctorProfile: (data) => api.patch('/api/staff/profile-update/', data),
};

export default api;