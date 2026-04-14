import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Settings</Text>
      <Text style={styles.hint}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
  },
  hint: {
    fontSize: 14,
    color: '#444444',
  },
});
