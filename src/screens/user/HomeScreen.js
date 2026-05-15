import React, { useContext, useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Image,
    TouchableOpacity,
    RefreshControl,
    Platform,
    Animated,
    Share,
    Alert,
    Modal,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    Pressable
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import API from '../../api/api';
import { formatTimeAgo } from '../../utils/dateUtils';

const { height } = Dimensions.get('window');

const isWeb = Platform.OS === 'web';
const ModalContainer = isWeb ? View : KeyboardAvoidingView;
const modalKavProps = isWeb ? {} : {
    behavior: Platform.OS === 'ios' ? 'padding' : 'height',
};

const HomeScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user: contextUser, logout, refreshUser, optimisticFollow } = useContext(AuthContext);
    const [posts, setPosts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [friends, setFriends] = useState([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [activePost, setActivePost] = useState(null);
    const [sharing, setSharing] = useState(false);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [commentText, setCommentText] = useState('');
    const [commenting, setCommenting] = useState(false);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [modalComments, setModalComments] = useState([]);
    const commentsScrollRef = useRef(null);

    const fetchUnreadCount = async () => {
        try {
            const res = await API.get('/notifications');
            const unread = res.data.filter(n => !n.read).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Fetch unread error:', err);
        }
    };

    const openOptionsModal = (post) => {
        setActivePost(post);
        setShowOptionsModal(true);
    };

    const openCommentModal = (post) => {
        setActivePost(post);
        setModalComments(post.comments || []);
        setCommentText('');
        setShowCommentModal(true);
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || commenting) return;
        const text = commentText.trim();
        setCommentText('');

        const optimistic = {
            _id: `temp_${Date.now()}`,
            text,
            userId: { name: contextUser?.name, _id: contextUser?.id, profilePic: contextUser?.profilePic },
            createdAt: new Date().toISOString(),
        };
        setModalComments(prev => [...prev, optimistic]);

        setCommenting(true);
        try {
            const res = await API.post(`/posts/${activePost._id}/comment`, { text });
            if (res.data?.comments) {
                setModalComments(res.data.comments);
            }
            fetchPosts();
        } catch (err) {
            console.error('Comment error:', err);
            setModalComments(prev => prev.filter(c => c._id !== optimistic._id));
            setCommentText(text);
        } finally {
            setCommenting(false);
        }
    };

    const handleEdit = () => {
        setShowOptionsModal(false);
        navigation.navigate('Add', { post: activePost });
    };

    const handleDelete = async () => {
        try {
            setShowOptionsModal(false);
            await API.delete(`/posts/${activePost._id}`);
            fetchPosts();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const fetchPosts = async () => {
        try {
            const res = await API.get('/posts');
            setPosts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchFriends = async () => {
        try {
            const res = await API.get(`/users/${contextUser?.id}`);
            setFriends(res.data?.following || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchFriends();
        fetchUnreadCount();

        const interval = setInterval(fetchUnreadCount, 10000);

        const unsubscribe = navigation.addListener('focus', () => {
            refreshUser();
            fetchPosts();
            fetchFriends();
            fetchUnreadCount();
        });

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [navigation]);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchPosts(), fetchFriends()]);
        setRefreshing(false);
    };

    const handleFollow = async (userId) => {
        try {
            optimisticFollow(userId);
            await API.post(`/users/${userId}/follow`);
            await refreshUser();
        } catch (err) {
            console.error('Follow error:', err);
            optimisticFollow(userId);
        }
    };

    const handleLike = async (postId) => {
        try {
            await API.post(`/posts/${postId}/like`);
            fetchPosts();
        } catch (err) {
            console.error('Like error:', err);
        }
    };

    const openShareModal = (post) => {
        setSelectedPost(post);
        setSelectedFriends([]);
        setShowShareModal(true);
    };

    const toggleFriendSelection = (friendId) => {
        setSelectedFriends(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    };

    const handleShareToSelected = async () => {
        if (sharing || selectedFriends.length === 0) return;
        setSharing(true);
        try {
            const shareData = JSON.stringify({
                type: 'shared_post',
                postId: selectedPost._id,
                title: selectedPost.title,
                lyrics: selectedPost.lyrics,
                imageUrl: selectedPost.imageUrl,
                author: selectedPost.userId?.name || 'Unknown Writer'

            });

            await Promise.all(selectedFriends.map(friendId =>
                API.post('/messages', {
                    receiver: friendId,
                    text: shareData
                })
            ));

            Alert.alert('Success', `Shared with ${selectedFriends.length} friends!`);
            setShowShareModal(false);
        } catch (err) {
            console.error('Share error:', err);
        } finally {
            setSharing(false);
        }
    };

    const renderPost = ({ item }) => {
        const postUserId = item.userId?._id || item.userId;
        const isOwnPost = postUserId === contextUser?.id;
        const isFollowing = contextUser?.following?.some(f => (f?._id || f) === postUserId);

        return (
            <View style={styles.postCard}>
                <View style={styles.postHeader}>
                    <TouchableOpacity
                        style={styles.userInfo}
                        onPress={() => navigation.navigate('Profile', { userId: item.userId?._id })}
                    >
                        {item.userId?.profilePic ? (
                            <Image source={{ uri: item.userId.profilePic }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.placeholderAvatar]}>
                                <Text style={styles.avatarInitial}>{item.userId?.name?.[0] || 'U'}</Text>
                            </View>
                        )}
                        <View>
                            <Text style={styles.username}>{item.userId?.name}</Text>
                            <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
                        </View>
                    </TouchableOpacity>
                    {!isOwnPost ? (
                        <TouchableOpacity
                            style={[styles.followButton, isFollowing && styles.followingButton]}
                            onPress={() => handleFollow(item.userId?._id)}
                        >
                            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                                {isFollowing ? 'Friends' : 'Follow'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.iconAction} onPress={() => openOptionsModal(item)}>
                            <Ionicons name="ellipsis-vertical" size={20} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.postBody}
                    onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
                >
                    <Text style={styles.postTitle}>{item.title}</Text>
                    
                    {item.imageUrl ? (
                        <View style={styles.postImageContainer}>
                            <Image 
                                source={{ uri: item.imageUrl }} 
                                style={styles.postImage} 
                                resizeMode="cover"
                            />
                        </View>
                    ) : null}

                    <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled showsVerticalScrollIndicator>
                        <Text style={styles.lyrics}>{item.lyrics}</Text>
                    </ScrollView>
                </TouchableOpacity>


                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item._id)}>
                        <Ionicons name={item.likes?.includes(contextUser?.id) ? "heart" : "heart-outline"} size={24} color={item.likes?.includes(contextUser?.id) ? "#ff4757" : "rgba(255,255,255,0.5)"} />
                        <Text style={styles.actionText}>{item.likes?.length || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => openCommentModal(item)}>
                        <Ionicons name="chatbubble-outline" size={24} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.actionText}>{item.comments?.length || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => openShareModal(item)}>
                        <Ionicons name="share-social-outline" size={24} color="rgba(255,255,255,0.5)" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.orb1} />
            <View style={styles.orb2} />

            <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 10 : Math.max(insets.top, 20) }]}>
                <Text style={styles.headerTitle}>LyricHub</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
                        <Ionicons name="notifications-outline" size={26} color="#fff" />
                        {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>}
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                style={{ flex: 1 }}
                data={posts}
                renderItem={renderPost}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />}

                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No lyrics shared yet.</Text>
                    </View>
                }
            />

            {/* Share Modal */}
            <Modal visible={showShareModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowShareModal(false)} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Share Lyrics</Text>
                            <TouchableOpacity onPress={() => setShowShareModal(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
                        </View>
                        <FlatList
                            data={friends}
                            keyExtractor={item => item._id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.friendItem, selectedFriends.includes(item._id) && styles.friendItemSelected]}
                                    onPress={() => toggleFriendSelection(item._id)}
                                >
                                    <View style={styles.friendRow}>
                                        {item.profilePic ? (
                                            <Image source={{ uri: item.profilePic }} style={styles.friendAvatar} />
                                        ) : (
                                            <View style={styles.friendAvatarPlaceholder}>
                                                <Ionicons name="person" size={20} color="#666" />
                                            </View>
                                        )}
                                        <Text style={styles.friendName}>{item.name}</Text>
                                    </View>
                                    {selectedFriends.includes(item._id) && (
                                        <Ionicons name="checkmark-circle" size={24} color="#a855f7" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.sendAllBtn} onPress={handleShareToSelected}><Text style={styles.sendAllText}>Send to Friends</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Options Modal */}
            <Modal visible={showOptionsModal} transparent animationType="fade">
                <View style={styles.optionsOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowOptionsModal(false)} />
                    <View style={styles.optionsContent}>
                        <TouchableOpacity style={styles.optionBtn} onPress={handleEdit}><Text style={styles.optionText}>Edit Post</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.optionBtn} onPress={handleDelete}><Text style={[styles.optionText, { color: '#ff4757' }]}>Delete Post</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Comment Modal */}
            <Modal
                visible={showCommentModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCommentModal(false)}
            >
                <ModalContainer style={{ flex: 1 }} {...modalKavProps}>
                    <View style={styles.cmtOverlay}>
                        <Pressable 
                            style={StyleSheet.absoluteFill} 
                            onPress={() => setShowCommentModal(false)} 
                        />
                        <View style={styles.cmtSheet}>
                            <View style={styles.cmtDragBar} />
                            
                            <View style={styles.cmtHeader}>
                                <View>
                                    <Text style={styles.modalTitle}>Resonations</Text>
                                    <Text style={styles.modalSubtitle}>{modalComments.length} souls responding</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowCommentModal(false)}>
                                    <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.3)" />
                                </TouchableOpacity>
                            </View>

                            {activePost && (
                                <View style={styles.cmtPostContext}>
                                    <Image 
                                        source={activePost.userId?.profilePic ? { uri: activePost.userId.profilePic } : null} 
                                        style={styles.ctxAvatar} 
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.ctxName}>{activePost.userId?.name}</Text>
                                        <Text style={styles.ctxTitle} numberOfLines={1}>{activePost.title}</Text>
                                    </View>
                                    <Text style={styles.ctxTime}>{formatTimeAgo(activePost.createdAt)}</Text>
                                </View>
                            )}

                            <View style={styles.cmtDivider} />

                            <ScrollView 
                                ref={commentsScrollRef} 
                                style={styles.cmtList}
                                contentContainerStyle={{ paddingBottom: 30 }}
                                showsVerticalScrollIndicator={true}
                                keyboardShouldPersistTaps="handled"
                            >
                                {modalComments.length === 0 ? (
                                    <View style={styles.cmtEmpty}>
                                        <Ionicons name="chatbubbles-outline" size={50} color="#222" />
                                        <Text style={styles.cmtEmptyText}>No comments yet. Be the first to resonate!</Text>
                                    </View>
                                ) : (
                                    modalComments.map((comment, idx) => (
                                        <View key={idx} style={styles.cmtItem}>
                                            <TouchableOpacity 
                                                onPress={() => {
                                                    setShowCommentModal(false);
                                                    navigation.navigate('Profile', { userId: comment.userId?._id });
                                                }}
                                            >
                                                {comment.userId?.profilePic ? (
                                                    <Image source={{ uri: comment.userId.profilePic }} style={styles.cmtAvatar} />
                                                ) : (
                                                    <View style={[styles.cmtAvatar, styles.cmtPlaceholderAvatar]}>
                                                        <Text style={styles.cmtInitial}>{comment.userId?.name?.[0] || 'U'}</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                            <View style={styles.cmtContent}>
                                                <View style={styles.cmtMeta}>
                                                    <Text style={styles.cmtName}>{comment.userId?.name}</Text>
                                                    <Text style={styles.cmtTime}>{formatTimeAgo(comment.createdAt)}</Text>
                                                </View>
                                                <Text style={styles.cmtText}>{comment.text}</Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </ScrollView>

                            <View style={styles.cmtInputWrapper}>
                                <View style={styles.cmtInputInner}>
                                    <TextInput
                                        style={styles.cmtTextInput}
                                        placeholder="Add a comment..."
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        value={commentText}
                                        onChangeText={setCommentText}
                                        multiline
                                    />
                                    <TouchableOpacity 
                                        style={[styles.cmtSendBtn, !commentText.trim() && styles.cmtSendDisabled]}
                                        onPress={handleAddComment}
                                        disabled={!commentText.trim() || commenting}
                                    >
                                        {commenting ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <Ionicons name="send" size={18} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </ModalContainer>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#0a0a14',
        height: Platform.OS === 'web' ? '100dvh' : '100%',
        overflow: 'hidden' 
    },

    orb1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(168,85,247,0.1)', top: -50, right: -50 },
    orb2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(168,85,247,0.05)', bottom: 100, left: -50 },
    header: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, 
        borderBottomColor: 'rgba(255,255,255,0.05)',
        backgroundColor: '#0a0a14',
        zIndex: 100,
    },

    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
    headerIcons: { flexDirection: 'row' },
    iconButton: { marginLeft: 15 },
    badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#a855f7', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    listContent: { padding: 15 },
    postCard: { 
        backgroundColor: 'rgba(255, 255, 255, 0.03)', 
        borderRadius: 24, 
        padding: 16, 
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
    placeholderAvatar: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { color: '#fff', fontWeight: 'bold' },
    username: { color: '#fff', fontWeight: 'bold' },
    timeText: { color: '#666', fontSize: 12 },
    followButton: { backgroundColor: 'rgba(168,85,247,0.2)', paddingVertical: 5, paddingHorizontal: 15, borderRadius: 10 },
    followButtonText: { color: '#a855f7', fontWeight: 'bold' },
    followingButton: { backgroundColor: '#333' },
    followingButtonText: { color: '#666' },
    postBody: { marginBottom: 15 },
    postTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    postImageContainer: {
        width: '100%',
        height: 250,
        borderRadius: 16,
        overflow: 'hidden',
        marginVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    postImage: {
        width: '100%',
        height: '100%',
    },
    lyrics: { color: '#bbb', fontStyle: 'italic' },

    actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 10 },
    actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
    actionText: { color: '#666', marginLeft: 5 },
    iconAction: { padding: 5 },
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#666', fontSize: 18 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, height: height * 0.6 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    friendItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: 12, 
        backgroundColor: 'rgba(255,255,255,0.03)', 
        borderRadius: 15, 
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    friendItemSelected: { 
        backgroundColor: 'rgba(168,85,247,0.1)', 
        borderColor: 'rgba(168,85,247,0.3)' 
    },
    friendRow: { flexDirection: 'row', alignItems: 'center' },
    friendAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    friendAvatarPlaceholder: { 
        width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', 
        justifyContent: 'center', alignItems: 'center', marginRight: 12 
    },
    friendName: { color: '#fff', fontSize: 16, fontWeight: '500' },
    sendAllBtn: { backgroundColor: '#a855f7', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 10 },
    sendAllText: { color: '#fff', fontWeight: 'bold' },
    optionsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    optionsContent: { backgroundColor: '#1a1a2e', borderRadius: 20, padding: 20, width: '80%' },
    optionBtn: { padding: 15, alignItems: 'center' },
    optionText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    cmtOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    cmtSheet: { 
        backgroundColor: 'rgba(15, 15, 30, 0.95)', 
        height: height * 0.75, 
        borderTopLeftRadius: 32, 
        borderTopRightRadius: 32,
        paddingTop: 12, 
        borderTopWidth: 1, 
        borderTopColor: 'rgba(255, 255, 255, 0.1)'
    },
    cmtDragBar: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
    cmtHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
    modalSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 },
    cmtDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 10 },
    cmtPostContext: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(168,85,247,0.08)',
        marginHorizontal: 20, 
        padding: 12, 
        borderRadius: 15, 
        marginBottom: 10,
        borderWidth: 1, 
        borderColor: 'rgba(168,85,247,0.2)'
    },
    ctxAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
    ctxName: { color: '#a855f7', fontWeight: 'bold', fontSize: 14 },
    ctxTitle: { color: '#fff', fontSize: 13, opacity: 0.8 },
    ctxTime: { color: 'rgba(255,255,255,0.3)', fontSize: 11, alignSelf: 'flex-start' },
    cmtList: { flex: 1 },
    cmtItem: { 
        flexDirection: 'row', 
        paddingHorizontal: 20, 
        paddingVertical: 10,
        alignItems: 'center'
    },
    cmtAvatarBox: { marginRight: 12 },
    cmtAvatar: { 
        width: 38, 
        height: 38, 
        borderRadius: 19, 
        borderWidth: 1, 
        borderColor: 'rgba(168,85,247,0.2)' 
    },
    cmtPlaceholderAvatar: { backgroundColor: 'rgba(168,85,247,0.1)', justifyContent: 'center', alignItems: 'center' },
    cmtInitial: { color: '#a855f7', fontWeight: 'bold', fontSize: 14 },
    cmtContent: { 
        flex: 1, 
        backgroundColor: 'rgba(255,255,255,0.04)', 
        paddingHorizontal: 14, 
        paddingVertical: 10, 
        borderRadius: 20,
        borderBottomLeftRadius: 4, // Style the bubble tail
    },
    cmtMeta: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 4 
    },
    cmtName: { color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.2 },
    cmtTime: { color: 'rgba(255,255,255,0.3)', fontSize: 10 },
    cmtText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20 },
    cmtEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    cmtEmptyText: { color: '#444', fontSize: 16, marginTop: 15, textAlign: 'center', paddingHorizontal: 40 },
    cmtInputWrapper: { 
        padding: 15, 
        paddingBottom: Platform.OS === 'ios' ? 35 : 15,
        backgroundColor: '#0a0a14', 
        borderTopWidth: 1, 
        borderTopColor: 'rgba(255,255,255,0.05)'
    },
    cmtInputInner: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 25, 
        paddingHorizontal: 15, 
        paddingVertical: 8
    },
    cmtTextInput: { 
        flex: 1, 
        color: '#fff', 
        fontSize: 15, 
        paddingHorizontal: 10, 
        maxHeight: 100,
        minHeight: 20
    },
    cmtSendBtn: { 
        width: 36, 
        height: 36, 
        borderRadius: 18, 
        backgroundColor: '#a855f7', 
        justifyContent: 'center', 
        alignItems: 'center',
        elevation: 2
    },
    cmtSendDisabled: { opacity: 0.3 }
});

export default HomeScreen;
