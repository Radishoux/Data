import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import TabNavigator from './TabNavigator';
import AuthScreen from '../screens/auth/AuthScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import { AuthStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashText}>Data</Text>
    </View>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Auth" component={AuthScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

const RootNavigator: React.FC = () => {
  const initAuth = useStore((s) => s.initAuth);
  const isLoading = useStore((s) => s.isLoading);
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  useEffect(() => {
    initAuth();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (isAuthenticated) {
    return <TabNavigator />;
  }

  return <AuthNavigator />;
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
  },
});

export default RootNavigator;
