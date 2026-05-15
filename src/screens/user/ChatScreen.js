import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator,
    Vibration,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/api';
import { formatTimeAgo } from '../../utils/dateUtils';

const ChatScreen = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { userId, userName, userPic } = route.params;
    const { user: currentUser } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [targetUser, setTargetUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef();

    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        fetchMessages();
        fetchTargetUser();
        const interval = setInterval(() => {
            fetchMessages();
            fetchTargetUser();
        }, 3000); 

        const showSubscription = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardOpen(true));
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardOpen(false));

        return () => {
            clearInterval(interval);
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await API.get(`/messages/${userId}`);
            setMessages(res.data);
            setLoading(false);
            
            // Mark as read if there are unread messages from the other user
            const hasUnread = res.data.some(m => m.sender === userId && !m.read);
            if (hasUnread) {
                Vibration.vibrate(100);
                await API.put(`/messages/read/${userId}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTargetUser = async () => {
        try {
            const res = await API.get(`/users/${userId}`);
            setTargetUser(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const isOnline = () => {
        if (!targetUser?.lastActive) return false;
        const lastActive = new Date(targetUser.lastActive);
        const now = new Date();
        const diffInSeconds = (now - lastActive) / 1000;
        return diffInSeconds < 65; 
    };

    const handleSend = async () => {
        if (!text.trim()) return;
        const msgText = text;
        setText('');
        
        try {
            const res = await API.post('/messages', {
                receiver: userId,
                text: msgText
            });
            setMessages([...messages, res.data]);
            setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
        } catch (err) {
            console.error(err);
        }
    };

    const renderMessage = ({ item }) => {
        const isMine = item.sender === currentUser.id;
        
        let isSharedPost = false;
        let postData = null;
        try {
            if (item.text.startsWith('{"type":"shared_post"')) {
                postData = JSON.parse(item.text);
                isSharedPost = true;
            }
        } catch (e) {}

        if (isSharedPost) {
            return (
                <View style={[styles.messageWrapper, isMine ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
                    <TouchableOpacity 
                        style={[styles.sharedPostBubble, isMine ? styles.myBubble : styles.theirBubble]}
                        onPress={() => navigation.navigate('PostDetail', { postId: postData.postId })}
                    >
                        <View style={styles.sharedPostHeader}>
                            <Ionicons name="musical-note" size={14} color="#fff" style={{marginRight: 6}} />
                            <Text style={styles.sharedPostLabel}>Shared Lyric Post</Text>
                        </View>
                        <View style={styles.sharedPostCard}>
                            <Text style={styles.sharedPostTitle}>{postData.title}</Text>
                            <Text style={styles.sharedPostAuthor}>by {postData.author}</Text>
                            
                            {postData.imageUrl ? (
                                <Image source={{ uri: postData.imageUrl }} style={styles.sharedPostImage} resizeMode="cover" />
                            ) : null}

                            <Text style={styles.sharedPostLyrics} numberOfLines={3}>{postData.lyrics}</Text>
                        </View>

                        <View style={styles.sharedPostFooter}>
                            <Text style={styles.viewPostLink}>View Post →</Text>
                            <Text style={styles.timeText}>
                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={[styles.messageWrapper, isMine ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
                <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.theirBubble]}>
                    <Text style={styles.messageText}>{item.text}</Text>
                    <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView 
                style={styles.flexContainer} 
                behavior={Platform.OS === 'web' ? null : (Platform.OS === 'ios' ? 'padding' : 'height')}
                keyboardVerticalOffset={0}
            >

                {/* Header inside to stay anchored */}
                <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 10 : Math.max(insets.top, 20) }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.userInfo}>
                        {userPic ? (
                            <Image source={{ uri: userPic }} style={styles.avatar} />
                        ) : (
                            <View style={styles.placeholderAvatar}>
                                <Text style={styles.avatarInitial}>{userName?.[0]}</Text>
                            </View>
                        )}
                        <View>
                            <Text style={styles.userName}>{userName}</Text>
                            <Text style={[styles.statusText, { color: isOnline() ? '#34d399' : '#666' }]}>
                                {isOnline() ? 'Online' : 'Offline'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Messages */}

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator color="#a855f7" />
                    </View>
                ) : (
                    <FlatList
                        style={{ flex: 1 }}
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item._id}
                        renderItem={renderMessage}
                        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    />
                )}

                {/* Input */}
                <View style={[
                    styles.inputArea, 
                    { paddingBottom: Platform.OS === 'web' ? 10 : (isKeyboardOpen ? 10 : Math.max(insets.bottom, 10)) }
                ]}>
                    <TouchableOpacity style={styles.attachBtn}>
                        <Ionicons name="add" size={28} color="#aaa" />
                    </TouchableOpacity>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            placeholderTextColor="#666"
                            value={text}
                            onChangeText={setText}
                            multiline
                        />
                        <TouchableOpacity style={styles.emojiBtn}>
                            <Ionicons name="happy-outline" size={22} color="#aaa" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );

};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a14',
        height: Platform.OS === 'web' ? '100dvh' : '100%',
        overflow: 'hidden',
    },

    flexContainer: {
        flex: 1,
    },
    orb1: {
        position: 'absolute', width: 220, height: 220, borderRadius: 110,
        backgroundColor: 'rgba(168, 85, 247, 0.12)', top: -50, right: -60,
    },
    orb2: {
        position: 'absolute', width: 160, height: 160, borderRadius: 80,
        backgroundColor: 'rgba(168, 85, 247, 0.08)', bottom: 100, left: -40,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingBottom: 12, paddingHorizontal: 15,
        backgroundColor: '#0a0a14', 
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
        zIndex: 100,
    },

    backBtn: { padding: 5 },
    userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
    placeholderAvatar: { 
        width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(168,85,247,0.1)', 
        alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' 
    },
    avatarInitial: { color: '#a855f7', fontWeight: 'bold', fontSize: 18 },
    userName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    statusText: { fontSize: 11 },
    listContent: { padding: 15, paddingBottom: 20 },
    messageWrapper: { marginVertical: 6, width: '100%' },
    myMessageWrapper: { alignItems: 'flex-end' },
    theirMessageWrapper: { alignItems: 'flex-start' },
    messageBubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
    myBubble: { backgroundColor: '#a855f7', borderBottomRightRadius: 4 },
    theirBubble: { backgroundColor: 'rgba(255,255,255,0.1)', borderBottomLeftRadius: 4 },
    messageText: { color: '#fff', fontSize: 15, lineHeight: 20 },
    timeText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4 },
    
    // Shared Post Card
    sharedPostBubble: { width: 250, padding: 12, borderRadius: 20 },
    sharedPostHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, opacity: 0.8 },
    sharedPostLabel: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    sharedPostCard: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12, marginBottom: 8 },
    sharedPostTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
    sharedPostAuthor: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8 },
    sharedPostImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 8, backgroundColor: 'rgba(0,0,0,0.1)' },
    sharedPostLyrics: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontStyle: 'italic' },

    sharedPostFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    viewPostLink: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    inputArea: { 
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, 
        backgroundColor: 'rgba(26, 26, 46, 0.95)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' 
    },
    attachBtn: { padding: 5 },
    inputContainer: { 
        flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a14', 
        borderRadius: 22, paddingHorizontal: 12, marginHorizontal: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 44 
    },
    input: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 8 },
    emojiBtn: { padding: 5 },
    sendBtn: { 
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#a855f7', alignItems: 'center', justifyContent: 'center', 
        elevation: 2, shadowColor: '#a855f7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default ChatScreen;
