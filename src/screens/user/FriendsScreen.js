import React, { useContext, useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Animated,
    RefreshControl,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/api';

const { width } = Dimensions.get('window');

const FriendsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user: currentUser, refreshUser } = useContext(AuthContext);
    const [friends, setFriends] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unfollowingId, setUnfollowingId] = useState(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchFriends);
        return unsubscribe;
    }, [navigation, currentUser]);

    useEffect(() => {
        if (search.trim() === '') {
            setFiltered(friends);
        } else {
            const q = search.toLowerCase();
            setFiltered(friends.filter(f =>
                f.name?.toLowerCase().includes(q) ||
                f.bio?.toLowerCase().includes(q)
            ));
        }
    }, [search, friends]);

    const fetchFriends = async () => {
        try {
            setLoading(true);
            const res = await API.get(`/users/${currentUser?.id}`);
            const followingList = res.data?.following || [];
            setFriends(followingList);
            setFiltered(followingList);

            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]).start();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleUnfollow = async (friendId) => {
        setUnfollowingId(friendId);
        try {
            await API.post(`/users/${friendId}/follow`);
            await refreshUser();
            setFriends(prev => prev.filter(f => f._id !== friendId));
        } catch (err) {
            console.error(err);
        } finally {
            setUnfollowingId(null);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchFriends();
    };

    const renderFriendCard = ({ item, index }) => {
        const delay = index * 60;
        const itemFade = new Animated.Value(0);
        const itemSlide = new Animated.Value(20);

        Animated.parallel([
            Animated.timing(itemFade, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
            Animated.timing(itemSlide, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
        ]).start();

        const isUnfollowing = unfollowingId === item._id;

        return (
            <Animated.View style={{ opacity: itemFade, transform: [{ translateY: itemSlide }] }}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('UserProfile', { userId: item._id })}
                    activeOpacity={0.85}
                >
                    {/* Avatar */}
                    <View style={styles.avatarWrap}>
                        {item.profilePic ? (
                            <Image source={{ uri: item.profilePic }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitial}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
                            </View>
                        )}
                        <View style={styles.onlineDot} />
                    </View>

                    {/* Info */}
                    <View style={styles.info}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.bio} numberOfLines={1}>
                            {item.bio || '🎵 Lyric writer'}
                        </Text>
                    </View>

                    {/* Unfollow Button */}
                    <TouchableOpacity
                        style={[styles.unfollowBtn, isUnfollowing && styles.unfollowBtnLoading]}
                        onPress={() => handleUnfollow(item._id)}
                        disabled={isUnfollowing}
                        activeOpacity={0.75}
                    >
                        {isUnfollowing ? (
                            <ActivityIndicator size="small" color="#a855f7" />
                        ) : (
                            <Text style={styles.unfollowText}>Friends ✓</Text>
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const EmptyComponent = () => (
        <Animated.View style={[styles.emptyWrap, { opacity: fadeAnim }]}>
            <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyEmoji}>🎵</Text>
            </View>
            <Text style={styles.emptyTitle}>No Friends Yet</Text>
            <Text style={styles.emptySubtitle}>
                Follow lyric writers you love{'\n'}and they'll appear here!
            </Text>
            <TouchableOpacity
                style={styles.discoverBtn}
                onPress={() => navigation.navigate('Home')}
            >
                <Text style={styles.discoverText}>Discover Writers →</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            {/* Background orbs */}
            <View style={styles.orb1} />
            <View style={styles.orb2} />

            {/* Header */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, paddingTop: Platform.OS === 'web' ? 10 : Math.max(insets.top, 20) }]}>
                <View>
                    <Text style={styles.headerTitle}>Friends</Text>
                    <Text style={styles.headerCount}>
                        {friends.length} {friends.length === 1 ? 'connection' : 'connections'}
                    </Text>
                </View>
                <View style={styles.headerIconWrap}>
                    <Ionicons name="people" size={26} color="#a855f7" />
                </View>
            </Animated.View>

            {/* Search */}
            <Animated.View style={[styles.searchWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <Ionicons name="search" size={18} color="rgba(255,255,255,0.35)" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search friends..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.35)" />
                    </TouchableOpacity>
                )}
            </Animated.View>

            {/* Friends Count Badge */}
            {search.length > 0 && filtered.length > 0 && (
                <Text style={styles.resultText}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</Text>
            )}

            {/* List */}
            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#a855f7" />
                    <Text style={styles.loadingText}>Loading friends...</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item._id}
                    renderItem={renderFriendCard}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<EmptyComponent />}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#a855f7"
                            colors={['#a855f7']}
                        />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingTop: 60,
        paddingBottom: 18,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
    headerCount: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.35)',
        marginTop: 2,
    },
    headerIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Search
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 22,
        paddingHorizontal: 14,
        paddingVertical: 4,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#ffffff',
        fontSize: 15,
        paddingVertical: 12,
    },
    resultText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        marginHorizontal: 24,
        marginBottom: 10,
    },
    // List
    list: {
        paddingHorizontal: 16,
        paddingBottom: 30,
    },
    // Card
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        padding: 14,
        marginBottom: 10,
    },
    avatarWrap: {
        position: 'relative',
        marginRight: 14,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 2,
        borderColor: 'rgba(168, 85, 247, 0.4)',
    },
    avatarPlaceholder: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderWidth: 2,
        borderColor: 'rgba(168, 85, 247, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 22,
        fontWeight: '700',
        color: '#a855f7',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#34d399',
        borderWidth: 2,
        borderColor: '#0a0a14',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 3,
    },
    bio: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
    },
    // Unfollow Button
    unfollowBtn: {
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.4)',
        paddingHorizontal: 12,
        paddingVertical: 7,
        minWidth: 80,
        alignItems: 'center',
    },
    unfollowBtnLoading: {
        borderColor: 'rgba(168, 85, 247, 0.2)',
    },
    unfollowText: {
        color: '#a855f7',
        fontSize: 12,
        fontWeight: '700',
    },
    // Loading
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 14,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 14,
    },
    // Empty
    emptyWrap: {
        alignItems: 'center',
        paddingTop: 70,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyEmoji: {
        fontSize: 38,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.35)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    discoverBtn: {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(168, 85, 247, 0.4)',
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    discoverText: {
        color: '#a855f7',
        fontWeight: '700',
        fontSize: 14,
    },
});

export default FriendsScreen;
