import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-api.com/api';

// Token management
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Base API request function
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Request failed for ${endpoint}:`, error);
    throw error;
  }
};

export const apiService = {
  users: {
    getProfile: (userId) => apiRequest(`/users/profile${userId ? `/${userId}` : ''}`),
    getStats: () => apiRequest('/users/stats'),
    getCounsellors: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/users/counsellors${queryString ? `?${queryString}` : ''}`);
    },
    getRandomCounsellor: () => apiRequest('/users/counsellors/random'),
    updateProfile: (data) => apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    updatePreferences: (data) => apiRequest('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    // Counsellor-specific endpoints
    getCounsellorStudents: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/users/counsellor/students${queryString ? `?${queryString}` : ''}`);
    },
    getProfile: () => apiRequest('/users/profile'),
  },

  chatbot: {
    getQuestionnaire: (type) => apiRequest(`/chatbot/questionnaire/${type}`),
    submitAssessment: (data) => apiRequest('/chatbot/assessment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    sendMessage: (data) => apiRequest('/chatbot/message', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getAssessments: () => apiRequest('/chatbot/assessments'),
  },

  bookings: {
    create: (data) => apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/bookings${queryString ? `?${queryString}` : ''}`);
    },
    getById: (bookingId) => apiRequest(`/bookings/${bookingId}`),
    update: (bookingId, data) => apiRequest(`/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    cancel: (bookingId) => apiRequest(`/bookings/${bookingId}/cancel`, {
      method: 'POST',
    }),
    reschedule: (bookingId, data) => apiRequest(`/bookings/${bookingId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    // Counsellor-specific endpoints
    getCounsellorBookings: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/bookings/counsellor${queryString ? `?${queryString}` : ''}`);
    },
    updateStatus: (bookingId, status) => apiRequest(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
    addNotes: (bookingId, notes) => apiRequest(`/bookings/${bookingId}/notes`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),
  },

  resources: {
    getAll: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/resources${queryString ? `?${queryString}` : ''}`);
    },
    getById: (resourceId) => apiRequest(`/resources/${resourceId}`),
    getByCategory: (category) => apiRequest(`/resources/category/${category}`),
    getByLanguage: (language) => apiRequest(`/resources/language/${language}`),
    markAsRead: (resourceId) => apiRequest(`/resources/${resourceId}/read`, {
      method: 'POST',
    }),
    favorite: (resourceId) => apiRequest(`/resources/${resourceId}/favorite`, {
      method: 'POST',
    }),
    unfavorite: (resourceId) => apiRequest(`/resources/${resourceId}/favorite`, {
      method: 'DELETE',
    }),
  },

  auth: {
    login: (credentials) => apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
    register: (userData) => apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
    logout: () => apiRequest('/auth/logout', {
      method: 'POST',
    }),
    resetPassword: (email) => apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
    refreshToken: () => apiRequest('/auth/refresh', {
      method: 'POST',
    }),
  },

  reports: {
    getCrisis: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/reports/crisis${queryString ? `?${queryString}` : ''}`);
    },
    getProgress: (userId) => apiRequest(`/reports/progress/${userId}`),
    getAnalytics: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/reports/analytics${queryString ? `?${queryString}` : ''}`);
    },
  },

  ml: {
    analyzeSentiment: (data) => apiRequest('/ml/sentiment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    detectCrisis: (data) => apiRequest('/ml/crisis', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getRecommendations: (userId) => apiRequest(`/ml/recommendations/${userId}`),
  },

  admin: {
    getUsers: (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      return apiRequest(`/admin/users${queryString ? `?${queryString}` : ''}`);
    },
    getUserById: (userId) => apiRequest(`/admin/users/${userId}`),
    approveCounsellor: (counsellorId) => apiRequest(`/admin/counsellors/${counsellorId}/approve`, {
      method: 'PUT',
    }),
    rejectCounsellor: (counsellorId) => apiRequest(`/admin/counsellors/${counsellorId}/reject`, {
      method: 'PUT',
    }),
    blockUser: (userId) => apiRequest(`/admin/users/${userId}/block`, {
      method: 'PUT',
    }),
    unblockUser: (userId) => apiRequest(`/admin/users/${userId}/unblock`, {
      method: 'PUT',
    }),
    deleteUser: (userId) => apiRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    }),
    getSystemStats: () => apiRequest('/admin/stats'),
    updateUserRole: (userId, role) => apiRequest(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  },
};

export const handleApiError = (error) => {
  if (error.message) {
    // Handle specific error messages
    if (error.message.includes('401')) {
      return 'Authentication required. Please login again.';
    }
    if (error.message.includes('403')) {
      return 'Permission denied. You are not authorized to perform this action.';
    }
    if (error.message.includes('404')) {
      return 'Resource not found.';
    }
    if (error.message.includes('500')) {
      return 'Server error. Please try again later.';
    }
    return error.message;
  }
  return 'Network error. Please check your connection and try again.';
};

export default apiService;