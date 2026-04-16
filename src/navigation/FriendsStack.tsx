import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FriendsStackParamList } from './types';
import FriendsScreen from '../screens/friends/FriendsScreen';
import ChatScreen from '../screens/friends/ChatScreen';
import AllAnswersScreen from '../screens/profile/AllAnswersScreen';
import FriendProfileScreen from '../screens/friends/FriendProfileScreen';

const Stack = createNativeStackNavigator<FriendsStackParamList>();

const COLORS = {
  background: '#0a0a0a',
  surface: '#111111',
  border: '#222222',
  accent: '#7C3AED',
  text: '#ffffff',
  muted: '#666666',
};

const FriendsStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '700',
          color: COLORS.text,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <Stack.Screen
        name="FriendsList"
        component={FriendsScreen}
        options={{ title: 'Friends' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params.friendNickname,
          headerBackTitle: 'Back',
        })}
      />
      <Stack.Screen
        name="AllAnswers"
        component={AllAnswersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FriendProfile"
        component={FriendProfileScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default FriendsStack;
