# CorpoAgent Frontend Setup

This is the Angular 20.3.7 frontend for the CorpoAgent application, built with standalone components and PrimeNG.

## Features Implemented

### Authentication System
- ✅ Login/Register forms with validation using PrimeNG components
- ✅ JWT token storage (localStorage)
- ✅ Authentication state management with Angular signals
- ✅ API client with automatic token inclusion
- ✅ Token expiration and refresh logic
- ✅ Protected route components with guards
- ✅ Logout functionality
- ✅ Error handling for auth failures

### API Integration
- ✅ HTTP client with interceptors
- ✅ Request/response logging
- ✅ Network error handling
- ✅ API endpoint constants
- ✅ Chat API service layer

### UI Components
- ✅ Modern dashboard with PrimeNG components
- ✅ Responsive design with Tailwind CSS
- ✅ User avatar and profile display
- ✅ Quick action buttons
- ✅ System status indicators

## Project Structure

```
src/app/
├── core/
│   ├── constants/
│   │   └── api.constants.ts          # API endpoint definitions
│   ├── guards/
│   │   ├── auth.guard.ts             # Authentication guard
│   │   └── guest.guard.ts            # Guest-only guard
│   ├── interceptors/
│   │   ├── auth.interceptor.ts       # JWT token interceptor
│   │   └── logging.interceptor.ts    # Request/response logging
│   ├── models/
│   │   └── auth.models.ts            # TypeScript interfaces
│   └── services/
│       ├── auth.service.ts           # Authentication service
│       └── api.service.ts            # General API service
├── features/
│   ├── auth/
│   │   └── components/
│   │       ├── login-form.component.ts
│   │       └── register-form.component.ts
│   └── dashboard/
│       └── dashboard.component.ts
├── app.config.ts                     # App configuration
├── app.routes.ts                     # Route definitions
└── app.html                          # Main app template
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. The application will be available at `http://localhost:4200`

## Key Technologies

- **Angular 20.3.7** - Latest Angular with standalone components
- **PrimeNG 20.2.0** - UI component library
- **PrimeIcons 7.0.0** - Icon library
- **Angular Signals** - Reactive state management
- **RxJS** - Reactive programming
- **TypeScript 5.9.2** - Type safety

## Authentication Flow

1. **Login/Register**: Users can authenticate via forms
2. **Token Management**: JWT tokens are automatically included in requests
3. **Token Refresh**: Automatic token refresh on expiration
4. **Route Protection**: Guards prevent unauthorized access
5. **State Management**: Reactive state with Angular signals

## API Integration

- **Base URL**: `http://localhost:3000/api`
- **Authentication**: Bearer token in Authorization header
- **Error Handling**: Comprehensive error handling with user feedback
- **Logging**: Request/response logging for debugging

## Next Steps

- [ ] Implement chat interface
- [ ] Add real-time messaging
- [ ] Create agent management interface
- [ ] Add data visualization components
- [ ] Implement report generation UI
- [ ] Add user profile management
- [ ] Create settings page
- [ ] Add dark mode support
