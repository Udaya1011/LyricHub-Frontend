import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    Alert, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../../api/api';

const SecurityScreen = ({ navigation }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            return Alert.alert('Error', 'Please fill all fields');
        }

        if (newPassword !== confirmPassword) {
            return Alert.alert('Error', 'Passwords do not match');
        }

        if (newPassword.length < 6) {
            return Alert.alert('Error', 'New password must be at least 6 characters');
        }

        setLoading(true);
        setSuccess(false);
        try {
            await API.put('/auth/change-password', {
                currentPassword,
                newPassword
            });
            setSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            
            // Auto redirect after 1.5s
            setTimeout(() => {
                navigation.goBack();
            }, 1500);
        } catch (err) {
            console.error(err);
            Alert.alert('Error', err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Security</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.iconSection}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="lock-closed" size={40} color="#a855f7" />
                    </View>
                    <Text style={styles.title}>Change Password</Text>
                    <Text style={styles.subtitle}>Protect your account with a strong password</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Current Password</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter current password"
                            placeholderTextColor="#666"
                            secureTextEntry={!showCurrent}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />
                        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowCurrent(!showCurrent)}>
                            <Ionicons name={showCurrent ? "eye-off" : "eye"} size={22} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter new password"
                            placeholderTextColor="#666"
                            secureTextEntry={!showNew}
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNew(!showNew)}>
                            <Ionicons name={showNew ? "eye-off" : "eye"} size={22} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Confirm New Password</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm new password"
                            placeholderTextColor="#666"
                            secureTextEntry={!showConfirm}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirm(!showConfirm)}>
                            <Ionicons name={showConfirm ? "eye-off" : "eye"} size={22} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {success && (
                        <View style={styles.successContainer}>
                            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                            <Text style={styles.successText}>Password updated successfully!</Text>
                        </View>
                    )}

                    <TouchableOpacity 
                        style={[styles.button, (loading || success) && styles.buttonDisabled]} 
                        onPress={handleChangePassword}
                        disabled={loading || success}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : success ? (
                            <Ionicons name="checkmark" size={24} color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Update Password</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a14' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 55, paddingBottom: 20,
        backgroundColor: 'rgba(26, 26, 46, 0.8)'
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    content: { padding: 25 },
    iconSection: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
    iconCircle: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(168,85,247,0.1)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
        borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)'
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
    form: { marginTop: 10 },
    label: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 8, marginLeft: 4 },
    inputWrapper: { position: 'relative', marginBottom: 20 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16,
        paddingRight: 50, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    eyeIcon: { position: 'absolute', right: 15, top: 16 },
    button: {
        backgroundColor: '#a855f7', paddingVertical: 16, borderRadius: 12,
        alignItems: 'center', marginTop: 10,
        shadowColor: '#a855f7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    successContainer: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
        backgroundColor: 'rgba(16,185,129,0.1)', padding: 12, borderRadius: 10,
        marginBottom: 15, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)'
    },
    successText: { color: '#10b981', fontSize: 14, fontWeight: '600', marginLeft: 8 }
});

export default SecurityScreen;
