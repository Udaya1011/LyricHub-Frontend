import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Vibration,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/api';
import { formatTimeAgo } from '../../utils/dateUtils';

const MessagesListScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user } = useContext(AuthContext);
    const [conversations, setConversations] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchData();
        const unsubscribe = navigation.addListener('focus', fetchData);
        const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [navigation]);

    const fetchData = async () => {
        try {
            const [convRes, userRes] = await Promise.all([
                API.get('/messages/conversations/list'),
                API.get(`/users/${user.id}`)
            ]);
            
            // Check if we have new unread messages to potentially alert the user
            const newTotalUnread = convRes.data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
            
            // If unread count increased, vibrate
            if (newTotalUnread > conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)) {
                Vibration.vibrate(200);
            }
            
            setConversations(convRes.data);
            setFriends(userRes.data?.following || []);
            setLoading(false);
            setRefreshing(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const isOnline = (lastActiveDate) => {
        if (!lastActiveDate) return false;
        const lastActive = new Date(lastActiveDate);
        const now = new Date();
        const diffInSeconds = (now - lastActive) / 1000;
        return diffInSeconds < 65;
    };

    const renderConversation = ({ item }) => {
        let displayMessage = item.lastMessage;
        try {
            if (displayMessage && displayMessage.startsWith('{"type":"shared_post"')) {
                displayMessage = "Sent a lyric";
            }
        } catch (e) {}

        return (
            <TouchableOpacity 
                style={styles.card}
                onPress={() => navigation.navigate('Chat', { 
                    userId: item.userId || item._id, 
                    userName: item.userName || item.name, 
                    userPic: item.userPic || item.profilePic 
                })}
            >
                <View style={styles.avatarContainer}>
                    {item.userPic || item.profilePic ? (
                        <Image source={{ uri: item.userPic || item.profilePic }} style={styles.avatar} />
                    ) : (
                        <View style={styles.placeholderAvatar}>
                            <Text style={styles.avatarInitial}>{(item.userName || item.name)?.[0]}</Text>
                        </View>
                    )}
                    {isOnline(item.lastActive) && <View style={styles.onlineIndicator} />}
                </View>
                <View style={styles.info}>
                    <View style={styles.topRow}>
                        <Text style={styles.name}>{item.userName}</Text>
                        <Text style={[styles.time, item.unreadCount > 0 && { color: '#a855f7', fontWeight: 'bold' }]}>
                            {formatTimeAgo(item.createdAt)}
                        </Text>
                    </View>
                    <View style={styles.bottomRow}>
                        <Text style={[styles.lastMessage, item.unreadCount > 0 && { color: '#fff', fontWeight: '500' }]} numberOfLines={1}>
                            {displayMessage}
                        </Text>
                    {item.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
            </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Background orbs */}
            <View style={styles.orb1} />
            <View style={styles.orb2} />

            <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 10 : Math.max(insets.top, 20) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={26} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Friends')}>
                    <Ionicons name="create-outline" size={24} color="#a855f7" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#a855f7" />
                </View>
            ) : (
                <FlatList
                    data={[
                        { type: 'header', title: 'Recent Chats' },
                        ...conversations.map(c => ({ ...c, type: 'conversation' })),
                        { type: 'header', title: 'All Friends' },
                        ...friends.filter(f => !conversations.some(c => c.userId === f._id)).map(f => ({ ...f, type: 'friend' }))
                    ]}
                    keyExtractor={(item, index) => item.userId || item._id || index.toString()}
                    renderItem={({ item }) => {
                        if (item.type === 'header') {
                            return <Text style={styles.sectionHeader}>{item.title}</Text>;
                        }
                        if (item.type === 'conversation') {
                            return renderConversation({ item });
                        }
                        // Render Friend
                        return (
                            <TouchableOpacity 
                                style={styles.card}
                                onPress={() => navigation.navigate('Chat', { 
                                    userId: item._id, 
                                    userName: item.name, 
                                    userPic: item.profilePic 
                                })}
                            >
                                <View style={styles.avatarContainer}>
                                    {item.profilePic ? (
                                        <Image source={{ uri: item.profilePic }} style={styles.avatar} />
                                    ) : (
                                        <View style={styles.placeholderAvatar}>
                                            <Text style={styles.avatarInitial}>{item.name?.[0]}</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.info}>
                                    <Text style={styles.name}>{item.name}</Text>
                                    <Text style={styles.lastMessage}>Start a new message</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a14',
    },
    orb1: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(168, 85, 247, 0.12)',
        top: -50,
        right: -60,
    },
    orb2: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
        bottom: 100,
        left: -40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 55,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: Platform.OS === 'web' ? 'rgba(10, 10, 20, 0.75)' : '#0a0a14',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } : {}),
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '800',
        color: '#a855f7',
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: 5,
    },
    listContent: {
        paddingBottom: 30,
    },
    card: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 18,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    placeholderAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1a1a2e',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(168,85,247,0.3)',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#34d399',
        borderWidth: 2,
        borderColor: '#0d0d1a',
    },
    avatarInitial: {
        color: '#a855f7',
        fontSize: 22,
        fontWeight: 'bold',
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    time: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 11,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    unreadBadge: {
        backgroundColor: '#a855f7',
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginLeft: 10,
        elevation: 4,
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    unreadText: {
        color: '#000',
        fontSize: 11,
        fontWeight: '900',
    },
    lastMessage: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        lineHeight: 18,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default MessagesListScreen;
