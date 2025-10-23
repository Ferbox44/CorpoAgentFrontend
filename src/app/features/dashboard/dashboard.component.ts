import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, AvatarModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  userInitials = signal('');

  constructor(public authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.user();
    if (user) {
      this.userInitials.set(
        `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
      );
    }
  }

  logout(): void {
    this.authService.logout();
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
    // TODO: Implement data analysis
    console.log('Opening data analysis...');
  }

  generateReport(): void {
    // TODO: Implement report generation
    console.log('Generating report...');
  }

  openOrchestration(): void {
    // TODO: Implement orchestration
    console.log('Opening orchestration...');
  }
}