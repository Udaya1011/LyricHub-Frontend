import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import API from '../../api/api';

const CreatePostScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const editPost = route.params?.post;
    const [title, setTitle] = useState(editPost?.title || '');
    const [lyrics, setLyrics] = useState(editPost?.lyrics || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (route.params?.post) {
                setTitle(route.params.post.title);
                setLyrics(route.params.post.lyrics);
            } else {
                // Clear fields if it's a new post (no post param)
                setTitle('');
                setLyrics('');
            }
        });

        return unsubscribe;
    }, [navigation, route.params]);

    const handleCreatePost = async () => {
        if (!title || !lyrics) return Alert.alert('Error', 'Please fill all fields');
        
        setLoading(true);
        try {
            if (editPost) {
                await API.put(`/posts/${editPost._id}`, { title, lyrics });
                Alert.alert('Success', 'Post updated successfully!');
            } else {
                await API.post('/posts', { title, lyrics });
                Alert.alert('Success', 'Post created successfully!');
            }
            
            // Reset state and clear params after successful operation
            setTitle('');
            setLyrics('');
            navigation.setParams({ post: undefined });
            
            // Navigate back or to Home
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.navigate('Home');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', `Failed to ${editPost ? 'update' : 'create'} post`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            {/* Decorative background orbs */}
            <View style={styles.orb1} />
            <View style={styles.orb2} />

            <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 10 : Math.max(insets.top, 55) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="close-outline" size={32} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Compose</Text>
                <TouchableOpacity 
                    style={[styles.postBtn, (!title || !lyrics) && styles.postBtnDisabled]} 
                    onPress={handleCreatePost} 
                    disabled={loading || !title || !lyrics}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.postBtnText}>Post</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.inputCard}>
                    <TextInput
                        style={styles.titleInput}
                        placeholder="Song Title"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={title}
                        onChangeText={setTitle}
                    />
                    
                    <View style={styles.divider} />

                    <TextInput
                        style={styles.lyricsInput}
                        placeholder="Let your soul flow here..."
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={lyrics}
                        onChangeText={setLyrics}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.footer}>
                    <View style={styles.charCount}>
                        <Ionicons name="text-outline" size={16} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.charText}>{lyrics.length} characters</Text>
                    </View>
                    <View style={styles.soulBadge}>
                        <Ionicons name="sparkles" size={16} color="#a855f7" />
                        <Text style={styles.soulText}>Lyric Soul</Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a14' },
    orb1: {
        position: 'absolute', width: 250, height: 250, borderRadius: 125,
        backgroundColor: 'rgba(168, 85, 247, 0.1)', top: -100, right: -100,
    },
    orb2: {
        position: 'absolute', width: 200, height: 200, borderRadius: 100,
        backgroundColor: 'rgba(0, 229, 255, 0.05)', bottom: -50, left: -50,
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingBottom: 20,
        backgroundColor: 'rgba(26, 26, 46, 0.8)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    backBtn: { padding: 5 },
    postBtn: {
        backgroundColor: '#a855f7', paddingHorizontal: 20, paddingVertical: 8,
        borderRadius: 20, shadowColor: '#a855f7', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8
    },
    postBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)', shadowOpacity: 0 },
    postBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    scrollContent: { padding: 20 },
    inputCard: {
        backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 25, padding: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', minHeight: 450,
    },
    titleInput: {
        fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 15,
        paddingVertical: 10
    },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },
    lyricsInput: {
        fontSize: 18, color: 'rgba(255,255,255,0.8)', flex: 1, lineHeight: 28,
        fontStyle: 'italic', paddingBottom: 20
    },
    footer: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 20, paddingHorizontal: 10
    },
    charCount: { flexDirection: 'row', alignItems: 'center' },
    charText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginLeft: 6 },
    soulBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(168,85,247,0.1)',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15,
        borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)'
    },
    soulText: { color: '#a855f7', fontSize: 12, fontWeight: 'bold', marginLeft: 6 }
});

export default CreatePostScreen;
