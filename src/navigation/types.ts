export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Auth: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

export type MainTabParamList = {
  Question: undefined;
  Profile: undefined;
  Friends: undefined;
  Settings: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  AllAnswers: {
    userId: string;
    nickname: string;
    isOwnProfile: boolean;
  };
};

export type FriendsStackParamList = {
  FriendsList: undefined;
  Chat: {
    friendId: string;
    friendNickname: string;
  };
  AllAnswers: {
    userId: string;
    nickname: string;
    isOwnProfile: boolean;
  };
  FriendProfile: {
    friendId: string;
    friendNickname: string;
  };
};
