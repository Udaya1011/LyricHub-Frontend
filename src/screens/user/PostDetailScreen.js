import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator, 
    Platform, 
    TextInput, 
    Alert, 
    Share, 
    Image,
    KeyboardAvoidingView,
    Dimensions,
    Keyboard,
    Modal,
    Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/api';
import { formatTimeAgo } from '../../utils/dateUtils';

const { height } = Dimensions.get('window');

const PostDetailScreen = ({ route, navigation }) => {
    const { postId } = route.params;
    const { user } = useContext(AuthContext);
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [commenting, setCommenting] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const scrollViewRef = useRef();

    useEffect(() => {
        fetchPostDetails();
        
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
            setIsKeyboardOpen(true);
            // Optional: Scroll to bottom when keyboard opens to see latest comments
            // setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        });
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
            setIsKeyboardOpen(false);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, [postId]);

    useEffect(() => {
        console.log('PostDetail Context User:', user);
        console.log('Post Author ID:', post?.userId?._id || post?.userId);
    }, [user, post]);

    const fetchPostDetails = async () => {
        try {
            const res = await API.get(`/posts/${postId}`);
            setPost(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        try {
            await API.post(`/posts/${postId}/like`);
            fetchPostDetails();
        } catch (err) {
            console.error(err);
        }
    };

    const handleComment = async () => {
        if (!newComment.trim()) return;
        setCommenting(true);
        try {
            await API.post(`/posts/${postId}/comment`, { text: newComment });
            setNewComment('');
            Keyboard.dismiss();
            fetchPostDetails();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to post comment');
        } finally {
            setCommenting(false);
        }
    };

    const handleEdit = () => {
        setShowOptionsModal(false);
        navigation.navigate('Add', { post });
    };

    const handleDelete = async () => {
        try {
            setShowOptionsModal(false);
            await API.delete(`/posts/${postId}`);
            navigation.goBack();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Could not delete post');
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out these lyrics on LyricHub: "${post.title}"\n\n${post.lyrics}`,
                title: post.title,
            });
        } catch (error) {
            console.error('Share error:', error.message);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#a855f7" />
            </View>
        );
    }

    if (!post) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Post not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backLink}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView 
                style={{ flex: 1 }}
                behavior="padding"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Background orbs */}
                <View style={styles.orb1} />
                <View style={styles.orb2} />
    
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={26} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>{post.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={handleShare} style={styles.iconAction}>
                            <Ionicons name="share-social-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                        {(post.userId?._id === user?.id || post.userId === user?.id || post.userId === user?._id) && (
                            <TouchableOpacity 
                                onPress={() => {
                                    console.log('Opening Options Modal');
                                    setShowOptionsModal(true);
                                }} 
                                style={[styles.iconAction, { marginLeft: 15 }]}
                            >
                                <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

            <ScrollView 
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.postCard}>
                    <View style={styles.authorInfo}>
                        {post.userId?.profilePic ? (
                            <Image source={{ uri: post.userId.profilePic }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitial}>{post.userId?.name?.[0]}</Text>
                            </View>
                        )}
                        <View>
                            <Text style={styles.authorName}>{post.userId?.name}</Text>
                            <Text style={styles.postDate}>{formatTimeAgo(post.createdAt)}</Text>
                        </View>
                        {post.userId?._id !== user?.id && (
                            <TouchableOpacity style={styles.followMiniBtn}>
                                <Text style={styles.followMiniText}>Follow</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text style={styles.lyricsTitle}>{post.title}</Text>
                    <View style={styles.lyricsContainer}>
                        <ScrollView 
                            style={{ maxHeight: 350 }} 
                            nestedScrollEnabled={true} 
                            showsVerticalScrollIndicator={true}
                            indicatorStyle="white"
                        >
                            <Text style={styles.lyricsText}>{post.lyrics}</Text>
                        </ScrollView>
                        <Ionicons name="musical-notes" size={40} color="rgba(168,85,247,0.05)" style={styles.lyricsBgIcon} />
                    </View>

                    <View style={styles.statsContainer}>
                        <TouchableOpacity style={styles.statItem} onPress={handleLike}>
                            <Ionicons 
                                name={post.likes?.includes(user?.id) ? "heart" : "heart-outline"} 
                                size={26} 
                                color={post.likes?.includes(user?.id) ? "#ff5252" : "rgba(255,255,255,0.4)"} 
                            />
                            <Text style={[styles.statText, post.likes?.includes(user?.id) && { color: '#ff5252', fontWeight: 'bold' }]}>
                                {post.likes?.length || 0}
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.statItem}>
                            <Ionicons name="chatbubble-outline" size={22} color="rgba(255,255,255,0.4)" />
                            <Text style={styles.statText}>{post.comments?.length || 0}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.commentSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Comments</Text>
                        <View style={styles.commentCountBadge}>
                            <Text style={styles.commentCountText}>{post.comments?.length || 0}</Text>
                        </View>
                    </View>
                    
                    {post.comments?.length > 0 ? (
                        post.comments.map((comment, index) => (
                            <View key={index} style={styles.commentCard}>
                                <View style={styles.commentMain}>
                                    {comment.userId?.profilePic ? (
                                        <Image source={{ uri: comment.userId.profilePic }} style={styles.commentAvatar} />
                                    ) : (
                                        <View style={styles.commentAvatarPlaceholder}>
                                            <Text style={styles.commentAvatarInitial}>{comment.userId?.name?.[0]}</Text>
                                        </View>
                                    )}
                                    <View style={styles.commentInfo}>
                                        <View style={styles.commentHeader}>
                                            <Text style={styles.commentAuthor}>{comment.userId?.name}</Text>
                                            <Text style={styles.commentDate}>{formatTimeAgo(comment.createdAt)}</Text>
                                        </View>
                                        <Text style={styles.commentText}>{comment.text}</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyComments}>
                            <Ionicons name="chatbubbles-outline" size={40} color="rgba(255,255,255,0.1)" />
                            <Text style={styles.noCommentsText}>Be the first to share your thoughts!</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={[
                styles.footer,
                { paddingBottom: Platform.OS === 'ios' ? (isKeyboardOpen ? 15 : 30) : (isKeyboardOpen ? 0 : 30) }
            ]}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Add a comment..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline
                    />
                    <TouchableOpacity 
                        style={[styles.sendButton, !newComment.trim() && { opacity: 0.5 }]} 
                        onPress={handleComment}
                        disabled={commenting || !newComment.trim()}
                    >
                        {commenting ? (
                            <ActivityIndicator size="small" color="#a855f7" />
                        ) : (
                            <View style={styles.sendIconBg}>
                                <Ionicons name="send" size={16} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>

            {/* Options Modal */}
            <Modal visible={showOptionsModal} transparent animationType="fade">
                <View style={styles.optionsOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowOptionsModal(false)} />
                    <View style={styles.optionsContent}>
                        <TouchableOpacity style={styles.optionBtn} onPress={handleEdit}>
                            <Ionicons name="create-outline" size={22} color="#fff" style={{ marginRight: 15 }} />
                            <Text style={styles.optionText}>Edit Post</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.optionBtn} onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={22} color="#ff4757" style={{ marginRight: 15 }} />
                            <Text style={[styles.optionText, { color: '#ff4757' }]}>Delete Post</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.optionBtn, { borderBottomWidth: 0, marginTop: 10 }]} onPress={() => setShowOptionsModal(false)}>
                            <Text style={[styles.optionText, { color: '#666' }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    optionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsContent: {
        backgroundColor: '#1a1a2e',
        borderRadius: 25,
        padding: 10,
        width: '80%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    optionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    container: {
        flex: 1,
        backgroundColor: '#0a0a14',
    },
    orb1: {
        position: 'absolute', width: 220, height: 220, borderRadius: 110,
        backgroundColor: 'rgba(168, 85, 247, 0.12)', top: -50, right: -60,
    },
    orb2: {
        position: 'absolute', width: 160, height: 160, borderRadius: 80,
        backgroundColor: 'rgba(168, 85, 247, 0.08)', bottom: 100, left: -40,
    },
    loadingContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a14',
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 15, paddingTop: 55, paddingBottom: 15,
        backgroundColor: 'rgba(26, 26, 46, 0.98)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
        zIndex: 100, elevation: 10,
    },
    backBtn: { padding: 5 },
    shareBtn: { padding: 5 },
    iconAction: { 
        padding: 5,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center', marginHorizontal: 10,
    },
    scrollContent: {
        padding: 15, paddingBottom: 20,
    },
    postCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 24, padding: 20, marginBottom: 25,
        borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.2)',
        ...Platform.select({
            web: { backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' },
            default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 }
        })
    },
    authorInfo: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 20,
    },
    avatar: {
        width: 44, height: 44, borderRadius: 22, marginRight: 12, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)',
    },
    avatarPlaceholder: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(168,85,247,0.1)',
        justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)',
    },
    avatarInitial: { color: '#a855f7', fontWeight: 'bold', fontSize: 18 },
    authorName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    postDate: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
    followMiniBtn: { 
        marginLeft: 'auto', backgroundColor: 'rgba(168,85,247,0.15)', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 8,
        borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)'
    },
    followMiniText: { color: '#a855f7', fontSize: 12, fontWeight: 'bold' },
    lyricsTitle: {
        fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 15, textAlign: 'center',
    },
    lyricsContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20, padding: 25, marginBottom: 25, position: 'relative', overflow: 'hidden'
    },
    lyricsBgIcon: { position: 'absolute', top: 10, right: 10 },
    lyricsText: {
        color: '#fff', fontSize: 18, lineHeight: 28, fontStyle: 'italic', textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 15, justifyContent: 'center'
    },
    statItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20 },
    statText: { color: 'rgba(255,255,255,0.5)', marginLeft: 8, fontSize: 15 },
    commentSection: { paddingHorizontal: 5 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginRight: 10 },
    commentCountBadge: { 
        backgroundColor: 'rgba(168,85,247,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 
    },
    commentCountText: { color: '#a855f7', fontSize: 12, fontWeight: 'bold' },
    commentCard: {
        backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 12, marginBottom: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
    },
    commentMain: { flexDirection: 'row', alignItems: 'flex-start' },
    commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)' },
    commentAvatarPlaceholder: { 
        width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(168,85,247,0.1)', 
        alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)' 
    },
    commentAvatarInitial: { color: '#a855f7', fontSize: 14, fontWeight: 'bold' },
    commentInfo: { flex: 1 },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    commentAuthor: { color: '#a855f7', fontWeight: 'bold', fontSize: 13 },
    commentDate: { color: 'rgba(255,255,255,0.3)', fontSize: 10 },
    commentText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20 },
    emptyComments: { alignItems: 'center', paddingVertical: 40 },
    noCommentsText: { color: 'rgba(255,255,255,0.2)', fontSize: 14, marginTop: 10, textAlign: 'center' },
    footer: {
        backgroundColor: 'rgba(26, 26, 46, 0.95)', paddingHorizontal: 15, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
    },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a14', borderRadius: 25,
        paddingHorizontal: 15, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    commentInput: { flex: 1, color: '#fff', fontSize: 15, maxHeight: 100, paddingVertical: 10 },
    sendButton: { marginLeft: 10, padding: 5 },
    sendIconBg: { 
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#a855f7', alignItems: 'center', justifyContent: 'center' 
    },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a14' },
    errorText: { color: '#fff', fontSize: 18, marginBottom: 20 },
    backLink: { color: '#a855f7', fontSize: 16, fontWeight: 'bold' }
});

export default PostDetailScreen;
