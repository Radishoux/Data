import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useStore } from '../store/useStore';
import { usersAPI } from '../services/api';
import Avatar from '../components/Avatar';

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

export default function SettingsScreen() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const logout = useStore((s) => s.logout);

  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const handleSaveNickname = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    if (trimmed === user?.nickname) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const res = await usersAPI.updateMe({ nickname: trimmed });
      setUser(res.data.user);
      setSaveSuccess('Nickname updated!');
    } catch (err: any) {
      setSaveError(err.response?.data?.error ?? 'Failed to update nickname.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profile header ── */}
      <View style={styles.profileSection}>
        {user && <Avatar userId={user.id} size={88} borderRadius={22} />}
        <Text style={styles.profileNickname}>{user?.nickname ?? '—'}</Text>
        {user?.email ? (
          <Text style={styles.profileEmail}>{user.email}</Text>
        ) : null}
      </View>

      {/* ── Edit nickname ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nickname</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={(t) => {
              setNickname(t);
              setSaveError('');
              setSaveSuccess('');
            }}
            placeholder="Your nickname"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={50}
          />
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSaveNickname}
            disabled={saving || !nickname.trim() || nickname.trim() === user?.nickname}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
        {saveSuccess ? <Text style={styles.successText}>{saveSuccess}</Text> : null}
      </View>

      {/* ── Account section ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email ?? '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member since</Text>
          <Text style={styles.infoValue}>
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })
              : '—'}
          </Text>
        </View>
      </View>

      {/* ── Danger zone ── */}
      <View style={[styles.section, styles.dangerSection]}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutBtnText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingBottom: 48,
  },

  // Profile
  profileSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  profileNickname: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.muted,
    letterSpacing: 0.2,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },

  // Nickname row
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.text,
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 64,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
  },
  successText: {
    fontSize: 13,
    color: COLORS.success,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Danger zone
  dangerSection: {
    marginTop: 12,
  },
  logoutBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.error,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
