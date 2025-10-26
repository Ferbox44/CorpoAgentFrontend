import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { ChatService, ChatSession, ChatMessage, SendMessageRequest, SendFileMessageRequest } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-chat-container',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    ProgressSpinnerModule,
    TooltipModule,
    FileUploadModule,
    MessageModule,
    DialogModule
  ],
  templateUrl: './chat-container.component.html',
  styleUrl: './chat-container.component.css'
})
export class ChatContainerComponent implements OnInit, AfterViewChecked {
  // Form
  messageForm: FormGroup;
  
  // File handling
  selectedFile: File | null = null;
  
  // CSV Preview Dialog
  showCsvDialog = false;
  csvContent = '';

  // Scrolling
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  private shouldScrollToBottom = true;

  // Use ChatService signals directly
  currentSession: any;
  messages: any;
  isLoading: any;
  isTyping: any;
  error: any;
  hasMessages: any;
  sessionTitle: any;

  constructor(
    private fb: FormBuilder,
    private chatService: ChatService,
    public authService: AuthService
  ) {
    // Initialize signals after constructor
    this.currentSession = this.chatService.currentSession;
    this.messages = this.chatService.messages;
    this.isLoading = this.chatService.isLoading;
    this.isTyping = this.chatService.isTyping;
    this.error = this.chatService.error;
    this.hasMessages = this.chatService.hasMessages;
    this.sessionTitle = computed(() => this.currentSession()?.title || 'New Chat');
    this.messageForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    this.loadCurrentSession();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  private loadCurrentSession(): void {
    this.chatService.getChatSessions().subscribe({
      next: (session) => {
        if (session) {
          this.loadMessages(session.id);
        } else {
          this.createNewSession();
        }
      },
      error: (error) => {
        console.error('Failed to load sessions:', error);
        if (error.status === 401) {
          // Authentication error - redirect to login
          console.error('Authentication required. Please login again.');
        }
      }
    });
  }

  private createNewSession(): void {
    this.chatService.createChatSession().subscribe({
      next: (session) => {
        // Session is automatically set by ChatService
      },
      error: (error) => {
        console.error('Failed to create session:', error);
      }
    });
  }

  private loadMessages(sessionId: string): void {
    this.chatService.getChatMessages(sessionId).subscribe({
      next: (messages) => {
        // Messages are automatically set by ChatService
      },
      error: (error) => {
        console.error('Failed to load messages:', error);
      }
    });
  }

  sendMessage(): void {
    if (this.messageForm.valid && this.currentSession()) {
      const messageText = this.messageForm.get('message')?.value;
      
      // Check if we have a file selected
      if (this.selectedFile) {
        // Use send-file endpoint
        this.sendFileMessage(messageText || '');
      } else if (messageText?.trim()) {
        // Use regular send endpoint
        this.sendTextMessage(messageText);
      }
    }
  }

  private sendTextMessage(messageText: string): void {
    this.messageForm.reset();
    this.selectedFile = null;
    this.shouldScrollToBottom = true;

    // Send to API using ChatService
    const request: SendMessageRequest = {
      sessionId: this.currentSession()!.id,
      message: messageText
    };

    this.chatService.sendMessage(request).subscribe({
      next: (response) => {
        // Message and response are automatically handled by ChatService
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Failed to send message:', error);
      }
    });
  }

  private sendFileMessage(messageText: string): void {
    if (!this.selectedFile) return;

    this.messageForm.reset();
    const file = this.selectedFile;
    this.selectedFile = null;
    this.shouldScrollToBottom = true;

    // Send file using ChatService
    this.chatService.sendFileMessage({
      sessionId: this.currentSession()!.id,
      file: file,
      message: messageText
    }).subscribe({
      next: (response) => {
        // File message and response are automatically handled by ChatService
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Failed to send file message:', error);
      }
    });
  }

  clearSession(): void {
    this.chatService.clearSession();
    this.createNewSession();
  }

  copyMessage(message: ChatMessage): void {
    this.chatService.copyMessage(message);
  }

  deleteMessage(messageId: string): void {
    this.chatService.deleteMessage(messageId);
  }

  onFileUpload(event: any): void {
    if (event.files && event.files.length > 0) {
      this.selectedFile = event.files[0];
      console.log('File selected:', this.selectedFile?.name);
    }
  }

  // Scroll to bottom of messages
  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  // Check if user is at bottom of scroll
  onScroll(event: any): void {
    const element = event.target;
    const threshold = 100; // pixels from bottom
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
    this.shouldScrollToBottom = isAtBottom;
  }

  // HTML Document Methods
  hasHTMLContent(messageContent: any): boolean {
    return this.getHTMLContent(messageContent) !== '';
  }

  getHTMLContent(messageContent: any): string {
    if (messageContent?.plan?.tasks) {
      // Look for export_pdf action with HTML result
      const exportPdfTask = messageContent.plan.tasks.find((task: any) => 
        task.agent === 'report' && 
        task.action === 'export_pdf' && 
        task.status === 'completed' &&
        typeof task.result === 'string' &&
        task.result.includes('<!DOCTYPE html>')
      );
      return exportPdfTask?.result || '';
    }
    return '';
  }

  openHTMLDocument(htmlContent: string): void {
    if (!htmlContent) return;
    
    const newWindow = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes,resizable=yes,menubar=yes,toolbar=yes');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      newWindow.focus();
    }
  }

  downloadHTML(htmlContent: string, filename: string = 'report.html'): void {
    if (!htmlContent) return;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Parse AI response content
  parseAIResponse(content: any): any {
    if (typeof content === 'string') {
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    }
    return content;
  }

  // Check if content is a complex AI response
  isComplexAIResponse(content: any): boolean {
    const parsed = this.parseAIResponse(content);
    return typeof parsed === 'object' && parsed !== null && 
           (parsed.plan || parsed.results || parsed.summary || parsed.recommendations);
  }

  // Get formatted summary from AI response
  getAISummary(content: any): string {
    const parsed = this.parseAIResponse(content);
    if (parsed && parsed.summary) {
      return parsed.summary;
    }
    return typeof content === 'string' ? content : JSON.stringify(content);
  }

  // Get insights from AI response
  getAIInsights(content: any): string[] {
    const parsed = this.parseAIResponse(content);
    if (parsed && parsed.results && Array.isArray(parsed.results)) {
      const insights: string[] = [];
      parsed.results.forEach((result: any) => {
        if (result.sections && Array.isArray(result.sections)) {
          result.sections.forEach((section: any) => {
            if (section.insights && Array.isArray(section.insights)) {
              insights.push(...section.insights);
            }
          });
        }
      });
      return insights;
    }
    return [];
  }

  // Get recommendations from AI response
  getAIRecommendations(content: any): string[] {
    const parsed = this.parseAIResponse(content);
    if (parsed && parsed.results && Array.isArray(parsed.results)) {
      const recommendations: string[] = [];
      parsed.results.forEach((result: any) => {
        if (result.recommendations && Array.isArray(result.recommendations)) {
          recommendations.push(...result.recommendations);
        }
      });
      return recommendations;
    }
    return [];
  }

  // Get processed data content from AI response
  getProcessedDataContent(content: any): string {
    const parsed = this.parseAIResponse(content);
    if (parsed && parsed.plan && parsed.plan.tasks) {
      // Look for data agent tasks that have result.content or result.processedData
      const dataTask = parsed.plan.tasks.find((task: any) => 
        task.agent === 'data' && 
        task.status === 'completed' &&
        task.result && 
        (task.result.content || task.result.processedData)
      );
      
      // Return processedData if available, otherwise content
      if (dataTask?.result?.processedData) {
        return dataTask.result.processedData;
      } else if (dataTask?.result?.content) {
        return dataTask.result.content;
      }
    }
    return '';
  }

  // Check if there's processed data content to display
  hasProcessedDataContent(content: any): boolean {
    return this.getProcessedDataContent(content) !== '';
  }

  // Get filename of the processed data
  getProcessedDataFilename(content: any): string {
    const parsed = this.parseAIResponse(content);
    if (parsed && parsed.plan && parsed.plan.tasks) {
      const dataTask = parsed.plan.tasks.find((task: any) => 
        task.agent === 'data' && 
        task.status === 'completed' &&
        task.result && 
        (task.result.filename || task.result.processedData)
      );
      return dataTask?.result?.filename || 'processed_data.csv';
    }
    return '';
  }

  // Public methods for external components to interact with
  setMessageText(text: string): void {
    this.messageForm.patchValue({ message: text });
  }

  // Method to send message programmatically
  sendMessageProgrammatically(messageText: string, file?: File): void {
    if (file) {
      this.selectedFile = file;
      this.sendFileMessage(messageText);
    } else {
      this.sendTextMessage(messageText);
    }
  }

  setFileFromPath(filePath: string): void {
    // Create a file object from the path (this is a simplified approach)
    // In a real application, you might need to fetch the file from the server
    fetch(filePath)
      .then(response => response.blob())
      .then(blob => {
        const file = new File([blob], 'employees.csv', { type: 'text/csv' });
        this.selectedFile = file;
        console.log('File set:', file.name);
      })
      .catch(error => {
        console.error('Error loading file:', error);
      });
  }

  // Method to load the corporate data CSV file
  loadCorporateDataCSV(): void {
    // Sample corporate financial data
    const csvContent = `employee_id,first_name,last_name,email,phone,department,position,hire_date,birth_date,salary,age,state,status,performance_rating,manager_id
EMP001,John,Smith,JOHN.SMITH@COMPANY.COM,555-123-4567,Sales,Senior Sales Manager,01/15/2018,05/12/1985,95000,38,CA,Active,4.5,NULL
EMP002,Sarah,JOHNSON,sarah.johnson@company.com,5551234568,Marketing,Marketing Director,03/22/2017,08/30/1982,110000,41,ny,Active,4.8,EMP015
EMP003,Michael,Davis,michael.davis@company,555.123.4569,IT,Software Engineer,06/10/2019,12/05/1990,85000,33,TX,active,4.2,EMP008
EMP004,Emily,NULL,emily.wilson@company.com,NULL,HR,HR Specialist,09/01/2020,03/18/1988,65000,35,FL,Active,N/A,EMP012
EMP005,Robert,Brown,ROBERT.BROWN@COMPANY.COM,(555) 123-4571,Finance,Financial Analyst,11/20/2018,07/25/1987,75,000,36,California,Active,4.1,EMP019
EMP006,Jennifer,Martinez,jennifer.martinez@company.com,555-123-4572,Sales,Sales Representative,02/14/2021,10/08/1992,55000,31,TX,active,3.9,EMP001
EMP007,David,Garcia,david.garcia@,1234567890,IT,DevOps Engineer,04/30/2019,01/15/1989,90000,34,WA,Active,4.6,EMP008
EMP008,Lisa,Rodriguez,lisa.rodriguez@company.com,555-123-4574,IT,IT Director,08/05/2015,06/20/1980,125000,43,wa,Active,4.9,NULL
EMP009,James,Wilson,JAMES.WILSON@COMPANY.COM,555-123-4575,Marketing,Content Strategist,07/12/2020,09/03/1991,62000,32,NY,PENDING,4.0,EMP002
EMP010,Maria,Anderson,maria.anderson@company.com,NULL,HR,Recruiter,10/25/2019,11/28/1986,58000,37,FL,Active,TBD,EMP012
EMP011,William,Taylor,william.taylor@company.com,555.123.4577,Sales,Account Executive,12/08/2020,04/17/1993,60000,150,CA,active,3.8,EMP001
EMP012,Elizabeth,Thomas,elizabeth.thomas@company.com,555-123-4578,HR,HR Director,05/15/2016,02/22/1979,105000,44,FL,Active,4.7,NULL
EMP013,Christopher,Moore,CHRIS.MOORE@COMPANY.COM,(555)123-4579,Finance,Senior Accountant,03/18/2018,08/10/1984,80000,39,TX,Active,4.3,EMP019
EMP014,Jessica,Jackson,jessica.jackson@company,555-123-4580,Marketing,Social Media Manager,09/22/2021,12/01/1994,52000,29,NY,Active,nil,EMP002
EMP015,Daniel,Martin,daniel.martin@company.com,NULL,Marketing,Chief Marketing Officer,01/10/2014,05/05/1978,145000,45,ny,Active,5.0,NULL
EMP016,Ashley,Lee,ashley.lee@company.com,555-123-4582,IT,UI/UX Designer,06/30/2020,07/14/1991,70000,32,CA,active,4.1,EMP008
EMP017,Matthew,Perez,matthew.perez@company.com,5551234583,Sales,Sales Coordinator,11/05/2021,10/20/1995,48000,28,TX,Active,3.7,EMP001
EMP018,Amanda,Thompson,AMANDA.THOMPSON@COMPANY.COM,555.123.4584,HR,Benefits Administrator,02/28/2019,03/12/1987,60000,36,fl,Active,4.0,EMP012
EMP019,Joshua,WHITE,joshua.white@company.com,555-123-4585,Finance,Finance Director,09/12/2015,11/08/1981,120000,42,TX,Active,4.8,NULL
EMP020,Melissa,Harris,melissa.harris@company,NULL,Marketing,Brand Manager,04/15/2020,06/25/1988,72000,35,CA,PENDING,4.2,EMP015
EMP021,Andrew,Clark,andrew.clark@company.com,555-123-4587,IT,Systems Administrator,08/20/2018,09/30/1986,75000,37,WA,Active,--,EMP008
EMP022,Stephanie,Lewis,STEPHANIE.LEWIS@COMPANY.COM,(555) 123-4588,Sales,Regional Sales Manager,12/15/2017,02/18/1983,98000,40,ca,Active,4.6,NULL
EMP023,Ryan,Robinson,ryan.robinson@company.com,555-123-4589,Finance,Budget Analyst,05/22/2020,08/08/1990,68000,-5,TX,active,3.9,EMP019
EMP024,Nicole,Walker,nicole.walker@company.com,555.123.4590,HR,Training Coordinator,10/10/2021,12/14/1992,54000,31,FL,Active,N/A,EMP012
EMP025,Kevin,Hall,kevin.hall@,1234567891,IT,Cloud Architect,03/05/2019,04/22/1985,105000,38,WA,Active,4.7,EMP008
EMP026,Lauren,ALLEN,lauren.allen@company.com,NULL,Marketing,Marketing Analyst,07/18/2020,01/30/1991,58000,32,NY,active,4.0,EMP002
EMP027,Brandon,Young,BRANDON.YOUNG@COMPANY.COM,555-123-4593,Sales,Inside Sales Rep,11/30/2021,07/07/1994,46000,29,CA,Active,3.6,EMP022
EMP028,Rebecca,King,rebecca.king@company.com,555-123-4594,Finance,Payroll Specialist,02/12/2019,10/15/1987,62000,36,tx,Active,4.1,EMP019
EMP029,Jason,Wright,jason.wright@company,555.123.4595,IT,Security Analyst,06/25/2020,03/28/1989,82000,34,WA,PENDING,TBD,EMP008
EMP030,Michelle,Lopez,michelle.lopez@company.com,(555)123-4596,HR,Employee Relations Manager,09/08/2018,05/19/1984,78000,39,FL,Active,4.4,EMP012
EMP031,Eric,Hill,ERIC.HILL@COMPANY.COM,NULL,Sales,Sales Operations Manager,12/20/2019,11/22/1986,88000,37,TX,active,4.3,EMP001
EMP032,Kimberly,Scott,kimberly.scott@company.com,555-123-4598,Marketing,Digital Marketing Specialist,04/08/2021,09/09/1993,56000,30,ca,Active,3.8,EMP015
EMP033,Jeffrey,Green,jeffrey.green@,5551234599,Finance,Tax Analyst,08/15/2020,02/01/1988,70000,200,TX,Active,4.0,EMP019
EMP034,Amy,Adams,amy.adams@company.com,555.123.4600,IT,Database Administrator,01/22/2019,06/12/1987,80000,36,WA,active,4.2,EMP008
EMP035,Gary,Baker,GARY.BAKER@COMPANY.COM,555-123-4601,Sales,Territory Manager,05/30/2018,12/30/1982,92000,41,CA,Active,4.5,EMP022
EMP036,Rachel,Gonzalez,rachel.gonzalez@company.com,NULL,HR,Compensation Analyst,10/15/2020,08/25/1990,66000,33,FL,PENDING,nil,EMP012
EMP037,Scott,Nelson,scott.nelson@company.com,(555) 123-4603,IT,Network Engineer,03/12/2019,04/05/1986,78000,37,wa,Active,4.3,EMP008
EMP038,Laura,Carter,LAURA.CARTER@COMPANY.COM,555-123-4604,Marketing,Event Coordinator,07/28/2021,10/18/1992,50000,31,NY,active,3.7,EMP002
EMP039,Raymond,Mitchell,raymond.mitchell@,555.123.4605,Finance,Investment Analyst,11/10/2019,01/08/1985,85,000,38,TX,Active,4.4,EMP019
EMP040,Catherine,Perez,catherine.perez@company.com,555-123-4606,Sales,Key Account Manager,02/20/2018,07/16/1984,95000,39,ca,Active,4.6,EMP001
EMP041,Patrick,Roberts,patrick.roberts@company.com,NULL,IT,Technical Lead,06/05/2017,03/20/1981,110000,42,WA,active,4.8,EMP008
EMP042,Sandra,Turner,SANDRA.TURNER@COMPANY.COM,5551234608,Marketing,Product Marketing Manager,09/18/2019,11/11/1987,82000,36,NY,Active,4.2,EMP015
EMP043,Dennis,Phillips,dennis.phillips@company,555-123-4609,HR,HRIS Specialist,12/02/2020,05/28/1989,64000,34,fl,PENDING,--,EMP012
EMP044,Carol,Campbell,carol.campbell@company.com,555.123.4610,Finance,Credit Analyst,04/22/2021,09/14/1991,58000,32,TX,Active,3.9,EMP019
EMP045,Peter,Parker,PETER.PARKER@COMPANY.COM,(555)123-4611,Sales,Business Development Rep,08/12/2021,02/08/1995,52000,28,CA,active,3.8,EMP022
EMP046,Janet,Evans,janet.evans@company.com,555-123-4612,IT,QA Engineer,01/15/2020,12/03/1988,72000,35,WA,Active,4.1,EMP008
EMP047,George,EDWARDS,george.edwards@,NULL,Marketing,SEO Specialist,05/25/2021,06/30/1992,54000,31,ny,Active,N/A,EMP002
EMP048,Donna,Collins,donna.collins@company.com,555-123-4614,HR,Talent Acquisition Manager,09/30/2017,08/22/1983,88000,40,FL,active,4.5,EMP012
EMP049,Kenneth,Stewart,KENNETH.STEWART@COMPANY.COM,555.123.4615,Finance,Controller,02/08/2016,04/18/1979,115000,44,tx,Active,4.7,NULL
EMP050,Ruth,Sanchez,ruth.sanchez@company.com,555-123-4616,Sales,Sales Enablement Manager,06/15/2019,10/25/1986,80000,37,CA,Active,TBD,EMP001`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'corporate_data.csv', { type: 'text/csv' });
    this.selectedFile = file;
    console.log('Corporate data CSV file loaded:', file.name);
  }

  // Method to load the employees.csv file from assets
  loadEmployeesCSV(): void {
    // Since the file is in the frontend assets, we'll create it from the CSV content
    const csvContent = `Employee ID, Full Name  ,Department,  Hire Date,Salary,Performance Rating,Email,Phone Number,Status,Manager ID,Location,Years of Service,Bonus %,Last Review Date,Certifications
E001,John Smith,Sales,2020-03-15,75000,4.5,john.smith@company.com,555-0101,Active,M001,New York,N/A,10,2024-03-01,None
E002,  Sarah Johnson  ,Marketing,15/06/2019,82000,4.8,sarah.j@company.com,(555) 102-0102,active,M002,Los Angeles,N/A,12,2024-02-15,Google Analytics; HubSpot
E003,Mike Davis,IT,2018-07-22,95000,3.9,mike.davis@company.com,555.0103,Active,M003,New York,N/A,8,01/03/2024,AWS; Azure; CISSP
E004,Emily White,Sales,2021-11-30,68000,4.2,emily.white@company.com,5550104,Active,M001,Chicago,N/A,11,2024-01-20,Salesforce
E005,Robert Brown,HR,06-05-2017,,,robert.brown@company.com,555-0105,Active,M004,New York,N/A,15,2024-02-28,SHRM-CP
E006,Lisa Anderson,IT,2019-09-12,91000,4.6,lisa.a@company.com,+1-555-0106,Active,M003,San Francisco,N/A,9,2024-03-10,PMP; Scrum Master
E007,David Miller,Marketing,2022-01-08,71000,3.5,david.miller@company.com,555-0107,Active,M002,Los Angeles,N/A,7,2023-12-15,
E008,Jennifer Wilson,Finance,2016-04-20,105000,4.9,jennifer.w@company.com,555-0108,Active,M005,New York,N/A,18,2024-02-05,CPA; CFA
E009,Michael Taylor,Sales,2023-03-15,62000,4.0,michael.taylor@company.com,555-0109,active,M001,Chicago,N/A,10,2024-03-01,None
E010,Amanda Martinez,IT,2018-11-25,88000,4.4,amanda.m@company.com,555-0110,Active,M003,San Francisco,N/A,8,2024-01-25,ITIL; Six Sigma
E011,Christopher Lee,HR,2020-08-14,72000,3.8,christopher.lee@company.com,555-0111,TERMINATED,M004,New York,N/A,12,2023-08-01,PHR
E012,Jessica Garcia,Marketing,2017-05-30,86000,4.7,jessica.garcia@company.com,555-0112,Active,M002,Boston,N/A,13,2024-02-20,Adobe Creative; Content Marketing
E013,Daniel Rodriguez,Finance,2021-07-19,79000,4.1,daniel.r@company.com,5550113,Active,M005,New York,N/A,11,2024-03-05,CMA
E014,Ashley Thomas,Sales,2019-02-28,73000,3.6,ashley.thomas@company.com,555-0114,On Leave,M001,Chicago,N/A,9,2023-11-30,
E015,Matthew Jackson,IT,2022-10-05,92000,4.5,matthew.jackson@company.com,555-0115,Active,M003,San Francisco,N/A,10,2024-02-10,CompTIA Security+; CCNA
E016,Nicole Harris,HR,2018-03-12,75000,,nicole.harris@company.com,555-0116,Active,M004,Boston,N/A,14,2024-01-15,SHRM-SCP
E017,Ryan Clark,Marketing,2020-12-01,69000,3.9,ryan.clark@company.com,555-0117,Active,M002,Los Angeles,N/A,8,2024-02-25,SEO; Google Ads
E018,Stephanie Lewis,Finance,2017-09-08,98000,4.8,stephanie.lewis@company.com,555-0118,Active,M005,New York,N/A,17,2024-03-01,CPA
E019,Kevin Walker,Sales,2023-06-20,65000,4.3,kevin.walker@company.com,555-0119,active,M001,Miami,N/A,11,2024-01-10,
E020,Lauren Hall,IT,2019-07-15,89000,4.2,lauren.hall@company.com,555-0120,Active,M003,San Francisco,N/A,9,2024-02-15,Java; Python; AWS
E021,Brandon Allen,HR,2021-04-22,70000,3.7,brandon.allen@company.com,555-0121,Active,M004,Boston,N/A,10,2023-12-20,
E022,Megan Young,Marketing,2018-01-30,84000,4.6,megan.young@company.com,555-0122,Active,M002,Los Angeles,N/A,12,2024-03-08,Marketing Automation
E023,Justin King,Finance,2020-06-18,81000,4.0,justin.king@company.com,555-0123,Active,M005,New York,N/A,13,2024-01-30,CFA Level 2
E024,Brittany Wright,Sales,2022-02-14,67000,3.8,brittany.wright@company.com,5550124,terminated,M001,Chicago,N/A,9,2023-10-15,
E025,Tyler Scott,IT,2017-11-20,94000,4.7,tyler.scott@company.com,555-0125,Active,M003,New York,N/A,11,2024-02-20,CISM; CISA
E026,Kayla Green,HR,2019-05-07,74000,4.1,kayla.green@company.com,555-0126,Active,M004,Boston,N/A,13,2024-03-02,Talent Acquisition
E027,Jordan Baker,Marketing,2021-09-25,72000,3.4,jordan.baker@company.com,555-0127,Active,M002,Seattle,N/A,7,2023-11-25,
E028,Samantha Adams,Finance,2018-08-14,102000,4.9,samantha.adams@company.com,555-0128,Active,M005,New York,N/A,18,2024-02-28,CPA; CFA
E029,Andrew Nelson,Sales,2023-01-09,63000,4.4,andrew.nelson@company.com,555-0129,active,M001,Miami,N/A,10,2024-03-05,Salesforce; Pardot
E030,Rachel Carter,IT,2019-10-30,90000,4.3,rachel.carter@company.com,555-0130,Active,M003,San Francisco,N/A,8,2024-01-18,DevOps; Kubernetes
E031,,Sales,2020-05-12,71000,4.0,missing.name@company.com,555-0131,Active,M001,Chicago,N/A,10,2024-02-12,
E032,Eric Mitchell,Marketing,2017-07-25,87000,4.5,eric.mitchell@company.com,555-0132,Active,M002,Boston,N/A,14,2024-03-07,Brand Management
E033,Christina Perez,Finance,2021-12-06,77000,3.9,christina.p@company.com,555-0133,Active,M005,New York,N/A,11,2024-01-22,CMA; FP&A
E034,Nathan Roberts,Sales,2022-08-17,66000,3.6,nathan.roberts@company.com,5550134,On Leave,M001,Chicago,N/A,,2023-09-30,
E035,Melissa Turner,IT,2018-06-05,91000,4.6,melissa.turner@company.com,555-0135,Active,M003,San Francisco,N/A,9,2024-02-18,Project Management; Agile
E036,Joshua Phillips,HR,2020-02-19,73000,4.2,joshua.phillips@company.com,555-0136,Active,M004,Boston,N/A,12,2024-03-03,Employee Relations
E037,Angela Campbell,Marketing,2019-11-28,70000,3.7,angela.campbell@company.com,555-0137,Active,M002,Los Angeles,N/A,8,2023-12-28,Social Media Marketing
E038,Jacob Parker,Finance,2017-03-15,106000,4.8,jacob.parker@company.com,555-0138,Active,M005,New York,N/A,19,2024-02-25,CPA; MBA
E039,Heather Evans,Sales,2023-04-03,64000,4.1,heather.evans@company.com,555-0139,active,M001,Miami,N/A,10,2024-03-10,
E040,Nicholas Edwards,IT,2019-08-22,89000,4.4,nicholas.edwards@company.com,555-0140,Active,M003,San Francisco,N/A,8,2024-01-28,Cloud Architecture; Docker
E041,Olivia Collins,HR,2021-06-30,71000,3.8,olivia.collins@company.com,555-0141,Active,M004,Boston,N/A,11,2023-12-15,Benefits Administration
E042,Zachary Stewart,Marketing,2018-04-18,85000,4.7,zachary.stewart@company.com,555-0142,Active,M002,Seattle,N/A,13,2024-03-06,Digital Strategy
E043,Victoria Morris,Finance,2020-10-27,80000,4.0,victoria.morris@company.com,555-0143,Active,M005,New York,N/A,12,2024-02-01,Financial Analysis
E044,Alexander Rogers,Sales,2022-05-11,68000,3.5,alexander.rogers@company.com,555-0144,TERMINATED,M001,Chicago,N/A,9,2023-08-20,
E045,Madison Reed,IT,2017-12-14,95000,4.8,madison.reed@company.com,555-0145,Active,M003,New York,N/A,10,2024-02-22,Cybersecurity; Penetration Testing
E046,Ethan Cook,HR,2019-03-28,76000,4.1,ethan.cook@company.com,555-0146,Active,M004,Boston,N/A,14,2024-03-04,Compensation & Benefits
E047,Hannah Morgan,Marketing,2021-11-16,73000,3.6,hannah.morgan@company.com,555-0147,Active,M002,Los Angeles,N/A,7,2023-11-10,Content Strategy
E048,Joseph Bell,Finance,2018-09-19,100000,4.9,joseph.bell@company.com,555-0148,Active,M005,New York,N/A,17,2024-02-27,CFA; Financial Planning
E049,Alexis Murphy,Sales,2023-02-22,62000,4.3,alexis.murphy@company.com,555-0149,active,M001,Miami,N/A,11,2024-03-09,CRM Management
E050,William Bailey,IT,2019-09-10,90000,4.2,william.bailey@company.com,555-0150,Active,M003,San Francisco,N/A,8,2024-01-20,Full Stack Development
M001,James Peterson,Sales,2015-02-10,125000,4.8,james.peterson@company.com,555-0201,Active,,New York,N/A,20,2024-02-15,Sales Leadership
M002,Patricia Rivera,Marketing,2014-06-15,130000,4.9,patricia.rivera@company.com,555-0202,Active,,Los Angeles,N/A,22,2024-02-20,Marketing Strategy; MBA
M003,Richard Cooper,IT,2013-09-20,145000,4.7,richard.cooper@company.com,555-0203,Active,,San Francisco,N/A,25,2024-02-25,Technology Leadership; ITIL
M004,Linda Richardson,HR,2016-01-12,115000,4.6,linda.richardson@company.com,555-0204,Active,,Boston,N/A,18,2024-03-01,HR Management; SHRM-SCP
M005,Charles Cox,Finance,2012-11-08,155000,4.9,charles.cox@company.com,555-0205,Active,,New York,N/A,28,2024-02-28,CPA; CFO Track
E051,Grace Howard,Sales,2020-07-23,74000,null,grace.howard@company.com,555-0151,Active,M001,New York,N/A,10,2024-02-13,
E052,Dylan Ward,Marketing,2018-12-11,83000,4.5,dylan.ward@company.com,555-0152,Active,M002,Boston,N/A,12,2024-03-11,Email Marketing
E053,Sophia Torres,Finance,2021-03-29,78000,4.1,sophia.torres@company.com,555-0153,Active,M005,New York,N/A,11,2024-01-27,Financial Modeling
E054,Logan Peterson,Sales,2022-09-14,67000,3.7,logan.peterson@company.com,5550154,Active,M001,Chicago,N/A,9,2023-12-01,
E055,Chloe Gray,IT,2019-04-17,92000,4.6,chloe.gray@company.com,555-0155,Active,M003,San Francisco,N/A,9,2024-02-19,UX/UI Design
E056,Isaac Ramirez,HR,2020-11-09,72000,4.0,isaac.ramirez@company.com,555-0156,Active,M004,Boston,N/A,12,2024-03-05,Recruitment
E057,Lily James,Marketing,2017-08-24,86000,4.7,lily.james@company.com,555-0157,Active,M002,Los Angeles,N/A,13,2024-02-23,PR & Communications
E058,Gavin Watson,Finance,2021-01-20,81000,3.9,gavin.watson@company.com,555-0158,Active,M005,New York,N/A,12,2024-01-31,Treasury Management
E059,Natalie Brooks,Sales,2023-07-12,65000,4.4,natalie.brooks@company.com,555-0159,active,M001,Miami,N/A,10,2024-03-12,Business Development
E060,Caleb Kelly,IT,2019-06-26,88000,4.3,caleb.kelly@company.com,555-0160,Active,M003,San Francisco,N/A,8,2024-02-08,Database Administration
E061,Avery Sanders,HR,2021-08-05,70000,3.8,avery.sanders@company.com,555-0161,Active,M004,Boston,N/A,11,2023-12-18,Training & Development
E062,Jack Price,Marketing,2018-02-14,84000,4.6,jack.price@company.com,555-0162,Active,M002,Seattle,N/A,12,2024-03-13,Product Marketing
E063,Ella Bennett,Finance,2020-09-30,79000,4.0,ella.bennett@company.com,555-0163,Active,M005,New York,N/A,13,2024-02-04,Accounting
E064,Owen Wood,Sales,2022-04-27,68000,3.6,owen.wood@company.com,555-0164,On Leave,M001,Chicago,N/A,9,2023-10-25,
E065,Abigail Barnes,IT,2017-10-18,93000,4.7,abigail.barnes@company.com,555-0165,Active,M003,New York,N/A,10,2024-02-21,Systems Architecture
E066,Henry Ross,HR,2019-12-03,75000,4.1,henry.ross@company.com,555-0166,Active,M004,Boston,N/A,14,2024-03-07,Organizational Development
E067,Aria Henderson,Marketing,2021-10-19,71000,3.7,aria.henderson@company.com,555-0167,Active,M002,Los Angeles,N/A,8,2023-11-28,Influencer Marketing
E068,Sebastian Coleman,Finance,2018-05-22,101000,4.8,sebastian.coleman@company.com,555-0168,Active,M005,New York,N/A,18,2024-02-29,Financial Controller
E069,Scarlett Jenkins,Sales,2023-05-17,64000,4.2,scarlett.jenkins@company.com,555-0169,active,M001,Miami,N/A,11,2024-03-14,
E070,Luke Perry,IT,2019-11-13,89000,4.4,luke.perry@company.com,555-0170,Active,M003,San Francisco,N/A,8,2024-01-23,Network Engineering`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'employees.csv', { type: 'text/csv' });
    this.selectedFile = file;
    console.log('Employees CSV file loaded:', file.name);
  }

  // Method to programmatically set a file object
  setFile(file: File): void {
    this.selectedFile = file;
    console.log('File set:', file.name);
  }

  // CSV Preview Methods
  showCsvPreview(): void {
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.csvContent = e.target?.result as string;
        this.showCsvDialog = true;
      };
      reader.readAsText(this.selectedFile);
    } else {
      // If no file is selected, show the default CSV content
      this.csvContent = this.getDefaultCsvContent();
      this.showCsvDialog = true;
    }
  }

  private getDefaultCsvContent(): string {
    return `Employee ID, Full Name  ,Department,  Hire Date,Salary,Performance Rating,Email,Phone Number,Status,Manager ID,Location,Years of Service,Bonus %,Last Review Date,Certifications
E001,John Smith,Sales,2020-03-15,75000,4.5,john.smith@company.com,555-0101,Active,M001,New York,N/A,10,2024-03-01,None
E002,  Sarah Johnson  ,Marketing,15/06/2019,82000,4.8,sarah.j@company.com,(555) 102-0102,active,M002,Los Angeles,N/A,12,2024-02-15,Google Analytics; HubSpot
E003,Mike Davis,IT,2018-07-22,95000,3.9,mike.davis@company.com,555.0103,Active,M003,New York,N/A,8,01/03/2024,AWS; Azure; CISSP
E004,Emily White,Sales,2021-11-30,68000,4.2,emily.white@company.com,5550104,Active,M001,Chicago,N/A,11,2024-01-20,Salesforce
E005,Robert Brown,HR,06-05-2017,,,robert.brown@company.com,555-0105,Active,M004,New York,N/A,15,2024-02-28,SHRM-CP
E006,Lisa Anderson,IT,2019-09-12,91000,4.6,lisa.a@company.com,+1-555-0106,Active,M003,San Francisco,N/A,9,2024-03-10,PMP; Scrum Master
E007,David Miller,Marketing,2022-01-08,71000,3.5,david.miller@company.com,555-0107,Active,M002,Los Angeles,N/A,7,2023-12-15,
E008,Jennifer Wilson,Finance,2016-04-20,105000,4.9,jennifer.w@company.com,555-0108,Active,M005,New York,N/A,18,2024-02-05,CPA; CFA
E009,Michael Taylor,Sales,2023-03-15,62000,4.0,michael.taylor@company.com,555-0109,active,M001,Chicago,N/A,10,2024-03-01,None
E010,Amanda Martinez,IT,2018-11-25,88000,4.4,amanda.m@company.com,555-0110,Active,M003,San Francisco,N/A,8,2024-01-25,ITIL; Six Sigma
E011,Christopher Lee,HR,2020-08-14,72000,3.8,christopher.lee@company.com,555-0111,TERMINATED,M004,New York,N/A,12,2023-08-01,PHR
E012,Jessica Garcia,Marketing,2017-05-30,86000,4.7,jessica.garcia@company.com,555-0112,Active,M002,Boston,N/A,13,2024-02-20,Adobe Creative; Content Marketing
E013,Daniel Rodriguez,Finance,2021-07-19,79000,4.1,daniel.r@company.com,5550113,Active,M005,New York,N/A,11,2024-03-05,CMA
E014,Ashley Thomas,Sales,2019-02-28,73000,3.6,ashley.thomas@company.com,555-0114,On Leave,M001,Chicago,N/A,9,2023-11-30,
E015,Matthew Jackson,IT,2022-10-05,92000,4.5,matthew.jackson@company.com,555-0115,Active,M003,San Francisco,N/A,10,2024-02-10,CompTIA Security+; CCNA
M001,James Peterson,Sales,2015-02-10,125000,4.8,james.peterson@company.com,555-0201,Active,,New York,N/A,20,2024-02-15,Sales Leadership
M002,Patricia Rivera,Marketing,2014-06-15,130000,4.9,patricia.rivera@company.com,555-0202,Active,,Los Angeles,N/A,22,2024-02-20,Marketing Strategy; MBA
M003,Richard Cooper,IT,2013-09-20,145000,4.7,richard.cooper@company.com,555-0203,Active,,San Francisco,N/A,25,2024-02-25,Technology Leadership; ITIL
M004,Linda Richardson,HR,2016-01-12,115000,4.6,linda.richardson@company.com,555-0204,Active,,Boston,N/A,18,2024-03-01,HR Management; SHRM-SCP
M005,Charles Cox,Finance,2012-11-08,155000,4.9,charles.cox@company.com,555-0205,Active,,New York,N/A,28,2024-02-28,CPA; CFO Track`;
  }

  closeCsvDialog(): void {
    this.showCsvDialog = false;
    this.csvContent = '';
  }
}
