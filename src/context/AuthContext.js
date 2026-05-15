import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        checkLoggedIn();
    }, []);

    useEffect(() => {
        let interval;
        if (user) {
            fetchUnreadCount();
            // Heartbeat + Unread Count check
            interval = setInterval(() => {
                API.get('/auth/heartbeat').catch(() => {});
                fetchUnreadCount();
            }, 15000);
        }
        return () => clearInterval(interval);
    }, [user]);

    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const res = await API.get('/messages/unread/total');
            setUnreadCount(res.data.count);
        } catch (err) {
            console.error('Fetch unread error:', err);
        }
    };

    const checkLoggedIn = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userData = await AsyncStorage.getItem('user');
            if (token && userData && userData !== 'undefined') {
                setUser(JSON.parse(userData));
            }
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await API.post('/auth/login', { email, password });
        await AsyncStorage.setItem('token', res.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
    };

    const register = async (name, email, password) => {
        const res = await API.post('/auth/register', { name, email, password });
        await AsyncStorage.setItem('token', res.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        setUser(null);
    };

    const updateProfile = async (name, bio, profilePic) => {
        const res = await API.put('/auth/update', { name, bio, profilePic });
        const updatedUser = {
            id: res.data._id,
            name: res.data.name,
            email: res.data.email,
            profilePic: res.data.profilePic,
            bio: res.data.bio,
            followers: res.data.followers || [],
            following: res.data.following || [],
            isAdmin: res.data.isAdmin
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const refreshUser = async () => {
        if (!user) return;
        try {
            const res = await API.get(`/users/${user.id}`);
            const updatedUser = {
                id: res.data._id,
                name: res.data.name,
                email: res.data.email,
                profilePic: res.data.profilePic,
                bio: res.data.bio,
                followers: res.data.followers || [],
                following: res.data.following || [],
                isAdmin: res.data.isAdmin
            };
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        } catch (err) {
            console.error('Refresh user error:', err);
        }
    };

    const optimisticFollow = (targetUserId) => {
        if (!user) return;
        const isFollowing = user.following?.some(f => 
            (typeof f === 'string' ? f === targetUserId : f?._id === targetUserId)
        );
        
        let newFollowing;
        if (isFollowing) {
            newFollowing = user.following.filter(f => 
                (typeof f === 'string' ? f !== targetUserId : f?._id !== targetUserId)
            );
        } else {
            newFollowing = [...(user.following || []), targetUserId];
        }

        const updatedUser = { ...user, following: newFollowing };
        setUser(updatedUser);
        AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            unreadCount,
            login, 
            register, 
            logout, 
            updateProfile, 
            refreshUser, 
            optimisticFollow,
            fetchUnreadCount
        }}>
            {children}
        </AuthContext.Provider>
    );
};
