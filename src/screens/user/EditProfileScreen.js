import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import API from '../../api/api';

const EditProfileScreen = ({ navigation }) => {
    const { user, updateProfile } = useContext(AuthContext);
    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [profilePic, setProfilePic] = useState(user?.profilePic || '');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            return Alert.alert('Permission Denied', 'We need access to your photos to change your profile picture.');
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri) => {
        setUploading(true);
        const formData = new FormData();
        
        try {
            if (Platform.OS === 'web') {
                const response = await fetch(uri);
                const blob = await response.blob();
                formData.append('image', blob, 'profile.jpg');
            } else {
                const fileName = uri.split('/').pop();
                const match = /\.(\w+)$/.exec(fileName);
                const fileType = match ? `image/${match[1]}` : `image`;
                
                formData.append('image', {
                    uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                    name: fileName,
                    type: fileType,
                });
            }

            const res = await API.post('/auth/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProfilePic(res.data.imageUrl);
            Alert.alert('Success', 'Profile picture uploaded!');
        } catch (err) {
            console.error('Upload error:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to upload image';
            Alert.alert('Upload Failed', errorMsg);
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async () => {
        if (!name) return Alert.alert('Error', 'Name is required');
        
        setLoading(true);
        try {
            await updateProfile(name, bio, profilePic);
            Alert.alert('Success', 'Profile updated successfully!');
            navigation.goBack();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to update profile');
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
                    <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleUpdate} disabled={loading || uploading}>
                    {loading ? <ActivityIndicator color="#a855f7" /> : <Text style={styles.saveButtonText}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        {profilePic ? (
                            <Image source={{ uri: profilePic }} style={styles.avatar} />
                        ) : (
                            <View style={styles.placeholderAvatar}>
                                <Text style={styles.avatarInitial}>{name?.[0] || 'U'}</Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.editAvatarButton} onPress={pickImage} disabled={uploading}>
                            {uploading ? <ActivityIndicator size="small" color="#000" /> : <Ionicons name="camera" size={20} color="#000" />}
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={pickImage} disabled={uploading}>
                        <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputSection}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Your full name"
                        placeholderTextColor="#666"
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.label}>Bio</Text>
                    <TextInput
                        style={[styles.input, styles.bioInput]}
                        placeholder="Tell us about yourself..."
                        placeholderTextColor="#666"
                        value={bio}
                        onChangeText={setBio}
                        multiline
                        numberOfLines={4}
                    />

                    <Text style={styles.label}>Profile Picture URL (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Image URL (http://...)"
                        placeholderTextColor="#666"
                        value={profilePic}
                        onChangeText={setProfilePic}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#1e1e1e',
        borderBottomWidth: 1,
        borderBottomColor: '#252525',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#a855f7',
    },
    scrollContent: {
        padding: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 10,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#a855f7',
    },
    placeholderAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1e1e1e',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#a855f7',
    },
    avatarInitial: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#a855f7',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#a855f7',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#121212',
    },
    changePhotoText: {
        color: '#a855f7',
        fontSize: 14,
        fontWeight: '600',
    },
    inputSection: {
        marginTop: 10,
    },
    label: {
        color: '#666',
        fontSize: 14,
        marginBottom: 8,
        marginLeft: 5,
    },
    input: {
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        padding: 15,
        color: '#fff',
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    bioInput: {
        height: 100,
        textAlignVertical: 'top',
    },
});

export default EditProfileScreen;
