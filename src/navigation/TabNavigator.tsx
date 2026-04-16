import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import QuestionScreen from '../screens/question/QuestionScreen';
import ProfileStack from './ProfileStack';
import FriendsStack from './FriendsStack';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const COLORS = {
  background: '#0a0a0a',
  surface: '#111111',
  border: '#222222',
  accent: '#7C3AED',
  text: '#ffffff',
  muted: '#666666',
};

interface TabIconProps {
  symbol: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ symbol, focused }) => (
  <Text style={[styles.tabIcon, { color: focused ? COLORS.accent : COLORS.muted }]}>
    {symbol}
  </Text>
);

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Question"
        component={QuestionScreen}
        options={{
          tabBarLabel: 'Question',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📝" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon symbol="👤" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsStack}
        options={{
          tabBarLabel: 'Friends',
          tabBarIcon: ({ focused }) => <TabIcon symbol="👥" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon symbol="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 20,
  },
});

export default TabNavigator;
