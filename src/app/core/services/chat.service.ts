import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
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
  status?: 'sending' | 'sent' | 'failed';
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
  attachments?: File[];
}

export interface SendFileMessageRequest {
  sessionId: string;
  file: File;
  message?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
  response: string;
}

export interface ChatState {
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly CHAT_STORAGE_KEY = 'corpo_agent_chat';

  // Signals for reactive state management
  private chatState = signal<ChatState>({
    currentSession: null,
    messages: [],
    isLoading: false,
    isTyping: false,
    error: null
  });

  // Public readonly signals
  public readonly currentSession = computed(() => this.chatState().currentSession);
  public readonly messages = computed(() => this.chatState().messages);
  public readonly isLoading = computed(() => this.chatState().isLoading);
  public readonly isTyping = computed(() => this.chatState().isTyping);
  public readonly error = computed(() => this.chatState().error);
  public readonly hasMessages = computed(() => this.chatState().messages.length > 0);

  constructor(private http: HttpClient) {
    this.initializeChat();
  }

  private initializeChat(): void {
    this.loadStoredChat();
  }

  private loadStoredChat(): void {
    try {
      const stored = localStorage.getItem(this.CHAT_STORAGE_KEY);
      if (stored) {
        const chatData = JSON.parse(stored);
        this.chatState.set(chatData);
      }
    } catch (error) {
      console.error('Failed to load stored chat:', error);
    }
  }

  private storeChat(): void {
    try {
      localStorage.setItem(this.CHAT_STORAGE_KEY, JSON.stringify(this.chatState()));
    } catch (error) {
      console.error('Failed to store chat:', error);
    }
  }

  // Session Management
  getChatSessions(): Observable<ChatSession> {
    this.chatState.update(state => ({ ...state, isLoading: true, error: null }));
    
    return this.http.get<ChatSession>(`${API_BASE_URL}${API_ENDPOINTS.CHAT.SESSIONS}`)
      .pipe(
        tap(session => {
          this.chatState.update(state => ({
            ...state,
            currentSession: session,
            isLoading: false
          }));
          this.storeChat();
        }),
        catchError(error => {
          this.chatState.update(state => ({
            ...state,
            isLoading: false,
            error: 'Failed to load chat sessions'
          }));
          return throwError(() => error);
        })
      );
  }

  createChatSession(): Observable<ChatSession> {
    this.chatState.update(state => ({ ...state, isLoading: true, error: null }));
    
    return this.http.get<ChatSession>(`${API_BASE_URL}${API_ENDPOINTS.CHAT.SESSIONS}`)
      .pipe(
        tap(session => {
          this.chatState.update(state => ({
            ...state,
            currentSession: session,
            messages: [],
            isLoading: false
          }));
          this.storeChat();
        }),
        catchError(error => {
          this.chatState.update(state => ({
            ...state,
            isLoading: false,
            error: 'Failed to create chat session'
          }));
          return throwError(() => error);
        })
      );
  }

  // Message Management
  getChatMessages(sessionId: string): Observable<ChatMessage[]> {
    this.chatState.update(state => ({ ...state, isLoading: true, error: null }));
    
    return this.http.get<ChatMessage[]>(`${API_BASE_URL}${API_ENDPOINTS.CHAT.MESSAGES}`)
      .pipe(
        tap(messages => {
          this.chatState.update(state => ({
            ...state,
            messages,
            isLoading: false
          }));
          this.storeChat();
        }),
        catchError(error => {
          this.chatState.update(state => ({
            ...state,
            isLoading: false,
            error: 'Failed to load messages'
          }));
          return throwError(() => error);
        })
      );
  }

  sendMessage(request: SendMessageRequest): Observable<any> {
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sessionId: request.sessionId,
      content: request.message,
      role: 'user',
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    this.chatState.update(state => ({
      ...state,
      messages: [...state.messages, userMessage],
      isTyping: true,
      error: null
    }));
    this.storeChat();

    // Send only the message content to match backend expectation
    const sendData = { content: request.message };

    return this.http.post<any>(`${API_BASE_URL}${API_ENDPOINTS.CHAT.SEND}`, sendData)
      .pipe(
        tap(response => {
          // Update user message status
          this.chatState.update(state => ({
            ...state,
            messages: state.messages.map(msg => 
              msg.id === userMessage.id 
                ? { ...msg, status: 'sent' as const }
                : msg
            )
          }));

          // Add AI response from backend
          const aiMessage: ChatMessage = {
            id: response.message.id,
            sessionId: response.message.sessionId,
            content: response.message.content,
            role: 'assistant',
            timestamp: response.message.timestamp
          };

          this.chatState.update(state => ({
            ...state,
            messages: [...state.messages, aiMessage],
            isTyping: false
          }));
          this.storeChat();
        }),
        catchError(error => {
          // Update user message status to failed
          this.chatState.update(state => ({
            ...state,
            messages: state.messages.map(msg => 
              msg.id === userMessage.id 
                ? { ...msg, status: 'failed' as const }
                : msg
            ),
            isTyping: false,
            error: 'Failed to send message'
          }));
          this.storeChat();
          return throwError(() => error);
        })
      );
  }

  sendFileMessage(request: SendFileMessageRequest): Observable<any> {
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sessionId: request.sessionId,
      content: `File uploaded: ${request.file.name}${request.message ? ` - ${request.message}` : ''}`,
      role: 'user',
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    this.chatState.update(state => ({
      ...state,
      messages: [...state.messages, userMessage],
      isTyping: true,
      error: null
    }));
    this.storeChat();

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', request.file);
    if (request.message) {
      formData.append('request', request.message);
    }

    return this.http.post<any>(`${API_BASE_URL}${API_ENDPOINTS.CHAT.SEND_FILE}`, formData)
      .pipe(
        tap(response => {
          // Update user message status
          this.chatState.update(state => ({
            ...state,
            messages: state.messages.map(msg => 
              msg.id === userMessage.id 
                ? { ...msg, status: 'sent' as const }
                : msg
            )
          }));

          // Add AI response from backend
          const aiMessage: ChatMessage = {
            id: response.message.id,
            sessionId: response.message.sessionId,
            content: response.message.content,
            role: 'assistant',
            timestamp: response.message.timestamp
          };

          this.chatState.update(state => ({
            ...state,
            messages: [...state.messages, aiMessage],
            isTyping: false
          }));
          this.storeChat();
        }),
        catchError(error => {
          // Update user message status to failed
          this.chatState.update(state => ({
            ...state,
            messages: state.messages.map(msg => 
              msg.id === userMessage.id 
                ? { ...msg, status: 'failed' as const }
                : msg
            ),
            isTyping: false,
            error: 'Failed to send file message'
          }));
          this.storeChat();
          return throwError(() => error);
        })
      );
  }

  // Local message management
  addMessage(message: ChatMessage): void {
    this.chatState.update(state => ({
      ...state,
      messages: [...state.messages, message]
    }));
    this.storeChat();
  }

  updateMessage(messageId: string, updates: Partial<ChatMessage>): void {
    this.chatState.update(state => ({
      ...state,
      messages: state.messages.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    }));
    this.storeChat();
  }

  deleteMessage(messageId: string): void {
    this.chatState.update(state => ({
      ...state,
      messages: state.messages.filter(msg => msg.id !== messageId)
    }));
    this.storeChat();
  }

  clearSession(): void {
    this.http.delete(`${API_BASE_URL}${API_ENDPOINTS.CHAT.SESSIONS}`).subscribe(() => {
      this.chatState.set({
        currentSession: null,
        messages: [],
        isLoading: false,
        isTyping: false,
        error: null
      });
    });
  }

  // Utility methods
  copyMessage(message: ChatMessage): void {
    navigator.clipboard.writeText(message.content);
  }

  retryMessage(messageId: string): void {
    const message = this.chatState().messages.find(msg => msg.id === messageId);
    if (message && message.role === 'user' && message.status === 'failed') {
      this.updateMessage(messageId, { status: 'sending' });
      // TODO: Implement retry logic
    }
  }
}
