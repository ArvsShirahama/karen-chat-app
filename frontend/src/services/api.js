import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY || '';

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/token/refresh/`, {
            refresh: refreshToken,
          });
          localStorage.setItem('token', response.data.access);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

// Supabase client
export const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Auth functions
export const register = async (username, email, password) => {
  const response = await api.post('/auth/register/', { username, email, password });
  return response.data;
};

export const login = async (username, password) => {
  const response = await axios.post(`${API_URL}/token/`, { username, password });
  const { access, refresh } = response.data;
  localStorage.setItem('token', access);
  localStorage.setItem('refreshToken', refresh);
  
  const userResponse = await api.get('/auth/profile/');
  return userResponse.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/profile/');
  return response.data;
};

// Room functions
export const getRooms = async () => {
  const response = await api.get('/rooms/');
  return response.data;
};

export const getMyRooms = async () => {
  const response = await api.get('/rooms/my/');
  return response.data;
};

export const createRoom = async (name, isPrivate = false) => {
  const response = await api.post('/rooms/', { name, is_private: isPrivate });
  return response.data;
};

export const joinRoom = async (roomId) => {
  const response = await api.post(`/rooms/${roomId}/join/`);
  return response.data;
};

export const getRoom = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}/`);
  return response.data;
};

// Message functions
export const getMessages = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}/messages/`);
  return response.data;
};

export const sendMessage = async (roomId, content) => {
  const response = await api.post(`/rooms/${roomId}/messages/`, { content });
  return response.data;
};

// Supabase realtime subscription
export const setupSupabaseSubscription = (callbacks = {}) => {
  if (!supabase) {
    console.warn('Supabase not configured');
    return () => {};
  }

  const channelName = `messages-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        if (callbacks.onNewMessage) {
          callbacks.onNewMessage(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export default api;
