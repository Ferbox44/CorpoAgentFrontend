# CorpoAgent Frontend

Frontend application for CorpoAgent, a corporate AI assistant platform built with Angular. Provides an intuitive web interface for interacting with the AI agent, managing chat sessions, processing files, and accessing the knowledge base.

## 🚀 Features

- **💬 Intelligent Chat Interface**: Real-time chat with AI agent supporting file uploads and conversation history
- **🔐 Secure Authentication**: JWT-based authentication with protected routes and automatic token refresh
- **📊 Dashboard**: Overview of user activity and quick access to features
- **📁 Knowledge Base Management**: Browse and manage processed documents and extracted insights
- **📱 Responsive Design**: Modern, mobile-friendly interface using Tailwind CSS
- **🎨 PrimeNG Components**: Rich UI components library for professional interface
- **🔄 Real-time Updates**: Reactive state management with Angular Signals
- **📤 File Upload**: Drag-and-drop file upload with progress tracking

## 🛠️ Tech Stack

- **Framework**: Angular 20.3.0
- **Language**: TypeScript 5.9.2
- **UI Library**: PrimeNG 20.2.0
- **Styling**: Tailwind CSS
- **State Management**: Angular Signals
- **HTTP Client**: RxJS with Angular HttpClient
- **Charts**: Chart.js 4.5.1
- **Icons**: PrimeIcons 7.0.0

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Running CorpoAgent backend server (see [Backend README](../backend/README.md))

## 🚀 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure API endpoint (if different from default):
   - Edit `src/app/core/constants/api.constants.ts`
   - Update `API_BASE_URL` if your backend runs on a different port or host

4. Start the development server:
```bash
npm start
# or
ng serve
```

The application will be available at `http://localhost:4200/`

## 📜 Available Scripts

```bash
# Development
npm start              # Start development server with hot-reload
ng serve               # Same as above

# Building
npm run build          # Build for production
ng build               # Same as above
npm run watch          # Build in watch mode for development

# Testing
npm test               # Run unit tests with Karma
ng test                # Same as above
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── constants/
│   │   │   │   └── api.constants.ts      # API endpoints configuration
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts         # Authentication guard
│   │   │   │   └── guest.guard.ts        # Guest route guard
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts   # JWT token injection
│   │   │   │   └── logging.interceptor.ts # HTTP request logging
│   │   │   ├── models/
│   │   │   │   └── auth.models.ts        # Authentication models
│   │   │   └── services/
│   │   │       ├── api.service.ts        # Base API service
│   │   │       ├── auth.service.ts       # Authentication service
│   │   │       ├── chat.service.ts       # Chat service
│   │   │       └── knowledge-base.service.ts # Knowledge base service
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   └── components/
│   │   │   │       └── login-form.component.ts # Login component
│   │   │   ├── chat/
│   │   │   │   └── components/
│   │   │   │       └── chat-container.component.ts # Main chat interface
│   │   │   └── dashboard/
│   │   │       └── dashboard.component.ts # Dashboard component
│   │   ├── app.routes.ts                 # Route configuration
│   │   ├── app.config.ts                 # App configuration
│   │   └── app.ts                        # Root component
│   ├── environments/                     # Environment configurations
│   ├── index.html                        # Main HTML file
│   ├── main.ts                           # Application entry point
│   └── styles.scss                       # Global styles
├── public/
│   └── favicon.ico                       # Application favicon
├── angular.json                          # Angular CLI configuration
├── package.json
├── tsconfig.json
└── README.md
```

## 🎯 Main Features

### Authentication
- **Login**: Secure user authentication with JWT tokens
- **Registration**: User registration with validation
- **Protected Routes**: Automatic route protection for authenticated users
- **Token Management**: Automatic token refresh and storage

### Chat Interface
- **Real-time Messaging**: Send messages to AI agent
- **File Upload**: Upload and process files directly in chat
- **Session Management**: Create and manage multiple chat sessions
- **Message History**: View conversation history per session
- **AI Responses**: Display formatted AI responses with markdown support

### Dashboard
- **Overview**: Quick access to main features
- **Statistics**: User activity and system metrics
- **Quick Actions**: Shortcuts to common operations

### Knowledge Base
- **Document List**: Browse processed documents
- **Search**: Search through knowledge base entries
- **Delete**: Remove documents from knowledge base

## 🔌 API Integration

The frontend communicates with the backend API at `http://localhost:3000` by default. All API endpoints are defined in `src/app/core/constants/api.constants.ts`.

### Main API Endpoints Used:
- **Authentication**: `/auth/login`, `/auth/register`, `/auth/profile`
- **Chat**: `/chat/sessions`, `/chat/messages`, `/chat/send`, `/chat/send-file`
- **Knowledge Base**: `/knowledge-base`
- **AI Agents**: `/agents/uni`, `/agents/orchestrator`, `/agents/report`

## 🔒 Security

- **JWT Authentication**: All protected routes require valid JWT tokens
- **HTTP Interceptors**: Automatic token injection for authenticated requests
- **Route Guards**: Protection of routes requiring authentication
- **Token Storage**: Secure token storage in browser
- **CORS**: Configured for secure cross-origin requests

## 🎨 Styling

The application uses a combination of:
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **PrimeNG Themes**: Pre-built theme system from PrimeNG
- **Component Styles**: Scoped component styles for specific UI elements

## 📝 Development Notes

- The application uses Angular standalone components (no NgModules)
- State management is handled with Angular Signals for reactivity
- HTTP interceptors automatically add JWT tokens to requests
- The app expects the backend to be running on `http://localhost:3000`
- CORS must be configured on the backend to allow requests from `http://localhost:4200`
- Production builds are optimized and stored in the `dist/` directory

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend CORS configuration allows requests from `http://localhost:4200`

2. **API Connection Errors**: Verify the backend server is running and `API_BASE_URL` in `api.constants.ts` is correct

3. **Authentication Issues**: Check that JWT tokens are being stored correctly and not expired

4. **Build Errors**: Ensure all dependencies are installed with `npm install`

## 🚀 Building for Production

1. Build the application:
```bash
npm run build
```

2. The production build will be in the `dist/frontend/browser/` directory

3. Serve the built files using a web server (nginx, Apache, etc.) or deploy to a hosting service

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT Licence

## 👨‍💻 Author

Developed as part of the CorpoAgent project.

---

**Note**: This frontend is designed to work together with the CorpoAgent backend. Make sure you have the backend server running before using the application.
