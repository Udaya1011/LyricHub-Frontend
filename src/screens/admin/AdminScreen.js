import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Image, 
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../../api/api';
import { AuthContext } from '../../context/AuthContext';

const AdminScreen = ({ navigation }) => {
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState('users'); // 'users' or 'posts'

    const [unreadCount, setUnreadCount] = useState(0);

    const fetchData = async () => {
        try {
            const [usersRes, postsRes, notifRes] = await Promise.all([
                API.get('/admin/users'),
                API.get('/admin/posts'),
                API.get('/notifications')
            ]);
            setUsers(usersRes.data);
            setPosts(postsRes.data);
            setUnreadCount(notifRes.data.filter(n => !n.read).length);
        } catch (err) {
            console.error('Admin fetch error:', err);
            Alert.alert('Error', 'Failed to fetch admin data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(async () => {
            try {
                const res = await API.get('/notifications');
                setUnreadCount(res.data.filter(n => !n.read).length);
            } catch (e) {}
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleDeleteUser = (userId, name) => {
        Alert.alert(
            "Delete User",
            `Are you sure you want to delete ${name}? All their posts will also be deleted.`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await API.delete(`/admin/users/${userId}`);
                            fetchData();
                        } catch (err) {
                            Alert.alert("Error", err.response?.data?.message || "Delete failed");
                        }
                    }
                }
            ]
        );
    };

    const handleDeletePost = (postId) => {
        Alert.alert(
            "Delete Post",
            "Are you sure you want to delete this post?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await API.delete(`/admin/posts/${postId}`);
                            fetchData();
                        } catch (err) {
                            Alert.alert("Error", "Delete failed");
                        }
                    }
                }
            ]
        );
    };

    const renderUser = ({ item }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('UserProfile', { userId: item._id })}
        >
            <View style={styles.userInfo}>
                <Image source={{ uri: item.profilePic }} style={styles.avatar} />
                <View>
                    <Text style={styles.name}>{item.name} {item.isAdmin && <Text style={styles.adminTag}>(Admin)</Text>}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                    <Text style={styles.stats}>{item.followers?.length || 0} followers • {item.following?.length || 0} following</Text>
                </View>
            </View>
            {!item.isAdmin && (
                <TouchableOpacity 
                    onPress={() => handleDeleteUser(item._id, item.name)} 
                    style={styles.deleteBtn}
                >
                    <Ionicons name="trash-outline" size={20} color="#ff5252" />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    const renderPost = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.postInfo}>
                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.postAuthor}>by {item.userId?.name}</Text>
                <Text style={styles.postLyrics} numberOfLines={2}>{item.lyrics}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeletePost(item._id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color="#ff5252" />
            </TouchableOpacity>
        </View>
    );

    const { logout } = React.useContext(AuthContext);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={{ width: 40 }}>
                    <TouchableOpacity onPress={logout} style={styles.backBtn}>
                        <Ionicons name="log-out-outline" size={28} color="#ff5252" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerTitle}>Admin Panel</Text>
                <TouchableOpacity 
                    style={styles.iconButton} 
                    onPress={() => navigation.navigate('Notifications')}
                >
                    <Ionicons name="notifications-outline" size={28} color="#fff" />
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity 
                    style={[styles.tab, tab === 'users' && styles.activeTab]} 
                    onPress={() => setTab('users')}
                >
                    <Text style={[styles.tabText, tab === 'users' && styles.activeTabText]}>Users ({users.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, tab === 'posts' && styles.activeTab]} 
                    onPress={() => setTab('posts')}
                >
                    <Text style={[styles.tabText, tab === 'posts' && styles.activeTabText]}>Posts ({posts.length})</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#a855f7" />
                </View>
            ) : (
                <FlatList
                    data={tab === 'users' ? users : posts}
                    keyExtractor={item => item._id}
                    renderItem={tab === 'users' ? renderUser : renderPost}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a14' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 55, paddingBottom: 20,
        backgroundColor: 'rgba(26, 26, 46, 0.8)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    backBtn: { padding: 5 },
    iconButton: { position: 'relative', padding: 5 },
    badge: { 
        position: 'absolute', top: -2, right: -2, backgroundColor: '#a855f7', 
        borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#1a1a2e'
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    tabs: { flexDirection: 'row', padding: 15, backgroundColor: 'rgba(255,255,255,0.02)' },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    activeTab: { backgroundColor: 'rgba(168,85,247,0.1)' },
    tabText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
    activeTabText: { color: '#a855f7' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 15 },
    card: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 15,
        marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
    },
    userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
    name: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    adminTag: { color: '#a855f7', fontSize: 12 },
    email: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
    stats: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 },
    postInfo: { flex: 1, marginRight: 10 },
    postTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    postAuthor: { color: '#a855f7', fontSize: 12, marginBottom: 4 },
    postLyrics: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
    deleteBtn: { padding: 10, backgroundColor: 'rgba(255,82,82,0.1)', borderRadius: 10 }
});

export default AdminScreen;
