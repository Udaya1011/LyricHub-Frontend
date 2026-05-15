import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ScrollView, Platform, Alert, ActivityIndicator, Modal } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import API from '../../api/api';
import { formatTimeAgo } from '../../utils/dateUtils';

const ProfileScreen = ({ route, navigation }) => {
    const { userId } = route.params || {};
    const { user: currentUser, logout, refreshUser } = useContext(AuthContext);
    const [viewType, setViewType] = useState('grid'); // 'grid' or 'list'
    const [userPosts, setUserPosts] = useState([]);
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

    const isOwnProfile = !userId || userId === currentUser?.id;

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchProfileData();
        });
        return unsubscribe;
    }, [navigation, userId]);

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            // Fetch User Details
            const targetId = userId || currentUser?.id;
            if (!targetId) return;

            const userRes = await API.get(`/users/${targetId}`);
            setProfileUser(userRes.data);

            // Fetch Posts
            const postsRes = await API.get('/posts');
            const filtered = postsRes.data.filter(post => post.userId?._id === targetId || post.userId === targetId);
            setUserPosts(filtered);

            if (isOwnProfile) refreshUser();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        try {
            await API.post(`/users/${profileUser._id}/follow`);
            await refreshUser(); // Update local Following list
            fetchProfileData(); // Refresh to show new follower count
        } catch (err) {
            console.error(err);
        }
    };

    const openOptionsModal = (post) => {
        setSelectedPost(post);
        setShowOptionsModal(true);
    };

    const handleEdit = () => {
        setShowOptionsModal(false);
        navigation.navigate('Add', { post: selectedPost });
    };

    const handleDelete = async () => {
        try {
            setShowOptionsModal(false);
            await API.delete(`/posts/${selectedPost._id}`);
            fetchProfileData();
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Could not delete post');
        }
    };

    const renderPostItem = ({ item, index }) => {
        if (viewType === 'grid') {
            return (
                <TouchableOpacity 
                    style={styles.gridItem}
                    onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
                >
                    <View style={[styles.gridItemGradient, { backgroundColor: index % 2 === 0 ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.05)' }]}>
                        <Text style={styles.gridItemTitle} numberOfLines={2}>{item.title}</Text>
                        <Ionicons name="musical-notes" size={24} color="rgba(255,255,255,0.3)" style={styles.gridIcon} />
                    </View>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity 
                style={styles.listCard}
                onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
            >
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardDate}>{formatTimeAgo(item.createdAt)}</Text>
                    </View>
                    {isOwnProfile && (
                        <TouchableOpacity 
                            style={styles.moreButton}
                            onPress={() => openOptionsModal(item)}
                        >
                            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.cardLyrics} numberOfLines={4}>{item.lyrics}</Text>
                <View style={styles.cardFooter}>
                    <View style={styles.cardStat}>
                        <Ionicons name="heart-outline" size={18} color="#666" />
                        <Text style={styles.cardStatText}>{item.likes?.length || 0}</Text>
                    </View>
                    <View style={styles.cardStat}>
                        <Ionicons name="chatbubble-outline" size={16} color="#666" />
                        <Text style={styles.cardStatText}>{item.comments?.length || 0}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !profileUser) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#a855f7" />
            </View>
        );
    }

    const isFollowing = currentUser?.following?.some(f => {
        const id = typeof f === 'object' ? f?._id : f;
        return id === profileUser?._id;
    });

    return (
        <View style={styles.container}>
            {/* Background orbs */}
            <View style={styles.orb1} />
            <View style={styles.orb2} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {profileUser?.name?.toLowerCase().replace(/\s/g, '_')}
                </Text>
                <TouchableOpacity onPress={isOwnProfile ? logout : () => {}}>
                    <Ionicons name={isOwnProfile ? "log-out-outline" : "ellipsis-horizontal"} size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.profileSection}>
                    <View style={styles.avatarRow}>
                        <View style={styles.avatarContainer}>
                            {profileUser?.profilePic ? (
                                <Image source={{ uri: profileUser.profilePic }} style={styles.avatar} />
                            ) : (
                                <View style={styles.placeholderAvatar}>
                                    <Text style={styles.avatarInitial}>{profileUser?.name?.[0] || 'U'}</Text>
                                </View>
                            )}
                            {isOwnProfile && (
                                <TouchableOpacity 
                                    style={styles.addAvatarButton}
                                    onPress={() => navigation.navigate('EditProfile')}
                                >
                                    <Ionicons name="add-circle" size={24} color="#a855f7" />
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{userPosts.length}</Text>
                                <Text style={styles.statLabel}>Posts</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.statItem}
                                onPress={() => navigation.navigate('Friends')}
                            >
                                <Text style={styles.statNumber}>{profileUser?.following?.length || 0}</Text>
                                <Text style={styles.statLabel}>Friends</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    <View style={styles.bioContainer}>
                        <Text style={styles.name}>{profileUser?.name}</Text>
                        {profileUser?.bio ? (
                            <Text style={styles.bio}>{profileUser.bio}</Text>
                        ) : null}
                    </View>
                    
                    <View style={styles.buttonRow}>
                        {isOwnProfile ? (
                            <>
                                <TouchableOpacity 
                                    style={styles.primaryButton}
                                    onPress={() => navigation.navigate('EditProfile')}
                                >
                                    <Text style={styles.primaryButtonText}>Edit Profile</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.secondaryButton}
                                    onPress={() => navigation.navigate('Security')}
                                >
                                    <Text style={styles.secondaryButtonText}>Security</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity 
                                    style={[styles.primaryButton, isFollowing && styles.followingButton]}
                                    onPress={handleFollow}
                                >
                                    <Text style={[styles.primaryButtonText, isFollowing && styles.followingButtonText]}>
                                        {isFollowing ? 'Friends' : 'Follow'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.secondaryButton}
                                    onPress={() => navigation.navigate('Chat', { 
                                        userId: profileUser._id, 
                                        userName: profileUser.name, 
                                        userPic: profileUser.profilePic 
                                    })}
                                >
                                    <Text style={styles.secondaryButtonText}>Message</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, viewType === 'grid' && styles.activeTab]} 
                        onPress={() => setViewType('grid')}
                    >
                        <Ionicons name="grid" size={22} color={viewType === 'grid' ? "#a855f7" : "#666"} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, viewType === 'list' && styles.activeTab]} 
                        onPress={() => setViewType('list')}
                    >
                        <Ionicons name="list" size={24} color={viewType === 'list' ? "#a855f7" : "#666"} />
                    </TouchableOpacity>
                </View>

                <View style={styles.postsContainer}>
                    <FlatList
                        data={userPosts || []}
                        keyExtractor={(item) => item?._id || Math.random().toString()}
                        renderItem={renderPostItem}
                        numColumns={viewType === 'grid' ? 3 : 1}
                        key={viewType} // Re-render when switching columns
                        scrollEnabled={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="camera-outline" size={60} color="#333" />
                                <Text style={styles.emptyText}>No posts yet</Text>
                            </View>
                        }
                    />
                </View>
            </ScrollView>

            {/* Options Modal */}
            <Modal visible={showOptionsModal} transparent animationType="fade">
                <View style={styles.optionsOverlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowOptionsModal(false)} />
                    <View style={styles.optionsContent}>
                        <TouchableOpacity style={styles.optionBtn} onPress={handleEdit}>
                            <Ionicons name="create-outline" size={20} color="#fff" style={{ marginRight: 12 }} />
                            <Text style={styles.optionText}>Edit Post</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.optionBtn} onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={20} color="#ff4757" style={{ marginRight: 12 }} />
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a14',
    },
    followingButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    followingButtonText: {
        color: '#a855f7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 55,
        paddingBottom: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContent: {
        paddingBottom: 50,
    },
    profileSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 86,
        height: 86,
        borderRadius: 43,
        borderWidth: 2,
        borderColor: 'rgba(168,85,247,0.4)',
    },
    placeholderAvatar: {
        width: 86,
        height: 86,
        borderRadius: 43,
        backgroundColor: 'rgba(168,85,247,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(168,85,247,0.3)',
    },
    avatarInitial: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#a855f7',
    },
    addAvatarButton: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#0a0a14',
        borderRadius: 12,
    },
    statsRow: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'space-around',
        marginLeft: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
    },
    bioContainer: {
        marginBottom: 20,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    bio: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 18,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    primaryButton: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    secondaryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    tabContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        marginTop: 10,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#a855f7',
    },
    postsContainer: {
        paddingTop: 2,
    },
    gridItem: {
        flex: 1/3,
        aspectRatio: 1,
        padding: 1,
    },
    gridItemGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    gridItemTitle: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    gridIcon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
    },
    listCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginHorizontal: 15,
        marginVertical: 10,
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        color: '#a855f7',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardDate: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
    },
    cardLyrics: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    cardFooter: {
        flexDirection: 'row',
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    cardStat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    cardStatText: {
        color: 'rgba(255,255,255,0.4)',
        marginLeft: 5,
        fontSize: 13,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.3)',
        marginTop: 10,
        fontSize: 16,
    },
    moreButton: {
        padding: 5,
    },
    optionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
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
});

export default ProfileScreen;
