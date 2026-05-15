import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'web' 
    ? 'http://localhost:5000/api'
    : 'http://10.170.198.119:5000/api';

const API = axios.create({
    baseURL: BASE_URL,
});

API.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;
