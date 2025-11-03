import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';

export interface KnowledgeBaseItem {
  id: string;
  title: string;
  content: string;
  tags?: string | null;
  raw_content?: string | null;
  analysis_summary?: string | null;
  filename?: string | null;
  file_type?: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class KnowledgeBaseService {
  constructor(private http: HttpClient) {}

  list(): Observable<KnowledgeBaseItem[]> {
    return this.http.get<KnowledgeBaseItem[]>(`${API_BASE_URL}${API_ENDPOINTS.KNOWLEDGE_BASE.LIST}`);
  }

  delete(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${API_BASE_URL}${API_ENDPOINTS.KNOWLEDGE_BASE.DELETE(id)}`);
  }
}


