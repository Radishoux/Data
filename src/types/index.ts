export interface User {
  id: string;
  nickname: string;
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

export interface Friend {
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted';
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
