export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile'
  },
  CHAT: {
    SESSIONS: '/chat/sessions',
    MESSAGES: '/chat/messages',
    SEND: '/chat/send'
  },
  AGENTS: {
    DATA: '/agents/data',
    ORCHESTRATOR: '/agents/orchestrator',
    REPORT: '/agents/report',
    UNI: '/agents/uni'
  }
} as const;

export const API_BASE_URL = 'http://localhost:3000';
