import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS, API_BASE_URL } from '../constants/api.constants';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  // Chat Sessions
  getChatSessions(): Observable<ChatSession[]> {
    return this.http.get<ChatSession[]>(`${API_BASE_URL}${API_ENDPOINTS.CHAT.SESSIONS}`);
  }

  createChatSession(): Observable<ChatSession> {
    return this.http.post<ChatSession>(`${API_BASE_URL}${API_ENDPOINTS.CHAT.SESSIONS}`, {});
  }

  getChatMessages(sessionId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${API_BASE_URL}${API_ENDPOINTS.CHAT.MESSAGES}/${sessionId}`);
  }

  sendMessage(request: SendMessageRequest): Observable<SendMessageResponse> {
    return this.http.post<SendMessageResponse>(`${API_BASE_URL}${API_ENDPOINTS.CHAT.SEND}`, request);
  }

  // Agent Endpoints
  getDataAgentStatus(): Observable<{ status: string; lastActivity: string }> {
    return this.http.get<{ status: string; lastActivity: string }>(`${API_BASE_URL}${API_ENDPOINTS.AGENTS.DATA}/status`);
  }

  getReportAgentStatus(): Observable<{ status: string; lastActivity: string }> {
    return this.http.get<{ status: string; lastActivity: string }>(`${API_BASE_URL}${API_ENDPOINTS.AGENTS.REPORT}/status`);
  }

  getOrchestratorStatus(): Observable<{ status: string; lastActivity: string }> {
    return this.http.get<{ status: string; lastActivity: string }>(`${API_BASE_URL}${API_ENDPOINTS.AGENTS.ORCHESTRATOR}/status`);
  }

  getUniAgentStatus(): Observable<{ status: string; lastActivity: string }> {
    return this.http.get<{ status: string; lastActivity: string }>(`${API_BASE_URL}${API_ENDPOINTS.AGENTS.UNI}/status`);
  }
}
