import { Component, signal, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '../../core/services/auth.service';
import { KnowledgeBaseService, KnowledgeBaseItem } from '../../core/services/knowledge-base.service';
import { ChatContainerComponent } from '../chat/components/chat-container.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, AvatarModule, ChatContainerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  userInitials = signal('');
  @ViewChild(ChatContainerComponent) chatContainer!: ChatContainerComponent;

  kbItems = signal<KnowledgeBaseItem[]>([]);
  kbLoading = signal(false);

  constructor(
    public authService: AuthService,
    private router: Router,
    private knowledgeBaseService: KnowledgeBaseService
  ) {}

  ngOnInit() {
    const user = this.authService.user;
    if (user) {
      // Extract first and last name from the full name
      const nameParts = user.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts[1] || '';
      this.userInitials.set(
        `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
      );
    }

    this.loadKnowledgeBase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  startNewChat(): void {
    // TODO: Implement chat functionality
    console.log('Starting new chat...');
  }

  viewReports(): void {
    // TODO: Implement reports view
    console.log('Viewing reports...');
  }

  openDataAnalysis(): void {
    // Set a default message for data analysis
    const analysisMessage = "Please analyze the employee data and provide insights about department performance, salary distribution, and any patterns you can identify.";
    
    if (this.chatContainer) {
      // Load the employees.csv file and send the message directly
      this.chatContainer.loadEmployeesCSV();
      
      // Wait a moment for the file to be loaded, then send the message
      setTimeout(() => {
        const file = this.chatContainer.selectedFile;
        if (file) {
          this.chatContainer.sendMessageProgrammatically(analysisMessage, file);
          console.log('Data analysis message sent with employees.csv file');
        } else {
          // Fallback: send text message only
          this.chatContainer.sendMessageProgrammatically(analysisMessage);
          console.log('Data analysis message sent (no file)');
        }
      }, 200);
    } else {
      console.warn('Chat container not available');
    }
  }

  generateReport(): void {
    const reportMessage = "Please generate a report from the corporateData file and provide insights and recommendations. Export the report to PDF.";

    if (this.chatContainer) {
      // Send the message directly
      this.chatContainer.sendMessageProgrammatically(reportMessage);
      console.log('Report generation message sent');
    } else {
      console.warn('Chat container not available');
    }
  }

  openOrchestration(): void {
    // TODO: Implement orchestration
    console.log('Opening orchestration...');
  }

  generateCharts(): void {
    const chartsMessage = "Generate insightful charts from the employees.csv file.";

    if (this.chatContainer) {
      // Prefer using the employees dataset for charting examples
      //this.chatContainer.loadEmployeesCSV();

      setTimeout(() => {
        const file = this.chatContainer.selectedFile;
        if (file) {
          this.chatContainer.sendMessageProgrammatically(chartsMessage, file);
          console.log('Charts generation message sent with employees.csv file');
        } else {
          this.chatContainer.sendMessageProgrammatically(chartsMessage);
          console.log('Charts generation message sent (no file)');
        }
      }, 200);
    } else {
      console.warn('Chat container not available');
    }
  }

  showCsvPreview(): void {
    if (this.chatContainer) {
      // Load the employees.csv file
      this.chatContainer.loadEmployeesCSV();
      
      // Show CSV preview dialog
      setTimeout(() => {
        this.chatContainer.showCsvPreview();
      }, 200);
    }
  }

  showCorporateDataPreview(): void {
    if (this.chatContainer) {
      // Load the corporate data CSV file
      this.chatContainer.loadCorporateDataCSV();
      
      // Show CSV preview dialog
      setTimeout(() => {
        this.chatContainer.showCsvPreview();
      }, 200);
    }
  }

  private loadKnowledgeBase(): void {
    this.kbLoading.set(true);
    this.knowledgeBaseService.list().subscribe({
      next: (items) => {
        this.kbItems.set(items);
        this.kbLoading.set(false);
      },
      error: () => this.kbLoading.set(false)
    });
  }

  deleteKnowledgeBaseItem(id: string): void {
    const confirmed = confirm('Delete this file from the knowledge base?');
    if (!confirmed) return;
    this.knowledgeBaseService.delete(id).subscribe({
      next: () => {
        this.kbItems.set(this.kbItems().filter(item => item.id !== id));
      }
    });
  }
}