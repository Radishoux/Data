import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authAPI } from '../../services/api';
import { AuthStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const COLORS = {
  background: '#0a0a0a',
  surface: '#111111',
  surface2: '#1a1a1a',
  border: '#222222',
  accent: '#7C3AED',
  accentLight: '#9F7AEA',
  text: '#ffffff',
  muted: '#888888',
  error: '#EF4444',
  success: '#22C55E',
};

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NavProp>();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSuccess(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a reset code.
        </Text>

        {!success ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSend}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Code</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Check your inbox</Text>
            <Text style={styles.successBody}>
              A reset code has been sent to{' '}
              <Text style={styles.successEmail}>{email}</Text>.
            </Text>
            <Text style={styles.devHint}>
              Dev mode: check the server console for the reset code.
            </Text>
            <TouchableOpacity
              style={styles.resetCodeButton}
              onPress={() => navigation.navigate('ResetPassword', { email })}
              activeOpacity={0.85}
            >
              <Text style={styles.resetCodeButtonText}>Enter reset code →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 32,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 15,
    color: COLORS.accentLight,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.muted,
    lineHeight: 22,
    marginBottom: 32,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 4,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  successCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.success + '44',
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success,
  },
  successBody: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  successEmail: {
    color: COLORS.accentLight,
    fontWeight: '600',
  },
  devHint: {
    fontSize: 12,
    color: COLORS.muted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  resetCodeButton: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  resetCodeButtonText: {
    color: COLORS.accentLight,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
