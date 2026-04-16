import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { User, Answer, Question, Message, Friendship, FriendWithUser, FriendRequest, FriendTodayAnswer } from '../types';

const api = axios.create({ baseURL: `${API_BASE_URL}/api` });

// Request interceptor: add Authorization header if token exists
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: on 401, clear token
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export const authAPI = {
  register: (data: { nickname: string; email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', data),
  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),
  resetPassword: (resetToken: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { resetToken, password }),
};

// --- Users ---
export const usersAPI = {
  getMe: () => api.get<{ user: User }>('/users/me'),
  updateMe: (data: Partial<Pick<User, 'nickname' | 'avatarStyle'>>) =>
    api.patch<{ user: User }>('/users/me', data),
  getUserById: (userId: string) => api.get<{ user: User }>(`/users/${userId}`),
};

// --- Questions ---
export const questionsAPI = {
  getToday: () => api.get<{ question: Question; date: string }>('/questions/today'),
  getAll: () => api.get<{ questions: Question[] }>('/questions'),
};

// --- Answers ---
export const answersAPI = {
  getMyAnswers: () => api.get<{ answers: Answer[] }>('/answers/me'),
  postAnswer: (data: { questionId: string; content: string }) =>
    api.post<{ answer: Answer }>('/answers', data),
  getUserAnswers: (userId: string) =>
    api.get<{ answers: Answer[] }>(`/answers/user/${userId}`),
  getFriendsTodayFeed: () =>
    api.get<{ questionId: string; answers: FriendTodayAnswer[] }>('/answers/friends/today'),
};

// --- Friends ---
export const friendsAPI = {
  getFriends: () => api.get<{ friends: FriendWithUser[] }>('/friends'),
  sendRequest: (data: { identifier: string }) =>
    api.post<{ friendship: Friendship }>('/friends/request', data),
  getRequests: () => api.get<{ requests: FriendRequest[] }>('/friends/requests'),
  acceptRequest: (id: string) =>
    api.patch<{ friendship: Friendship }>(`/friends/${id}/accept`),
  removeFriend: (id: string) => api.delete(`/friends/${id}`),
};

// --- Messages ---
export const messagesAPI = {
  getMessages: (friendId: string) =>
    api.get<{ messages: Message[] }>(`/messages/${friendId}`),
  sendMessage: (data: { receiverId: string; content: string }) =>
    api.post<{ message: Message }>('/messages', data),
};

export default api;
