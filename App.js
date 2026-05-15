import React, { useContext, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/user/HomeScreen';
import CreatePostScreen from './src/screens/user/CreatePostScreen';
import ProfileScreen from './src/screens/user/ProfileScreen';
import EditProfileScreen from './src/screens/user/EditProfileScreen';
import PostDetailScreen from './src/screens/user/PostDetailScreen';
import FriendsScreen from './src/screens/user/FriendsScreen';
import ChatScreen from './src/screens/user/ChatScreen';
import NotificationsScreen from './src/screens/user/NotificationsScreen';
import AdminScreen from './src/screens/admin/AdminScreen';
import MessagesListScreen from './src/screens/user/MessagesListScreen';
import SecurityScreen from './src/screens/user/SecurityScreen';
import { ActivityIndicator, View, LogBox, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Global Web Styles to make it feel like a Native App
if (Platform.OS === 'web') {
  // 1. Inject CSS for layout and disabling zoom
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100%;
      width: 100%;
      overflow: hidden;
      -webkit-overflow-scrolling: touch;
      user-select: none;
      -webkit-user-select: none;
      background-color: #0a0a14;
      touch-action: manipulation;
    }
    input, textarea {
      user-select: text;
      -webkit-user-select: text;
    }
    * {
      -webkit-tap-highlight-color: transparent;
      outline: none;
    }
  `;
  document.head.append(style);

  // 2. Inject Meta tag to disable zooming
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  document.head.append(meta);
  // 3. PWA Install Logic
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
  });
}

// Ignore specific warnings that are internal to third-party libraries
LogBox.ignoreLogs([
  'props.pointerEvents is deprecated',
  'Blocked aria-hidden on an element',
]);

// Monkey-patch console.warn/error to hide these from the browser console as well
if (__DEV__) {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && (
      args[0].includes('props.pointerEvents is deprecated') || 
      args[0].includes('Blocked aria-hidden on an element') ||
      args[0].includes('Accessibility')
    )) return;
    originalWarn(...args);
  };

  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && (
      args[0].includes('props.pointerEvents is deprecated') || 
      args[0].includes('Blocked aria-hidden on an element') ||
      args[0].includes('Accessibility')
    )) return;
    originalError(...args);
  };
}

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { unreadCount, user } = useContext(AuthContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a14',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.08)',
          height: 100,
          paddingBottom: 35,
          paddingTop: 10,
          overflow: 'visible',
        },
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: '#ffffff',
        tabBarShowLabel: false,
        tabBarIcon: ({ focused, color }) => {
          if (route.name === 'Profile' && user?.profilePic) {
            return (
              <View style={{ height: 50, width: 50, alignItems: 'center', justifyContent: 'center' }}>
                <Image 
                  source={{ uri: user.profilePic }} 
                  style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: 14, 
                    borderWidth: focused ? 2 : 1, 
                    borderColor: focused ? '#a855f7' : 'rgba(255,255,255,0.5)' 
                  }} 
                />
              </View>
            );
          }

          let iconName;
          let iconSize = 28;

          if (focused) {
            if (route.name === 'Home') iconName = 'home';
            else if (route.name === 'Messenger') iconName = 'chatbubbles';
            else if (route.name === 'Add') iconName = 'add-circle';
            else if (route.name === 'Friends') iconName = 'people';
            else if (route.name === 'Profile') iconName = 'person';
          } else {
            if (route.name === 'Home') iconName = 'home-outline';
            else if (route.name === 'Messenger') iconName = 'chatbubbles-outline';
            else if (route.name === 'Add') iconName = 'add-circle-outline';
            else if (route.name === 'Friends') iconName = 'people-outline';
            else if (route.name === 'Profile') iconName = 'person-outline';
          }

          if (route.name === 'Add') iconSize = 42;

          return (
            <View style={{ height: 50, width: 50, alignItems: 'center', justifyContent: 'center' }}>
               <Ionicons name={iconName} size={iconSize} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="Messenger" 
        component={MessagesListScreen} 
        options={{ 
          tabBarBadge: unreadCount > 0 ? unreadCount : null,
          tabBarBadgeStyle: { backgroundColor: '#ff3b30', color: '#fff', fontSize: 10 }
        }} 
      />
      <Tab.Screen name="Add" component={CreatePostScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0a0a14',
    card: '#1a1a2e',
    text: '#ffffff',
    border: 'rgba(255,255,255,0.05)',
  },
};

const Navigation = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a14' }}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={MyTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            {user.isAdmin ? (
              <Stack.Screen name="AdminDashboard" component={AdminScreen} />
            ) : (
              <Stack.Screen name="Main" component={MainTabs} />
            )}
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="PostDetail" component={PostDetailScreen} />
            <Stack.Screen name="UserProfile" component={ProfileScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Admin" component={AdminScreen} />
            <Stack.Screen name="Security" component={SecurityScreen} />
            <Stack.Screen name="MessagesList" component={MessagesListScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  useEffect(() => {
    // Force allow screenshots in case they were previously blocked
    ScreenCapture.allowScreenCaptureAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
