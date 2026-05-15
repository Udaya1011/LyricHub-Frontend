import React, { useState, useContext, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passFocused, setPassFocused] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(60)).current;
    const logoScale = useRef(new Animated.Value(0.7)).current;
    const pulse = useRef(new Animated.Value(1)).current;
    const [canInstall, setCanInstall] = useState(false);

    useEffect(() => {
        // Check if prompt is already captured
        if (window.deferredPrompt) setCanInstall(true);

        const onPrompt = () => setCanInstall(true);
        window.addEventListener('beforeinstallprompt', onPrompt);
        
        return () => window.removeEventListener('beforeinstallprompt', onPrompt);
    }, []);
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
            ]),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.08, duration: 1800, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) return alert('Please fill all fields');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            alert(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleInstallApp = async () => {
        if (Platform.OS !== 'web') return;

        const promptEvent = window.deferredPrompt;
        if (promptEvent) {
            promptEvent.prompt();
            const { outcome } = await promptEvent.userChoice;
            if (outcome === 'accepted') {
                window.deferredPrompt = null;
                setCanInstall(false);
            }
        } else {
            // Fallback for iOS or if prompt not yet available
            alert(
                "Install LyricHub App\n\n1. Tap the 'Share' icon in your browser\n2. Select 'Add to Home Screen'"
            );
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            {/* Background orbs */}
            <View style={styles.orb1} />
            <View style={styles.orb2} />
            <View style={styles.orb3} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo Section */}
                <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
                    <Animated.View style={[styles.logoCircle, { transform: [{ scale: pulse }] }]}>
                        <Ionicons name="musical-notes" size={36} color="#a78bfa" />
                    </Animated.View>
                    <Text style={styles.title}>LyricHub</Text>
                    <Text style={styles.tagline}>Where words become music</Text>
                </Animated.View>

                {/* Card */}
                <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={styles.cardTitle}>Welcome Back</Text>
                    <Text style={styles.cardSubtitle}>Sign in to continue your journey</Text>

                    {/* Email Input */}
                    <View style={[styles.inputWrapper, emailFocused && styles.inputFocused]}>
                        <Ionicons
                            name="mail-outline"
                            size={18}
                            color={emailFocused ? '#a78bfa' : 'rgba(255,255,255,0.35)'}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email address"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                        />
                    </View>

                    {/* Password Input */}
                    <View style={[styles.inputWrapper, passFocused && styles.inputFocused]}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={18}
                            color={passFocused ? '#a78bfa' : 'rgba(255,255,255,0.35)'}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            onFocus={() => setPassFocused(true)}
                            onBlur={() => setPassFocused(false)}
                        />
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <View style={styles.buttonInner}>
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.buttonText}>Sign In</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                                </>
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Register Link */}
                    <TouchableOpacity
                        style={styles.registerBtn}
                        onPress={() => navigation.navigate('Register')}
                        activeOpacity={0.75}
                    >
                        <Text style={styles.registerText}>New to LyricHub? </Text>
                        <Text style={styles.registerHighlight}>Create Account</Text>
                        <Ionicons name="sparkles-outline" size={14} color="#a78bfa" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>

                    {Platform.OS === 'web' && (
                        <TouchableOpacity
                            style={[styles.installBtn, !canInstall && { opacity: 0.8 }]}
                            onPress={handleInstallApp}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="download-outline" size={16} color="#a78bfa" style={{ marginRight: 8 }} />
                            <Text style={styles.installBtnText}>
                                {canInstall ? 'Download LyricHub App' : 'How to Install?'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>

                {/* Bottom Note */}
                <Animated.View style={[styles.bottomNote, { opacity: fadeAnim }]}>
                    <Ionicons name="musical-note-outline" size={13} color="rgba(255,255,255,0.25)" />
                    <Text style={styles.bottomNoteText}>  50,000+ lyricists trust LyricHub</Text>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a14',
    },
    orb1: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(139, 92, 246, 0.18)',
        top: -60,
        left: -80,
    },
    orb2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(6, 182, 212, 0.14)',
        top: height * 0.35,
        right: -60,
    },
    orb3: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        bottom: 80,
        left: 30,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 36,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderWidth: 1.5,
        borderColor: 'rgba(139, 92, 246, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        ...Platform.select({
            web: { boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)' },
            default: { 
                shadowColor: '#8b5cf6',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 20,
            }
        }),
        elevation: 10,
    },
    title: {
        fontSize: 38,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 5,
        letterSpacing: 0.5,
    },
    // Card - truly glassy, no dark fill
    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 28,
        padding: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.09)',
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 6,
    },
    cardSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.38)',
        marginBottom: 28,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        borderWidth: 0,
        // Removed borderColor to eliminate white border
        marginBottom: 14,
        paddingHorizontal: 16,
    },
    inputFocused: {
        borderColor: 'rgba(139, 92, 246, 0.65)',
        backgroundColor: 'rgba(139, 92, 246, 0.07)',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#ffffff',
        fontSize: 15,
        paddingVertical: 14,
    },
    button: {
        borderRadius: 14,
        marginTop: 10,
        backgroundColor: '#7c3aed',
        ...Platform.select({
            web: { boxShadow: '0 6px 14px rgba(139, 92, 246, 0.45)' },
            default: {
                shadowColor: '#8b5cf6',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.45,
                shadowRadius: 14,
            }
        }),
        elevation: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 22,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    dividerText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        marginHorizontal: 12,
    },
    registerBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerText: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 14,
    },
    registerHighlight: {
        color: '#a78bfa',
        fontSize: 14,
        fontWeight: '700',
    },
    bottomNote: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
    },
    bottomNoteText: {
        color: 'rgba(255,255,255,0.22)',
        fontSize: 12,
    },
    installBtn: {
        marginTop: 25,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.25)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    installBtnText: {
        color: '#a78bfa',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default LoginScreen;
