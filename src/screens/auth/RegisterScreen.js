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

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    const [nameFocused, setNameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passFocused, setPassFocused] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(70)).current;
    const logoScale = useRef(new Animated.Value(0.6)).current;
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 55, useNativeDriver: true }),
            ]),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.1, duration: 2000, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const handleRegister = async () => {
        if (!name || !email || !password) return alert('Please fill all fields');
        setLoading(true);
        try {
            await register(name, email, password);
        } catch (err) {
            alert(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const strengthLevel = password.length < 6 ? 0 : password.length < 10 ? 1 : 2;
    const strengthLabel = ['Weak', 'Good', 'Strong'][strengthLevel];
    const strengthColor = ['#f87171', '#a78bfa', '#34d399'][strengthLevel];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            {/* Background orbs - Matched with LoginScreen */}
            <View style={styles.orb1} />
            <View style={styles.orb2} />
            <View style={styles.orb3} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo Section - Matched with LoginScreen */}
                <Animated.View style={[styles.logoSection, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
                    <Animated.View style={[styles.logoCircle, { transform: [{ scale: pulse }] }]}>
                        <Ionicons name="musical-notes" size={36} color="#a78bfa" />
                    </Animated.View>
                    <Text style={styles.title}>LyricHub</Text>
                    <Text style={styles.tagline}>Start your lyric journey today</Text>
                </Animated.View>

                {/* Card */}
                <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={styles.cardTitle}>Create Account</Text>
                    <Text style={styles.cardSubtitle}>Join thousands of lyric writers</Text>

                    {/* Step indicators */}
                    <View style={styles.stepRow}>
                        <View style={[styles.step, styles.stepActive]} />
                        <View style={styles.stepLine} />
                        <View style={[styles.step, name ? styles.stepActive : styles.stepInactive]} />
                        <View style={styles.stepLine} />
                        <View style={[styles.step, email && password ? styles.stepActive : styles.stepInactive]} />
                    </View>

                    {/* Name Input */}
                    <View style={[styles.inputWrapper, nameFocused && styles.inputFocused]}>
                        <Ionicons
                            name="person-outline"
                            size={18}
                            color={nameFocused ? '#a78bfa' : 'rgba(255,255,255,0.35)'}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={name}
                            onChangeText={setName}
                            onFocus={() => setNameFocused(true)}
                            onBlur={() => setNameFocused(false)}
                        />
                    </View>

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
                            placeholder="Create a password"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            onFocus={() => setPassFocused(true)}
                            onBlur={() => setPassFocused(false)}
                        />
                    </View>

                    {/* Password strength */}
                    {password.length > 0 && (
                        <View style={styles.strengthRow}>
                            <View style={[styles.strengthBar, { backgroundColor: strengthLevel >= 0 ? strengthColor : 'rgba(255,255,255,0.1)' }]} />
                            <View style={[styles.strengthBar, { backgroundColor: strengthLevel >= 1 ? strengthColor : 'rgba(255,255,255,0.1)' }]} />
                            <View style={[styles.strengthBar, { backgroundColor: strengthLevel >= 2 ? strengthColor : 'rgba(255,255,255,0.1)' }]} />
                            <Text style={[styles.strengthText, { color: strengthColor }]}>{strengthLabel}</Text>
                        </View>
                    )}

                    {/* Register Button - Matched with LoginScreen purple */}
                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <View style={styles.buttonInner}>
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.buttonText}>Join LyricHub</Text>
                                    <Ionicons name="rocket-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
                                </>
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* Terms */}
                    <Text style={styles.termsText}>
                        By registering, you agree to our{' '}
                        <Text style={styles.termsLink}>Terms</Text>
                        {' & '}
                        <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Login Link */}
                    <TouchableOpacity
                        style={styles.loginBtn}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.75}
                    >
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <Text style={styles.loginHighlight}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={14} color="#a78bfa" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Feature badges */}
                <Animated.View style={[styles.badges, { opacity: fadeAnim }]}>
                    <View style={styles.badge}>
                        <Ionicons name="musical-note-outline" size={20} color="#a78bfa" />
                        <Text style={styles.badgeText}>Share Lyrics</Text>
                    </View>
                    <View style={styles.badge}>
                        <Ionicons name="people-outline" size={20} color="#a78bfa" />
                        <Text style={styles.badgeText}>Collaborate</Text>
                    </View>
                    <View style={styles.badge}>
                        <Ionicons name="star-outline" size={20} color="#a78bfa" />
                        <Text style={styles.badgeText}>Get Noticed</Text>
                    </View>
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
        paddingVertical: 36,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 30,
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
    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 28,
        padding: 26,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.09)',
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.35)',
        marginBottom: 20,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 22,
    },
    step: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    stepActive: {
        backgroundColor: '#a78bfa',
        ...Platform.select({
            web: { boxShadow: '0 0 6px rgba(167, 139, 250, 0.8)' },
            default: {
                shadowColor: '#a78bfa',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 6,
            }
        }),
        elevation: 4,
    },
    stepInactive: {
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    stepLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginHorizontal: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        borderWidth: 0,
        marginBottom: 13,
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
    strengthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        marginTop: -4,
        gap: 5,
    },
    strengthBar: {
        flex: 1,
        height: 3,
        borderRadius: 2,
    },
    strengthText: {
        fontSize: 11,
        marginLeft: 6,
        minWidth: 40,
        fontWeight: '600',
    },
    button: {
        borderRadius: 14,
        marginTop: 6,
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
        letterSpacing: 0.4,
    },
    termsText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.25)',
        textAlign: 'center',
        marginTop: 12,
    },
    termsLink: {
        color: '#a78bfa',
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    dividerText: {
        color: 'rgba(255,255,255,0.28)',
        fontSize: 12,
        marginHorizontal: 12,
    },
    loginBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 14,
    },
    loginHighlight: {
        color: '#a78bfa',
        fontSize: 14,
        fontWeight: '700',
    },
    badges: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginTop: 26,
    },
    badge: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        paddingVertical: 10,
        paddingHorizontal: 14,
        gap: 4,
    },
    badgeText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.38)',
        fontWeight: '600',
    },
});

export default RegisterScreen;
