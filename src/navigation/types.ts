export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Question: undefined;
  Profile: undefined;
  Friends: undefined;
};

export type FriendsStackParamList = {
  FriendsList: undefined;
  Chat: {
    friendId: string;
    friendNickname: string;
  };
};
