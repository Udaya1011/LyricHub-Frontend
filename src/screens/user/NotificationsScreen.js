import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Image, 
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../../api/api';

const NotificationsScreen = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await API.get('/notifications');
            setNotifications(res.data);
            
            // Mark all as read
            await API.put('/notifications/read');
        } catch (err) {
            console.error('Fetch notifications error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const renderNotification = ({ item }) => {
        const getMessage = () => {
            switch (item.type) {
                case 'like': return 'liked your lyric';
                case 'comment': return 'commented on your lyric';
                case 'new_post': return 'posted a new lyric';
                case 'new_user': return 'just joined LyricHub! 🎉';
                default: return 'sent you a notification';
            }
        };

        const getIcon = () => {
            switch (item.type) {
                case 'like': return { name: 'heart', color: '#ff5252' };
                case 'comment': return { name: 'chatbubble', color: '#a855f7' };
                case 'new_post': return { name: 'musical-notes', color: '#00d2ff' };
                case 'new_user': return { name: 'sparkles', color: '#facc15' };
                default: return { name: 'notifications', color: '#fff' };
            }
        };

        const icon = getIcon();

        return (
            <TouchableOpacity 
                style={[styles.notificationCard, !item.read && styles.unreadCard]}
                onPress={() => item.post && navigation.navigate('PostDetail', { postId: item.post._id })}
            >
                {item.sender?.profilePic ? (
                    <Image source={{ uri: item.sender.profilePic }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.placeholderAvatar]}>
                        <Text style={styles.avatarInitial}>{item.sender?.name?.[0]}</Text>
                    </View>
                )}
                
                <View style={styles.content}>
                    <Text style={styles.message}>
                        <Text style={styles.senderName}>{item.sender?.name}</Text> {getMessage()}
                    </Text>
                    {item.post && <Text style={styles.postTitle}>"{item.post.title}"</Text>}
                    <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>

                <View style={[styles.iconBadge, { backgroundColor: icon.color + '20' }]}>
                    <Ionicons name={icon.name} size={16} color={icon.color} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.orb1} />
            <View style={styles.orb2} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 28 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#a855f7" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item._id}
                    renderItem={renderNotification}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={80} color="rgba(255,255,255,0.05)" />
                            <Text style={styles.emptyText}>No notifications yet.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a14' },
    orb1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(168, 85, 247, 0.1)', top: -50, right: -60 },
    orb2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(168, 85, 247, 0.05)', bottom: 100, left: -40 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 55, paddingBottom: 20,
        backgroundColor: 'rgba(26, 26, 46, 0.8)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    backBtn: { padding: 5 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 15, paddingBottom: 100 },
    notificationCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 15, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
    },
    unreadCard: { backgroundColor: 'rgba(168, 85, 247, 0.08)', borderColor: 'rgba(168, 85, 247, 0.2)' },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' },
    placeholderAvatar: { backgroundColor: 'rgba(168,85,247,0.1)', justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { color: '#a855f7', fontWeight: 'bold', fontSize: 20 },
    content: { flex: 1 },
    message: { color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 20 },
    senderName: { color: '#fff', fontWeight: 'bold' },
    postTitle: { color: '#a855f7', fontSize: 13, marginTop: 4, fontWeight: '500' },
    time: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 6 },
    iconBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { color: 'rgba(255,255,255,0.2)', fontSize: 18, marginTop: 20 }
});

export default NotificationsScreen;
