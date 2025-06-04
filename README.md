# PerioVision - AI-Powered Periodontal Analysis

PerioVision is a sophisticated web application designed to revolutionize periodontal analysis using artificial intelligence. This modern, user-friendly platform helps dental professionals streamline their workflow and improve diagnostic accuracy.

## 🌟 Features

### 1. Authentication System
- Secure email/password authentication
- User registration and login
- Remember me functionality
- Protected routes for authenticated users

### 2. Modern UI/UX
- Responsive design that works on all devices
- Beautiful and intuitive interface
- Dark/Light theme support with system preference detection
- Smooth transitions and animations
- Toast notifications for user feedback

### 3. Core Features

#### Dashboard
- Overview of recent cases and analyses
- Quick access to important features
- Statistical insights and metrics
- Activity timeline
- Recent patient records

#### New Case Management
- Streamlined case creation process
- Patient information input
- Image upload and management
- Detailed case documentation
- Case categorization and tagging

#### AI-Powered Analysis
- Advanced periodontal image analysis
- Real-time AI processing
- Detailed measurement reports
- Visual result presentation
- Historical comparison capabilities

#### Profile Management
- User profile customization
- Professional information management
- Preferences settings
- Account security options

### 4. Settings & Customization
- Theme preferences (Light/Dark/System)
- Notification settings
  - Email notifications
  - Push notifications
  - Product updates
- Privacy settings
  - Profile visibility
  - Information sharing preferences
- Account management

### 5. Additional Features
- Help Center
- Documentation
- Privacy Policy
- Terms of Service
- Error handling with user-friendly messages

## 🎨 Theme System
The application features a comprehensive theming system with:
- Light and dark mode support
- System preference detection
- Persistent theme selection
- Custom color variables for consistent styling
- Sidebar customization options

## 🔒 Security Features
- Secure authentication flow
- Protected routes
- Session management
- Password security
- Data encryption

## 🛠 Technical Stack

### Frontend
- React
- TypeScript
- TailwindCSS
- Radix UI Components
- Lucide Icons
- React Router DOM

### State Management
- React Context API
- Custom hooks for state management

### Authentication
- Firebase Authentication
- Protected routes
- Session management

### UI Components
- Custom UI component library
- Toast notifications
- Modal system
- Form components
- Data visualization tools

## 🚀 Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/periovision.git
```

2. Install dependencies
```bash
cd periovision
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory and add necessary environment variables:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your-key
```

4. Start the development server
```bash
npm run dev
```

## 📱 Responsive Design
The application is fully responsive and works seamlessly across:
- Desktop computers
- Tablets
- Mobile devices
- Different screen sizes and orientations

## 🔄 State Management
- Context-based state management for authentication
- Theme context for appearance management
- Toast context for notifications
- Sidebar context for layout management

## 📚 Documentation
Comprehensive documentation is available in the app covering:
- User guides
- Feature documentation
- API documentation
- Best practices
- Troubleshooting guides

## 🤝 Contributing
Contributions are welcome! Please read our contributing guidelines for details on our code of conduct and the process for submitting pull requests.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments
- Built with [Vite](https://vitejs.dev/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Styling with [TailwindCSS](https://tailwindcss.com/)
