export interface User {
  id: string;
  nickname: string;
  email?: string;
  avatarStyle?: string;
  avatarUri?: string;
  createdAt: string; // ISO date string
}

export interface Question {
  id: string;
  text: string;
  date: string; // ISO date string (YYYY-MM-DD)
  category?: string;
}

export interface Answer {
  id: string;
  userId: string;
  questionId: string;
  content: string;
  answeredAt: string; // ISO date string
}

export interface Friendship {
  id: string;
  requesterId: string;
  receiverId: string;
  status: 'pending' | 'accepted';
  createdAt?: string;
}

// Legacy alias — keep for any code that imports Friend
export type Friend = Friendship;

export interface FriendWithUser {
  friendship: Friendship;
  user: User | null;
}

export interface FriendRequest {
  request: Friendship;
  from: User | null;
}

export interface FriendTodayAnswer {
  answer: Answer;
  user: User | null;
}

export interface Reaction {
  id: string;
  userId: string;
  answerId: string;
  emoji: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string; // ISO date string
  read: boolean;
}
